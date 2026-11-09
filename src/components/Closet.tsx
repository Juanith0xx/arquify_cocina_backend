import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { Board } from './Board';
import { getNominalSlideLength, getDrawerBottomSpecs } from '../utils/manufacturing';
import { Text, Line, Cylinder, useCursor, Edges, Billboard } from '@react-three/drei';

function AssemblyJoint({
  position, 
  length, 
  axis, 
  pointing, 
  thickness,
  count = 3,
  overrideAssemblyType = undefined
, edgeOffset = 5}: {
  position: [number, number, number],
  length: number,
  axis: 'x' | 'y' | 'z',
  pointing: 'right' | 'left' | 'up' | 'down',
  thickness: number,
  count?: number,
  overrideAssemblyType?: 'spax' | 'minifix',
  edgeOffset?: number
}) {
  const isTransparent = useStore((state) => state.isTransparent);
  const globalAssemblyType = useStore((state) => state.assemblyType);
  const assemblyType = overrideAssemblyType || globalAssemblyType;
  if (!isTransparent) return null;

  const points = [];
  const start = -length / 2 + edgeOffset; 
  const end = length / 2 - edgeOffset;
  const step = count > 1 ? (end - start) / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    points.push(start + i * step);
  }

  let rot: [number, number, number] = [0, 0, 0];
  if (pointing === 'left') rot = [0, Math.PI, 0];
  if (pointing === 'up') rot = [0, 0, Math.PI/2];
  if (pointing === 'down') rot = [0, 0, -Math.PI/2];

  return (
    <group position={position}>
      {points.map((p, i) => {
        const pPos: [number, number, number] = 
          axis === 'x' ? [p, 0, 0] : 
          axis === 'y' ? [0, p, 0] : 
          [0, 0, p];
          
        return (
          <group key={i} position={pPos} rotation={rot}>
            {assemblyType === 'spax' ? (
              <group>
                <mesh position={[-thickness, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                  <cylinderGeometry args={[0.4, 0.4, 0.1, 12]} />
                  <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.5} />
                </mesh>
                <mesh position={[-thickness/2 + 1.25, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                  <cylinderGeometry args={[0.15, 0.05, thickness + 2.5, 8]} />
                  <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.5} />
                </mesh>
              </group>
            ) : (
              <group>
                <mesh position={[-thickness/2 + 0.75, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                  <cylinderGeometry args={[0.25, 0.25, thickness + 1.5, 8]} />
                  <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.5} />
                </mesh>
                <mesh position={[1.7, -thickness/2 + 0.25, 0]}>
                  <cylinderGeometry args={[0.75, 0.75, 0.5, 16]} />
                  <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.5} />
                </mesh>
                <mesh position={[0.5, 0, 3]} rotation={[0, 0, -Math.PI/2]}>
                   <cylinderGeometry args={[0.4, 0.4, 3, 8]} />
                   <meshStandardMaterial color="#d4a373" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

function FoldedClothes({ position, width, depth }: { position: [number, number, number], width: number, depth: number }) {
  const colors = ['#fde047', '#fca5a5', '#ea580c', '#3b82f6', '#93c5fd', '#f8fafc', '#e2e8f0', '#1e3a8a', '#d1d5db', '#fcd34d'];
  const seed = Math.abs(Math.floor(position[0] * 10 + position[1] * 100));
  
  const itemW = Math.min(22, width - 2); 
  const itemD = Math.min(30, depth - 2); 
  const h = 2.5; 
  
  const numStacks = Math.max(1, Math.floor((width - 2) / (itemW + 2)));
  const startX = -((numStacks - 1) * (itemW + 2)) / 2;

  const stacks = [];
  for (let s = 0; s < numStacks; s++) {
    const stackSeed = seed + s * 10;
    const currentStackCount = 3 + (stackSeed % 4);
    const stackX = startX + s * (itemW + 2);

    for (let i = 0; i < currentStackCount; i++) {
      const rotationY = (Math.sin(stackSeed + i) * 0.1); 
      const offsetX = (Math.cos(stackSeed + i) * 0.5); 
      stacks.push(
        <mesh key={`stack-${s}-item-${i}`} position={[stackX + offsetX, i * h + h/2, 0]} rotation={[0, rotationY, 0]} castShadow>
          <boxGeometry args={[itemW - (i*0.2), h, itemD - (i*0.2)]} />
          <meshStandardMaterial color={colors[(stackSeed + i) % colors.length]} roughness={1.0} />
        </mesh>
      );
    }
  }
  return <group position={position}>{stacks}</group>;
}

function StorageBox({ position, width, depth }: { position: [number, number, number], width: number, depth: number }) {
  const boxW = Math.min(width * 0.8, 32);
  const boxD = Math.min(depth * 0.8, 38);
  const boxH = 20; 
  const yCenter = boxH / 2;
  
  const numBoxes = Math.max(1, Math.floor((width - 2) / (boxW + 4)));
  const startX = -((numBoxes - 1) * (boxW + 4)) / 2;
  
  const boxes = [];
  for (let i = 0; i < numBoxes; i++) {
    boxes.push(
      <group key={`sbox-${i}`} position={[startX + i * (boxW + 4), 0, 0]}>
        <mesh position={[0, yCenter, 0]} castShadow>
          <boxGeometry args={[boxW, boxH, boxD]} />
          <meshStandardMaterial color="#e5d3b3" roughness={0.9} /> 
        </mesh>
        <mesh position={[0, boxH + 0.5, 0]} castShadow>
          <boxGeometry args={[boxW + 1.5, 2, boxD + 1.5]} />
          <meshStandardMaterial color="#f0e2c8" roughness={0.8} />
        </mesh>
        <mesh position={[0, yCenter, boxD/2 + 0.1]}>
           <boxGeometry args={[5, 2, 0.2]} />
           <meshStandardMaterial color="#a39171" />
        </mesh>
      </group>
    );
  }
  return <group position={position}>{boxes}</group>;
}

function ShoePair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-5, 3, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
         <capsuleGeometry args={[3, 12, 4, 16]} />
         <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[5, 3, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
         <capsuleGeometry args={[3, 12, 4, 16]} />
         <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  )
}

function HangingClothes({ position, color, maxW, availableH, maxD, index = 0, isLong = false }: { position: [number, number, number], color: string, maxW: number, availableH: number, maxD: number, index?: number, isLong?: boolean }) {
  const shirtW = Math.min(38, maxW - 2);
  const targetH = isLong ? 110 : 65;
  const shirtH = Math.min(targetH, availableH - 5); 
  const rotY = Math.sin(index * 45.12) * 0.15; 
  const isOpen = index % 3 === 0; 
  
  return (
    <group position={position} rotation={[0, rotY, 0]}>
       {/* Percha / Gancho */}
       <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, Math.PI/4]}>
         <torusGeometry args={[1.6, 0.12, 8, 24, Math.PI * 1.5]} />
         <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
       </mesh>
       <mesh position={[0, -2.5, 0]}>
         <cylinderGeometry args={[0.12, 0.12, 2.5, 8]} />
         <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
       </mesh>
       {/* Hombros percha (madera) */}
       <mesh position={[0, -3.7, 0]} rotation={[0, 0, Math.PI/2]}>
         <cylinderGeometry args={[0.35, 0.35, shirtW * 0.95, 8]} />
         <meshStandardMaterial color="#d4a373" roughness={0.9} />
       </mesh>
       
       {/* Cuerpo ropa (Cilindro aplastado para simular caída de tela orgánica) */}
       <mesh position={[0, -3.7 - shirtH/2, 0]} scale={[1, 1, 0.25]} castShadow>
         <cylinderGeometry args={[shirtW/2.2, shirtW/2, shirtH, 16]} />
         <meshStandardMaterial color={color} roughness={1.0} />
       </mesh>
       
       {/* Abertura central oscura para chaquetas/camisas */}
       {isOpen && (
         <mesh position={[0, -3.7 - shirtH/2, 2.5]}>
           <boxGeometry args={[0.8, shirtH * 0.9, 0.5]} />
           <meshStandardMaterial color="#111111" opacity={0.3} transparent />
         </mesh>
       )}
    </group>
  );
}

function ShelfHardware({ shelfYs, xLeft, xRight, zFront, zBack, bounds }: { shelfYs: number[], xLeft: number, xRight: number, zFront: number, zBack: number, bounds: { minY: number, maxY: number } }) {
  const holeRadius = 0.25;
  const holeDepth = 0.1;
  const pegLength = 1.0;
  
  // Calcular el espaciado máximo permitido para que ninguna repisa superponga sus 4 posiciones
  let step = 3.2; // 32mm por defecto
  
  if (shelfYs.length > 0) {
    const sortedYs = [...shelfYs].sort((a, b) => a - b);
    let limit = 3.2;
    
    // Distancia entre repisas consecutivas (se necesitan 8 espacios libres entre medio)
    for (let i = 0; i < sortedYs.length - 1; i++) {
      const diff = sortedYs[i+1] - sortedYs[i];
      if (diff > 0) limit = Math.min(limit, diff / 8);
    }
    
    // Distancia a los bordes superior e inferior del módulo (se necesitan 4.5 espacios libres para dar margen)
    const distBottom = sortedYs[0] - bounds.minY;
    if (distBottom > 0) limit = Math.min(limit, distBottom / 4.5);
    
    const distTop = bounds.maxY - sortedYs[sortedYs.length - 1];
    if (distTop > 0) limit = Math.min(limit, distTop / 4.5);
    
    step = limit;
  }
  
  // Usar un mapa para evitar duplicar agujeros en las mismas posiciones Y.
  // La clave será la posición Y redondeada a 1 decimal para evitar errores de flotabilidad.
  const holesMap = new Map<string, { y: number, isCenter: boolean }>();

  shelfYs.forEach(y => {
    for (let i = -4; i <= 4; i++) {
      const hY = y + i * step;
      const key = hY.toFixed(1);
      const isCenter = i === 0;
      
      // Si el agujero ya existe, solo sobreescribimos si el nuevo es un centro (tope)
      if (!holesMap.has(key) || isCenter) {
        holesMap.set(key, { y: hY, isCenter });
      }
    }
  });

  const elements: React.ReactNode[] = [];
  
  holesMap.forEach((hole, key) => {
    const createHardware = (id: string, xPos: number, zPos: number, isLeft: boolean) => {
      const xOffset = hole.isCenter ? (pegLength / 2) : (holeDepth / 2);
      const direction = isLeft ? 1 : -1;
      return (
        <mesh key={id} position={[xPos + (xOffset * direction), hole.y, zPos]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[holeRadius, holeRadius, hole.isCenter ? pegLength : holeDepth, 8]} />
          {hole.isCenter 
            ? <meshStandardMaterial color="#cccccc" metalness={0.8} /> 
            : <meshStandardMaterial color="#222222" roughness={0.9} />}
        </mesh>
      );
    };

    elements.push(createHardware(`lf-${key}`, xLeft, zFront, true));
    elements.push(createHardware(`rf-${key}`, xRight, zFront, false));
    elements.push(createHardware(`lb-${key}`, xLeft, zBack, true));
    elements.push(createHardware(`rb-${key}`, xRight, zBack, false));
  });

  return <group>{elements}</group>;
}

function AnimatedDrawer({ children, openZOffset, forceOpen, onClickAction }: { children: React.ReactNode, openZOffset: number, forceOpen?: boolean, onClickAction?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetZ = forceOpen ? openZOffset : 0;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 3);
    }
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (onClickAction) onClickAction(); 
      }}
    >
      {children}
    </group>
  );
}

function AnimatedDoor({ 
  position, 
  doorW, 
  doorHeight, 
  thickness, 
  
  color, textureUrl, materialType, isRightHinge,
  grainDirection, hplBalancerOverride, forceOpen, onClickAction
}: {
  position: [number, number, number],
  doorW: number,
  doorHeight: number,
  thickness: number,
  color: string,
  textureUrl?: string,
  materialType?: 'melamina' | 'hpl',
  isRightHinge: boolean,
  grainDirection?: 'vertical' | 'horizontal',
  hplBalancerOverride?: boolean,
  forceOpen?: boolean,
  onClickAction?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetRotation = forceOpen ? (isRightHinge ? Math.PI / 2 : -Math.PI / 2) : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, delta * 3);
    }
  });

  const hingeXOffset = isRightHinge ? doorW / 2 : -doorW / 2;
  
  // Criterio Técnico Industrial de Bisagras según altura (mm):
  // <= 900mm: 2 | 901-1500mm: 3 | 1501-2000mm: 4 | 2001-2500mm: 5
  const doorHMm = doorHeight * 10;
  const hingeCount = doorHMm <= 900 ? 2 : doorHMm <= 1500 ? 3 : doorHMm <= 2000 ? 4 : 5;
  const hingeYs = hingeCount === 2
    ? [-doorHeight / 2 + 15, doorHeight / 2 - 15]
    : hingeCount === 3
    ? [-doorHeight / 2 + 15, 0, doorHeight / 2 - 15]
    : hingeCount === 4
    ? [-doorHeight / 2 + 20, -doorHeight / 6, doorHeight / 6, doorHeight / 2 - 20]
    : [-doorHeight / 2 + 20, -doorHeight / 4, 0, doorHeight / 4, doorHeight / 2 - 20];
  const hingeDir = isRightHinge ? -1 : 1;

  return (
    <group 
      position={[position[0] + hingeXOffset, position[1], position[2]]}
      ref={groupRef}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (onClickAction) onClickAction(); 
      }}
    >
      <Board position={[-hingeXOffset, 0, 0]} args={[doorW, doorHeight, thickness]} color={color} textureUrl={textureUrl} materialType={materialType} isFrontPanel={true} grainDirection={grainDirection} hplBalancerOverride={hplBalancerOverride} />
      
      {/* Bisagras */}
      {hingeYs.map((y, index) => (
        <group key={`hinge-${index}`} position={[0, y, -thickness/2]}>
          {/* Placa base (simula estar en el lateral) */}
          <mesh position={[hingeDir * 1.5, 0, -1.5]}>
            <boxGeometry args={[2, 3, 1]} />
            <meshStandardMaterial color="#7a7a7a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Brazo */}
          <mesh position={[hingeDir * 2.2, 0, -0.4]}>
            <boxGeometry args={[4, 1.5, 0.4]} />
            <meshStandardMaterial color="#999999" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Cazoleta */}
          <mesh position={[hingeDir * 2.2, 0, -0.2]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[1.75, 1.75, 0.4, 16]} />
            <meshStandardMaterial color="#cccccc" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Closet() {
  const state = useStore();
  
  const { structureColor: color,  
    height, depth, thickness, modules,
    showTopWall, showBottomWall, showLeftWall, showRightWall, showBackWall,
    showSocle, showLegs, showDimensions, dimensionLevel,
    structureColor, backColor, doorColor, socleColor
  } = state;

  const baseOffset = showSocle ? 10 : showLegs ? 10 : 0;

  const getTextureProps = (c: string, mat: 'melamina' | 'hpl') => {
    if (!c) return { color: '#ffffff', materialType: mat };
    if (c.startsWith('#')) return { color: c, materialType: mat };
    const url = (c.startsWith('/') || c.startsWith('http') || c.startsWith('data:') || c.startsWith('blob:')) ? c : `/textures/${c}`;
    return { color: '#ffffff', textureUrl: url, materialType: mat };
  };
  
  const structureProps = getTextureProps(color, state.structureMaterial);
  const doorProps = getTextureProps(doorColor, state.doorMaterial);
  const drawerFrontProps = getTextureProps(state.drawerFrontColor, state.drawerFrontMaterial);
  const drawerInnerProps = getTextureProps(state.drawerInnerColor, state.drawerInnerMaterial);
  const shelfProps = getTextureProps(state.shelfColor, state.shelfMaterial);
  const backProps = getTextureProps(backColor, state.structureMaterial);
  const socleProps = getTextureProps(socleColor, state.socleMaterial as 'melamina' | 'hpl'); // Back wall uses structure material usually

  
  // En un esquema de módulos independientes, el ancho total es la suma de los anchos de cada módulo.
  const totalWidth = modules.reduce((sum, m) => sum + m.width, 0);
  
  const innerHeight = height - (showTopWall ? thickness : 0) - (showBottomWall ? thickness : 0);
  const innerYBase = baseOffset + (showBottomWall ? thickness : 0);
  const innerZBase = (showBackWall ? thickness : 0) / 2;
  const innerDepth = depth - (showBackWall ? thickness : 0);

  let currentX = -totalWidth / 2;

  const moduleElements = modules.map((mod, index) => {
    const modStructureProps = getTextureProps(mod.overrides?.structureColor || color, mod.overrides?.structureMaterial || state.structureMaterial);
    const modShelfProps = getTextureProps(mod.overrides?.shelfColor || mod.overrides?.structureColor || state.shelfColor, mod.overrides?.shelfMaterial || mod.overrides?.structureMaterial || state.shelfMaterial);
    const modDoorProps = getTextureProps(mod.overrides?.doorColor || doorColor, mod.overrides?.doorMaterial || state.doorMaterial);
    const modDrawerFrontProps = getTextureProps(mod.overrides?.drawerFrontColor || state.drawerFrontColor, mod.overrides?.drawerFrontMaterial || state.drawerFrontMaterial);
    const modDrawerInnerProps = getTextureProps(mod.overrides?.drawerInnerColor || state.drawerInnerColor, mod.overrides?.drawerInnerMaterial || state.drawerInnerMaterial);
    const modBackProps = getTextureProps(mod.overrides?.backColor || backColor, mod.overrides?.backMaterial || state.structureMaterial);
    const modSocleProps = getTextureProps(mod.overrides?.socleColor || socleColor, mod.overrides?.socleMaterial || (state.socleMaterial as 'melamina' | 'hpl'));
    const modGrainDirection = mod.overrides?.grainDirection || 'vertical';
    const modHplBalancer = mod.overrides?.hplBalancer !== undefined ? mod.overrides.hplBalancer : state.hplBalancer;

    const modCenterX = currentX + mod.width / 2;
    const innerW = mod.width - (showLeftWall ? thickness : 0) - (showRightWall ? thickness : 0);
    const innerCenterX = modCenterX + (showLeftWall ? thickness/2 : 0) - (showRightWall ? thickness/2 : 0);
    
    const parts = [];

    // Estructura Externa (Independiente por cada módulo)
    if (showLeftWall) {
      parts.push(<Board key={`L-${mod.id}`} position={[modCenterX - mod.width / 2 + thickness / 2, (height + baseOffset) / 2, 0]} args={[thickness, height + baseOffset, depth]} {...modStructureProps} />);
      if (showTopWall) parts.push(<AssemblyJoint key={`aj-TL-${mod.id}`} position={[modCenterX - mod.width / 2 + (showLeftWall ? thickness : 0), baseOffset + height - thickness / 2, 0]} length={depth} axis="z" pointing="right" thickness={thickness} count={3} />);
      if (showBottomWall) parts.push(<AssemblyJoint key={`aj-BL-${mod.id}`} position={[modCenterX - mod.width / 2 + (showLeftWall ? thickness : 0), baseOffset + thickness / 2, 0]} length={depth} axis="z" pointing="right" thickness={thickness} count={3} />);
    } else if (index !== 0) {
      // Si no es el primer módulo, y no hay left wall general (o la hay pero este es un módulo central), este es un divider central
      if (showTopWall) parts.push(<AssemblyJoint key={`aj-TDiv-${mod.id}`} position={[modCenterX - mod.width / 2, baseOffset + height - thickness / 2, 0]} length={depth} axis="z" pointing="right" thickness={thickness} count={3} />);
      if (showBottomWall) parts.push(<AssemblyJoint key={`aj-BDiv-${mod.id}`} position={[modCenterX - mod.width / 2, baseOffset + thickness / 2, 0]} length={depth} axis="z" pointing="right" thickness={thickness} count={3} />);
    }
    
    if (showRightWall) {
      parts.push(<Board key={`R-${mod.id}`} position={[modCenterX + mod.width / 2 - thickness / 2, (height + baseOffset) / 2, 0]} args={[thickness, height + baseOffset, depth]} {...modStructureProps} />);
      if (showTopWall) parts.push(<AssemblyJoint key={`aj-TR-${mod.id}`} position={[modCenterX + mod.width / 2 - thickness, baseOffset + height - thickness / 2, 0]} length={depth} axis="z" pointing="left" thickness={thickness} count={3} />);
      if (showBottomWall) parts.push(<AssemblyJoint key={`aj-BR-${mod.id}`} position={[modCenterX + mod.width / 2 - thickness, baseOffset + thickness / 2, 0]} length={depth} axis="z" pointing="left" thickness={thickness} count={3} />);
    }
    if (showBottomWall) {
      parts.push(<Board key={`B-${mod.id}`} position={[innerCenterX, baseOffset + thickness / 2, 0]} args={[innerW, thickness, depth]} {...modStructureProps} />);
    }
    if (showTopWall) {
      parts.push(<Board key={`T-${mod.id}`} position={[innerCenterX, baseOffset + height - thickness / 2, 0]} args={[innerW, thickness, depth]} {...modStructureProps} />);
    }
    if (showBackWall) {
      parts.push(<Board key={`Back-${mod.id}`} position={[innerCenterX, baseOffset + height / 2, -depth / 2 + thickness / 2]} args={[innerW, innerHeight, thickness]} {...modBackProps} />);
    }
    if (showSocle) {
      // Zócalo frontal (retranqueado 2cm o al ras de la puerta)
      parts.push(<Board key={`socle-front-${mod.id}`} position={[innerCenterX, baseOffset / 2, depth / 2 - thickness / 2 - 2]} args={[innerW, baseOffset, thickness]} {...modSocleProps} />);
      // Zócalo trasero
      parts.push(<Board key={`socle-back-${mod.id}`} position={[innerCenterX, baseOffset / 2, -depth / 2 + thickness / 2 + (showBackWall ? thickness : 0) + 2]} args={[innerW, baseOffset, thickness]} {...modSocleProps} />);
    }

    // --- COTAS DE MÓDULO (Nivel >= 2) ---
    if (showDimensions && dimensionLevel >= 2) {
      const dimY = baseOffset > 0 ? baseOffset / 2 : 1.5;
      parts.push(
        <group key={`dim-mod-${mod.id}`} position={[modCenterX, dimY, depth / 2 + 10]} renderOrder={999}>
          <Line points={[[-mod.width / 2, 0, 0], [mod.width / 2, 0, 0]]} color="#3b82f6" lineWidth={1.5} depthTest={false} renderOrder={999} />
          <Line points={[[-mod.width / 2, -1.5, 0], [-mod.width / 2, 1.5, 0]]} color="#3b82f6" lineWidth={1.5} depthTest={false} renderOrder={999} />
          <Line points={[[mod.width / 2, -1.5, 0], [mod.width / 2, 1.5, 0]]} color="#3b82f6" lineWidth={1.5} depthTest={false} renderOrder={999} />
          <Text position={[0, 2, 0]} fontSize={5} color="#3b82f6" anchorX="center" anchorY="bottom" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{Number(mod.width.toFixed(1))} cm</Text>
        </group>
      );
    }
    
    // Shelves and Hanger
    const drawersTotalHeight = mod.drawers > 0 ? mod.drawers * 27 : 0;
    const hasDrawers = mod.drawers > 0;
    const coverShelfY = baseOffset + (showBottomWall ? thickness : 0) + drawersTotalHeight;

    const shelfDepth = innerDepth - 1.5;
    const shelfZ = innerZBase - 1.5 / 2;

    if (hasDrawers) {
      // Tapa estructural de cajoneras obligatoria, llega hasta el borde frontal (innerDepth completo)
      parts.push(<Board key={`shelf-cover-${mod.id}`} position={[modCenterX, coverShelfY, innerZBase]} args={[innerW, thickness, innerDepth]} {...modStructureProps} />);
      
      // Assembly hardware for cover shelf
      parts.push(<AssemblyJoint key={`aj-coverL-${mod.id}`} position={[innerCenterX - innerW / 2, coverShelfY, innerZBase]} length={innerDepth} axis="z" pointing="right" thickness={thickness} count={3} />);
      parts.push(<AssemblyJoint key={`aj-coverR-${mod.id}`} position={[innerCenterX + innerW / 2, coverShelfY, innerZBase]} length={innerDepth} axis="z" pointing="left" thickness={thickness} count={3} />);
    }

    const usableYStart = hasDrawers ? (coverShelfY + thickness) : innerYBase;
    const usableHeight = (baseOffset + height - (showTopWall ? thickness : 0)) - usableYStart;

    const leftWallX = modCenterX - innerW / 2;
    const rightWallX = modCenterX + innerW / 2;
    const zFront = shelfZ + shelfDepth / 2 - 4;
    const zBack = shelfZ - shelfDepth / 2 + 4;
    const allShelfYs: number[] = [];

    if (mod.hasHanger) {
      // Hanger setup: usually one top shelf (maletero), maybe one bottom shelf, rod in between
      if (mod.shelves > 0) {
        // Top shelf (maletero) typically 35cm from the top
        const maleteroY = baseOffset + height - (showTopWall ? thickness : 0) - 35;
        parts.push(<Board key={`shelf-top-${mod.id}`} position={[modCenterX, maleteroY, shelfZ]} args={[innerW, thickness, shelfDepth]} {...modShelfProps} />);
        
        // Assembly hardware for maletero
        parts.push(<AssemblyJoint key={`aj-maleteroL-${mod.id}`} position={[innerCenterX - innerW / 2, maleteroY, shelfZ]} length={shelfDepth} axis="z" pointing="right" thickness={thickness} count={3} />);
        parts.push(<AssemblyJoint key={`aj-maleteroR-${mod.id}`} position={[innerCenterX + innerW / 2, maleteroY, shelfZ]} length={shelfDepth} axis="z" pointing="left" thickness={thickness} count={3} />);
        
        allShelfYs.push(maleteroY - thickness / 2);
        
        if (state.showDecorations) {
          parts.push(<StorageBox key={`sbox-top-${mod.id}`} position={[modCenterX, maleteroY + thickness/2, shelfZ]} width={innerW} depth={shelfDepth} />);
        }

        if (mod.shelves > 1) {
          // Bottom shelf inside usable space
          const bottomShelfY = usableYStart + 25;
          parts.push(<Board key={`shelf-bottom-${mod.id}`} position={[modCenterX, bottomShelfY, shelfZ]} args={[innerW, thickness, shelfDepth]} {...modShelfProps} />);
          
          // Assembly hardware for bottom fixed shelf
          parts.push(<AssemblyJoint key={`aj-bshelfL-${mod.id}`} position={[innerCenterX - innerW / 2, bottomShelfY, shelfZ]} length={shelfDepth} axis="z" pointing="right" thickness={thickness} count={3} />);
          parts.push(<AssemblyJoint key={`aj-bshelfR-${mod.id}`} position={[innerCenterX + innerW / 2, bottomShelfY, shelfZ]} length={shelfDepth} axis="z" pointing="left" thickness={thickness} count={3} />);
          
          allShelfYs.push(bottomShelfY - thickness / 2);
          
          if (showDimensions && dimensionLevel >= 5) {
            parts.push(
              <group key={`dim-shelf-bot-${mod.id}`} position={[modCenterX, usableYStart + (bottomShelfY - usableYStart)/2, depth / 2 + 5]} renderOrder={999}>
                <Line points={[[0, -(bottomShelfY - usableYStart)/2, 0], [0, (bottomShelfY - usableYStart)/2, 0]]} color="#8b5cf6" lineWidth={1} depthTest={false} renderOrder={999} />
                <Text position={[3, 0, 0]} fontSize={4} color="#8b5cf6" anchorX="left" anchorY="middle" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{(bottomShelfY - usableYStart).toFixed(1)}</Text>
              </group>
            );
          }

          if (state.showDecorations) {
             if (!hasDrawers && bottomShelfY < 30) {
                 parts.push(<ShoePair key={`shoes-bot-${mod.id}`} position={[modCenterX, bottomShelfY + thickness/2, shelfZ]} />);
             } else {
                 parts.push(<FoldedClothes key={`cloth-bot-${mod.id}`} position={[modCenterX, bottomShelfY + thickness/2, shelfZ]} width={innerW} depth={shelfDepth} />);
             }
          }
        }
      }
      
      // Render metallic rod below the top shelf (or top of the closet)
      const rodY = mod.shelves > 0 ? (baseOffset + height - (showTopWall ? thickness : 0) - 40) : (baseOffset + height - (showTopWall ? thickness : 0) - 5);
      parts.push(
        <group key={`hanger-${mod.id}`} position={[modCenterX, rodY, innerZBase]}>
          <Cylinder args={[1.5, 1.5, innerW - 0.2]} rotation={[0, 0, Math.PI/2]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
          </Cylinder>
        </group>
      );
      
      if (showDimensions && dimensionLevel >= 5 && mod.shelves > 0) {
         const maleteroY = baseOffset + height - (showTopWall ? thickness : 0) - 35;
         const topLimitY = baseOffset + height - (showTopWall ? thickness : 0);
         parts.push(
           <group key={`dim-shelf-top-${mod.id}`} position={[modCenterX, maleteroY + 17.5, depth / 2 + 5]} renderOrder={999}>
             <Line points={[[0, -17.5, 0], [0, 17.5, 0]]} color="#8b5cf6" lineWidth={1} depthTest={false} renderOrder={999} />
             <Text position={[3, 0, 0]} fontSize={4} color="#8b5cf6" anchorX="left" anchorY="middle" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>35.0</Text>
           </group>
         );
      }

      if (state.showDecorations && innerW > 10) {
        // Distribute hanging shirts sin traspasar las paredes laterales
        const hangerColors = ['#e5e7eb', '#fca5a5', '#bae6fd', '#fed7aa', '#f3f4f6', '#d1d5db', '#ffedd5'];
        const shirtW = Math.min(38, innerW - 2);
        const safeW = innerW - shirtW; // Espacio libre para colgar sin tocar paredes
        
        // Calcular la altura disponible para que la ropa no traspase estantes inferiores o tapa de cajones
        const bottomLimitY = (mod.shelves > 1) ? (usableYStart + 25) : usableYStart;
        const availableH = rodY - bottomLimitY;
        const isLong = availableH > 100;

        if (safeW <= 0.1) {
           parts.push(<HangingClothes key={`h-shirt-${mod.id}-0`} position={[innerCenterX, rodY, innerZBase]} color={hangerColors[0]} maxW={innerW} availableH={availableH} maxD={innerDepth} index={0} isLong={isLong} />);
        } else {
           const minSpacing = 5; 
           const numShirts = Math.max(2, Math.floor(safeW / minSpacing) + 1);
           const spacing = safeW / (numShirts - 1);
           const firstX = modCenterX - safeW / 2;
           for (let s = 0; s < numShirts; s++) {
             const noiseX = (Math.sin(s * 123.45) * 1.5);
             parts.push(<HangingClothes key={`h-shirt-${mod.id}-${s}`} position={[firstX + s * spacing + noiseX, rodY, innerZBase]} color={hangerColors[s % hangerColors.length]} maxW={innerW} availableH={availableH} maxD={innerDepth} index={s} isLong={isLong} />);
           }
        }
      }
      
    } else {
      if (mod.shelves > 0) {
        const spacing = usableHeight / (mod.shelves + 1);
        for (let i = 1; i <= mod.shelves; i++) {
          const shelfY = usableYStart + spacing * i;
          parts.push(
            <Board key={`shelf-${mod.id}-${i}`} position={[innerCenterX, shelfY, shelfZ]} args={[innerW, thickness, shelfDepth]} {...modShelfProps} />
          );
          allShelfYs.push(shelfY - thickness / 2);

          if (showDimensions && dimensionLevel >= 5) {
            const dimY = shelfY - spacing / 2;
            parts.push(
              <group key={`dim-shelf-${mod.id}-${i}`} position={[modCenterX, dimY, depth / 2 + 5]} renderOrder={999}>
                <Line points={[[0, -spacing / 2, 0], [0, spacing / 2, 0]]} color="#8b5cf6" lineWidth={1} depthTest={false} renderOrder={999} />
                <Text position={[3, 0, 0]} fontSize={4} color="#8b5cf6" anchorX="left" anchorY="middle" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{spacing.toFixed(1)}</Text>
              </group>
            );
            // Si es la última repisa, agregar la cota del último espacio superior
            if (i === mod.shelves) {
              const lastDimY = shelfY + spacing / 2;
              parts.push(
                <group key={`dim-shelf-last-${mod.id}`} position={[modCenterX, lastDimY, depth / 2 + 5]} renderOrder={999}>
                  <Line points={[[0, -spacing / 2, 0], [0, spacing / 2, 0]]} color="#8b5cf6" lineWidth={1} depthTest={false} renderOrder={999} />
                  <Text position={[3, 0, 0]} fontSize={4} color="#8b5cf6" anchorX="left" anchorY="middle" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{spacing.toFixed(1)}</Text>
                </group>
              );
            }
          }

          if (state.showDecorations) {
            if (i === mod.shelves && spacing >= 22) {
              parts.push(<StorageBox key={`sbox-${mod.id}-${i}`} position={[modCenterX, shelfY + thickness/2, shelfZ]} width={innerW} depth={shelfDepth} />);
            } else {
              parts.push(<FoldedClothes key={`cloth-${mod.id}-${i}`} position={[modCenterX, shelfY + thickness/2, shelfZ]} width={innerW} depth={shelfDepth} />);
            }
          }
        }
      }
    }

    if (allShelfYs.length > 0) {
      const usableYEnd = baseOffset + height - (showTopWall ? thickness : 0);
      parts.push(<ShelfHardware key={`hw-all-${mod.id}`} shelfYs={allShelfYs} xLeft={leftWallX} xRight={rightWallX} zFront={zFront} zBack={zBack} bounds={{ minY: usableYStart, maxY: usableYEnd }} />);
    }

    // Drawers
    if (mod.drawers > 0) {
      const isInnerDrawer = mod.doors && (mod.innerDrawers !== false);
      const drawerStep = 27; // espacio total asignado por cajón
      
      const spacerGap = isInnerDrawer ? 3.5 : 0; // Regleta de separación de bisagras (35 mm)
      const innerWallThickness = isInnerDrawer ? thickness : 0;
      const totalSideReduction = spacerGap + innerWallThickness;
      const freeInnerW = innerW - (totalSideReduction * 2);

      // Si son cajones interiores, el frente es más bajo (rebaje de 5 cm) para meter la mano y abrir sin tirador.
      const frontHeight = isInnerDrawer ? (drawerStep - 5.0) : (drawerStep - 0.3); 

      // Ancho del frente:
      // - Si es sobrepuesto (normal): Ancho total menos 3mm
      // - Si es interno: Ancho interno libre (entre regletas y laterales interiores) menos holgura 4mm
      const frontWidth = isInnerDrawer ? (freeInnerW - 0.4) : (mod.width - 0.3); 
      
      // Cálculo de proporciones del cajón interno
      const slideClearance = 2.6; // 26mm según ficha técnica corredera telescópica lateral (13mm por lado)
      const boxOuterWidth = isInnerDrawer ? (freeInnerW - slideClearance) : (innerW - slideClearance);
      
      // Profundidad ajustada: si es cajón interno, va retrasado para no chocar con la puerta cerrada
      const internalClearanceZ = isInnerDrawer ? (thickness + 1.5) : 0;
      const innerDepthMm = (depth - (showBackWall ? 0.3 : 0) - internalClearanceZ) * 10;
      const nominalLengthMm = getNominalSlideLength(innerDepthMm);
      const nominalLength = nominalLengthMm / 10; // cm
      const drawerBoxLength = nominalLength; // SKL = NL para corredera telescópica
      const sideHeight = isInnerDrawer ? 14 : 15;
      
      // Posiciones en el eje Z
      const innerBlockFrontZ = depth / 2 - internalClearanceZ;
      const frontStripZ = innerBlockFrontZ - thickness / 2;
      const frontZPos = isInnerDrawer ? frontStripZ : depth / 2 + thickness / 2;
      const boxZCenter = isInnerDrawer ? innerBlockFrontZ - thickness - drawerBoxLength / 2 : depth / 2 - drawerBoxLength / 2;

      // Estructura fija de la cajonera interior (Laterales interiores y regletas)
      if (isInnerDrawer) {
        const drawersTotalHeight = mod.drawers * drawerStep;
        const blockYCenter = baseOffset + (showBottomWall ? thickness : 0) + drawersTotalHeight / 2;
        
        // Lateral Interior Izquierdo
        parts.push(<Board key={`inner-lat-L-${mod.id}`} position={[innerCenterX - innerW/2 + spacerGap + thickness/2, blockYCenter, boxZCenter]} args={[thickness, drawersTotalHeight, drawerBoxLength]} {...modStructureProps} />);
        // Pilastra/Regleta Frontal Izquierda
        parts.push(<Board key={`front-strip-L-${mod.id}`} position={[innerCenterX - innerW/2 + spacerGap/2, blockYCenter, frontStripZ]} args={[spacerGap, drawersTotalHeight, thickness]} {...modStructureProps} />);

        // Lateral Interior Derecho
        parts.push(<Board key={`inner-lat-R-${mod.id}`} position={[innerCenterX + innerW/2 - spacerGap - thickness/2, blockYCenter, boxZCenter]} args={[thickness, drawersTotalHeight, drawerBoxLength]} {...modStructureProps} />);
        // Pilastra/Regleta Frontal Derecha
        parts.push(<Board key={`front-strip-R-${mod.id}`} position={[innerCenterX + innerW/2 - spacerGap/2, blockYCenter, frontStripZ]} args={[spacerGap, drawersTotalHeight, thickness]} {...modStructureProps} />);
      }

      const drawerAssemblyType = state.drawerAssemblyType || 'spax';

      for (let d = 0; d < mod.drawers; d++) {
        // En cajón interior, anclamos el frente a la base del cajón para que la holgura (uñero) quede en la parte superior
        const drawerBaseY = baseOffset + (showBottomWall && isInnerDrawer ? thickness : 0) + drawerStep * d;
        const yPosFront = isInnerDrawer 
          ? (drawerBaseY + 0.3 + frontHeight / 2) 
          : (drawerBaseY + drawerStep / 2);
        
        // yBoxBase es la base de la caja interior, un poco más arriba de la base del frente
        const yBoxBase = drawerBaseY + (isInnerDrawer ? 0.8 : (thickness + 1));
        const yBoxCenter = yBoxBase + sideHeight / 2;

        // Drawers
        const drawerElements = [];

        // Frente del Cajón
        drawerElements.push(
          <Board 
            key={`drawer-front-${mod.id}-${d}`} 
            position={[innerCenterX, yPosFront, frontZPos]} 
            args={[frontWidth, frontHeight, thickness]}
             isFrontPanel={true}
             {...modDrawerFrontProps} grainDirection={mod.overrides?.grainElements?.['drawer-'+d] || modGrainDirection} hplBalancerOverride={modHplBalancer} 
          />
        );

        if (showDimensions && dimensionLevel >= 4) {
          parts.push(
            <group key={`dim-drawer-${mod.id}-${d}`} position={[innerCenterX + frontWidth / 2 + 5, yPosFront, frontZPos + 2]} renderOrder={999}>
              <Line points={[[0, -frontHeight / 2, 0], [0, frontHeight / 2, 0]]} color="#10b981" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Line points={[[-2, -frontHeight / 2, 0], [2, -frontHeight / 2, 0]]} color="#10b981" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Line points={[[-2, frontHeight / 2, 0], [2, frontHeight / 2, 0]]} color="#10b981" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Text position={[3, 0, 0]} fontSize={4.5} color="#10b981" anchorX="left" anchorY="middle" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{frontHeight.toFixed(1)}</Text>
            </group>
          );
        }

        // --- Representación 3D del Cajón Interior (Caja) ---
        drawerElements.push(
          <Board key={`drawer-L-${mod.id}-${d}`} position={[innerCenterX - boxOuterWidth/2 + thickness/2, yBoxCenter, boxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...modDrawerInnerProps} />
        );
        drawerElements.push(
          <Board key={`drawer-R-${mod.id}-${d}`} position={[innerCenterX + boxOuterWidth/2 - thickness/2, yBoxCenter, boxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...modDrawerInnerProps} />
        );
        drawerElements.push(
          <Board key={`drawer-B-${mod.id}-${d}`} position={[innerCenterX, yBoxCenter, boxZCenter - drawerBoxLength/2 + thickness/2]} args={[boxOuterWidth - thickness*2, sideHeight, thickness]} {...modDrawerInnerProps} />
        );
        drawerElements.push(
          <Board key={`drawer-F-${mod.id}-${d}`} position={[innerCenterX, yBoxCenter, boxZCenter + drawerBoxLength/2 - thickness/2]} args={[boxOuterWidth - thickness*2, sideHeight, thickness]} {...modDrawerInnerProps} />
        );
        const closetBotSpecs = getDrawerBottomSpecs(mod.width, state.drawerInnerColor || state.structureColor, state.drawerInnerMaterial, thickness);
        const closetBotY = closetBotSpecs.isDurolac ? yBoxBase + 0.15 : yBoxBase + thickness / 2;
        const closetBotProps = closetBotSpecs.isDurolac ? { color: '#ffffff' } : modDrawerInnerProps;
        const closetBotThickness = closetBotSpecs.thicknessCm;

        drawerElements.push(
          <Board key={`drawer-Bot-${mod.id}-${d}`} position={[innerCenterX, closetBotY, boxZCenter]} args={[boxOuterWidth - thickness*2, closetBotThickness, drawerBoxLength - thickness*2]} {...closetBotProps} />
        );
        
        // Add drawer assembly joints (Front/Back walls to Side walls)
        const frontFaceZ = boxZCenter + drawerBoxLength/2 - thickness;
        const backFaceZ = boxZCenter - drawerBoxLength/2 + thickness;
        const leftFaceX = innerCenterX - boxOuterWidth/2 + thickness;
        const rightFaceX = innerCenterX + boxOuterWidth/2 - thickness;
        
        // Front board attached to Left side
        drawerElements.push(<AssemblyJoint key={`aj-drawer-FL-${mod.id}-${d}`} position={[leftFaceX, yBoxCenter, frontFaceZ + thickness/2]} length={sideHeight} edgeOffset={1.5} axis="y" overrideAssemblyType={drawerAssemblyType} pointing="right" thickness={thickness} count={2} />);
        // Front board attached to Right side
        drawerElements.push(<AssemblyJoint key={`aj-drawer-FR-${mod.id}-${d}`} position={[rightFaceX, yBoxCenter, frontFaceZ + thickness/2]} length={sideHeight} edgeOffset={1.5} axis="y" overrideAssemblyType={drawerAssemblyType} pointing="left" thickness={thickness} count={2} />);
        
        // Back board attached to Left side
        drawerElements.push(<AssemblyJoint key={`aj-drawer-BL-${mod.id}-${d}`} position={[leftFaceX, yBoxCenter, backFaceZ - thickness/2]} length={sideHeight} edgeOffset={1.5} axis="y" overrideAssemblyType={drawerAssemblyType} pointing="right" thickness={thickness} count={2} />);
        // Back board attached to Right side
        drawerElements.push(<AssemblyJoint key={`aj-drawer-BR-${mod.id}-${d}`} position={[rightFaceX, yBoxCenter, backFaceZ - thickness/2]} length={sideHeight} edgeOffset={1.5} axis="y" overrideAssemblyType={drawerAssemblyType} pointing="left" thickness={thickness} count={2} />);

        // --- Rieles / Correderas Telescópicas ---
        // Riel Móvil (Adosado al lateral del cajón a media altura, dentro de drawerElements)
        drawerElements.push(
          <group key={`slide-mov-L-${mod.id}-${d}`} position={[innerCenterX - boxOuterWidth/2 - 0.35, yBoxCenter, boxZCenter]}>
            <mesh castShadow>
              <boxGeometry args={[0.35, 3.5, drawerBoxLength]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.15} roughness={0.35} />
            </mesh>
            <mesh position={[-0.12, 0, drawerBoxLength/2 - 3.5]}>
              <boxGeometry args={[0.15, 1.4, 2.8]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} />
            </mesh>
          </group>
        );
        drawerElements.push(
          <group key={`slide-mov-R-${mod.id}-${d}`} position={[innerCenterX + boxOuterWidth/2 + 0.35, yBoxCenter, boxZCenter]}>
            <mesh castShadow>
              <boxGeometry args={[0.35, 3.5, drawerBoxLength]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.15} roughness={0.35} />
            </mesh>
            <mesh position={[0.12, 0, drawerBoxLength/2 - 3.5]}>
              <boxGeometry args={[0.15, 1.4, 2.8]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} />
            </mesh>
          </group>
        );

        parts.push(
          <AnimatedDrawer 
            key={`anim-drawer-${mod.id}-${d}`} 
            openZOffset={drawerBoxLength - 3} 
            forceOpen={mod.overrides?.openElements?.[`drawer-${d}`] ?? mod.overrides?.isOpen} 
            onClickAction={() => {
              state.setActiveModule(mod.id);
            }}
          >
            {drawerElements}
          </AnimatedDrawer>
        );

        // Riel Fijo (Adosado al mueble / lateral interno, a media altura)
        const slideFixXLeft = isInnerDrawer ? (innerCenterX - innerW/2 + spacerGap + thickness + 0.35) : (leftWallX + thickness + 0.35);
        const slideFixXRight = isInnerDrawer ? (innerCenterX + innerW/2 - spacerGap - thickness - 0.35) : (rightWallX - thickness - 0.35);

        parts.push(
          <group key={`slide-fix-L-${mod.id}-${d}`} position={[slideFixXLeft, yBoxCenter, boxZCenter]}>
            <mesh castShadow>
              <boxGeometry args={[0.4, 4.5, nominalLength]} />
              <meshStandardMaterial color="#d8dde6" metalness={0.15} roughness={0.35} />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.12, 1.8, nominalLength - 2]} />
              <meshStandardMaterial color="#c5cbd3" metalness={0.2} roughness={0.4} />
            </mesh>
          </group>
        );
        parts.push(
          <group key={`slide-fix-R-${mod.id}-${d}`} position={[slideFixXRight, yBoxCenter, boxZCenter]}>
            <mesh castShadow>
              <boxGeometry args={[0.4, 4.5, nominalLength]} />
              <meshStandardMaterial color="#d8dde6" metalness={0.15} roughness={0.35} />
            </mesh>
            <mesh position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.12, 1.8, nominalLength - 2]} />
              <meshStandardMaterial color="#c5cbd3" metalness={0.2} roughness={0.4} />
            </mesh>
          </group>
        );
      }
    }

    // Doors
    if (mod.doors) {
      const isInnerDrawer = mod.innerDrawers !== false;
      const totalDrawersHeight = (mod.drawers > 0 && !isInnerDrawer) ? mod.drawers * 27 : 0;
      // Las puertas deben cubrir la base del mueble si parten desde abajo (para alinear con cajones exteriores)
      const doorSpaceHeight = height - totalDrawersHeight;
      const doorHeight = doorSpaceHeight - 0.3; // 3mm gap vertical
      // Si cubre cajones interiores o no hay cajones, parte desde la misma base del módulo (tapando el piso interior)
      const doorY = baseOffset + totalDrawersHeight + doorSpaceHeight / 2;
      
      const doorCount = Math.max(1, Math.ceil(mod.width / 60));
      const totalGap = (doorCount - 1) * 0.3 + 0.3;
      const doorW = (mod.width - totalGap) / doorCount;
      
      for(let i = 0; i < doorCount; i++) {
        // Posición X paramétrica para puertas sobrepuestas (máx 60cm por hoja)
        const dX = modCenterX - mod.width / 2 + 0.15 + (i + 0.5) * doorW + i * 0.3;
        const isRightHinge = doorCount === 1 ? false : (i % 2 === 1);

        parts.push(
          <AnimatedDoor 
            key={`anim-door-${mod.id}-${i}`}
            position={[dX, doorY, depth / 2 + thickness / 2]}
            doorW={doorW}
            doorHeight={doorHeight}
            thickness={thickness}
            {...modDoorProps}
            isRightHinge={isRightHinge}
            grainDirection={mod.overrides?.grainElements?.['door-'+i] || modGrainDirection} hplBalancerOverride={modHplBalancer}
            forceOpen={mod.overrides?.openElements?.[`door-${i}`] ?? mod.overrides?.isOpen}
            onClickAction={() => {
              state.setActiveModule(mod.id);
            }}
          />
        );

        if (showDimensions && dimensionLevel >= 3) {
          // Dimensión horizontal (ancho de puerta)
          parts.push(
            <group key={`dim-door-w-${mod.id}-${i}`} position={[dX, doorY + doorHeight / 2 + 5, depth / 2 + thickness + 2]} renderOrder={999}>
              <Line points={[[-doorW / 2, 0, 0], [doorW / 2, 0, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Line points={[[-doorW / 2, -2, 0], [-doorW / 2, 2, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Line points={[[doorW / 2, -2, 0], [doorW / 2, 2, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
              <Text position={[0, 3, 0]} fontSize={4.5} color="#ec4899" anchorX="center" anchorY="bottom" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{doorW.toFixed(1)}</Text>
            </group>
          );
          
          // Dimensión vertical (alto de puerta) solo una vez para no saturar si hay dos puertas
          if (i === 0) {
            parts.push(
              <group key={`dim-door-h-${mod.id}`} position={[dX - doorW / 2 - 5, doorY, depth / 2 + thickness + 2]} renderOrder={999}>
                <Line points={[[0, -doorHeight / 2, 0], [0, doorHeight / 2, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
                <Line points={[[-2, -doorHeight / 2, 0], [2, -doorHeight / 2, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
                <Line points={[[-2, doorHeight / 2, 0], [2, doorHeight / 2, 0]]} color="#ec4899" lineWidth={1.5} depthTest={false} renderOrder={999} />
                <Text position={[-3, 0, 0]} rotation={[0, 0, Math.PI/2]} fontSize={4.5} color="#ec4899" anchorX="center" anchorY="bottom" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{doorHeight.toFixed(1)}</Text>
              </group>
            );
          }
        }
      }
    }


    

    
    if (showDimensions) {
      // Big text indicating the cabinet number
      parts.push(
        <Text 
          key={`gabinete-label-${mod.id}`} 
          position={[modCenterX, 0.1, depth/2 + 30]} 
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={8} 
          color="#f97316" 
          anchorX="center" 
          anchorY="bottom"
          outlineWidth={0.5}
          outlineColor="#000000"
          material-depthTest={false}
          material-toneMapped={false}
          renderOrder={1000}
        >
          {'Gabinete ' + (index + 1)}
        </Text>
      );
    }

    currentX += mod.width;

    return (
      <group 
        key={`mod-${mod.id}`}
        onClick={(e) => { e.stopPropagation(); state.setActiveModule(mod.id); }}
      >
        <mesh position={[modCenterX, height / 2 + baseOffset, 0]}>
          <boxGeometry args={[mod.width, height + baseOffset, depth]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {state.activeModuleId === mod.id && (
          <mesh position={[modCenterX, height / 2 + baseOffset, 0]}>
            <boxGeometry args={[mod.width + 1, height + 1, depth + 1]} />
            <Edges scale={1.0} threshold={15} color="#f97316" />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
        {parts}
      </group>
    );
  });

  return (
    <group>
      {/* Legs (Base global compartida) */}
      {showLegs && !showSocle && (
        <>
          <Board position={[-totalWidth / 2 + 5, 5, -depth / 2 + 5]} args={[4, 10, 4]} color="#cccccc" />
          <Board position={[totalWidth / 2 - 5, 5, -depth / 2 + 5]} args={[4, 10, 4]} color="#cccccc" />
          <Board position={[-totalWidth / 2 + 5, 5, depth / 2 - 5]} args={[4, 10, 4]} color="#cccccc" />
          <Board position={[totalWidth / 2 - 5, 5, depth / 2 - 5]} args={[4, 10, 4]} color="#cccccc" />
        </>
      )}

      {/* Modules (Cada módulo es un cajón independiente) */}
      {moduleElements}

      {/* Dimensions (Cotas) */}
      {showDimensions && (
        <group renderOrder={999}>
          {/* Width Dimension */}
          <group position={[0, baseOffset + height + 15, depth / 2]}>
            <Line points={[[-totalWidth / 2, 0, 0], [totalWidth / 2, 0, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[-totalWidth / 2, -3, 0], [-totalWidth / 2, 3, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[totalWidth / 2, -3, 0], [totalWidth / 2, 3, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Billboard follow={true}>
              <mesh position={[0, 5, -0.05]} renderOrder={999}>
                <planeGeometry args={[Math.max(22, `${Number(totalWidth.toFixed(1))} cm`.length * 4.2), 11]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} depthTest={false} />
              </mesh>
              <Text position={[0, 5, 0]} fontSize={8} color="#f97316" anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.5} outlineColor="#000000" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{Number(totalWidth.toFixed(1))} cm</Text>
            </Billboard>
          </group>
          {/* Height Dimension */}
          <group position={[-totalWidth / 2 - 15, baseOffset + height / 2, depth / 2]}>
            <Line points={[[0, -height / 2, 0], [0, height / 2, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[-3, -height / 2, 0], [3, -height / 2, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[-3, height / 2, 0], [3, height / 2, 0]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Billboard follow={true}>
              <mesh position={[-5, 0, -0.05]} renderOrder={999}>
                <planeGeometry args={[Math.max(22, `${Number(height.toFixed(1))} cm`.length * 4.2), 11]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} depthTest={false} />
              </mesh>
              <Text position={[-5, 0, 0]} fontSize={8} color="#f97316" anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.5} outlineColor="#000000" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{Number(height.toFixed(1))} cm</Text>
            </Billboard>
          </group>
          {/* Depth Dimension */}
          <group position={[totalWidth / 2 + 15, Math.max(baseOffset, 2), 0]}>
            <Line points={[[0, 0, -depth / 2], [0, 0, depth / 2]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[-3, 0, -depth / 2], [3, 0, -depth / 2]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Line points={[[-3, 0, depth / 2], [3, 0, depth / 2]]} color="#f97316" lineWidth={2} depthTest={false} renderOrder={999} />
            <Billboard follow={true}>
              <mesh position={[3, 4, -0.05]} renderOrder={999}>
                <planeGeometry args={[Math.max(22, `${Number(depth.toFixed(1))} cm`.length * 4.2), 11]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} depthTest={false} />
              </mesh>
              <Text position={[3, 4, 0]} fontSize={8} color="#f97316" anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.5} outlineColor="#000000" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>{Number(depth.toFixed(1))} cm</Text>
            </Billboard>
          </group>
        </group>
      )}
    </group>
  );
}
