import { MepPoint, MepType, MEP_TYPE_CONFIGS, MEP_PRESETS, MepPresetType } from '../types/mep';
import { WallType } from '../store/kitchenStore';
import { getWallInwardNormal } from './kitchenCollision';

/**
 * Calcula la posición 3D [x, y, z] y rotación en el plano de un punto MEP montado sobre un muro
 */
export function calculateMepPositionOnWall(
  wall: WallType,
  offsetCm: number,
  elevationCm: number,
  roomPoly?: [number, number][]
): { position: [number, number, number]; rotation: number } {
  const [x1, z1] = wall.start;
  const [x2, z2] = wall.end;
  const wLen = Math.hypot(x2 - x1, z2 - z1);

  if (wLen < 1) {
    return { position: [x1, elevationCm, z1], rotation: 0 };
  }

  const uX = (x2 - x1) / wLen;
  const uZ = (z2 - z1) / wLen;

  // Clampear offset para que no se salga de las esquinas del muro
  const clampedOffset = Math.max(10, Math.min(wLen - 10, offsetCm));

  // Normal hacia el interior de la habitación
  const [normX, normZ] = getWallInwardNormal(x1, z1, x2, z2, roomPoly);

  // Montado justo en la cara frontal interior del muro (frente del tabique visible al interior)
  const wallThick = wall.thickness || 20;
  const halfThick = wallThick / 2 + 0.1;
  const pX = x1 + clampedOffset * uX + normX * halfThick;
  const pZ = z1 + clampedOffset * uZ + normZ * halfThick;

  // Rotación orientada hacia el interior de la estancia (+Z local apunta hacia el interior de la habitación)
  const rotation = Math.atan2(normX, normZ);

  return {
    position: [pX, elevationCm, pZ],
    rotation,
  };
}

/**
 * Genera un conjunto predeterminado de puntos MEP para la pared principal de la cocina
 */
export function generateDefaultMepPoints(walls: WallType[], roomPoly?: [number, number][]): MepPoint[] {
  if (!walls || walls.length === 0) return [];

  const mainWall = walls[0];
  const [x1, z1] = mainWall.start;
  const [x2, z2] = mainWall.end;
  const wLen = Math.hypot(x2 - x1, z2 - z1);
  const midOffset = wLen / 2;

  const points: MepPoint[] = [];

  // Preset 1: Lavaplatos a -40cm del centro
  const sinkCenterOffset = Math.max(40, midOffset - 40);
  
  // Agua Caliente (AC)
  const acPos = calculateMepPositionOnWall(mainWall, sinkCenterOffset - 10, 55, roomPoly);
  points.push({
    id: 'mep-ac-default',
    name: 'Agua Caliente (AC)',
    type: 'water_hot',
    wallId: mainWall.id,
    wallOffset: sinkCenterOffset - 10,
    elevation: 55,
    position: acPos.position,
    rotation: acPos.rotation,
    diameterMm: 15,
    specs: 'Terminal HE 1/2" (Monomando)',
  });

  // Desagüe Sanitario (DES)
  const desPos = calculateMepPositionOnWall(mainWall, sinkCenterOffset, 45, roomPoly);
  points.push({
    id: 'mep-des-default',
    name: 'Desagüe PVC Ø50 (DES)',
    type: 'drain',
    wallId: mainWall.id,
    wallOffset: sinkCenterOffset,
    elevation: 45,
    position: desPos.position,
    rotation: desPos.rotation,
    diameterMm: 50,
    specs: 'Descarga sanitaria PVC Ø50mm',
  });

  // Agua Fría (AF)
  const afPos = calculateMepPositionOnWall(mainWall, sinkCenterOffset + 10, 55, roomPoly);
  points.push({
    id: 'mep-af-default',
    name: 'Agua Fría (AF)',
    type: 'water_cold',
    wallId: mainWall.id,
    wallOffset: sinkCenterOffset + 10,
    elevation: 55,
    position: afPos.position,
    rotation: afPos.rotation,
    diameterMm: 15,
    specs: 'Terminal HE 1/2" (Monomando)',
  });

  // Enchufe doble sobre cubierta
  const socketOffset = Math.min(wLen - 40, midOffset + 50);
  const sockPos = calculateMepPositionOnWall(mainWall, socketOffset, 110, roomPoly);
  points.push({
    id: 'mep-sock-default',
    name: 'Enchufe Sobre Cubierta 220V',
    type: 'electric_socket',
    wallId: mainWall.id,
    wallOffset: socketOffset,
    elevation: 110,
    position: sockPos.position,
    rotation: sockPos.rotation,
    diameterMm: 65,
    specs: 'Doble toma 10/16A embutida',
  });

  // Enchufe de fuerza para horno empotrado
  const pwrOffset = Math.min(wLen - 20, midOffset + 110);
  const pwrPos = calculateMepPositionOnWall(mainWall, pwrOffset, 35, roomPoly);
  points.push({
    id: 'mep-pwr-default',
    name: 'Enchufe Fuerza Horno 16A',
    type: 'electric_power',
    wallId: mainWall.id,
    wallOffset: pwrOffset,
    elevation: 35,
    position: pwrPos.position,
    rotation: pwrPos.rotation,
    diameterMm: 65,
    specs: 'Línea dedicada 16A 220V',
  });

  // Llave de paso de Gas
  const gasOffset = Math.min(wLen - 20, midOffset + 175);
  const gasPos = calculateMepPositionOnWall(mainWall, gasOffset, 75, roomPoly);
  points.push({
    id: 'mep-gas-default',
    name: 'Llave de Paso de Gas',
    type: 'gas',
    wallId: mainWall.id,
    wallOffset: gasOffset,
    elevation: 75,
    position: gasPos.position,
    rotation: gasPos.rotation,
    diameterMm: 20,
    specs: 'Válvula de bola gas 1/2"',
  });

  return points;
}
