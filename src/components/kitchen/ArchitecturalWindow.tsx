import React from 'react';
import * as THREE from 'three';
import { Edges, Line } from '@react-three/drei';

interface ArchitecturalWindowProps {
  width: number;
  height: number;
  depth: number;
  isSelected?: boolean;
  viewMode?: '2d' | '3d';
  isOpen?: boolean;
}

export function ArchitecturalWindow({
  width,
  height,
  depth,
  isSelected = false,
  viewMode = '3d',
}: ArchitecturalWindowProps) {
  const frameThick = 4.5;
  const glassW = Math.max(10, width / 2 - 3);
  const glassH = Math.max(10, height - 2 * frameThick);

  // Estética clásica de ventana de PVC/Aluminio fija y limpia con dos paños fijos
  const frameColor = '#ffffff'; 
  const glassColor = '#bae6fd';

  return (
    <group name="archRealWindow">
      {/* Marco Perimetral */}
      <mesh position={[0, (height - frameThick) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThick, depth]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.05} />
        <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#cbd5e1'} />
      </mesh>
      <mesh position={[0, -(height - frameThick) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThick, depth]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.05} />
        <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#cbd5e1'} />
      </mesh>
      <mesh position={[-(width - frameThick) / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThick, height - 2 * frameThick, depth]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.05} />
        <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#cbd5e1'} />
      </mesh>
      <mesh position={[(width - frameThick) / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThick, height - 2 * frameThick, depth]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.05} />
        <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#cbd5e1'} />
      </mesh>

      {/* Travesaño Central Fijo */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, height - 2 * frameThick, depth - 2]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Paño Izquierdo Fijo */}
      <group position={[-width / 4 + 1, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[glassW, glassH, 1.0]} />
          <meshStandardMaterial color={glassColor} transparent={true} opacity={0.28} roughness={0.02} metalness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Paño Derecho Fijo */}
      <group position={[width / 4 - 1, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[glassW, glassH, 1.0]} />
          <meshStandardMaterial color={glassColor} transparent={true} opacity={0.28} roughness={0.02} metalness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2D Architectural Window Double Line */}
      {viewMode === '2d' && (
        <group renderOrder={1005} position={[0, height / 2 + 2, 0]}>
          <Line
            points={[[-width / 2, 0, -depth / 4], [width / 2, 0, -depth / 4]]}
            color="#0284c7"
            lineWidth={2}
            depthTest={false}
            material-toneMapped={false}
          />
          <Line
            points={[[-width / 2, 0, depth / 4], [width / 2, 0, depth / 4]]}
            color="#0284c7"
            lineWidth={2}
            depthTest={false}
            material-toneMapped={false}
          />
        </group>
      )}
    </group>
  );
}



