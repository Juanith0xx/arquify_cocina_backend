import React from 'react';
import { Line, Text, Billboard } from '@react-three/drei';
import { CabinetType, useKitchenStore } from '../../store/kitchenStore';
import { useStore } from '../../store';

export interface CabinetRun {
  id: string;
  cabinets: CabinetType[];
  totalWidth: number;
  maxHeight: number;
  maxDepth: number;
  rotation: number;
  center: [number, number, number];
}

export function calculateCabinetRuns(cabinets: CabinetType[]): CabinetRun[] {
  if (!cabinets || cabinets.length < 2) return [];

  const getFlanks = (cab: CabinetType) => {
    const rot = cab.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    // Vector along width
    const uX: [number, number] = [cos, sin];
    const left: [number, number] = [
      cab.position[0] - (cab.width / 2) * uX[0],
      cab.position[2] - (cab.width / 2) * uX[1],
    ];
    const right: [number, number] = [
      cab.position[0] + (cab.width / 2) * uX[0],
      cab.position[2] + (cab.width / 2) * uX[1],
    ];
    return { left, right, uX, rot };
  };

  const dist = (p1: [number, number], p2: [number, number]) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

  const visited = new Set<string>();
  const runs: CabinetRun[] = [];

  for (const cab of cabinets) {
    if (visited.has(cab.id)) continue;

    const isFloorCab = cab.type !== 'wall';

    // Find all connected cabinets in this collinear line
    const component: CabinetType[] = [];
    const queue: CabinetType[] = [cab];
    visited.add(cab.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      const curFlanks = getFlanks(current);

      for (const other of cabinets) {
        if (visited.has(other.id)) continue;
        const otherIsFloor = other.type !== 'wall';
        // Check tier: floor cabinets together (base, tall, island), wall cabinets together
        if (isFloorCab !== otherIsFloor) continue;

        // Same or opposite collinear angle
        const rotDiff = Math.abs((other.rotation || 0) - (current.rotation || 0)) % Math.PI;
        if (rotDiff > 0.1 && Math.abs(rotDiff - Math.PI) > 0.1) continue;

        const otherFlanks = getFlanks(other);
        const isTouching =
          dist(curFlanks.right, otherFlanks.left) < 6 ||
          dist(curFlanks.left, otherFlanks.right) < 6 ||
          dist(curFlanks.right, otherFlanks.right) < 6 ||
          dist(curFlanks.left, otherFlanks.left) < 6;

        if (isTouching) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    // Only create a run dimension when there are 2 or more cabinets side by side
    if (component.length >= 2) {
      // Sort the component along the main axis direction
      const baseRot = component[0].rotation || 0;
      const cos = Math.cos(baseRot);
      const sin = Math.sin(baseRot);

      // Project each cabinet position onto the line
      component.sort((a, b) => {
        const projA = a.position[0] * cos + a.position[2] * sin;
        const projB = b.position[0] * cos + b.position[2] * sin;
        return projA - projB;
      });

      const totalWidth = component.reduce((sum, c) => sum + c.width, 0);
      const maxHeight = Math.max(...component.map((c) => c.height));
      const maxDepth = Math.max(...component.map((c) => c.depth));

      // Calculate center of the run in world coordinates
      const first = component[0];
      const last = component[component.length - 1];
      const firstFlanks = getFlanks(first);
      const lastFlanks = getFlanks(last);

      // Choose extreme points
      const startPt: [number, number] = firstFlanks.left;
      const endPt: [number, number] = lastFlanks.right;

      const centerX = (startPt[0] + endPt[0]) / 2;
      const centerZ = (startPt[1] + endPt[1]) / 2;
      const centerY = isFloorCab ? 0 : first.position[1] - first.height / 2;

      runs.push({
        id: component.map((c) => c.id).join('-'),
        cabinets: component,
        totalWidth,
        maxHeight,
        maxDepth,
        rotation: baseRot,
        center: [centerX, centerY, centerZ],
      });
    }
  }

  return runs;
}

export function KitchenRunDimensions() {
  const cabinets = useKitchenStore((state) => state.cabinets);
  const toolMode = useKitchenStore((state) => state.toolMode);
  const activeCabinetId = useKitchenStore((state) => state.activeCabinetId);
  const showDimensions = useStore((state) => state.showDimensions);

  if (!showDimensions) return null;

  // Filter out any cabinet currently being moved
  const validCabinets = cabinets.filter(
    (c) => !(toolMode === 'move_active' && c.id === activeCabinetId)
  );

  const runs = calculateCabinetRuns(validCabinets);

  if (runs.length === 0) return null;

  return (
    <group name="kitchenRunDimensions" renderOrder={1000}>
      {runs.map((run) => {
        const { id, totalWidth, maxHeight, maxDepth, rotation, center } = run;

        // Tier 2 (Overall Run Dimension): Positioned cleanly above the tallest cabinet
        const topY = maxHeight + 14;
        const frontZ = maxDepth / 2;
        const tickH = 3;

        return (
          <group key={`run-dim-${id}`} position={center} rotation={[0, rotation, 0]} renderOrder={1000}>
            {/* Main Overall Dimension Line (Cota de Medida Total) */}
            <Line
              points={[
                [-totalWidth / 2, topY, frontZ],
                [totalWidth / 2, topY, frontZ],
              ]}
              color="#f97316"
              lineWidth={2.2}
              depthTest={false}
              renderOrder={1000}
            />

            {/* Left Extreme Tick */}
            <Line
              points={[
                [-totalWidth / 2, topY - tickH, frontZ],
                [-totalWidth / 2, topY + tickH, frontZ],
              ]}
              color="#f97316"
              lineWidth={2.2}
              depthTest={false}
              renderOrder={1000}
            />

            {/* Right Extreme Tick */}
            <Line
              points={[
                [totalWidth / 2, topY - tickH, frontZ],
                [totalWidth / 2, topY + tickH, frontZ],
              ]}
              color="#f97316"
              lineWidth={2.2}
              depthTest={false}
              renderOrder={1000}
            />

            {/* Left Extension Line */}
            <Line
              points={[
                [-totalWidth / 2, maxHeight + 1, frontZ],
                [-totalWidth / 2, topY + tickH, frontZ],
              ]}
              color="#f97316"
              lineWidth={1.2}
              dashed
              dashScale={1.5}
              depthTest={false}
              renderOrder={999}
            />

            {/* Right Extension Line */}
            <Line
              points={[
                [totalWidth / 2, maxHeight + 1, frontZ],
                [totalWidth / 2, topY + tickH, frontZ],
              ]}
              color="#f97316"
              lineWidth={1.2}
              dashed
              dashScale={1.5}
              depthTest={false}
              renderOrder={999}
            />

            {/* Text Label: Medida Total (TOTAL XX cm) */}
            <group position={[0, topY + 4.5, frontZ]}>
              <Billboard follow={true}>
                <mesh position={[0, 0, -0.05]} renderOrder={1000}>
                  <planeGeometry args={[Math.max(36, `${Number(totalWidth.toFixed(1))} cm (TOTAL)`.length * 4.2), 12]} />
                  <meshBasicMaterial color="#090d16" transparent opacity={0.92} depthTest={false} />
                </mesh>
                <Text
                  fontSize={8.5}
                  color="#f97316"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.6}
                  outlineColor="#000000"
                  fontWeight="bold"
                  material-depthTest={false}
                  material-toneMapped={false}
                  renderOrder={1001}
                >
                  {`${Number(totalWidth.toFixed(1))} cm (TOTAL)`}
                </Text>
              </Billboard>
            </group>

            {/* Piso / Rótulo de Corrida Total */}
            <group position={[0, 0.1, frontZ + 28]}>
              <Text
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={8}
                color="#f97316"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.5}
                outlineColor="#000000"
                fontWeight="bold"
                material-depthTest={false}
                material-toneMapped={false}
                renderOrder={1000}
              >
                {`CORRIDA TOTAL: ${Number(totalWidth.toFixed(1))} cm (${run.cabinets.length} MÓDULOS)`}
              </Text>
            </group>
          </group>
        );
      })}
    </group>
  );
}
