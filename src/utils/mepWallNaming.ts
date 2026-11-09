import { WallType, CabinetType, ArchitecturalElement } from '../store/kitchenStore';
import { getWallLabel } from './roomGeometry';

export interface WallDescriptiveInfo {
  id: string;
  index: number;
  letter: string;
  lengthCm: number;
  orientation: string;
  shortLabel: string;
  fullLabel: string;
  cabinetsCount: number;
  archElementsCount: number;
  startPoint: [number, number];
  endPoint: [number, number];
}

/**
 * Calcula la información descriptiva, cardinal y de elementos para identificar claramente cada muro.
 */
export function getWallDescriptiveInfo(
  wall: WallType,
  allWalls: WallType[],
  cabinets: CabinetType[] = [],
  archElements: ArchitecturalElement[] = []
): WallDescriptiveInfo {
  const index = allWalls.findIndex((w) => w.id === wall.id);
  const safeIndex = index >= 0 ? index : 0;
  const letter = getWallLabel(safeIndex);

  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const lengthCm = Math.round(Math.hypot(dx, dz));

  const midX = (wall.start[0] + wall.end[0]) / 2;
  const midZ = (wall.start[1] + wall.end[1]) / 2;

  // Orientación geométrica y cardinal
  let orientation = 'General';
  const absDx = Math.abs(dx);
  const absDz = Math.abs(dz);

  if (absDz <= absDx * 0.35) {
    // Principalmente horizontal (eje X)
    orientation = midZ <= 0 ? 'Fondo / Norte' : 'Frente / Sur';
  } else if (absDx <= absDz * 0.35) {
    // Principalmente vertical (eje Z)
    orientation = midX >= 0 ? 'Lateral Der / Este' : 'Lateral Izq / Oeste';
  } else {
    // Diagonal
    const latH = midZ <= 0 ? 'Norte' : 'Sur';
    const latV = midX >= 0 ? 'Este' : 'Oeste';
    orientation = `Diagonal ${latH}-${latV}`;
  }

  // Contar muebles situados próximos a este muro
  const wallCabinets = cabinets.filter((c) => {
    if (c.type === 'island') return false;
    // Proyección del mueble sobre el segmento del muro
    const uX = dx / (lengthCm || 1);
    const uZ = dz / (lengthCm || 1);
    const s = (c.position[0] - wall.start[0]) * uX + (c.position[2] - wall.start[1]) * uZ;
    if (s < -20 || s > lengthCm + 20) return false;
    const projX = wall.start[0] + s * uX;
    const projZ = wall.start[1] + s * uZ;
    const dist = Math.hypot(c.position[0] - projX, c.position[2] - projZ);
    return dist <= (c.depth + 40);
  });

  // Contar vanos o pilares vinculados a este muro
  const wallArchs = archElements.filter((a) => a.wallId === wall.id);

  const detailsParts: string[] = [`${lengthCm} cm`];
  if (wallCabinets.length > 0) {
    detailsParts.push(`${wallCabinets.length} ${wallCabinets.length === 1 ? 'mueble' : 'muebles'}`);
  }
  if (wallArchs.length > 0) {
    detailsParts.push(`${wallArchs.length} ${wallArchs.length === 1 ? 'vano' : 'vanos'}`);
  }

  const shortLabel = `Muro ${letter} (${orientation.split('/')[0].trim()} · ${lengthCm} cm)`;
  const fullLabel = `Muro ${letter} · ${orientation} (${detailsParts.join(' · ')})`;

  return {
    id: wall.id,
    index: safeIndex,
    letter,
    lengthCm,
    orientation,
    shortLabel,
    fullLabel,
    cabinetsCount: wallCabinets.length,
    archElementsCount: wallArchs.length,
    startPoint: wall.start,
    endPoint: wall.end,
  };
}

/**
 * Obtiene la lista completa de información de muros descriptivos para selectores y listas.
 */
export function getAllWallsDescriptiveInfo(
  walls: WallType[],
  cabinets: CabinetType[] = [],
  archElements: ArchitecturalElement[] = []
): WallDescriptiveInfo[] {
  return walls.map((w) => getWallDescriptiveInfo(w, walls, cabinets, archElements));
}
