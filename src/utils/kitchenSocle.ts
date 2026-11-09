import { CabinetType, WallType } from '../store/kitchenStore';
import { getClosestPointOnSegment } from './kitchenCollision';

export interface SocleWorldPiece {
  id: string;
  length: number; // in cm
  center: [number, number, number];
  rotation: number;
}

export interface SocleWorldJoint {
  id: string;
  position: [number, number, number];
  rotation: number;
}

export interface SocleLateralReturn {
  id: string;
  position: [number, number, number];
  rotation: number;
  depth: number;
  isRight: boolean;
}

export interface SocleCorner {
  id: string;
  position: [number, number, number];
  rotation: number;
  isRight: boolean;
}

export interface ProcessedSocleSystem {
  pieces: SocleWorldPiece[];
  straightJoints: SocleWorldJoint[];
  laterals: SocleLateralReturn[];
  corners: SocleCorner[];
  socleColor: string;
}

/**
 * Calculates continuous kitchen socle system optimized for standard 3000mm (3m) commercial profiles.
 * - Base, tall, and island modules on the floor are unified into collinear runs.
 * - Intermediate joints between adjacent modules are strictly omitted.
 * - Straight 180° H-joints are only placed when a single continuous run exceeds 3000mm.
 * - Lateral returns and 90° corners are only generated on exposed flanks (not against walls or adjacent cabinets).
 */
export function calculateSocleSystem(
  cabinets: CabinetType[],
  walls: WallType[] = [],
  _roomVertices: any[] = [],
  socleFinish: 'aluminum' | 'black' | string = 'aluminum',
  socleHeight: number = 10
): ProcessedSocleSystem {
  // Filter all floor-standing cabinets that have legs/socle
  const floorCabinets = cabinets.filter(
    (c) => c.type === 'base' || c.type === 'island' || c.type === 'tall'
  );

  const defaultColor = socleFinish === 'black' ? '#18181b' : '#e2e8f0';

  if (floorCabinets.length === 0) {
    return { pieces: [], straightJoints: [], laterals: [], corners: [], socleColor: defaultColor };
  }

  const socleColor = socleFinish === 'black' ? '#18181b' : (socleFinish === 'aluminum' ? '#e2e8f0' : (floorCabinets[0]?.socleColor || '#e2e8f0'));
  const legsHeight = socleHeight || 10;
  const socleY = legsHeight / 2;

  // Helper to get unit vectors and front/flank coordinates for a cabinet
  const getCabGeo = (cab: CabinetType) => {
    const rot = cab.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    // Three.js: uX: vector along width from left to right ([cos, -sin])
    const uX: [number, number] = [cos, -sin];
    // uZ: vector along depth from back to front ([sin, cos])
    const uZ: [number, number] = [sin, cos];

    const cx = cab.position[0];
    const cz = cab.position[2];

    const left: [number, number] = [cx - (cab.width / 2) * uX[0], cz - (cab.width / 2) * uX[1]];
    const right: [number, number] = [cx + (cab.width / 2) * uX[0], cz + (cab.width / 2) * uX[1]];
    const frontCenter: [number, number] = [cx + (cab.depth / 2 - 2) * uZ[0], cz + (cab.depth / 2 - 2) * uZ[1]];

    return { cx, cz, uX, uZ, rot, left, right, frontCenter, width: cab.width, depth: cab.depth };
  };

  // Helper to check if a world point (x, z) is against or very close to any wall
  const isPointNearWall = (px: number, pz: number, threshold = 15): boolean => {
    if (!walls || walls.length === 0) return false;
    for (const w of walls) {
      const proj = getClosestPointOnSegment(px, pz, w.start[0], w.start[1], w.end[0], w.end[1]);
      if (proj.dist < threshold + (w.thickness || 20) / 2) {
        return true;
      }
    }
    return false;
  };

  const dist = (p1: [number, number], p2: [number, number]) =>
    Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

  const visited = new Set<string>();
  const pieces: SocleWorldPiece[] = [];
  const straightJoints: SocleWorldJoint[] = [];
  const laterals: SocleLateralReturn[] = [];
  const corners: SocleCorner[] = [];

  for (const cab of floorCabinets) {
    if (visited.has(cab.id)) continue;

    // Collect all collinear touching/overlapping cabinets into a single run
    const component: CabinetType[] = [];
    const queue: CabinetType[] = [cab];
    visited.add(cab.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      const curGeo = getCabGeo(current);

      for (const other of floorCabinets) {
        if (visited.has(other.id)) continue;

        // Check parallel orientation (modulo PI)
        const rotDiff = Math.abs((other.rotation || 0) - (current.rotation || 0)) % Math.PI;
        const isParallel = rotDiff < 0.12 || Math.abs(rotDiff - Math.PI) < 0.12;
        if (!isParallel) continue;

        const otherGeo = getCabGeo(other);

        // Check that their front planes or centerlines are aligned along depth axis
        const depthOffset = (otherGeo.cx - curGeo.cx) * curGeo.uZ[0] + (otherGeo.cz - curGeo.cz) * curGeo.uZ[1];
        const maxAllowedDepthOffset = (current.type === 'island' || other.type === 'island') ? 25 : 15;
        if (Math.abs(depthOffset) > maxAllowedDepthOffset) continue; // Not on the same run line

        // Check if their width spans touch or overlap along the uX axis
        const isTouching =
          dist(curGeo.right, otherGeo.left) < 12 ||
          dist(curGeo.left, otherGeo.right) < 12 ||
          dist(curGeo.right, otherGeo.right) < 12 ||
          dist(curGeo.left, otherGeo.left) < 12;

        if (isTouching) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    // Orientation reference from the component (Three.js coordinate system)
    const baseRot = component[0].rotation || 0;
    const cos = Math.cos(baseRot);
    const sin = Math.sin(baseRot);
    const uX: [number, number] = [cos, -sin];
    const uZ: [number, number] = [sin, cos];

    // Sort all cabinets in the run along the uX axis (from leftmost to rightmost)
    component.sort((a, b) => {
      const projA = a.position[0] * uX[0] + a.position[2] * uX[1];
      const projB = b.position[0] * uX[0] + b.position[2] * uX[1];
      return projA - projB;
    });

    const leftmostCab = component[0];
    const leftX = leftmostCab.position[0] - (leftmostCab.width / 2) * uX[0];
    const leftZ = leftmostCab.position[2] - (leftmostCab.width / 2) * uX[1];

    const rightmostCab = component[component.length - 1];
    const rightX = rightmostCab.position[0] + (rightmostCab.width / 2) * uX[0];
    const rightZ = rightmostCab.position[2] + (rightmostCab.width / 2) * uX[1];

    // Detect adjoining terminal shelf modules (Torre Terminal Repisas Abiertas) on flanks
    const rightTerminal = floorCabinets.find((c) => {
      if (c.variant !== 'tall_terminal_shelves' || visited.has(c.id)) return false;
      const cDist = dist([rightX, rightZ], [c.position[0], c.position[2]]);
      return cDist < (c.depth / 2 + 15);
    });

    const leftTerminal = floorCabinets.find((c) => {
      if (c.variant !== 'tall_terminal_shelves' || visited.has(c.id)) return false;
      const cDist = dist([leftX, leftZ], [c.position[0], c.position[2]]);
      return cDist < (c.depth / 2 + 15);
    });

    if (rightTerminal) visited.add(rightTerminal.id);
    if (leftTerminal) visited.add(leftTerminal.id);

    const maxDepth = Math.max(...component.map((c) => c.depth));
    const frontOffsetZ = maxDepth / 2 - 2;

    // Physical start (left) and end (right) of this continuous front run
    const runStartX = leftTerminal ? (leftX - leftTerminal.depth * uX[0]) : leftX;
    const runStartZ = leftTerminal ? (leftZ - leftTerminal.depth * uX[1]) : leftZ;
    const runEndX = rightTerminal ? (rightX + rightTerminal.depth * uX[0]) : rightX;
    const runEndZ = rightTerminal ? (rightZ + rightTerminal.depth * uX[1]) : rightZ;

    const totalRunWidth = dist([runStartX, runStartZ], [runEndX, runEndZ]);

    // Build Continuous Commercial Strips (Commercial length = 300 cm / 3000 mm)
    // Seamless continuous strip across all cabinets (and terminal shelves) in the run
    let currentStartX = runStartX;
    let currentStartZ = runStartZ;
    let remainingWidth = totalRunWidth;
    let stripIndex = 0;

    while (remainingWidth > 0.01) {
      const segLen = Math.min(300, remainingWidth);
      const nextEndX = currentStartX + segLen * uX[0];
      const nextEndZ = currentStartZ + segLen * uX[1];

      const stripCenterX = (currentStartX + nextEndX) / 2 + frontOffsetZ * uZ[0];
      const stripCenterZ = (currentStartZ + nextEndZ) / 2 + frontOffsetZ * uZ[1];

      pieces.push({
        id: `socle-piece-${component.map((c) => c.id).join('-')}-${stripIndex}`,
        length: segLen,
        center: [stripCenterX, socleY, stripCenterZ],
        rotation: baseRot,
      });

      remainingWidth -= segLen;

      // If the run exceeds 3000mm, insert a 180° Straight H-Joint profile between strips
      if (remainingWidth > 0.01) {
        const jointX = nextEndX + frontOffsetZ * uZ[0];
        const jointZ = nextEndZ + frontOffsetZ * uZ[1];
        straightJoints.push({
          id: `socle-joint-${component[0].id}-${stripIndex}`,
          position: [jointX, socleY, jointZ],
          rotation: baseRot,
        });
      }

      currentStartX = nextEndX;
      currentStartZ = nextEndZ;
      stripIndex++;
    }

    // Evaluate Left Flank & Terminal Shelves returns
    if (leftTerminal) {
      const cornLeftX = runStartX + 0.6 * uX[0] + frontOffsetZ * uZ[0];
      const cornLeftZ = runStartZ + 0.6 * uX[1] + frontOffsetZ * uZ[1];
      corners.push({
        id: `socle-corn-left-${leftTerminal.id}`,
        position: [cornLeftX, socleY, cornLeftZ],
        rotation: baseRot,
        isRight: false,
      });

      const latDepth = leftTerminal.width - 4;
      const latCenterZOffset = frontOffsetZ - latDepth / 2;
      const latLeftX = runStartX + 0.6 * uX[0] + latCenterZOffset * uZ[0];
      const latLeftZ = runStartZ + 0.6 * uX[1] + latCenterZOffset * uZ[1];
      laterals.push({
        id: `socle-lat-left-${leftTerminal.id}`,
        position: [latLeftX, socleY, latLeftZ],
        rotation: baseRot,
        depth: latDepth,
        isRight: false,
      });

      const rearZOffset = frontOffsetZ - latDepth;
      const rearCornerX = runStartX + rearZOffset * uZ[0];
      const rearCornerZ = runStartZ + rearZOffset * uZ[1];
      if (!isPointNearWall(rearCornerX, rearCornerZ, 12)) {
        corners.push({
          id: `socle-corn-rear-left-${leftTerminal.id}`,
          position: [runStartX + 0.6 * uX[0] + rearZOffset * uZ[0], socleY, runStartZ + 0.6 * uX[1] + rearZOffset * uZ[1]],
          rotation: baseRot,
          isRight: false,
        });
        pieces.push({
          id: `socle-rear-left-${leftTerminal.id}`,
          length: leftTerminal.depth,
          center: [
            (runStartX + leftX) / 2 + rearZOffset * uZ[0],
            socleY,
            (runStartZ + leftZ) / 2 + rearZOffset * uZ[1],
          ],
          rotation: baseRot,
        });
      }
    } else {
      const isLeftNearWall = isPointNearWall(leftX, leftZ, 12);
      const hasPerpLeftNeighbor = floorCabinets.some((other) => {
        if (component.some((c) => c.id === other.id)) return false;
        const oGeo = getCabGeo(other);
        const dx = (leftX - oGeo.cx) * oGeo.uX[0] + (leftZ - oGeo.cz) * oGeo.uX[1];
        const dz = (leftX - oGeo.cx) * oGeo.uZ[0] + (leftZ - oGeo.cz) * oGeo.uZ[1];
        return Math.abs(dx) <= other.width / 2 + 5 && Math.abs(dz) <= other.depth / 2 + 5;
      });

      if (!isLeftNearWall && !hasPerpLeftNeighbor) {
        const latLeftX = leftX + 0.6 * uX[0] - 1.0 * uZ[0];
        const latLeftZ = leftZ + 0.6 * uX[1] - 1.0 * uZ[1];
        laterals.push({
          id: `socle-lat-left-${leftmostCab.id}`,
          position: [latLeftX, socleY, latLeftZ],
          rotation: baseRot,
          depth: leftmostCab.depth - 4,
          isRight: false,
        });

        const cornLeftX = leftX + 0.6 * uX[0] + frontOffsetZ * uZ[0];
        const cornLeftZ = leftZ + 0.6 * uX[1] + frontOffsetZ * uZ[1];
        corners.push({
          id: `socle-corn-left-${leftmostCab.id}`,
          position: [cornLeftX, socleY, cornLeftZ],
          rotation: baseRot,
          isRight: false,
        });
      }
    }

    // Evaluate Right Flank & Terminal Shelves returns
    if (rightTerminal) {
      const cornRightX = runEndX - 0.6 * uX[0] + frontOffsetZ * uZ[0];
      const cornRightZ = runEndZ - 0.6 * uX[1] + frontOffsetZ * uZ[1];
      corners.push({
        id: `socle-corn-right-${rightTerminal.id}`,
        position: [cornRightX, socleY, cornRightZ],
        rotation: baseRot,
        isRight: true,
      });

      const latDepth = rightTerminal.width - 4;
      const latCenterZOffset = frontOffsetZ - latDepth / 2;
      const latRightX = runEndX - 0.6 * uX[0] + latCenterZOffset * uZ[0];
      const latRightZ = runEndZ - 0.6 * uX[1] + latCenterZOffset * uZ[1];
      laterals.push({
        id: `socle-lat-right-${rightTerminal.id}`,
        position: [latRightX, socleY, latRightZ],
        rotation: baseRot,
        depth: latDepth,
        isRight: true,
      });

      const rearZOffset = frontOffsetZ - latDepth;
      const rearCornerX = runEndX + rearZOffset * uZ[0];
      const rearCornerZ = runEndZ + rearZOffset * uZ[1];
      if (!isPointNearWall(rearCornerX, rearCornerZ, 12)) {
        corners.push({
          id: `socle-corn-rear-right-${rightTerminal.id}`,
          position: [runEndX - 0.6 * uX[0] + rearZOffset * uZ[0], socleY, runEndZ - 0.6 * uX[1] + rearZOffset * uZ[1]],
          rotation: baseRot,
          isRight: true,
        });
        pieces.push({
          id: `socle-rear-right-${rightTerminal.id}`,
          length: rightTerminal.depth,
          center: [
            (runEndX + rightX) / 2 + rearZOffset * uZ[0],
            socleY,
            (runEndZ + rightZ) / 2 + rearZOffset * uZ[1],
          ],
          rotation: baseRot,
        });
      }
    } else {
      const isRightNearWall = isPointNearWall(rightX, rightZ, 12);
      const hasPerpRightNeighbor = floorCabinets.some((other) => {
        if (component.some((c) => c.id === other.id)) return false;
        const oGeo = getCabGeo(other);
        const dx = (rightX - oGeo.cx) * oGeo.uX[0] + (rightZ - oGeo.cz) * oGeo.uX[1];
        const dz = (rightX - oGeo.cx) * oGeo.uZ[0] + (rightZ - oGeo.cz) * oGeo.uZ[1];
        return Math.abs(dx) <= other.width / 2 + 5 && Math.abs(dz) <= other.depth / 2 + 5;
      });

      if (!isRightNearWall && !hasPerpRightNeighbor) {
        const latRightX = rightX - 0.6 * uX[0] - 1.0 * uZ[0];
        const latRightZ = rightZ - 0.6 * uX[1] - 1.0 * uZ[1];
        laterals.push({
          id: `socle-lat-right-${rightmostCab.id}`,
          position: [latRightX, socleY, latRightZ],
          rotation: baseRot,
          depth: rightmostCab.depth - 4,
          isRight: true,
        });

        const cornRightX = rightX - 0.6 * uX[0] + frontOffsetZ * uZ[0];
        const cornRightZ = rightZ - 0.6 * uX[1] + frontOffsetZ * uZ[1];
        corners.push({
          id: `socle-corn-right-${rightmostCab.id}`,
          position: [cornRightX, socleY, cornRightZ],
          rotation: baseRot,
          isRight: true,
        });
      }
    }
  }

  return { pieces, straightJoints, laterals, corners, socleColor };
}

