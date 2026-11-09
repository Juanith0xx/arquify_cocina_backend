import { ABET_SHEET_FORMATS, HplSheetFormat, HplThickness } from '../store/hplBathroomStore';

export interface HplPartToCut {
  id: string;
  pieceType: 'door' | 'pilaster' | 'divider' | 'urinal' | 'top_rail';
  name: string;
  cubicleName?: string;
  width: number;  // mm
  height: number; // mm
  thickness: HplThickness;
  qty: number;
  colorName: string;
  allowRotation?: boolean;
}

export interface PlacedHplPart {
  id: string;
  originalPartId: string;
  name: string;
  pieceType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  thickness: number;
}

export interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HplSheetResult {
  sheetIndex: number;
  sheetId: string;
  format: HplSheetFormat;
  thickness: HplThickness;
  placedParts: PlacedHplPart[];
  freeRects: FreeRect[];
  usedAreaM2: number;
  totalAreaM2: number;
  wastePercentage: number;
  efficiencyPercentage: number;
}

export interface HplNestingResult {
  selectedFormat: HplSheetFormat;
  sheets: HplSheetResult[];
  totalSheets: number;
  totalPartsCount: number;
  totalHplAreaUsedM2: number;
  totalSheetAreaM2: number;
  globalEfficiencyPct: number;
  globalWastePct: number;
  byThickness: {
    thickness: HplThickness;
    sheetCount: number;
    partsCount: number;
    usedAreaM2: number;
    sheetsAreaM2: number;
  }[];
}

/**
 * 2D Guillotine Bin Packing for HPL Panels
 */
export function runHplNesting(
  parts: HplPartToCut[],
  preferredFormat: HplSheetFormat,
  kerf = 4.0, // Espesor disco corte CNC / escuadradora
  margin = 15 // Margen perimetral de refilado de placa
): HplSheetResult[] {
  // 1. Agrupar piezas por espesor (cada espesor debe ir en placas separadas)
  const partsByThickness = new Map<HplThickness, HplPartToCut[]>();
  parts.forEach((p) => {
    const list = partsByThickness.get(p.thickness) || [];
    list.push(p);
    partsByThickness.set(p.thickness, list);
  });

  const allSheets: HplSheetResult[] = [];
  let globalSheetCounter = 1;

  partsByThickness.forEach((thickParts, thick) => {
    // Expandir piezas por cantidad
    const items: {
      id: string;
      originalPartId: string;
      name: string;
      pieceType: string;
      w: number;
      h: number;
      thickness: HplThickness;
      allowRotation: boolean;
    }[] = [];

    thickParts.forEach((p) => {
      for (let i = 0; i < p.qty; i++) {
        items.push({
          id: `${p.id}_${i + 1}`,
          originalPartId: p.id,
          name: p.qty > 1 ? `${p.name} (${i + 1}/${p.qty})` : p.name,
          pieceType: p.pieceType,
          w: Math.round(p.width),
          h: Math.round(p.height),
          thickness: p.thickness,
          allowRotation: p.allowRotation !== false,
        });
      }
    });

    // Ordenar: Piezas más grandes primero (área descendente, luego lado mayor)
    items.sort((a, b) => b.w * b.h - a.w * a.h || Math.max(b.w, b.h) - Math.max(a.w, a.h));

    const thickSheets: HplSheetResult[] = [];

    const createSheet = (): HplSheetResult => {
      const sheet: HplSheetResult = {
        sheetIndex: globalSheetCounter++,
        sheetId: `Placa ${thick}mm #${globalSheetCounter - 1}`,
        format: preferredFormat,
        thickness: thick,
        placedParts: [],
        freeRects: [
          {
            x: margin,
            y: margin,
            w: preferredFormat.length - 2 * margin,
            h: preferredFormat.width - 2 * margin,
          },
        ],
        usedAreaM2: 0,
        totalAreaM2: (preferredFormat.length * preferredFormat.width) / 1_000_000,
        wastePercentage: 100,
        efficiencyPercentage: 0,
      };
      thickSheets.push(sheet);
      return sheet;
    };

    const splitFreeRect = (freeRects: FreeRect[], fr: FreeRect, pw: number, ph: number) => {
      const rightW = fr.w - pw - kerf;
      const bottomH = fr.h - ph - kerf;

      // Guillotine cut decision (minimiza fragmentación)
      const splitHorizontal = pw * bottomH > rightW * ph;

      if (splitHorizontal) {
        if (rightW > 0 && ph > 0) {
          freeRects.push({ x: fr.x + pw + kerf, y: fr.y, w: rightW, h: ph });
        }
        if (bottomH > 0 && fr.w > 0) {
          freeRects.push({ x: fr.x, y: fr.y + ph + kerf, w: fr.w, h: bottomH });
        }
      } else {
        if (rightW > 0 && fr.h > 0) {
          freeRects.push({ x: fr.x + pw + kerf, y: fr.y, w: rightW, h: fr.h });
        }
        if (bottomH > 0 && pw > 0) {
          freeRects.push({ x: fr.x, y: fr.y + ph + kerf, w: pw, h: bottomH });
        }
      }
    };

    const tryPlace = (
      sheet: HplSheetResult,
      item: { id: string; originalPartId: string; name: string; pieceType: string; w: number; h: number; thickness: HplThickness; allowRotation: boolean }
    ): boolean => {
      let bestScore = Infinity;
      let bestRectIdx = -1;
      let bestRotated = false;

      // Evaluar cada espacio libre
      for (let r = 0; r < sheet.freeRects.length; r++) {
        const fr = sheet.freeRects[r];

        // 1. Sin rotar (ancho=w, alto=h)
        if (item.w <= fr.w && item.h <= fr.h) {
          const leftoverArea = fr.w * fr.h - item.w * item.h;
          if (leftoverArea < bestScore) {
            bestScore = leftoverArea;
            bestRectIdx = r;
            bestRotated = false;
          }
        }

        // 2. Rotado 90° (ancho=h, alto=w)
        if (item.allowRotation && item.h <= fr.w && item.w <= fr.h) {
          const leftoverArea = fr.w * fr.h - item.w * item.h;
          if (leftoverArea < bestScore) {
            bestScore = leftoverArea;
            bestRectIdx = r;
            bestRotated = true;
          }
        }
      }

      if (bestRectIdx !== -1) {
        const fr = sheet.freeRects[bestRectIdx];
        sheet.freeRects.splice(bestRectIdx, 1);

        const pw = bestRotated ? item.h : item.w;
        const ph = bestRotated ? item.w : item.h;

        sheet.placedParts.push({
          id: item.id,
          originalPartId: item.originalPartId,
          name: item.name,
          pieceType: item.pieceType,
          x: fr.x,
          y: fr.y,
          w: pw,
          h: ph,
          rotated: bestRotated,
          thickness: item.thickness,
        });

        splitFreeRect(sheet.freeRects, fr, pw, ph);

        const partAreaM2 = (pw * ph) / 1_000_000;
        sheet.usedAreaM2 += partAreaM2;
        sheet.efficiencyPercentage = Math.round((sheet.usedAreaM2 / sheet.totalAreaM2) * 1000) / 10;
        sheet.wastePercentage = Math.round((100 - sheet.efficiencyPercentage) * 10) / 10;

        return true;
      }

      return false;
    };

    // Colocar cada pieza en las placas
    items.forEach((item) => {
      let placed = false;
      for (const sheet of thickSheets) {
        if (tryPlace(sheet, item)) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newSheet = createSheet();
        tryPlace(newSheet, item);
      }
    });

    allSheets.push(...thickSheets);
  });

  return allSheets;
}

/**
 * Optimiza y encuentra automáticamente el mejor formato Abet Laminati para el conjunto de piezas
 */
export function getOptimizedHplNesting(
  parts: HplPartToCut[],
  chosenFormatId: string,
  autoOptimize: boolean
): HplNestingResult {
  let bestFormat = ABET_SHEET_FORMATS.find((f) => f.id === chosenFormatId) || ABET_SHEET_FORMATS[1];
  let bestSheets: HplSheetResult[] = [];

  if (autoOptimize && parts.length > 0) {
    let bestWasteScore = Infinity;

    for (const format of ABET_SHEET_FORMATS) {
      const sheets = runHplNesting(parts, format);
      const totalSheetArea = sheets.reduce((acc, s) => acc + s.totalAreaM2, 0);
      const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedAreaM2, 0);
      const wasteArea = totalSheetArea - totalUsedArea;

      // Ponderar: menos placas totales y menor desperdicio
      const score = sheets.length * 1000 + wasteArea;
      if (score < bestWasteScore) {
        bestWasteScore = score;
        bestFormat = format;
        bestSheets = sheets;
      }
    }
  } else {
    bestSheets = runHplNesting(parts, bestFormat);
  }

  const totalSheets = bestSheets.length;
  const totalPartsCount = bestSheets.reduce((acc, s) => acc + s.placedParts.length, 0);
  const totalHplAreaUsedM2 = Math.round(bestSheets.reduce((acc, s) => acc + s.usedAreaM2, 0) * 100) / 100;
  const totalSheetAreaM2 = Math.round(bestSheets.reduce((acc, s) => acc + s.totalAreaM2, 0) * 100) / 100;
  const globalEfficiencyPct = totalSheetAreaM2 > 0 ? Math.round((totalHplAreaUsedM2 / totalSheetAreaM2) * 1000) / 10 : 0;
  const globalWastePct = Math.round((100 - globalEfficiencyPct) * 10) / 10;

  // Resumen por espesor
  const thickMap = new Map<HplThickness, { sheetCount: number; partsCount: number; usedAreaM2: number; sheetsAreaM2: number }>();
  bestSheets.forEach((s) => {
    const entry = thickMap.get(s.thickness) || { sheetCount: 0, partsCount: 0, usedAreaM2: 0, sheetsAreaM2: 0 };
    entry.sheetCount += 1;
    entry.partsCount += s.placedParts.length;
    entry.usedAreaM2 += s.usedAreaM2;
    entry.sheetsAreaM2 += s.totalAreaM2;
    thickMap.set(s.thickness, entry);
  });

  const byThickness: {
    thickness: HplThickness;
    sheetCount: number;
    partsCount: number;
    usedAreaM2: number;
    sheetsAreaM2: number;
  }[] = [];

  thickMap.forEach((val, t) => {
    byThickness.push({
      thickness: t,
      sheetCount: val.sheetCount,
      partsCount: val.partsCount,
      usedAreaM2: Math.round(val.usedAreaM2 * 100) / 100,
      sheetsAreaM2: Math.round(val.sheetsAreaM2 * 100) / 100,
    });
  });

  return {
    selectedFormat: bestFormat,
    sheets: bestSheets,
    totalSheets,
    totalPartsCount,
    totalHplAreaUsedM2,
    totalSheetAreaM2,
    globalEfficiencyPct,
    globalWastePct,
    byThickness,
  };
}
