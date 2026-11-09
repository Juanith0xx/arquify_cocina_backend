import * as XLSX from 'xlsx-js-style';
import { useStore } from '../store';
import { useKitchenStore } from '../store/kitchenStore';
import { generateKitchenPartsList, generateKitchenHardwareList, HARDWARE_SPECS, isHplFinish } from './kitchenManufacturing';
import { generateCountertopPieces, detectContinuousCabinetRuns } from './countertopNesting';
import { getFriendlyColorName } from './colorNames';

export const exportKitchenToExcel = () => {
  try {
    const state = useStore.getState();
    const kState = useKitchenStore.getState();
    const cabinets = kState.cabinets;
    const thickness = state.thickness;
    const kerf = 3.2; // mm
    const hplOversize = 10; // mm (1 cm más ancho y largo para prensado y posterior refilado en taller)
    const m2PorPlacaMDF = 2.44 * 1.83; // 4.4652 m²
    const m2PorPlacaHPL = 3.05 * 1.30; // 3.965 m²

    const parts = generateKitchenPartsList(cabinets);
    const hardware = generateKitchenHardwareList(cabinets);

    const getTextureName = (urlOrColor: string) => {
      return getFriendlyColorName(urlOrColor, state.customTextures);
    };

    const dataPlacas: any[] = [];
    const dataHPL: any[] = [];
    const dataEdgeBanding: any[] = [];
    const edgeSummary: Record<string, { desc: string; decorName: string; metersNet: number; metersWaste: number; rollThickness: number }> = {};

    parts.forEach((p, idx) => {
      const isFront = (p.name.toLowerCase().includes('puerta') || p.name.toLowerCase().includes('frente') || p.name.toLowerCase().includes('panel ciego')) &&
                      !p.name.toLowerCase().includes('contrafrente') &&
                      !p.name.toLowerCase().includes('amarre') &&
                      !p.name.toLowerCase().includes('caja');
      const decorName = getTextureName(p.material);
      const isHPL = isFront && (p.isHpl !== undefined ? p.isHpl : isHplFinish(p.material, undefined, cabinets.find(c => c.id === p.moduleId)));

      if (isHPL) {
        dataHPL.push({
          Gabinete: p.notes?.includes('Cab') ? p.notes : `Gabinete ${(p.moduleIndex || 0) + 1}`,
          Pieza: `${p.name} (Cara HPL +1cm refilado)`,
          Material: 'Laminado Alta Presión (Abet Laminati 0.9mm)',
          Decorativo: decorName,
          'Largo Corte HPL (mm)': (p.length + hplOversize).toFixed(1),
          'Ancho Corte HPL (mm)': (p.width + hplOversize).toFixed(1),
          'Espesor (mm)': '0.9',
          Cantidad: p.qty,
          Notas: 'Sobremedida +1cm para prensado sobre MDF 18mm y posterior refilado'
        });
      }

      dataPlacas.push({
        Gabinete: p.notes?.includes('Cab') ? p.notes : `Gabinete ${(p.moduleIndex || 0) + 1}`,
        Pieza: isHPL ? `${p.name} (Sustrato Base MDF 18mm)` : p.name,
        Material: isHPL ? 'MDF Crudo Desnudo (Sustrato Base)' : (p.thickness === 3 ? 'Durolac / MDF 3mm' : 'Melamina Estándar'),
        Decorativo: isHPL ? `${decorName} (HPL)` : decorName,
        'Cortes Totales': p.qty,
        Cantidad: p.qty,
        'Largo (mm)': p.length.toFixed(1),
        'Ancho (mm)': p.width.toFixed(1),
        'Veta (Orientación)': isHPL ? 'Sin Veta (Libre)' : (p.grainDirection === 'horizontal' ? 'Horizontal' : 'Vertical'),
        'Espesor (mm)': isHPL ? '18.0' : p.thickness.toFixed(1),
        'Tapacanto Largo 1': p.edgeL1 ? 'Sí' : 'No',
        'Tapacanto Largo 2': p.edgeL2 ? 'Sí' : 'No',
        'Tapacanto Ancho 1': p.edgeW1 ? 'Sí' : 'No',
        'Tapacanto Ancho 2': p.edgeW2 ? 'Sí' : 'No',
        Notas: isHPL ? `Sustrato base MDF 18mm para prensado de ${decorName}` : (p.notes || '')
      });

      // Tapacantos por pieza técnica
      const cantosL = (p.edgeL1 ? 1 : 0) + (p.edgeL2 ? 1 : 0);
      const cantosW = (p.edgeW1 ? 1 : 0) + (p.edgeW2 ? 1 : 0);
      const metersNet = (((cantosL * p.length) + (cantosW * p.width)) * p.qty) / 1000;

      if (metersNet > 0) {
        const edgeThick = isFront ? (state.edgeBandingThicknessFronts || 1.0) : (state.edgeBandingThicknessCabinets || 0.45);
        const tipoCanto = isFront ? `Tapacanto PVC 22x${edgeThick.toFixed(2)}mm Frentes` : `Tapacanto PVC 22x${edgeThick.toFixed(2)}mm Estructura`;

        dataEdgeBanding.push({
          Gabinete: p.notes?.includes('Cab') ? p.notes : `Gabinete ${(p.moduleIndex || 0) + 1}`,
          Pieza: p.name,
          'Ubicación / Tipo': isFront ? 'Frente / Puerta' : 'Casco / Estructura',
          'Color / Decorativo': decorName,
          'Espesor Canto (mm)': edgeThick.toFixed(2),
          'Largo (mm)': p.length.toFixed(1),
          'Ancho (mm)': p.width.toFixed(1),
          Cantidad: p.qty,
          'Largo 1': p.edgeL1 ? 'Sí' : '-',
          'Largo 2': p.edgeL2 ? 'Sí' : '-',
          'Ancho 1': p.edgeW1 ? 'Sí' : '-',
          'Ancho 2': p.edgeW2 ? 'Sí' : '-',
          'Metros Netos (m)': Number(metersNet.toFixed(2)),
          'Metros c/ Merma 10% (m)': Number((metersNet * 1.1).toFixed(2))
        });

        const sumKey = `${isFront ? 'FRONT' : 'STRUCT'}_${decorName}_${edgeThick}`;
        if (!edgeSummary[sumKey]) {
          edgeSummary[sumKey] = { desc: tipoCanto, decorName, metersNet: 0, metersWaste: 0, rollThickness: edgeThick };
        }
        edgeSummary[sumKey].metersNet += metersNet;
        edgeSummary[sumKey].metersWaste += metersNet * 1.1;
      }
    });

    // Panel Trasero Continuo de Isla (en Melamina o HPL decorativo)
    if (kState.islandBackConfig?.enabled && kState.islandBackConfig.materialType === 'decorative') {
      const runs = detectContinuousCabinetRuns(cabinets, kState.countertopConfig, kState.walls, kState.architecturalElements, kState.roomConfig);
      const islandRuns = runs.filter(r => r.type === 'island');
      const decorName = getTextureName(kState.islandBackConfig.decorativeColor);
      const isHPL = kState.islandBackConfig.decorativeMaterial === 'hpl';
      const socleGapMm = (kState.socleHeight ?? 10) * 10;

      islandRuns.forEach((run, rIdx) => {
        const totalLenMm = run.totalLengthMm;
        const hMm = kState.islandBackConfig.heightMode === 'to_floor' ? run.heightMm : (run.heightMm - socleGapMm);
        const maxLenMm = 2440;
        const segmentCount = Math.ceil(totalLenMm / maxLenMm);
        const segLenMm = totalLenMm / segmentCount;

        for (let s = 0; s < segmentCount; s++) {
          if (isHPL) {
            dataHPL.push({
              Gabinete: `Isla ${rIdx + 1}`,
              Pieza: `Panel Trasero Trasdosado (${segmentCount > 1 ? `Tramo ${s + 1}/${segmentCount}` : 'Monolítico'})`,
              Material: 'HPL / Laminado Alta Presión',
              Decorativo: decorName,
              'Largo Corte HPL (mm)': (segLenMm + hplOversize).toFixed(1),
              'Ancho Corte HPL (mm)': (hMm + hplOversize).toFixed(1),
              Cantidad: 1
            });
          }

          dataPlacas.push({
            Gabinete: `Isla ${rIdx + 1}`,
            Pieza: `Panel Trasero Trasdosado Isla (${segmentCount > 1 ? `Tramo ${s + 1}/${segmentCount}` : 'Monolítico'})`,
            Material: isHPL ? 'MDF Desnudo (Sustrato HPL)' : 'Melamina Estándar',
            Decorativo: decorName,
            'Cortes Totales': 1,
            Cantidad: 1,
            'Largo (mm)': segLenMm.toFixed(1),
            'Ancho (mm)': hMm.toFixed(1),
            'Veta (Orientación)': 'Horizontal',
            'Espesor (mm)': '18.0',
            'Tapacanto Largo 1': 'Sí',
            'Tapacanto Largo 2': 'Sí',
            'Tapacanto Ancho 1': 'Sí',
            'Tapacanto Ancho 2': 'Sí',
            Notas: `Revestimiento continuo isla (${kState.islandBackConfig.heightMode === 'to_floor' ? 'a piso' : 'con zócalo'})`
          });
        }
      });
    }

    // M² calculations
    const placasByMaterial: Record<string, { name: string; m2: number }> = {};
    dataPlacas.forEach(p => {
      const mat = p.Decorativo;
      if (!placasByMaterial[mat]) placasByMaterial[mat] = { name: mat, m2: 0 };
      placasByMaterial[mat].m2 += (parseFloat(p['Ancho (mm)']) * parseFloat(p['Largo (mm)']) * p.Cantidad) / 1000000;
    });

    const hplByDecorativo: Record<string, { name: string; m2: number }> = {};
    dataHPL.forEach(p => {
      const name = p.Decorativo;
      if (!hplByDecorativo[name]) hplByDecorativo[name] = { name, m2: 0 };
      hplByDecorativo[name].m2 += (parseFloat(p['Ancho Corte HPL (mm)']) * parseFloat(p['Largo Corte HPL (mm)']) * p.Cantidad) / 1000000;
    });

    // Metros de tapacanto calculados
    let cantosGabM = 0;
    let cantosFrentesM = 0;

    dataPlacas.forEach(p => {
      const isFront = p.Pieza.toLowerCase().includes('puerta') || p.Pieza.toLowerCase().includes('frente');
      let cantosL = 0;
      if (p['Tapacanto Largo 1'] === 'Sí') cantosL++;
      if (p['Tapacanto Largo 2'] === 'Sí') cantosL++;
      let cantosA = 0;
      if (p['Tapacanto Ancho 1'] === 'Sí') cantosA++;
      if (p['Tapacanto Ancho 2'] === 'Sí') cantosA++;

      const meters = (((cantosL * parseFloat(p['Largo (mm)'])) + (cantosA * parseFloat(p['Ancho (mm)']))) * p.Cantidad) / 1000;
      if (isFront) {
        cantosFrentesM += meters;
      } else {
        cantosGabM += meters;
      }
    });

    const cantosGabTotal = Math.ceil(cantosGabM * 1.1);
    const cantosFrentesTotal = Math.ceil(cantosFrentesM * 1.1);

    // BoM consolidado
    const dataBoM: any[] = [];

    // Mecanizado
    dataBoM.push({
      Categoria: 'Mecanizado',
      Item: 'Descuento de Sierra (Kerf de Corte)',
      Cantidad: kerf,
      Unidad: 'mm',
      Detalles: 'Espesor de sierra compensado en optimización de corte (Guillotina / Panelera)'
    });

    // Herrajes de armado, tableros, tapacantos e insumos calculados en generateKitchenHardwareList
    hardware.forEach(h => {
      dataBoM.push({
        Categoria: h.Categoria || 'Herrajes',
        Item: h.Item,
        Cantidad: h.Cantidad,
        Unidad: h.Unidad,
        Detalles: h.Detalles || ''
      });
    });

    // Añadir resumen consolidado al final de dataEdgeBanding
    if (Object.keys(edgeSummary).length > 0) {
      dataEdgeBanding.push({
        Gabinete: '--- RESUMEN CONSOLIDADO DE COMPRA ---',
        Pieza: '----------------------------------------',
        'Ubicación / Tipo': '----------------',
        'Color / Decorativo': '----------------',
        'Espesor Canto (mm)': '--',
        'Largo (mm)': '-',
        'Ancho (mm)': '-',
        Cantidad: '-',
        'Largo 1': '-',
        'Largo 2': '-',
        'Ancho 1': '-',
        'Ancho 2': '-',
        'Metros Netos (m)': 0,
        'Metros c/ Merma 10% (m)': 0
      });

      Object.values(edgeSummary).forEach(s => {
        dataEdgeBanding.push({
          Gabinete: 'TOTAL COMPRA',
          Pieza: s.desc,
          'Ubicación / Tipo': s.desc.includes('Frentes') ? 'Puertas/Frentes' : (s.desc.includes('Isla') ? 'Revestimiento Isla' : 'Cuerpo/Estructura'),
          'Color / Decorativo': s.decorName,
          'Espesor Canto (mm)': s.rollThickness.toFixed(2),
          'Largo (mm)': '-',
          'Ancho (mm)': '-',
          Cantidad: 1,
          'Largo 1': '-',
          'Largo 2': '-',
          'Ancho 1': '-',
          'Ancho 2': '-',
          'Metros Netos (m)': Number(s.metersNet.toFixed(2)),
          'Metros c/ Merma 10% (m)': Math.ceil(s.metersWaste)
        });
      });
    }

    const wb = XLSX.utils.book_new();
    const wsPlacas = XLSX.utils.json_to_sheet(dataPlacas);
    const wsBoM = XLSX.utils.json_to_sheet(dataBoM);
    const wsEdgeBanding = XLSX.utils.json_to_sheet(dataEdgeBanding);

    // Styling function
    const applyStyles = (ws: any, colWidths: number[]) => {
      if (!ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'F97316' } }, // Orange 500
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
          }
        };
      }

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ c: C, r: R });
          if (!ws[address]) continue;
          ws[address].s = ws[address].s || {};
          ws[address].s.border = {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          };
          ws[address].s.alignment = { vertical: 'center' };
        }
      }

      ws['!cols'] = colWidths.map(w => ({ wch: w }));
    };

    applyStyles(wsPlacas, [16, 28, 26, 24, 12, 10, 14, 14, 18, 14, 18, 18, 18, 18, 30]);
    applyStyles(wsBoM, [16, 52, 14, 24, 50]);
    applyStyles(wsEdgeBanding, [18, 32, 22, 26, 18, 14, 14, 10, 10, 10, 10, 10, 18, 22]);

    XLSX.utils.book_append_sheet(wb, wsPlacas, '1_Placas_y_Cortes');
    let sheetNum = 2;
    if (dataHPL.length > 0) {
      const wsHPL = XLSX.utils.json_to_sheet(dataHPL);
      applyStyles(wsHPL, [16, 32, 30, 24, 20, 20, 14, 10, 45]);
      XLSX.utils.book_append_sheet(wb, wsHPL, `${sheetNum}_Corte_HPL`);
      sheetNum++;
    }
    XLSX.utils.book_append_sheet(wb, wsBoM, `${sheetNum}_BOM_y_Herrajes`);
    sheetNum++;
    XLSX.utils.book_append_sheet(wb, wsEdgeBanding, `${sheetNum}_Metros_Tapacanto`);
    sheetNum++;

    // Cubiertas Qstone si aplica
    if (kState.countertopConfig?.enabled) {
      const ctBOM = generateCountertopPieces(cabinets, kState.countertopConfig, kState.qstoneCatalog, kState.islandBackConfig, kState.walls, kState.architecturalElements, kState.roomConfig);
      if (ctBOM && ctBOM.pieces.length > 0) {
        const dataStone = ctBOM.pieces.map(p => ({
          'Código': p.id,
          'Descripción Pieza': p.name,
          'Material': ctBOM.product.name,
          'Largo (mm)': p.lengthMm,
          'Ancho (mm)': p.widthMm,
          'Espesor (mm)': p.thicknessMm,
          'Área Neta (m²)': Number(p.areaM2.toFixed(3)),
          'Canto Pulido (m)': Number(p.edgePolishingM.toFixed(2)),
          'Notas de Taller': p.notes || ''
        }));

        const wsStone = XLSX.utils.json_to_sheet(dataStone);
        applyStyles(wsStone, [18, 36, 26, 14, 14, 14, 16, 18, 38]);
        XLSX.utils.book_append_sheet(wb, wsStone, `${sheetNum}_Cubiertas_Qstone`);
      }
    }

    XLSX.writeFile(wb, 'Optimizacion_Cortes_Cocina.xlsx');
  } catch (e: any) {
    console.error('Error exportando Excel de cocina:', e);
  }
};
