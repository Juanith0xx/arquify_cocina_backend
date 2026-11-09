import React from 'react';
import * as THREE from 'three';
import { Edges, Line } from '@react-three/drei';

interface ArchitecturalDoorProps {
  width: number;
  height: number;
  depth: number;
  isSelected?: boolean;
  viewMode?: '2d' | '3d';
  isOpen?: boolean;
  hingeSide?: 'left' | 'right';
}

export function ArchitecturalDoor({
  width,
  height,
  depth,
  isSelected = false,
  viewMode = '3d',
  isOpen = false,
  hingeSide = 'left',
}: ArchitecturalDoorProps) {
  // Constantes dimensionales y perfiles
  const frameThick = 4.5; // Grosor de cara del marco (jambas y dintel)
  const frameDepth = Math.max(10, depth + 0.8); // Profundidad que abraza el muro
  const casingWidth = 6.0; // Ancho de chambrana / tapajuntas
  const casingThick = 1.0; // Espesor de tapajuntas exterior e interior

  // Dimensiones libres de la hoja de puerta
  const doorWidth = Math.max(20, width - 2 * frameThick - 0.6);
  const doorHeight = Math.max(40, height - frameThick - 0.4);
  const doorThick = 4.0; // Espesor estándar hoja de puerta
  const doorY = -frameThick / 2 + 0.2; // Centrado en vano despejando piso

  const isRight = hingeSide === 'right';
  const hingeLocalX = isRight ? (width / 2 - frameThick) : (-width / 2 + frameThick);
  const openAngle = isOpen ? (isRight ? -Math.PI * 0.45 : Math.PI * 0.45) : 0;
  const leafShiftX = isRight ? -doorWidth / 2 : doorWidth / 2;

  // Paleta de acabados arquitectónicos realistas
  const frameColor = '#f8fafc'; // Marco lacado blanco puro / satinado
  const casingColor = '#f1f5f9'; // Tapajuntas blanco mate
  const doorPanelColor = '#b45309'; // Madera Roble Cálido / Lenga contemporánea
  const doorGrooveColor = '#78350f'; // Canterías/buñas en bajo relieve
  const hardwareColor = '#1e293b'; // Manilla y bisagras negro grafito / acero satinado
  const hardwareSteel = '#e2e8f0'; // Roseta / cilindro metálico

  // Altura estándar de manilla respecto al centro
  const handleY = doorY - doorHeight * 0.05; // ~95-100cm desde el suelo
  const handleX = doorWidth / 2 - 6.5; // Lado de apertura / cerradura
  const hingeX = -doorWidth / 2 + 0.8; // Lado de bisagras

  return (
    <group name="architecturalRealDoor">
      {/* ========================================================================= */}
      {/* 1. MARCO PERIMETRAL HUECO (JAMBAS LATERALES Y DINTEL SUPERIOR)            */}
      {/* ========================================================================= */}
      <group name="doorFrameJambs">
        {/* Jamba Izquierda */}
        <mesh
          position={[-width / 2 + frameThick / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[frameThick, height, frameDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color={isSelected ? '#0284c7' : '#cbd5e1'} />
        </mesh>

        {/* Jamba Derecha */}
        <mesh
          position={[width / 2 - frameThick / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[frameThick, height, frameDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color={isSelected ? '#0284c7' : '#cbd5e1'} />
        </mesh>

        {/* Dintel / Cabezal Superior */}
        <mesh
          position={[0, height / 2 - frameThick / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, frameThick, frameDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color={isSelected ? '#0284c7' : '#cbd5e1'} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 2. TAPAJUNTAS / CHAMBRANAS PERIMETRALES (CARA FRONTAL Y POSTERIOR)         */}
      {/* ========================================================================= */}
      {/* Cara Frontal (+Z) */}
      <group position={[0, 0, frameDepth / 2 + casingThick / 2]}>
        {/* Tapajuntas Izquierdo */}
        <mesh position={[-width / 2 - casingWidth / 2 + frameThick, 0, 0]} castShadow>
          <boxGeometry args={[casingWidth, height + casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
        {/* Tapajuntas Derecho */}
        <mesh position={[width / 2 + casingWidth / 2 - frameThick, 0, 0]} castShadow>
          <boxGeometry args={[casingWidth, height + casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
        {/* Tapajuntas Superior */}
        <mesh position={[0, height / 2 + casingWidth / 2 - frameThick / 2, 0]} castShadow>
          <boxGeometry args={[width + 2 * casingWidth - 2 * frameThick, casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
      </group>

      {/* Cara Posterior (-Z) */}
      <group position={[0, 0, -frameDepth / 2 - casingThick / 2]}>
        {/* Tapajuntas Izquierdo */}
        <mesh position={[-width / 2 - casingWidth / 2 + frameThick, 0, 0]} castShadow>
          <boxGeometry args={[casingWidth, height + casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
        {/* Tapajuntas Derecho */}
        <mesh position={[width / 2 + casingWidth / 2 - frameThick, 0, 0]} castShadow>
          <boxGeometry args={[casingWidth, height + casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
        {/* Tapajuntas Superior */}
        <mesh position={[0, height / 2 + casingWidth / 2 - frameThick / 2, 0]} castShadow>
          <boxGeometry args={[width + 2 * casingWidth - 2 * frameThick, casingWidth, casingThick]} />
          <meshStandardMaterial color={casingColor} roughness={0.4} metalness={0.05} side={THREE.DoubleSide} />
          <Edges scale={1} threshold={20} color="#cbd5e1" />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 3. HOJA DE PUERTA PRINCIPAL CON CANTERÍAS / BUÑAS MODERNAS                */}
      {/* ========================================================================= */}
      <group position={[hingeLocalX, doorY, 0]} rotation={[0, openAngle, 0]}>
        <group position={[leafShiftX, 0, 0]}>
          {/* Tablero Principal de la Hoja */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[doorWidth, doorHeight, doorThick]} />
            <meshStandardMaterial
              color={doorPanelColor}
              roughness={0.45}
              metalness={0.08}
              side={THREE.DoubleSide}
            />
            <Edges scale={1} threshold={15} color="#78350f" />
          </mesh>

          {/* Canterías / Buñas Horizontales Estilo Arquitectónico Contemporáneo (Frontal) */}
          {[-0.6, -0.2, 0.2, 0.6].map((relY, idx) => (
            <mesh
              key={`groove-front-${idx}`}
              position={[0, (doorHeight / 2) * relY, doorThick / 2 + 0.1]}
            >
              <boxGeometry args={[doorWidth - 4, 0.8, 0.25]} />
              <meshStandardMaterial color={doorGrooveColor} roughness={0.7} />
            </mesh>
          ))}

          {/* Canterías / Buñas Horizontales (Posterior) */}
          {[-0.6, -0.2, 0.2, 0.6].map((relY, idx) => (
            <mesh
              key={`groove-back-${idx}`}
              position={[0, (doorHeight / 2) * relY, -doorThick / 2 - 0.1]}
            >
              <boxGeometry args={[doorWidth - 4, 0.8, 0.25]} />
              <meshStandardMaterial color={doorGrooveColor} roughness={0.7} />
            </mesh>
          ))}

          {/* Placa / Zócalo de Protección Inferior en Acero Inoxidable Satinado */}
          <mesh position={[0, -doorHeight / 2 + 5, doorThick / 2 + 0.15]} castShadow>
            <boxGeometry args={[doorWidth - 2, 8, 0.15]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -doorHeight / 2 + 5, -doorThick / 2 - 0.15]} castShadow>
            <boxGeometry args={[doorWidth - 2, 8, 0.15]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* ========================================================================= */}
          {/* 4. HERRAJES: MANILLA DE PALANCA ERGONÓMICA, ROSETA Y BOCALLAVE            */}
          {/* ========================================================================= */}
          {/* Manilla Frontal (+Z) */}
          <group position={[handleX, handleY - doorY, doorThick / 2]}>
            {/* Roseta circular */}
            <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.0, 2.0, 0.4, 24]} />
              <meshStandardMaterial color={hardwareSteel} metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Eje / Cuello */}
            <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 1.2, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Manilla L horizontal ergonómica */}
            <mesh position={[-4.5, 0, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 10.0, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Remate esférico suave */}
            <mesh position={[-9.5, 0, 1.5]}>
              <sphereGeometry args={[0.55, 16, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.85} roughness={0.2} />
            </mesh>

            {/* Roseta Inferior con Bocallave / Cilindro Europerfil */}
            <group position={[0, -6.5, 0.25]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.35, 24]} />
                <meshStandardMaterial color={hardwareSteel} metalness={0.9} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0, 0.22]}>
                <boxGeometry args={[0.4, 1.0, 0.1]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
            </group>
          </group>

          {/* Manilla Posterior (-Z) */}
          <group position={[handleX, handleY - doorY, -doorThick / 2]}>
            {/* Roseta circular */}
            <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.0, 2.0, 0.4, 24]} />
              <meshStandardMaterial color={hardwareSteel} metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Eje / Cuello */}
            <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 1.2, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Manilla L horizontal ergonómica */}
            <mesh position={[-4.5, 0, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 10.0, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[-9.5, 0, -1.5]}>
              <sphereGeometry args={[0.55, 16, 16]} />
              <meshStandardMaterial color={hardwareColor} metalness={0.85} roughness={0.2} />
            </mesh>

            {/* Roseta Inferior Bocallave */}
            <group position={[0, -6.5, -0.25]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.35, 24]} />
                <meshStandardMaterial color={hardwareSteel} metalness={0.9} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0, -0.22]}>
                <boxGeometry args={[0.4, 1.0, 0.1]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
            </group>
          </group>

          {/* ========================================================================= */}
          {/* 5. HERRAJES: BISAGRAS TUBULARES DE ACERO EN EL CANTO LATERAL               */}
          {/* ========================================================================= */}
          {[0.35, 0, -0.35].map((relY, bIdx) => (
            <group
              key={`hinge-${bIdx}`}
              position={[hingeX - 0.4, (doorHeight / 2) * relY, 0]}
            >
              {/* Nudo / Barril de bisagra */}
              <mesh position={[0, 0, doorThick / 2 + 0.15]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.55, 0.55, 5.0, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Pletina fijada al marco */}
              <mesh position={[-0.4, 0, doorThick / 2 + 0.1]}>
                <boxGeometry args={[0.8, 4.5, 0.15]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {/* Placa Frontal de Pestillo / Cerradura en el Canto */}
          <mesh position={[doorWidth / 2 + 0.05, handleY - doorY, 0]}>
            <boxGeometry args={[0.15, 14.0, 2.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 6. REPRESENTACIÓN ARQUITECTÓNICA 2D: ABATIMIENTO A 90 GRADOS               */}
      {/* ========================================================================= */}
      {viewMode === '2d' && (() => {
        const radius = doorWidth;
        const arcPts: [number, number, number][] = [];
        const pivotX = isRight ? (width / 2 - frameThick - 0.4) : (-width / 2 + frameThick + 0.4);
        const dir = isRight ? -1 : 1;
        for (let step = 0; step <= 16; step++) {
          const angle = (step / 16) * (Math.PI / 2);
          arcPts.push([
            pivotX + dir * radius * Math.sin(angle),
            height / 2 + 2,
            dir * radius * Math.cos(angle),
          ]);
        }
        const leafPts: [number, number, number][] = [
          [pivotX, height / 2 + 2, 0],
          [pivotX + dir * radius, height / 2 + 2, 0],
        ];
        return (
          <group renderOrder={1005}>
            <Line
              points={arcPts}
              color="#38bdf8"
              lineWidth={2}
              depthTest={false}
              material-toneMapped={false}
            />
            <Line
              points={leafPts}
              color="#0284c7"
              lineWidth={2.5}
              depthTest={false}
              material-toneMapped={false}
            />
          </group>
        );
      })()}
    </group>
  );
}
