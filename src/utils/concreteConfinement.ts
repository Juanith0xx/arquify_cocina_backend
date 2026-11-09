import { ConcreteOpening } from '../store/concreteHouseStore';

/**
 * Calcula el rango permitido [minOffset, maxOffset] para ubicar o mover un vano
 * en un muro específico sin colisionar ni sobreponerse con otros vanos y
 * respetando el margen de esquina y la separación mínima constructiva (machón).
 */
export function getOpeningAllowedRange(
  wallLengthCm: number,
  openingId: string,
  openingWidth: number,
  wallOpenings: ConcreteOpening[],
  minCornerMargin = 20,
  minOpeningSpacing = 20
): { minOffset: number; maxOffset: number } {
  const currentOp = wallOpenings.find((op) => op.id === openingId);
  const currentOffset = currentOp ? currentOp.offsetAlongWall : minCornerMargin;

  let minOffset = minCornerMargin;
  let maxOffset = wallLengthCm - minCornerMargin - openingWidth;

  const otherOpenings = wallOpenings.filter((op) => op.id !== openingId);

  for (const other of otherOpenings) {
    const otherLeft = other.offsetAlongWall;
    const otherRight = other.offsetAlongWall + other.width;

    if (otherLeft < currentOffset) {
      // Vano situado a la izquierda
      minOffset = Math.max(minOffset, otherRight + minOpeningSpacing);
    } else {
      // Vano situado a la derecha
      maxOffset = Math.min(maxOffset, otherLeft - minOpeningSpacing - openingWidth);
    }
  }

  // Si por configuración inicial estuvieran muy juntos, asegurar rango válido
  if (minOffset > maxOffset) {
    minOffset = Math.min(minOffset, currentOffset);
    maxOffset = Math.max(maxOffset, currentOffset);
  }

  return {
    minOffset: Math.round(minOffset),
    maxOffset: Math.round(maxOffset),
  };
}

/**
 * Ajusta y delimita (clampa) el offset horizontal de un vano para evitar colisiones.
 */
export function clampOpeningOffset(
  candidateOffset: number,
  wallLengthCm: number,
  openingId: string,
  openingWidth: number,
  wallOpenings: ConcreteOpening[],
  minCornerMargin = 20,
  minOpeningSpacing = 20
): number {
  const { minOffset, maxOffset } = getOpeningAllowedRange(
    wallLengthCm,
    openingId,
    openingWidth,
    wallOpenings,
    minCornerMargin,
    minOpeningSpacing
  );
  return Math.max(minOffset, Math.min(maxOffset, candidateOffset));
}

/**
 * Calcula las posiciones X en el sistema de coordenadas local del muro (centrado en 0)
 * para los pilares de confinamiento de Hormigón Armado según NCh2123 / D.S. 60.
 *
 * Criterios técnicos:
 * 1. Pilares en esquinas / extremos del muro.
 * 2. Pilares de confinamiento en jambas a ambos lados de cada vano (puerta o ventana).
 * 3. Subdivisión obligatoria de paños ciegos que superen L_max <= 2.80 m.
 * 4. Jamás atraviesa ni colisiona con vanos existentes.
 */
export function getConfinedPillarXPositions(
  wallLengthCm: number,
  openings: ConcreteOpening[],
  colWidth = 20,
  maxPillarSpacingCm = 280
): number[] {
  const halfLen = wallLengthCm / 2;
  const rawPillars: number[] = [];

  // 1. Pilares en esquinas / extremos del muro
  rawPillars.push(-halfLen + colWidth / 2);
  rawPillars.push(halfLen - colWidth / 2);

  // 2. Pilares a los lados de cada vano (jambas de confinamiento)
  openings.forEach((op) => {
    const opLeftX = op.offsetAlongWall - halfLen;
    const opRightX = op.offsetAlongWall + op.width - halfLen;

    const leftPillar = opLeftX - colWidth / 2;
    const rightPillar = opRightX + colWidth / 2;

    if (leftPillar >= -halfLen + colWidth / 2) {
      rawPillars.push(leftPillar);
    }
    if (rightPillar <= halfLen - colWidth / 2) {
      rawPillars.push(rightPillar);
    }
  });

  // Ordenar y fusionar candidatos excesivamente próximos (< 24 cm)
  const sorted = Array.from(new Set(rawPillars.map((x) => Math.round(x)))).sort((a, b) => a - b);
  const basePillars: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      basePillars.push(sorted[i]);
    } else {
      const prev = basePillars[basePillars.length - 1];
      if (sorted[i] - prev < 24) {
        basePillars[basePillars.length - 1] = Math.round((prev + sorted[i]) / 2);
      } else {
        basePillars.push(sorted[i]);
      }
    }
  }

  // 3. Subdivisión obligatoria de paños ciegos que superen maxPillarSpacingCm
  const finalPillars: number[] = [];
  for (let i = 0; i < basePillars.length - 1; i++) {
    const pA = basePillars[i];
    const pB = basePillars[i + 1];
    finalPillars.push(pA);

    const span = pB - pA;
    if (span > maxPillarSpacingCm) {
      const numSubPanels = Math.ceil(span / 260); // Distribuir en paños de max ~2.60 m
      const step = span / numSubPanels;
      for (let k = 1; k < numSubPanels; k++) {
        const candX = Math.round(pA + k * step);
        // Verificar que candX no colisione con el interior de ningún vano
        const inOp = openings.some((op) => {
          const opLeftX = op.offsetAlongWall - halfLen;
          const opRightX = op.offsetAlongWall + op.width - halfLen;
          return candX >= opLeftX - colWidth / 2 + 2 && candX <= opRightX + colWidth / 2 - 2;
        });
        if (!inOp) {
          finalPillars.push(candX);
        }
      }
    }
  }
  finalPillars.push(basePillars[basePillars.length - 1]);

  return Array.from(new Set(finalPillars)).sort((a, b) => a - b);
}

/**
 * Calcula las posiciones (offset respecto al centro 0) de pilares de confinamiento
 * a lo largo de un vano o arista de muro de longitud `lengthCm` según NCh2123 / NCh1928.
 * Incluye los extremos y distribuye pilares intermedios uniformes cuando la distancia excede maxSpacingCm (280 cm).
 */
export function getSpanPillars(
  lengthCm: number,
  colWidth = 15,
  maxSpacingCm = 280
): number[] {
  const halfLen = lengthCm / 2;
  const startP = -halfLen + colWidth / 2;
  const endP = halfLen - colWidth / 2;
  const span = endP - startP;

  if (span <= maxSpacingCm) {
    return [startP, endP];
  }

  const numPanels = Math.ceil(span / 260); // Repartir en paños uniformes <= 2.60 m
  const step = span / numPanels;
  const pillars: number[] = [];

  for (let i = 0; i <= numPanels; i++) {
    pillars.push(Math.round(startP + i * step));
  }

  return pillars;
}

export interface ConfinedElement {
  pos: [number, number, number];
  size: [number, number, number];
}

export interface WallConfinementResult {
  pilares: ConfinedElement[];
  cadenas: ConfinedElement[];
}

/**
 * Genera los segmentos de una viga/cadena horizontal continua a lo largo del muro,
 * sustrayendo cualquier intersección con vanos (puertas y ventanas) para que jamás
 * invadan el espacio libre de aberturas ni cristales.
 */
export function sliceHorizontalBeam(
  wallLengthCm: number,
  yBottom: number,
  yTop: number,
  thicknessCm: number,
  openings: ConcreteOpening[]
): ConfinedElement[] {
  const height = yTop - yBottom;
  if (height <= 0) return [];

  // Encontrar todas las exclusiones en X (intervalos donde un vano intersecta verticalmente con la viga)
  const blockingIntervals: { startX: number; endX: number }[] = [];

  openings.forEach((op) => {
    const opX1 = Math.max(0, op.offsetAlongWall);
    const opX2 = Math.min(wallLengthCm, op.offsetAlongWall + op.width);
    const opY1 = op.sillHeight;
    const opY2 = op.sillHeight + op.height;

    // Verificar si hay traslape vertical con margen de tolerancia (0.5 cm)
    const overlapY1 = Math.max(yBottom, opY1);
    const overlapY2 = Math.min(yTop, opY2);

    if (overlapY2 - overlapY1 > 0.5 && opX2 - opX1 > 0.5) {
      blockingIntervals.push({ startX: opX1, endX: opX2 });
    }
  });

  // Si no hay bloqueos, la viga es una sola pieza completa
  if (blockingIntervals.length === 0) {
    return [
      {
        pos: [0, (yBottom + yTop) / 2, 0],
        size: [wallLengthCm, height, thicknessCm],
      },
    ];
  }

  // Ordenar y fusionar intervalos de bloqueo
  blockingIntervals.sort((a, b) => a.startX - b.startX);
  const merged: { startX: number; endX: number }[] = [];
  for (const interval of blockingIntervals) {
    if (merged.length === 0) {
      merged.push({ ...interval });
    } else {
      const last = merged[merged.length - 1];
      if (interval.startX <= last.endX + 1) {
        last.endX = Math.max(last.endX, interval.endX);
      } else {
        merged.push({ ...interval });
      }
    }
  }

  // Generar los segmentos libres de viga
  const segments: ConfinedElement[] = [];
  let currentX = 0;

  merged.forEach((block) => {
    if (block.startX > currentX + 0.5) {
      const segW = block.startX - currentX;
      const centerX = currentX + segW / 2 - wallLengthCm / 2;
      segments.push({
        pos: [centerX, (yBottom + yTop) / 2, 0],
        size: [segW, height, thicknessCm],
      });
    }
    currentX = Math.max(currentX, block.endX);
  });

  if (currentX < wallLengthCm - 0.5) {
    const segW = wallLengthCm - currentX;
    const centerX = currentX + segW / 2 - wallLengthCm / 2;
    segments.push({
      pos: [centerX, (yBottom + yTop) / 2, 0],
      size: [segW, height, thicknessCm],
    });
  }

  return segments;
}

/**
 * Calcula el sistema completo y normativo de pilares y cadenas de confinamiento (NCh2123 / NCh1928),
 * garantizando que ninguna cadena atraviese puertas ni ventanas y que los dinteles se ubiquen exactamente
 * sobre cada vano.
 */
export function getWallConfinementElements(
  wallLengthCm: number,
  wallHeightCm: number,
  wallThicknessCm: number,
  openings: ConcreteOpening[],
  colWidth = 15,
  beamHeight = 20
): WallConfinementResult {
  const pilares: ConfinedElement[] = [];
  const cadenas: ConfinedElement[] = [];
  const thick = wallThicknessCm + 0.6;

  // 1. Pilares verticales (esquinas, jambas de vanos y paños <= 2.80 m)
  const pilarXPositions = getConfinedPillarXPositions(wallLengthCm, openings, colWidth, 280);
  pilarXPositions.forEach((xPos) => {
    pilares.push({
      pos: [xPos, wallHeightCm / 2, 0],
      size: [colWidth, wallHeightCm, thick],
    });
  });

  // 2. Cadena de sobrecimiento inferior (Y = 0 a beamHeight = 20 cm)
  // Sustraída en vanos con antepecho bajo o puertas (sillHeight < beamHeight)
  const sobrecimientoSegments = sliceHorizontalBeam(
    wallLengthCm,
    0,
    beamHeight,
    thick,
    openings
  );
  cadenas.push(...sobrecimientoSegments);

  // 3. Cadena Intermedia / Dintel (para muros >= 250 cm, típicamente de Y = 210 a Y = 230 cm)
  // Se sustrae automáticamente en cualquier vano que penetre dicho nivel
  if (wallHeightCm >= 250) {
    const midYBot = 210;
    const midYTop = Math.min(wallHeightCm - beamHeight, 230);
    if (midYTop > midYBot) {
      const intermediateSegments = sliceHorizontalBeam(
        wallLengthCm,
        midYBot,
        midYTop,
        thick,
        openings
      );
      cadenas.push(...intermediateSegments);
    }
  }

  // 4. Dinteles específicos sobre vanos que no coincidan exactamente con el nivel de cadena intermedia
  openings.forEach((op) => {
    const opTopY = op.sillHeight + op.height;
    // Si la parte superior del vano no está en [210..230] y queda por debajo de la cadena de coronación
    if (opTopY < wallHeightCm - beamHeight && (opTopY < 205 || opTopY > 235)) {
      const lintelH = Math.min(15, wallHeightCm - beamHeight - opTopY);
      if (lintelH > 5) {
        const opLeft = Math.max(0, op.offsetAlongWall);
        const opRight = Math.min(wallLengthCm, op.offsetAlongWall + op.width);
        const opW = opRight - opLeft;
        const centerX = opLeft + opW / 2 - wallLengthCm / 2;
        cadenas.push({
          pos: [centerX, opTopY + lintelH / 2, 0],
          size: [opW, lintelH, thick],
        });
      }
    }
  });

  // 5. Cadena de Coronación Superior corrida (Y = wallHeightCm - beamHeight a wallHeightCm)
  const crownSegments = sliceHorizontalBeam(
    wallLengthCm,
    wallHeightCm - beamHeight,
    wallHeightCm,
    thick,
    openings
  );
  cadenas.push(...crownSegments);

  return { pilares, cadenas };
}
