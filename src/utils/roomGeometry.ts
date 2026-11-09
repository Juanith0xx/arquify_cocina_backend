export interface RoomVertex {
  id: string;
  x: number; // en cm
  y: number; // en cm (corresponde a Z en escena 3D)
}

export type RoomShapeType = 'rectangular' | 'freeform' | 'l_shape' | 'five_corners' | 'u_shape' | 'linear';

export interface RoomConfig {
  type: RoomShapeType;
  wallHeight: number; // cm (ej. 250)
  wallThickness: number; // cm (ej. 20)
  vertices: RoomVertex[];
}

export interface WallSegmentData {
  index: number;
  label: string; // A, B, C, D...
  start: RoomVertex;
  end: RoomVertex;
  length: number; // cm
  angleWithNext: number; // grados en el vértice end
}

// Genera una letra A, B, C, ... AA, AB etc.
export function getWallLabel(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < 26) return letters[index];
  return letters[Math.floor(index / 26) - 1] + letters[index % 26];
}

// Calcula la distancia euclidiana entre dos puntos en cm
export function distanceBetween(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Calcula el área de un polígono usando el método de Gauss / Shoelace en m²
export function calculatePolygonArea(vertices: RoomVertex[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];
    sum += current.x * next.y - next.x * current.y;
  }
  const areaCm2 = Math.abs(sum) / 2;
  return Number((areaCm2 / 10000).toFixed(2)); // m²
}

// Calcula el perímetro total en metros
export function calculatePolygonPerimeter(vertices: RoomVertex[]): number {
  if (vertices.length < 2) return 0;
  let totalCm = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];
    totalCm += distanceBetween(current, next);
  }
  return Number((totalCm / 100).toFixed(2)); // metros
}

// Calcula el ángulo interior en grados en el vértice B (entre segmento A->B y B->C)
export function calculateVertexAngle(prev: RoomVertex, current: RoomVertex, next: RoomVertex): number {
  const v1 = { x: prev.x - current.x, y: prev.y - current.y };
  const v2 = { x: next.x - current.x, y: next.y - current.y };

  const angle1 = Math.atan2(v1.y, v1.x);
  const angle2 = Math.atan2(v2.y, v2.x);

  let diff = angle2 - angle1;
  while (diff < 0) diff += Math.PI * 2;
  while (diff >= Math.PI * 2) diff -= Math.PI * 2;

  let deg = Math.round((diff * 180) / Math.PI);
  // Normalizar a valor entre 1 y 359
  if (deg === 0) deg = 360;
  return deg;
}

// Descompone los vértices en datos de segmentos de pared y ángulos
export function analyzeRoomWalls(vertices: RoomVertex[]): WallSegmentData[] {
  const n = vertices.length;
  if (n < 2) return [];

  const segments: WallSegmentData[] = [];
  for (let i = 0; i < n; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % n];
    const next = vertices[(i + 2) % n];

    const length = Math.round(distanceBetween(start, end) * 10) / 10;
    const angle = n >= 3 ? calculateVertexAngle(start, end, next) : 90;

    segments.push({
      index: i,
      label: getWallLabel(i),
      start,
      end,
      length,
      angleWithNext: angle,
    });
  }
  return segments;
}

// Centra los vértices alrededor de (0, 0)
export function centerVertices(vertices: RoomVertex[]): RoomVertex[] {
  if (vertices.length === 0) return [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  vertices.forEach(v => {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return vertices.map(v => ({
    ...v,
    x: Math.round((v.x - centerX) * 10) / 10,
    y: Math.round((v.y - centerY) * 10) / 10,
  }));
}

// Generadores de Plantillas Predefinidas
export function getPresetRoomVertices(type: RoomShapeType): RoomVertex[] {
  switch (type) {
    case 'rectangular': {
      // 500cm x 400cm centrado (Exacto imagen de referencia)
      const w = 500;
      const h = 400;
      return [
        { id: 'v1', x: -w / 2, y: -h / 2 },
        { id: 'v2', x: w / 2, y: -h / 2 },
        { id: 'v3', x: w / 2, y: h / 2 },
        { id: 'v4', x: -w / 2, y: h / 2 },
      ];
    }
    case 'l_shape': {
      // Forma en L paramétrica
      return [
        { id: 'v1', x: -250, y: -200 },
        { id: 'v2', x: 50, y: -200 },
        { id: 'v3', x: 50, y: 0 },
        { id: 'v4', x: 250, y: 0 },
        { id: 'v5', x: 250, y: 200 },
        { id: 'v6', x: -250, y: 200 },
      ];
    }
    case 'five_corners': {
      // 5 esquinas con chaflán diagonal en esquina superior derecha
      return [
        { id: 'v1', x: -250, y: -200 },
        { id: 'v2', x: 100, y: -200 },
        { id: 'v3', x: 250, y: -50 },
        { id: 'v4', x: 250, y: 200 },
        { id: 'v5', x: -250, y: 200 },
      ];
    }
    case 'u_shape': {
      // Forma en U (3 alas envolventes)
      return [
        { id: 'v1', x: -250, y: -200 },
        { id: 'v2', x: 250, y: -200 },
        { id: 'v3', x: 250, y: 200 },
        { id: 'v4', x: 100, y: 200 },
        { id: 'v5', x: 100, y: 0 },
        { id: 'v6', x: -100, y: 0 },
        { id: 'v7', x: -100, y: 200 },
        { id: 'v8', x: -250, y: 200 },
      ];
    }
    case 'linear': {
      // Cocina abierta de 2 paredes en escuadra (3 vértices)
      return [
        { id: 'v1', x: -200, y: -150 },
        { id: 'v2', x: 250, y: -150 },
        { id: 'v3', x: 250, y: 200 },
        { id: 'v4', x: -200, y: 200 },
      ];
    }
    case 'freeform':
    default: {
      return [
        { id: 'v1', x: -200, y: -150 },
        { id: 'v2', x: 200, y: -150 },
        { id: 'v3', x: 200, y: 150 },
        { id: 'v4', x: -200, y: 150 },
      ];
    }
  }
}

// Convertidor a objetos WallType[] para el motor 3D
export function generateWallsFromRoom(config: RoomConfig): any[] {
  const { vertices, wallHeight, wallThickness } = config;
  const n = vertices.length;
  if (n < 2) return [];

  const walls = [];
  for (let i = 0; i < n; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];

    walls.push({
      id: `wall_${i}_${current.id}_${next.id}`,
      start: [current.x, current.y] as [number, number],
      end: [next.x, next.y] as [number, number],
      thickness: wallThickness,
      height: wallHeight,
    });
  }
  return walls;
}

// Mueve un vértice en modo ORTHO preservando los ángulos rectos (90°) de sus muros adyacentes
export function moveVertexOrthogonal(
  vertices: RoomVertex[],
  vertexIndex: number,
  targetPos: { x: number; y: number },
  snapStepCm: number = 5
): RoomVertex[] {
  const n = vertices.length;
  if (n < 3 || vertexIndex < 0 || vertexIndex >= n) return vertices;

  const snappedX = Math.round(targetPos.x / snapStepCm) * snapStepCm;
  const snappedY = Math.round(targetPos.y / snapStepCm) * snapStepCm;

  const prevIdx = (vertexIndex - 1 + n) % n;
  const nextIdx = (vertexIndex + 1) % n;

  const cur = vertices[vertexIndex];
  const prev = vertices[prevIdx];
  const next = vertices[nextIdx];

  const updated = vertices.map((v) => ({ ...v }));
  updated[vertexIndex] = { ...cur, x: snappedX, y: snappedY };

  // Analizar si el segmento (prev -> cur) es horizontal o vertical
  const dxPrev = Math.abs(cur.x - prev.x);
  const dyPrev = Math.abs(cur.y - prev.y);
  if (dxPrev >= dyPrev) {
    // Era horizontal: para mantenerlo horizontal a 90°, el vértice prev debe compartir la nueva Y
    updated[prevIdx].y = snappedY;
  } else {
    // Era vertical: para mantenerlo vertical a 90°, el vértice prev debe compartir la nueva X
    updated[prevIdx].x = snappedX;
  }

  // Analizar si el segmento (cur -> next) es horizontal o vertical
  const dxNext = Math.abs(next.x - cur.x);
  const dyNext = Math.abs(next.y - cur.y);
  if (dxNext >= dyNext) {
    // Es horizontal: para mantenerlo horizontal a 90°, el vértice next debe compartir la nueva Y
    updated[nextIdx].y = snappedY;
  } else {
    // Es vertical: para mantenerlo vertical a 90°, el vértice next debe compartir la nueva X
    updated[nextIdx].x = snappedX;
  }

  return updated;
}

// Modifica la longitud de una pared preservando la ortogonalidad (90°) sin deformar en diagonales
export function adjustWallLengthOrthogonal(
  vertices: RoomVertex[],
  segmentIndex: number,
  newLengthCm: number,
  snapStepCm: number = 5
): RoomVertex[] {
  const n = vertices.length;
  if (n < 3 || segmentIndex < 0 || segmentIndex >= n || newLengthCm <= 20) return vertices;

  const p1Idx = segmentIndex;
  const p2Idx = (segmentIndex + 1) % n;
  const p3Idx = (segmentIndex + 2) % n;

  const p1 = vertices[p1Idx];
  const p2 = vertices[p2Idx];

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const isHorizontal = Math.abs(dx) >= Math.abs(dy);

  const updated = vertices.map((v) => ({ ...v }));

  if (n === 4) {
    // Si es un cuadrilátero regular, escalar simétricamente la dimensión correspondiente
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });

    const targetW = isHorizontal ? newLengthCm : maxX - minX;
    const targetH = isHorizontal ? maxY - minY : newLengthCm;

    return [
      { id: vertices[0].id, x: -targetW / 2, y: -targetH / 2 },
      { id: vertices[1].id, x: targetW / 2, y: -targetH / 2 },
      { id: vertices[2].id, x: targetW / 2, y: targetH / 2 },
      { id: vertices[3].id, x: -targetW / 2, y: targetH / 2 },
    ];
  }

  // Si es un segmento diagonal (ochava / chaflán a 45°)
  const len = Math.hypot(dx, dy);
  if (Math.abs(dx) > 15 && Math.abs(dy) > 15 && Math.abs(Math.abs(dx) - Math.abs(dy)) < 30) {
    const ratio = newLengthCm / (len || 1);
    const newDx = dx * ratio;
    const newDy = dy * ratio;
    updated[p2Idx].x = Math.round((p1.x + newDx) * 10) / 10;
    updated[p2Idx].y = Math.round((p1.y + newDy) * 10) / 10;
    return updated;
  }

  if (isHorizontal) {
    const dirX = dx >= 0 ? 1 : -1;
    const currentLen = Math.abs(dx) || 1;
    const deltaX = (newLengthCm - currentLen) * dirX;
    updated[p2Idx].x += deltaX;
    updated[p3Idx].x += deltaX;
  } else {
    const dirY = dy >= 0 ? 1 : -1;
    const currentLen = Math.abs(dy) || 1;
    const deltaY = (newLengthCm - currentLen) * dirY;
    updated[p2Idx].y += deltaY;
    updated[p3Idx].y += deltaY;
  }

  return updated;
}

// Endereza cualquier polígono a ángulos estrictos de 90°
export function orthogonalizePolygon(vertices: RoomVertex[], snapModuleCm = 5): RoomVertex[] {
  const n = vertices.length;
  if (n < 3) return vertices;

  // Si es un rectángulo estándar de 4 vértices
  if (n === 4) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });

    const w = Math.max(snapModuleCm * 2, Math.round((maxX - minX) / snapModuleCm) * snapModuleCm);
    const h = Math.max(snapModuleCm * 2, Math.round((maxY - minY) / snapModuleCm) * snapModuleCm);

    return [
      { id: vertices[0].id || 'v1', x: -w / 2, y: -h / 2 },
      { id: vertices[1].id || 'v2', x: w / 2, y: -h / 2 },
      { id: vertices[2].id || 'v3', x: w / 2, y: h / 2 },
      { id: vertices[3].id || 'v4', x: -w / 2, y: h / 2 },
    ];
  }

  // Si es una forma en L (6 vértices)
  if (n === 6) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });

    const totalW = Math.max(snapModuleCm * 3, Math.round((maxX - minX) / snapModuleCm) * snapModuleCm);
    const totalH = Math.max(snapModuleCm * 3, Math.round((maxY - minY) / snapModuleCm) * snapModuleCm);
    const wingW = Math.max(snapModuleCm, Math.round(totalW * 0.45 / snapModuleCm) * snapModuleCm);
    const wingH = Math.max(snapModuleCm, Math.round(totalH * 0.50 / snapModuleCm) * snapModuleCm);

    const halfW = totalW / 2;
    const halfH = totalH / 2;

    return [
      { id: 'v1', x: -halfW, y: -halfH },
      { id: 'v2', x: halfW - wingW, y: -halfH },
      { id: 'v3', x: halfW - wingW, y: -halfH + wingH },
      { id: 'v4', x: halfW, y: -halfH + wingH },
      { id: 'v5', x: halfW, y: halfH },
      { id: 'v6', x: -halfW, y: halfH },
    ];
  }

  // Para polígonos generales, iterar proyectando cada arista a su eje dominante a 90°
  const snapped = vertices.map((v) => ({
    ...v,
    x: Math.round(v.x / snapModuleCm) * snapModuleCm,
    y: Math.round(v.y / snapModuleCm) * snapModuleCm,
  }));

  for (let i = 0; i < n; i++) {
    const cur = snapped[i];
    const nextIdx = (i + 1) % n;
    const next = snapped[nextIdx];

    const dx = Math.abs(next.x - cur.x);
    const dy = Math.abs(next.y - cur.y);

    if (dx >= dy) {
      next.y = cur.y; // Forzar horizontal
    } else {
      next.x = cur.x; // Forzar vertical
    }
  }

  return centerVertices(snapped);
}

// Mueve una pared completa (segmento) en dirección perpendicular preservando la ortogonalidad
export function moveWallSegmentOrthogonal(
  vertices: RoomVertex[],
  segmentIndex: number,
  targetCm: { x: number; y: number },
  snapStepCm: number = 5
): RoomVertex[] {
  const n = vertices.length;
  if (n < 3 || segmentIndex < 0 || segmentIndex >= n) return vertices;

  const p1Idx = segmentIndex;
  const p2Idx = (segmentIndex + 1) % n;
  const p1 = vertices[p1Idx];
  const p2 = vertices[p2Idx];

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return vertices;

  const isPureHorizontal = Math.abs(dy) <= 5 || Math.abs(dx) >= Math.abs(dy) * 2;
  const isPureVertical = Math.abs(dx) <= 5 || Math.abs(dy) >= Math.abs(dx) * 2;

  const updated = vertices.map((v) => ({ ...v }));

  if (isPureHorizontal) {
    // La pared es horizontal -> se mueve verticalmente (en Y)
    const snappedY = Math.round(targetCm.y / snapStepCm) * snapStepCm;
    updated[p1Idx].y = snappedY;
    updated[p2Idx].y = snappedY;
  } else if (isPureVertical) {
    // La pared es vertical -> se mueve horizontalmente (en X)
    const snappedX = Math.round(targetCm.x / snapStepCm) * snapStepCm;
    updated[p1Idx].x = snappedX;
    updated[p2Idx].x = snappedX;
  } else {
    // Pared diagonal (chaflán a 45° o similar) -> traslación a lo largo de su vector normal
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const nx = -dy / len;
    const ny = dx / len;
    const proj = (targetCm.x - midX) * nx + (targetCm.y - midY) * ny;
    const snappedProj = Math.round(proj / snapStepCm) * snapStepCm;
    updated[p1Idx].x = Math.round((p1.x + nx * snappedProj) * 10) / 10;
    updated[p1Idx].y = Math.round((p1.y + ny * snappedProj) * 10) / 10;
    updated[p2Idx].x = Math.round((p2.x + nx * snappedProj) * 10) / 10;
    updated[p2Idx].y = Math.round((p2.y + ny * snappedProj) * 10) / 10;
  }

  return updated;
}
