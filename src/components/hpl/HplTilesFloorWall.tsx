import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface HplTilesProps {
  roomWidth: number;  // mm
  roomLength: number; // mm
  roomHeight: number; // mm
  tileSize?: number;  // 600 mm (60x60 cm)
  tileColor?: string;
  floorColor?: string;
}

/**
 * Genera texturas canvas procedurales de cerámica 60x60 cm con fragüe nítido y realista
 */
function createTileTexture(tileSizePx: number, tileColorHex: string, groutColorHex: string, isFloor = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Fondo fragüe
  ctx.fillStyle = groutColorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Azulejos con sutil gradiente y bisel
  const groutWidth = 4;
  const tileSize = 256; // 2x2 azulejos por textura repetible

  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      // Color base del azulejo
      ctx.fillStyle = tileColorHex;
      ctx.fillRect(x + groutWidth / 2, y + groutWidth / 2, tileSize - groutWidth, tileSize - groutWidth);

      // Sutil brillo reflectante
      const grad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
      if (isFloor) {
        grad.addColorStop(0, 'rgba(255,255,255,0.06)');
        grad.addColorStop(0.5, 'rgba(240,240,240,0.01)');
        grad.addColorStop(1, 'rgba(0,0,0,0.03)');
      } else {
        grad.addColorStop(0, 'rgba(255,255,255,0.12)');
        grad.addColorStop(1, 'rgba(0,0,0,0.02)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x + groutWidth / 2, y + groutWidth / 2, tileSize - groutWidth, tileSize - groutWidth);

      // Borde interno biselado sutil
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + groutWidth / 2, y + groutWidth / 2, tileSize - groutWidth, tileSize - groutWidth);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export const HplTilesFloorWall: React.FC<HplTilesProps> = ({
  roomWidth,
  roomLength,
  roomHeight,
  tileSize = 600,
  tileColor = '#FFFFFF',
  floorColor = '#F8FAFC',
}) => {
  // Convertir dimensiones a metros para Three.js
  const widthM = roomWidth / 1000;
  const lengthM = roomLength / 1000;
  const heightM = roomHeight / 1000;
  const tileSizeM = tileSize / 1000;

  const backWallRef = useRef<THREE.Group>(null);
  const frontWallRef = useRef<THREE.Group>(null);
  const leftWallRef = useRef<THREE.Group>(null);
  const rightWallRef = useRef<THREE.Group>(null);

  // Al girar la vista 3D con la cámara, siempre desaparecen los 2 muros de frente para no tapar la cámara
  useFrame(({ camera }) => {
    // Eje Z: si la cámara está en +Z (frontal), ocultar muro frontal y mostrar posterior
    const camIsPositiveZ = camera.position.z > 0;
    if (frontWallRef.current) frontWallRef.current.visible = !camIsPositiveZ;
    if (backWallRef.current) backWallRef.current.visible = camIsPositiveZ;

    // Eje X: si la cámara está en +X (derecha), ocultar muro derecho y mostrar izquierdo
    const camIsPositiveX = camera.position.x > 0;
    if (rightWallRef.current) rightWallRef.current.visible = !camIsPositiveX;
    if (leftWallRef.current) leftWallRef.current.visible = camIsPositiveX;
  });

  const floorTexture = useMemo(() => {
    const tex = createTileTexture(512, floorColor, '#CBD5E1', true);
    tex.repeat.set(widthM / tileSizeM, lengthM / tileSizeM);
    return tex;
  }, [widthM, lengthM, tileSizeM, floorColor]);

  const wallTexture = useMemo(() => {
    const tex = createTileTexture(512, tileColor, '#E2E8F0', false);
    tex.repeat.set(widthM / tileSizeM, heightM / tileSizeM);
    return tex;
  }, [widthM, heightM, tileSizeM, tileColor]);

  const sideWallTexture = useMemo(() => {
    const tex = createTileTexture(512, tileColor, '#E2E8F0', false);
    tex.repeat.set(lengthM / tileSizeM, heightM / tileSizeM);
    return tex;
  }, [lengthM, heightM, tileSizeM, tileColor]);

  return (
    <group name="HplBathroomTilesEnvironment">
      {/* 1. SUELO DE CERÁMICA 60x60 */}
      <mesh receiveShadow position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.25}
          metalness={0.05}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* 2. MURO POSTERIOR (Z = -lengthM/2) */}
      <group ref={backWallRef} position={[0, 0, -lengthM / 2]}>
        <mesh receiveShadow position={[0, heightM / 2, 0]}>
          <planeGeometry args={[widthM, heightM]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.3}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Guardapolvo cerámico posterior */}
        <mesh position={[0, 0.05, 0.008]}>
          <boxGeometry args={[widthM, 0.1, 0.015]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
      </group>

      {/* 3. MURO FRONTAL (Z = +lengthM/2) */}
      <group ref={frontWallRef} position={[0, 0, lengthM / 2]}>
        <mesh receiveShadow position={[0, heightM / 2, 0]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[widthM, heightM]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.3}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Guardapolvo cerámico frontal */}
        <mesh position={[0, 0.05, -0.008]}>
          <boxGeometry args={[widthM, 0.1, 0.015]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
      </group>

      {/* 4. MURO LATERAL IZQUIERDO (X = -widthM/2) */}
      <group ref={leftWallRef} position={[-widthM / 2, 0, 0]}>
        <mesh receiveShadow position={[0, heightM / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[lengthM, heightM]} />
          <meshStandardMaterial
            map={sideWallTexture}
            roughness={0.3}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Guardapolvo cerámico izquierdo */}
        <mesh position={[0.008, 0.05, 0]}>
          <boxGeometry args={[0.015, 0.1, lengthM]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
      </group>

      {/* 5. MURO LATERAL DERECHO (X = +widthM/2) */}
      <group ref={rightWallRef} position={[widthM / 2, 0, 0]}>
        <mesh receiveShadow position={[0, heightM / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[lengthM, heightM]} />
          <meshStandardMaterial
            map={sideWallTexture}
            roughness={0.3}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Guardapolvo cerámico derecho */}
        <mesh position={[-0.008, 0.05, 0]}>
          <boxGeometry args={[0.015, 0.1, lengthM]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
