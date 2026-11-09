import React from 'react';
import { Line, Text, Billboard } from '@react-three/drei';

interface DimensionCotaProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  color?: string;
  fontSize?: number;
  textOffset?: [number, number, number];
  tickSize?: number;
  lineWidth?: number;
  tickDirection?: 'x' | 'y' | 'z' | 'auto';
  extensionStart?: [number, number, number];
  extensionEnd?: [number, number, number];
}

export function DimensionCota({
  start,
  end,
  label,
  color = '#f97316',
  fontSize = 5.5,
  textOffset = [0, 2.5, 0],
  tickSize = 2.5,
  lineWidth = 1.8,
  tickDirection = 'auto',
  extensionStart,
  extensionEnd
}: DimensionCotaProps) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];

  const midX = (start[0] + end[0]) / 2 + textOffset[0];
  const midY = (start[1] + end[1]) / 2 + textOffset[1];
  const midZ = (start[2] + end[2]) / 2 + textOffset[2];

  // Determine tick axis
  let tDir = tickDirection;
  if (tDir === 'auto') {
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dz)) {
      tDir = 'y'; // horizontal dimension along X -> ticks along Y
    } else if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) {
      tDir = 'x'; // vertical dimension along Y -> ticks along X
    } else {
      tDir = 'y'; // depth dimension along Z -> ticks along Y
    }
  }

  const getTickPoints = (center: [number, number, number]): [[number, number, number], [number, number, number]] => {
    if (tDir === 'x') {
      return [
        [center[0] - tickSize, center[1] + tickSize * 0.7, center[2]],
        [center[0] + tickSize, center[1] - tickSize * 0.7, center[2]]
      ];
    } else if (tDir === 'z') {
      return [
        [center[0] + tickSize * 0.7, center[1], center[2] - tickSize],
        [center[0] - tickSize * 0.7, center[1], center[2] + tickSize]
      ];
    } else {
      return [
        [center[0] - tickSize * 0.7, center[1] - tickSize, center[2] - tickSize * 0.7],
        [center[0] + tickSize * 0.7, center[1] + tickSize, center[2] + tickSize * 0.7]
      ];
    }
  };

  const startTick = getTickPoints(start);
  const endTick = getTickPoints(end);

  return (
    <group renderOrder={999}>
      {/* Main Dimension Line */}
      <Line points={[start, end]} color={color} lineWidth={lineWidth} depthTest={false} renderOrder={999} />

      {/* Start Tick */}
      <Line points={startTick} color={color} lineWidth={lineWidth} depthTest={false} renderOrder={999} />

      {/* End Tick */}
      <Line points={endTick} color={color} lineWidth={lineWidth} depthTest={false} renderOrder={999} />

      {/* Optional Extension Lines */}
      {extensionStart && (
        <Line points={[extensionStart, start]} color={color} lineWidth={lineWidth * 0.7} dashed dashScale={1} depthTest={false} renderOrder={999} />
      )}
      {extensionEnd && (
        <Line points={[extensionEnd, end]} color={color} lineWidth={lineWidth * 0.7} dashed dashScale={1} depthTest={false} renderOrder={999} />
      )}

      {/* Text Label - Always facing the camera with Billboard */}
      <Billboard position={[midX, midY, midZ]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={[0, 0, -0.05]} renderOrder={999}>
          <planeGeometry args={[Math.max(fontSize * (label.length * 0.55 + 1.2), 12), fontSize * 1.5]} />
          <meshBasicMaterial color="#111111" transparent opacity={0.85} depthTest={false} />
        </mesh>
        <Text
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={fontSize * 0.08}
          outlineColor="#000000"
          fontWeight="bold"
          material-depthTest={false}
          material-toneMapped={false}
          renderOrder={1000}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}
