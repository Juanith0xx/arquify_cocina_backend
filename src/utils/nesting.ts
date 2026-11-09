export interface NestingPart {
  id: string;
  name: string;
  width: number;
  length: number;
  qty: number;
  color: string;
  edgeL1: boolean;
  edgeL2: boolean;
  edgeW1: boolean;
  edgeW2: boolean;
  allowRotation?: boolean;
}

export interface PlacedPart {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  edgeTop: boolean;
  edgeBottom: boolean;
  edgeLeft: boolean;
  edgeRight: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardResult {
  id: number;
  color: string;
  w: number;
  h: number;
  placedParts: PlacedPart[];
  freeRects: Rect[];
  usedArea: number;
  totalArea: number;
  wastePercentage: number;
}

export function optimizeNesting(parts: NestingPart[], boardW = 2500, boardH = 1830, kerf = 3.2, margin = 15): BoardResult[] {
  // 1. Expand parts by quantity
  interface ItemToPlace {
    id: string;
    name: string;
    w: number;
    h: number;
    eL1: boolean;
    eL2: boolean;
    eW1: boolean;
    eW2: boolean;
    allowRotation: boolean;
  }

  const baseItems: ItemToPlace[] = [];
  parts.forEach(p => {
    for (let i = 0; i < p.qty; i++) {
      baseItems.push({
        id: `${p.id}-${i}`,
        name: p.name,
        w: Math.round(p.length),
        h: Math.round(p.width),
        eL1: p.edgeL1,
        eL2: p.edgeL2,
        eW1: p.edgeW1,
        eW2: p.edgeW2,
        allowRotation: p.allowRotation ?? true
      });
    }
  });

  if (baseItems.length === 0) return [];

  // =========================================================================
  // MOTOR DE CORTE CON DISCO (GUILLOTINA PURA INDUSTRIAL EN FAJAS)
  // Cumplimiento estricto para Escuadradoras, Seccionadoras y Paneleras (Celco/Striebig)
  // Cada corte es 100% pasante de borde a borde (Cero escalones, Cero cortes ciegos/L)
  // =========================================================================

  const usableW = boardW - 2 * margin;
  const usableH = boardH - 2 * margin;

  // Empaquetador de fajas continuas dentro de una sección rectangular
  const packSectionWithStrips = (
    secX: number,
    secY: number,
    secW: number,
    secH: number,
    orientation: 'horizontal' | 'vertical',
    unplaced: ItemToPlace[],
    placedParts: PlacedPart[]
  ): number => {
    let placedArea = 0;

    if (orientation === 'horizontal') {
      let curY = secY;

      while (curY < secY + secH && unplaced.length > 0) {
        const maxAvailH = (secY + secH) - curY;

        // Determinar altura de la faja (stripH): la pieza más alta que cabe en maxAvailH
        let bestH = 0;
        let candIdx = -1;
        let candRot = false;

        for (let i = 0; i < unplaced.length; i++) {
          const it = unplaced[i];
          if (it.h <= maxAvailH && it.w <= secW && it.h > bestH) {
            bestH = it.h;
            candIdx = i;
            candRot = false;
          }
          if (it.allowRotation && it.w <= maxAvailH && it.h <= secW && it.w > bestH) {
            bestH = it.w;
            candIdx = i;
            candRot = true;
          }
        }

        if (candIdx === -1) break; // No cabe ninguna otra faja en la altura restante

        const stripH = bestH;
        let curX = secX;

        // Llenar la faja horizontal de izquierda a derecha (cortes de tronzado verticales)
        while (curX < secX + secW && unplaced.length > 0) {
          const remW = (secX + secW) - curX;
          let pickIdx = -1;
          let pickRot = false;
          let bestScore = -Infinity;

          for (let i = 0; i < unplaced.length; i++) {
            const it = unplaced[i];

            // 1. Orientación normal
            if (it.w <= remW && it.h <= stripH) {
              const hMatch = it.h / stripH;
              const isExact = Math.abs(it.h - stripH) < 1;
              const score = (isExact ? 25000 : 0) + (hMatch * 1000) + it.w;
              if (score > bestScore) {
                bestScore = score;
                pickIdx = i;
                pickRot = false;
              }
            }

            // 2. Orientación rotada (respetando veta)
            if (it.allowRotation && it.h <= remW && it.w <= stripH) {
              const hMatch = it.w / stripH;
              const isExact = Math.abs(it.w - stripH) < 1;
              const score = (isExact ? 25000 : 0) + (hMatch * 1000) + it.h;
              if (score > bestScore) {
                bestScore = score;
                pickIdx = i;
                pickRot = true;
              }
            }
          }

          if (pickIdx === -1) break; // Faja llena en X

          const item = unplaced.splice(pickIdx, 1)[0];
          const pw = pickRot ? item.h : item.w;
          const ph = pickRot ? item.w : item.h;

          placedParts.push({
            id: item.id,
            name: item.name,
            x: curX,
            y: curY,
            w: pw,
            h: ph,
            rotated: pickRot,
            edgeTop: pickRot ? item.eW1 : item.eL1,
            edgeBottom: pickRot ? item.eW2 : item.eL2,
            edgeLeft: pickRot ? item.eL1 : item.eW1,
            edgeRight: pickRot ? item.eL2 : item.eW2
          });
          placedArea += pw * ph;

          // Sub-empaquetado 3-etapas dentro del bloque tronzado [curX, curX + pw] x [curY, curY + stripH]
          let colRemH = stripH - ph - kerf;
          let stackY = curY + ph + kerf;

          while (colRemH >= 50 && unplaced.length > 0) {
            let stIdx = -1;
            let stRot = false;
            let stScore = -Infinity;

            for (let i = 0; i < unplaced.length; i++) {
              const it = unplaced[i];
              // Sub-corte guillotina pasante dentro del bloque: ancho idéntico o submúltiplo
              if (it.w <= pw && it.h <= colRemH) {
                const exactW = Math.abs(it.w - pw) < 1 ? 15000 : 0;
                const s = exactW + (it.h / colRemH) * 500;
                if (s > stScore) {
                  stScore = s;
                  stIdx = i;
                  stRot = false;
                }
              }
              if (it.allowRotation && it.h <= pw && it.w <= colRemH) {
                const exactW = Math.abs(it.h - pw) < 1 ? 15000 : 0;
                const s = exactW + (it.w / colRemH) * 500;
                if (s > stScore) {
                  stScore = s;
                  stIdx = i;
                  stRot = true;
                }
              }
            }

            if (stIdx === -1) break;

            const stItem = unplaced.splice(stIdx, 1)[0];
            const spw = stRot ? stItem.h : stItem.w;
            const sph = stRot ? stItem.w : stItem.h;

            placedParts.push({
              id: stItem.id,
              name: stItem.name,
              x: curX,
              y: stackY,
              w: spw,
              h: sph,
              rotated: stRot,
              edgeTop: stRot ? stItem.eW1 : stItem.eL1,
              edgeBottom: stRot ? stItem.eW2 : stItem.eL2,
              edgeLeft: stRot ? stItem.eL1 : stItem.eW1,
              edgeRight: stRot ? stItem.eL2 : stItem.eW2
            });
            placedArea += spw * sph;
            stackY += sph + kerf;
            colRemH -= (sph + kerf);
          }

          curX += pw + kerf;
        }

        curY += stripH + kerf;
      }
    } else {
      // Fajas Verticales (Columnas)
      let curX = secX;

      while (curX < secX + secW && unplaced.length > 0) {
        const maxAvailW = (secX + secW) - curX;

        let bestW = 0;
        let candIdx = -1;
        let candRot = false;

        for (let i = 0; i < unplaced.length; i++) {
          const it = unplaced[i];
          if (it.w <= maxAvailW && it.h <= secH && it.w > bestW) {
            bestW = it.w;
            candIdx = i;
            candRot = false;
          }
          if (it.allowRotation && it.h <= maxAvailW && it.w <= secH && it.h > bestW) {
            bestW = it.h;
            candIdx = i;
            candRot = true;
          }
        }

        if (candIdx === -1) break;

        const stripW = bestW;
        let curY = secY;

        while (curY < secY + secH && unplaced.length > 0) {
          const remH = (secY + secH) - curY;
          let pickIdx = -1;
          let pickRot = false;
          let bestScore = -Infinity;

          for (let i = 0; i < unplaced.length; i++) {
            const it = unplaced[i];

            if (it.h <= remH && it.w <= stripW) {
              const wMatch = it.w / stripW;
              const isExact = Math.abs(it.w - stripW) < 1;
              const score = (isExact ? 25000 : 0) + (wMatch * 1000) + it.h;
              if (score > bestScore) {
                bestScore = score;
                pickIdx = i;
                pickRot = false;
              }
            }

            if (it.allowRotation && it.w <= remH && it.h <= stripW) {
              const wMatch = it.h / stripW;
              const isExact = Math.abs(it.h - stripW) < 1;
              const score = (isExact ? 25000 : 0) + (wMatch * 1000) + it.w;
              if (score > bestScore) {
                bestScore = score;
                pickIdx = i;
                pickRot = true;
              }
            }
          }

          if (pickIdx === -1) break;

          const item = unplaced.splice(pickIdx, 1)[0];
          const pw = pickRot ? item.h : item.w;
          const ph = pickRot ? item.w : item.h;

          placedParts.push({
            id: item.id,
            name: item.name,
            x: curX,
            y: curY,
            w: pw,
            h: ph,
            rotated: pickRot,
            edgeTop: pickRot ? item.eW1 : item.eL1,
            edgeBottom: pickRot ? item.eW2 : item.eL2,
            edgeLeft: pickRot ? item.eL1 : item.eW1,
            edgeRight: pickRot ? item.eL2 : item.eW2
          });
          placedArea += pw * ph;

          // Sub-empaquetado a lo largo de X dentro de la fila tronzada
          let rowRemW = stripW - pw - kerf;
          let stackX = curX + pw + kerf;

          while (rowRemW >= 50 && unplaced.length > 0) {
            let stIdx = -1;
            let stRot = false;
            let stScore = -Infinity;

            for (let i = 0; i < unplaced.length; i++) {
              const it = unplaced[i];
              if (it.h <= ph && it.w <= rowRemW) {
                const exactH = Math.abs(it.h - ph) < 1 ? 15000 : 0;
                const s = exactH + (it.w / rowRemW) * 500;
                if (s > stScore) {
                  stScore = s;
                  stIdx = i;
                  stRot = false;
                }
              }
              if (it.allowRotation && it.w <= ph && it.h <= rowRemW) {
                const exactH = Math.abs(it.w - ph) < 1 ? 15000 : 0;
                const s = exactH + (it.h / rowRemW) * 500;
                if (s > stScore) {
                  stScore = s;
                  stIdx = i;
                  stRot = true;
                }
              }
            }

            if (stIdx === -1) break;

            const stItem = unplaced.splice(stIdx, 1)[0];
            const spw = stRot ? stItem.h : stItem.w;
            const sph = stRot ? stItem.w : stItem.h;

            placedParts.push({
              id: stItem.id,
              name: stItem.name,
              x: stackX,
              y: curY,
              w: spw,
              h: sph,
              rotated: stRot,
              edgeTop: stRot ? stItem.eW1 : stItem.eL1,
              edgeBottom: stRot ? stItem.eW2 : stItem.eL2,
              edgeLeft: stRot ? stItem.eL1 : stItem.eW1,
              edgeRight: stRot ? stItem.eL2 : stItem.eW2
            });
            placedArea += spw * sph;
            stackX += spw + kerf;
            rowRemW -= (spw + kerf);
          }

          curY += ph + kerf;
        }

        curX += stripW + kerf;
      }
    }

    return placedArea;
  };

  // Simulación completa de tableros garantizando 100% corte guillotina con disco
  const runGuillotineSimulation = (
    items: ItemToPlace[],
    orientation: 'horizontal' | 'vertical',
    useHeadCut = false
  ): BoardResult[] => {
    const unplaced = [...items];
    const boards: BoardResult[] = [];

    while (unplaced.length > 0) {
      const placedParts: PlacedPart[] = [];
      let usedArea = 0;

      // Evaluar corte de cabeza si existen piezas largas (e.g. torres >= 1600mm)
      let headCutPerformed = false;
      if (useHeadCut) {
        let maxDim = 0;
        for (const it of unplaced) {
          const m = Math.max(it.w, it.h);
          if (m > maxDim) maxDim = m;
        }

        if (maxDim >= 1600 && maxDim <= usableW) {
          const headW = maxDim;
          const remW = usableW - headW - kerf;

          if (remW >= 200) {
            headCutPerformed = true;
            usedArea += packSectionWithStrips(margin, margin, headW, usableH, 'horizontal', unplaced, placedParts);
            usedArea += packSectionWithStrips(margin + headW + kerf, margin, remW, usableH, 'horizontal', unplaced, placedParts);
          }
        }
      }

      if (!headCutPerformed) {
        usedArea += packSectionWithStrips(margin, margin, usableW, usableH, orientation, unplaced, placedParts);
      }

      if (placedParts.length === 0 && unplaced.length > 0) {
        const fallback = unplaced.shift()!;
        placedParts.push({
          id: fallback.id,
          name: fallback.name,
          x: margin,
          y: margin,
          w: Math.min(fallback.w, usableW),
          h: Math.min(fallback.h, usableH),
          rotated: false,
          edgeTop: fallback.eL1,
          edgeBottom: fallback.eL2,
          edgeLeft: fallback.eW1,
          edgeRight: fallback.eW2
        });
        usedArea += Math.min(fallback.w, usableW) * Math.min(fallback.h, usableH);
      }

      boards.push({
        id: boards.length + 1,
        color: parts[0]?.color || '#ffffff',
        w: boardW,
        h: boardH,
        placedParts,
        freeRects: [],
        usedArea,
        totalArea: boardW * boardH,
        wastePercentage: 100 - ((usedArea / (boardW * boardH)) * 100)
      });
    }

    return boards;
  };

  // 2. Torneo Multi-Heurístico de Estrategias Guillotina Puras de Disco
  const candidateSorts: { name: string; sortFn: (a: ItemToPlace, b: ItemToPlace) => number }[] = [
    {
      name: 'StripCluster',
      // Agrupa piezas por dimensiones comunes (laterales, frentes, repisas) y luego por área
      sortFn: (a, b) => {
        const minA = Math.min(a.w, a.h);
        const minB = Math.min(b.w, b.h);
        if (Math.abs(minB - minA) > 15) return minB - minA;
        return (b.w * b.h) - (a.w * a.h);
      }
    },
    {
      name: 'AreaDesc',
      sortFn: (a, b) => (b.w * b.h) - (a.w * a.h) || Math.max(b.w, b.h) - Math.max(a.w, a.h)
    },
    {
      name: 'LongestSideDesc',
      sortFn: (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || (b.w * b.h) - (a.w * a.h)
    },
    {
      name: 'HeightDesc',
      sortFn: (a, b) => b.h - a.h || b.w - a.w
    },
    {
      name: 'WidthDesc',
      sortFn: (a, b) => b.w - a.w || b.h - a.h
    }
  ];

  let bestBoards: BoardResult[] | null = null;
  let minBoardsCount = Infinity;
  let minWaste = Infinity;

  // Evaluar exclusivamente estrategias 100% compatibles con disco (Fajas Horizontales, Fajas Verticales y Corte de Cabeza)
  for (const sortStrategy of candidateSorts) {
    const sortedItems = [...baseItems].sort(sortStrategy.sortFn);

    const configs: { orientation: 'horizontal' | 'vertical'; headCut: boolean }[] = [
      { orientation: 'horizontal', headCut: false },
      { orientation: 'vertical', headCut: false },
      { orientation: 'horizontal', headCut: true }
    ];

    for (const cfg of configs) {
      const result = runGuillotineSimulation(sortedItems, cfg.orientation, cfg.headCut);
      const totalWaste = result.reduce((acc, b) => acc + b.wastePercentage, 0) / (result.length || 1);

      if (
        result.length < minBoardsCount || 
        (result.length === minBoardsCount && totalWaste < minWaste)
      ) {
        bestBoards = result;
        minBoardsCount = result.length;
        minWaste = totalWaste;
      }
    }
  }

  return bestBoards || [];
}
