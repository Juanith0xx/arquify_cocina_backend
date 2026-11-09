import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { useKitchenStore, CabinetType } from '../../store/kitchenStore';
import { useStore } from '../../store';
import { QSTONE_SINKS, FDV_COOKTOPS, SinkSpec } from '../../types/countertop';
import { detectContinuousCabinetRuns, ContinuousRunInfo } from '../../utils/countertopNesting';

// =========================================================================
// 3D MODEL: GRIFERÍA MONOMANDO DE ALTA GAMA (L-NECK MIXER FAUCET)
// =========================================================================
function DeckMixerFaucet3D({ position }: { position: [number, number, number] }) {
  const isTransparent = useStore((s) => s.isTransparent);
  const getMatProps = (color: string, metalness = 0.95, roughness = 0.18) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      {/* Base de fijación sobre cubierta */}
      <mesh position={[0, 0.4, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[2.5, 2.7, 0.8, 32]} />
        <meshStandardMaterial {...getMatProps('#cbd5e1', 0.96, 0.16)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[2.0, 2.4, 0.4, 32]} />
        <meshStandardMaterial {...getMatProps('#94a3b8', 0.95, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Columna vertical principal */}
      <mesh position={[0, 9.5, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[1.7, 1.7, 17, 32]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.95, 0.18)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Caño horizontal en L hacia el centro de la poza */}
      <mesh position={[0, 18, 9]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[1.2, 1.2, 18, 24]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.95, 0.18)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Codo de unión 90° */}
      <mesh position={[0, 18, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <sphereGeometry args={[1.6, 24, 24]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.95, 0.18)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Puntera / Aireador direccionador de agua */}
      <mesh position={[0, 15.5, 17.5]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[1.1, 1.3, 4, 24]} />
        <meshStandardMaterial {...getMatProps('#cbd5e1', 0.96, 0.15)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      <mesh position={[0, 13.4, 17.5]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <cylinderGeometry args={[1.0, 1.0, 0.3, 24]} />
        <meshStandardMaterial {...getMatProps('#64748b', 0.4, 0.7)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Manilla monomando lateral */}
      <group position={[2.2, 6.5, 0]} rotation={[0, 0, -0.25]}>
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[1.2, 1.2, 1.2, 24]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.95, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0.6, 3.5, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[0.5, 0.5, 7, 20]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.97, 0.15)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// 3D MODEL: CESTA Y VÁLVULA DE DESAGÜE Ø90mm CON RANURAS RADIALES
// =========================================================================
function DrainBasketStrainer3D({ position }: { position: [number, number, number] }) {
  const isTransparent = useStore((s) => s.isTransparent);
  const getMatProps = (color: string, metalness = 0.92, roughness = 0.2) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      {/* Aro exterior cromado en el fondo */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 5.8, 32]} />
        <meshStandardMaterial {...getMatProps('#f1f5f9', 0.98, 0.12)} side={THREE.DoubleSide} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Copa de drenaje profunda */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[4.2, 3.6, 1.6, 32]} />
        <meshStandardMaterial {...getMatProps('#64748b', 0.88, 0.25)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Canastillo colador con fondo perforado */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.8, 32]} />
        <meshStandardMaterial {...getMatProps('#94a3b8', 0.92, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Ranuras oscuras radiales simuladas del colador */}
      {[0, 45, 90, 135].map((angle, idx) => (
        <mesh key={idx} position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, (angle * Math.PI) / 180]}>
          <planeGeometry args={[0.4, 2.6]} />
          <meshBasicMaterial
            color={isTransparent ? '#cbd5e1' : '#1e293b'}
            transparent={isTransparent}
            opacity={isTransparent ? 0.3 : 1}
            depthWrite={!isTransparent}
          />
        </mesh>
      ))}

      {/* Perilla central cilíndrica para jalar el tapón */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 1.8, 20]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.98, 0.12)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.98, 0.12)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
    </group>
  );
}

// =========================================================================
// 3D MODEL: REBOSADERO VERTICAL (OVERFLOW SLOTS)
// =========================================================================
function OverflowSlots3D({ position }: { position: [number, number, number] }) {
  const isTransparent = useStore((s) => s.isTransparent);
  return (
    <group position={position}>
      {/* Placa posterior oscura */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[4.5, 2.2, 0.1]} />
        <meshStandardMaterial
          key={isTransparent ? 'transp' : 'solid'}
          color={isTransparent ? '#cbd5e1' : '#0f172a'}
          roughness={isTransparent ? 0.1 : 0.8}
          transparent={isTransparent}
          opacity={isTransparent ? 0.3 : 1}
          depthWrite={!isTransparent}
        />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      {/* 4 Ranuras verticales de acero inoxidable */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, idx) => (
        <mesh key={idx} position={[x, 0, 0.05]}>
          <boxGeometry args={[0.35, 1.6, 0.1]} />
          <meshStandardMaterial
            key={isTransparent ? 'transp' : 'solid'}
            color={isTransparent ? '#cbd5e1' : '#e2e8f0'}
            metalness={isTransparent ? 0.05 : 0.92}
            roughness={isTransparent ? 0.1 : 0.2}
            transparent={isTransparent}
            opacity={isTransparent ? 0.3 : 1}
            depthWrite={!isTransparent}
          />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      ))}
    </group>
  );
}

// =========================================================================
// 3D MODEL: LAVAPLATOS BAJO CUBIERTA REALISTA (ALFA ONEC 3018)
// =========================================================================
function AlfaOnec3018Realistic({
  position,
  stoneThicknessCm,
}: {
  position: [number, number, number];
  stoneThicknessCm: number;
}) {
  const isTransparent = useStore((s) => s.isTransparent);
  const spec = QSTONE_SINKS.alfa_onec_3018!;
  const w = spec.cutoutWidthMm / 10; // 69.5 cm
  const d = spec.cutoutDepthMm / 10; // 40.0 cm
  const h = 22; // 22 cm profundidad de bacin
  const wallThick = 0.35; // 3.5mm acero

  const getMatProps = (color: string, metalness = 0.94, roughness = 0.22) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      {/* Pestaña perimetral superior que se fija BAJO la piedra (undermount flange) */}
      <mesh position={[0, -stoneThicknessCm - 0.15, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[w + 6, 0.3, d + 6]} />
        <meshStandardMaterial {...getMatProps('#cbd5e1', 0.95, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* CUBA PRINCIPAL PROFUNDA */}
      <group position={[0, -stoneThicknessCm - h / 2, 0]}>
        {/* Fondo metálico de la poza con leve declive */}
        <mesh position={[0, -h / 2 + wallThick / 2, 0]} receiveShadow={!isTransparent} castShadow={!isTransparent}>
          <boxGeometry args={[w, wallThick, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>

        {/* Líneas en cruz prensadas en el fondo ("X" drainage channels) */}
        {[-0.5, 0.5].map((side, i) => (
          <mesh
            key={i}
            position={[0, -h / 2 + wallThick + 0.04, 0]}
            rotation={[-Math.PI / 2, 0, Math.atan2(d, w) * side]}
          >
            <planeGeometry args={[Math.hypot(w, d) * 0.88, 0.12]} />
            <meshBasicMaterial
              color={isTransparent ? '#cbd5e1' : '#94a3b8'}
              transparent={isTransparent}
              opacity={isTransparent ? 0.3 : 1}
              depthWrite={!isTransparent}
            />
          </mesh>
        ))}

        {/* Pared trasera */}
        <mesh position={[0, 0, -d / 2 + wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[w, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>

        {/* Pared frontal */}
        <mesh position={[0, 0, d / 2 - wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[w, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>

        {/* Pared lateral izquierda */}
        <mesh position={[-w / 2 + wallThick / 2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[wallThick, h, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>

        {/* Pared lateral derecha */}
        <mesh position={[w / 2 - wallThick / 2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[wallThick, h, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>

        {/* Válvula y canastillo de desagüe en el fondo */}
        <DrainBasketStrainer3D position={[0, -h / 2 + wallThick + 0.05, -3]} />

        {/* Rebosadero vertical en la pared posterior */}
        <OverflowSlots3D position={[0, h / 2 - 4.5, -d / 2 + wallThick + 0.05]} />
      </group>

      {/* Grifería Monomando montada en la cubierta detrás de la poza */}
      <DeckMixerFaucet3D position={[0, 0, -d / 2 - 5]} />
    </group>
  );
}

// =========================================================================
// 3D MODEL: LAVAPLATOS BAJO CUBIERTA REALISTA (ALFA TWOC F5858A - 2 CUBAS)
// =========================================================================
function AlfaTwocF5858aRealistic({
  position,
  stoneThicknessCm,
}: {
  position: [number, number, number];
  stoneThicknessCm: number;
}) {
  const isTransparent = useStore((s) => s.isTransparent);
  const spec = QSTONE_SINKS.alfa_twoc_f5858a!;
  const w = spec.cutoutWidthMm / 10; // 73 cm
  const d = spec.cutoutDepthMm / 10; // 40 cm
  const h = 21;
  const bowlW = (w - 2.5) / 2; // ~35.2 cm por cuba
  const wallThick = 0.35;

  const getMatProps = (color: string, metalness = 0.94, roughness = 0.22) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      {/* Pestaña perimetral superior */}
      <mesh position={[0, -stoneThicknessCm - 0.15, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[w + 6, 0.3, d + 6]} />
        <meshStandardMaterial {...getMatProps('#cbd5e1', 0.95, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* Puente divisor central entre las dos cubas */}
      <mesh position={[0, -stoneThicknessCm - 1.5, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[2.5, 3, d]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.95, 0.18)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>

      {/* CUBA IZQUIERDA */}
      <group position={[-w / 2 + bowlW / 2, -stoneThicknessCm - h / 2, 0]}>
        <mesh position={[0, -h / 2 + wallThick / 2, 0]} receiveShadow={!isTransparent} castShadow={!isTransparent}>
          <boxGeometry args={[bowlW, wallThick, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0, -d / 2 + wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[bowlW, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0, d / 2 - wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[bowlW, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[-bowlW / 2 + wallThick / 2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[wallThick, h, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <DrainBasketStrainer3D position={[0, -h / 2 + wallThick + 0.05, -2]} />
      </group>

      {/* CUBA DERECHA */}
      <group position={[w / 2 - bowlW / 2, -stoneThicknessCm - h / 2, 0]}>
        <mesh position={[0, -h / 2 + wallThick / 2, 0]} receiveShadow={!isTransparent} castShadow={!isTransparent}>
          <boxGeometry args={[bowlW, wallThick, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0, -d / 2 + wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[bowlW, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0, d / 2 - wallThick / 2]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[bowlW, h, wallThick]} />
          <meshStandardMaterial {...getMatProps('#e2e8f0', 0.94, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[bowlW / 2 - wallThick / 2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <boxGeometry args={[wallThick, h, d]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.94, 0.22)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <DrainBasketStrainer3D position={[0, -h / 2 + wallThick + 0.05, -2]} />
        <OverflowSlots3D position={[0, h / 2 - 4.5, -d / 2 + wallThick + 0.05]} />
      </group>

      {/* Grifería Monomando montada centralmente en la cubierta detrás de las dos pozas */}
      <DeckMixerFaucet3D position={[0, 0, -d / 2 - 5]} />
    </group>
  );
}

// =========================================================================
// 3D MODEL: ENCIMERAS A GAS FDV (SOBRECUBIERTA)
// =========================================================================
function FdvDesign60Model({ position }: { position: [number, number, number] }) {
  const isTransparent = useStore((s) => s.isTransparent);
  const getMatProps = (color: string, metalness = 0.88, roughness = 0.2) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[58, 1.2, 50]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.88, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[57.2, 0.1, 49.2]} />
        <meshStandardMaterial {...getMatProps('#94a3b8', 0.95, 0.15)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      {/* 4 Quemadores con parrillas */}
      <group position={[-15, 1.6, 12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[5.5, 6, 0.6, 32]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[2, 2, 0.8, 24]} />
          <meshStandardMaterial {...getMatProps('#eab308', 0.8, 0.3)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[-15, 1.6, -12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[4, 4.5, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[15, 1.6, -12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[4.8, 5.2, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[15, 1.6, 12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[3.2, 3.8, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      {/* 4 Perillas de control */}
      {[-12, -4, 4, 12].map((x, idx) => (
        <mesh key={idx} position={[x, 1.5, 20]} rotation={[0.2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[1.2, 1.2, 0.8, 16]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.9, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      ))}
    </group>
  );
}

function FdvDesign90Model({ position }: { position: [number, number, number] }) {
  const isTransparent = useStore((s) => s.isTransparent);
  const getMatProps = (color: string, metalness = 0.88, roughness = 0.2) => ({
    color: isTransparent ? '#cbd5e1' : color,
    metalness: isTransparent ? 0.05 : metalness,
    roughness: isTransparent ? 0.1 : roughness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
        <boxGeometry args={[86, 1.4, 50]} />
        <meshStandardMaterial {...getMatProps('#e2e8f0', 0.88, 0.2)} />
        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
      </mesh>
      {/* Quemador Wok central triple corona */}
      <group position={[0, 1.8, 0]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[6.5, 7.5, 0.8, 32]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[2.5, 2.5, 1.0, 24]} />
          <meshStandardMaterial {...getMatProps('#eab308', 0.8, 0.3)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      {/* 4 quemadores laterales */}
      <group position={[-28, 1.6, 12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[4.2, 4.8, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[-28, 1.6, -12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[4.8, 5.2, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[28, 1.6, 12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[3.2, 3.8, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      <group position={[28, 1.6, -12]}>
        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[4.2, 4.8, 0.6, 24]} />
          <meshStandardMaterial {...getMatProps('#1e293b', 0.2, 0.8)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      </group>
      {/* 5 Perillas frontales */}
      {[-16, -8, 0, 8, 16].map((x, idx) => (
        <mesh key={idx} position={[x, 1.6, 20]} rotation={[0.2, 0, 0]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
          <cylinderGeometry args={[1.2, 1.2, 0.8, 16]} />
          <meshStandardMaterial {...getMatProps('#cbd5e1', 0.9, 0.2)} />
          {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
        </mesh>
      ))}
    </group>
  );
}

// =========================================================================
// COMPONENTE PRINCIPAL: KITCHEN COUNTERTOP 3D (CONTINUOUS SLABS & UNDERMOUNT SINK)
// =========================================================================
export function KitchenCountertop3D() {
  const isTransparent = useStore((state) => state.isTransparent);
  const { countertopConfig, qstoneCatalog, cabinets, walls, architecturalElements, roomConfig } = useKitchenStore();

  const selectedProduct = useMemo(() => {
    return (
      qstoneCatalog.find((p) => p.id === countertopConfig.selectedProductId) ||
      qstoneCatalog[0]
    );
  }, [countertopConfig.selectedProductId, qstoneCatalog]);

  const stoneThicknessCm = selectedProduct.thicknessMm / 10; // 1.2, 1.8, 2.0 cm
  const regruesoCm = countertopConfig.regruesoCm; // 0 a 5 cm

  const stoneColor = selectedProduct.colorHex || '#F8FAFC';
  const roughness = selectedProduct.finish === 'Pulido Brillante' ? 0.08 : 0.25;
  const metalness = 0.04;

  const stoneTexture = useMemo(() => {
    if (!selectedProduct.textureUrl || selectedProduct.textureUrl.startsWith('#')) return null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(selectedProduct.textureUrl);
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.wrapT = THREE.MirroredRepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }, [selectedProduct.textureUrl]);

  const getCountertopMatProps = () => ({
    color: isTransparent ? '#cbd5e1' : (stoneTexture ? '#ffffff' : stoneColor),
    map: isTransparent ? null : stoneTexture,
    roughness: isTransparent ? 0.1 : roughness,
    metalness: isTransparent ? 0.05 : metalness,
    transparent: isTransparent,
    opacity: isTransparent ? 0.3 : 1,
    depthWrite: !isTransparent,
  });

  // Agrupamiento geométrico en corridas continuas
  const continuousRuns = useMemo(() => {
    return detectContinuousCabinetRuns(cabinets, countertopConfig, walls, architecturalElements, roomConfig);
  }, [cabinets, countertopConfig, walls, architecturalElements, roomConfig]);

  if (!countertopConfig.enabled || continuousRuns.length === 0) {
    return null;
  }

  return (
    <group name="kitchen-qstone-countertops">
      {continuousRuns.map((run, runIndex) => {
        const isIsland = run.type === 'island';
        const override = countertopConfig.runOverrides?.[run.id];
        const rot = run.rotation;
        const totalRunLengthCm = run.totalLengthMm / 10;
        const depthCm = run.depthMm / 10;
        const cabTopY = run.heightMm / 10;
        const slabCenterY = cabTopY + stoneThicknessCm / 2;

        const isHpl8mm = selectedProduct.thicknessMm === 8 || selectedProduct.materialType === 'hpl_abet';
        const rawRegruesoCm = override?.regruesoCm !== undefined
          ? override.regruesoCm
          : (isIsland
              ? (countertopConfig.islandRegruesoCm ?? countertopConfig.regruesoCm)
              : (countertopConfig.baseRegruesoCm ?? countertopConfig.regruesoCm));
        const regruesoCm = isHpl8mm ? 0 : rawRegruesoCm;

        const backsplashMode = override?.backsplashMode !== undefined
          ? override.backsplashMode
          : countertopConfig.backsplashMode;

        const backsplashHeightCm = override?.backsplashHeightCm !== undefined
          ? override.backsplashHeightCm
          : countertopConfig.backsplashHeightCm;

        const isWaterLeft = override?.waterfallLeft !== undefined
          ? override.waterfallLeft
          : (isIsland
              ? (countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft)
              : (countertopConfig.baseWaterfallLeft ?? countertopConfig.waterfallLeft));

        const isWaterRight = override?.waterfallRight !== undefined
          ? override.waterfallRight
          : (isIsland
              ? (countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight)
              : (countertopConfig.baseWaterfallRight ?? countertopConfig.waterfallRight));

        const frontOverhang = (run.overhangFrontMm ?? (countertopConfig.overhangFrontCm ? countertopConfig.overhangFrontCm * 10 : 20)) / 10;
        const rearOverhang = (run.overhangRearMm ?? (isIsland ? (countertopConfig.overhangBackCm ?? countertopConfig.islandOverhangCm ?? 30) * 10 : 0)) / 10;
        const localZShift = (frontOverhang - rearOverhang) / 2;

        // Verificar si la corrida contiene el lavaplatos o la encimera
        const sinkCabinet = run.cabinets.find(
          (c) => c.id === countertopConfig.sinkCabinetId
        );
        const cooktopCabinet = run.cabinets.find(
          (c) => c.id === countertopConfig.cooktopCabinetId
        );

        // Calcular posición relativa del lavaplatos dentro de la corrida
        const leftCoverOffsetCm = (run.leftCoverThickMm || 0) / 10;
        let sinkRelX: number | null = null;
        let sinkSpec: SinkSpec | null = null;
        if (
          sinkCabinet &&
          countertopConfig.sinkModel &&
          countertopConfig.sinkModel !== 'none'
        ) {
          sinkSpec = QSTONE_SINKS[countertopConfig.sinkModel];
          // Calcular distancia desde el extremo izquierdo de la corrida hasta el centro del gabinete del lavaplatos
          let currentDist = leftCoverOffsetCm;
          for (const cab of run.cabinets) {
            if (cab.id === sinkCabinet.id) {
              const centerDistFromLeft = currentDist + cab.width / 2;
              sinkRelX = -totalRunLengthCm / 2 + centerDistFromLeft;
              break;
            }
            currentDist += cab.width;
          }
        }

        // Posición relativa de la encimera dentro de la corrida
        let cooktopRelX: number | null = null;
        if (
          cooktopCabinet &&
          countertopConfig.cooktopModel &&
          countertopConfig.cooktopModel !== 'none'
        ) {
          let currentDist = leftCoverOffsetCm;
          for (const cab of run.cabinets) {
            if (cab.id === cooktopCabinet.id) {
              const centerDistFromLeft = currentDist + cab.width / 2;
              cooktopRelX = -totalRunLengthCm / 2 + centerDistFromLeft;
              break;
            }
            currentDist += cab.width;
          }
        }

        // Renderizar los tramos de la corrida según segmentLengthsMm
        let currentSegStartCm = -totalRunLengthCm / 2;
        const totalExtLeftCm =
          ((run.cornerExtensionLeftMm || 0) + (run.extensionToWallLeftMm || 0) + (run.overhangLeftMm || 0)) / 10;
        const totalExtRightCm =
          ((run.cornerExtensionRightMm || 0) + (run.extensionToWallRightMm || 0) + (run.overhangRightMm || 0)) / 10;
        const trimLeftCm = (run.cornerTrimLeftMm || 0) / 10;
        const trimRightCm = (run.cornerTrimRightMm || 0) / 10;

        const bsExtLeftCm =
          ((run.backsplashExtLeftMm || 0) + (run.extensionToWallLeftMm || 0) + (run.overhangLeftMm || 0)) / 10;
        const bsExtRightCm =
          ((run.backsplashExtRightMm || 0) + (run.extensionToWallRightMm || 0) + (run.overhangRightMm || 0)) / 10;

        return (
          <group
            key={`run-${run.id}-${runIndex}`}
            position={[run.centerWorld[0], 0, run.centerWorld[2]]}
            rotation={[0, rot, 0]}
          >
            {run.segmentLengthsMm.map((segLenMm, segIdx) => {
              const segLenCm = segLenMm / 10;
              const extraCornerLeftCm = segIdx === 0 ? (totalExtLeftCm - trimLeftCm) : 0;
              const extraCornerRightCm =
                segIdx === run.segmentLengthsMm.length - 1 ? (totalExtRightCm - trimRightCm) : 0;
              const totalSegSlabLenCm = Math.max(0.1, segLenCm + extraCornerLeftCm + extraCornerRightCm);
              const segCornerShiftX = (extraCornerRightCm - extraCornerLeftCm) / 2;

              const segCenterRelX = currentSegStartCm + segLenCm / 2 + segCornerShiftX;
              const segLeft = currentSegStartCm - extraCornerLeftCm;
              const segRight = currentSegStartCm + segLenCm + extraCornerRightCm;
              currentSegStartCm += segLenCm;

              const isLastSeg = segIdx === run.segmentLengthsMm.length - 1;

              // Comprobar si el lavaplatos cae en este tramo
              const hasSinkInSeg =
                sinkRelX !== null &&
                sinkSpec !== null &&
                sinkRelX >= segLeft - 1 &&
                sinkRelX <= segRight + 1;

              const cutoutW = sinkSpec ? sinkSpec.cutoutWidthMm / 10 : 0;
              const cutoutD = sinkSpec ? sinkSpec.cutoutDepthMm / 10 : 0;

              return (
                <group key={`seg-${segIdx}`} position={[segCenterRelX, 0, 0]}>
                  {/* SI TIENE LAVAPLATOS: Generar la cubierta con HUECO REAL (Cutout) de 4 piezas sin colisiones ni z-fighting */}
                  {hasSinkInSeg && sinkSpec ? (
                    (() => {
                      const localSinkX = sinkRelX! - segCenterRelX;
                      const holeLeft = localSinkX - cutoutW / 2;
                      const holeRight = localSinkX + cutoutW / 2;
                      const holeBack = localZShift - cutoutD / 2;
                      const holeFront = localZShift + cutoutD / 2;

                      const leftPartW = Math.max(0, holeLeft - (-totalSegSlabLenCm / 2));
                      const rightPartW = Math.max(0, totalSegSlabLenCm / 2 - holeRight);
                      const rearPartD = Math.max(0, holeBack - (-depthCm / 2));
                      const frontPartD = Math.max(0, depthCm / 2 - holeFront);

                      return (
                        <group>
                          {/* Pieza izquierda de la cubierta */}
                          {leftPartW > 0.1 && (
                            <mesh
                              position={[
                                -totalSegSlabLenCm / 2 + leftPartW / 2,
                                slabCenterY,
                                localZShift,
                              ]}
                              castShadow={!isTransparent}
                              receiveShadow={!isTransparent}
                            >
                              <boxGeometry args={[leftPartW, stoneThicknessCm, depthCm]} />
                              <meshStandardMaterial {...getCountertopMatProps()} />
                              {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                            </mesh>
                          )}

                          {/* Pieza derecha de la cubierta */}
                          {rightPartW > 0.1 && (
                            <mesh
                              position={[
                                totalSegSlabLenCm / 2 - rightPartW / 2,
                                slabCenterY,
                                localZShift,
                              ]}
                              castShadow={!isTransparent}
                              receiveShadow={!isTransparent}
                            >
                              <boxGeometry args={[rightPartW, stoneThicknessCm, depthCm]} />
                              <meshStandardMaterial {...getCountertopMatProps()} />
                              {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                            </mesh>
                          )}

                          {/* Pieza trasera (puente donde se monta la grifería) */}
                          {rearPartD > 0.1 && (
                            <mesh
                              position={[
                                localSinkX,
                                slabCenterY,
                                -depthCm / 2 + rearPartD / 2,
                              ]}
                              castShadow={!isTransparent}
                              receiveShadow={!isTransparent}
                            >
                              <boxGeometry args={[cutoutW, stoneThicknessCm, rearPartD]} />
                              <meshStandardMaterial {...getCountertopMatProps()} />
                              {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                            </mesh>
                          )}

                          {/* Pieza delantera (borde frontal de la cubierta frente al lavaplatos) */}
                          {frontPartD > 0.1 && (
                            <mesh
                              position={[
                                localSinkX,
                                slabCenterY,
                                depthCm / 2 - frontPartD / 2,
                              ]}
                              castShadow={!isTransparent}
                              receiveShadow={!isTransparent}
                            >
                              <boxGeometry args={[cutoutW, stoneThicknessCm, frontPartD]} />
                              <meshStandardMaterial {...getCountertopMatProps()} />
                              {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                            </mesh>
                          )}

                          {/* MONTAJE BAJO CUBIERTA DEL LAVAPLATOS REALISTA */}
                          {countertopConfig.sinkModel === 'alfa_onec_3018' && (
                            <AlfaOnec3018Realistic
                              position={[localSinkX, cabTopY + stoneThicknessCm, localZShift]}
                              stoneThicknessCm={stoneThicknessCm}
                            />
                          )}
                          {countertopConfig.sinkModel === 'alfa_twoc_f5858a' && (
                            <AlfaTwocF5858aRealistic
                              position={[localSinkX, cabTopY + stoneThicknessCm, localZShift]}
                              stoneThicknessCm={stoneThicknessCm}
                            />
                          )}
                        </group>
                      );
                    })()
                  ) : (
                    /* SI NO TIENE LAVAPLATOS: Plancha corrida continua estándar cubriendo toda la superficie hasta el muro en esquinas */
                    <mesh position={[0, slabCenterY, localZShift]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
                      <boxGeometry
                        args={[totalSegSlabLenCm - (isLastSeg ? 0 : 0.05), stoneThicknessCm, depthCm]}
                      />
                      <meshStandardMaterial {...getCountertopMatProps()} />
                      {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                    </mesh>
                  )}

                  {/* Junta sutil a 90° si el tramo fue seccionado por criterio de transporte */}
                  {!isLastSeg && (
                    <mesh position={[totalSegSlabLenCm / 2, slabCenterY, localZShift]}>
                      <boxGeometry args={[0.06, stoneThicknessCm + 0.02, depthCm + 0.02]} />
                      <meshStandardMaterial
                        key={isTransparent ? 'transp' : 'solid'}
                        color={isTransparent ? '#cbd5e1' : '#94a3b8'}
                        roughness={isTransparent ? 0.1 : 0.8}
                        transparent={isTransparent}
                        opacity={isTransparent ? 0.3 : 1}
                        depthWrite={!isTransparent}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* ENCIMERA A GAS FDV (si cae en esta corrida) */}
            {cooktopRelX !== null && (
              <group position={[cooktopRelX, cabTopY + stoneThicknessCm, localZShift]}>
                {countertopConfig.cooktopModel === 'fdv_design_60' && (
                  <FdvDesign60Model position={[0, 0, 0]} />
                )}
                {countertopConfig.cooktopModel === 'fdv_design_90' && (
                  <FdvDesign90Model position={[0, 0, 0]} />
                )}
              </group>
            )}

            {/* Faldón Delantero / Regrueso Continuo (de 0 a 5 cm) */}
            {regruesoCm > 0 && (() => {
              const apronShiftX =
                (totalExtRightCm - trimRightCm - (totalExtLeftCm - trimLeftCm)) / 2;
              const apronLen = Math.max(
                0.1,
                totalRunLengthCm + (totalExtLeftCm - trimLeftCm) + (totalExtRightCm - trimRightCm)
              );
              const isWaterLeft = isIsland
                ? (countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft)
                : (countertopConfig.baseWaterfallLeft ?? countertopConfig.waterfallLeft);
              const isWaterRight = isIsland
                ? (countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight)
                : (countertopConfig.baseWaterfallRight ?? countertopConfig.waterfallRight);

              return (
                <group>
                  {/* Faldón frontal */}
                  <mesh
                    position={[
                      apronShiftX,
                      cabTopY + stoneThicknessCm - regruesoCm / 2,
                      run.cabinets[0].depth / 2 + frontOverhang - stoneThicknessCm / 2,
                    ]}
                    castShadow={!isTransparent}
                    receiveShadow={!isTransparent}
                  >
                    <boxGeometry args={[apronLen, regruesoCm, stoneThicknessCm]} />
                    <meshStandardMaterial {...getCountertopMatProps()} />
                    {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                  </mesh>

                  {/* Faldón lateral izquierdo si no hay cascada y el extremo está libre */}
                  {countertopConfig.regruesoOnOverhangSides !== false &&
                    !isWaterLeft &&
                    run.canWaterfallLeft &&
                    run.cornerExtensionLeftMm === 0 &&
                    (run.extensionToWallLeftMm || 0) === 0 && (
                      <mesh
                        position={[
                          -totalRunLengthCm / 2 - (totalExtLeftCm - trimLeftCm) + stoneThicknessCm / 2,
                          cabTopY + stoneThicknessCm - regruesoCm / 2,
                          localZShift,
                        ]}
                        castShadow={!isTransparent}
                        receiveShadow={!isTransparent}
                      >
                        <boxGeometry args={[stoneThicknessCm, regruesoCm, depthCm]} />
                        <meshStandardMaterial {...getCountertopMatProps()} />
                        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                      </mesh>
                    )}

                  {/* Faldón lateral derecho si no hay cascada y el extremo está libre */}
                  {countertopConfig.regruesoOnOverhangSides !== false &&
                    !isWaterRight &&
                    run.canWaterfallRight &&
                    run.cornerExtensionRightMm === 0 &&
                    (run.extensionToWallRightMm || 0) === 0 && (
                      <mesh
                        position={[
                          totalRunLengthCm / 2 + (totalExtRightCm - trimRightCm) - stoneThicknessCm / 2,
                          cabTopY + stoneThicknessCm - regruesoCm / 2,
                          localZShift,
                        ]}
                        castShadow={!isTransparent}
                        receiveShadow={!isTransparent}
                      >
                        <boxGeometry args={[stoneThicknessCm, regruesoCm, depthCm]} />
                        <meshStandardMaterial {...getCountertopMatProps()} />
                        {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                      </mesh>
                    )}

                  {/* Faldón posterior en isla (barra volada engrosada perimetralmente) */}
                  {isIsland && rearOverhang > 0 && countertopConfig.regruesoOnOverhangSides !== false && (
                    <mesh
                      position={[
                        apronShiftX,
                        cabTopY + stoneThicknessCm - regruesoCm / 2,
                        -run.cabinets[0].depth / 2 - rearOverhang + stoneThicknessCm / 2,
                      ]}
                      castShadow={!isTransparent}
                      receiveShadow={!isTransparent}
                    >
                      <boxGeometry args={[apronLen, regruesoCm, stoneThicknessCm]} />
                      <meshStandardMaterial {...getCountertopMatProps()} />
                      {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                    </mesh>
                  )}
                </group>
              );
            })()}

            {/* Respaldo / Zócalo Posterior Continuo (solo en muebles base contra muro, abarca 100% largo de la cubierta y patas) */}
            {!isIsland && backsplashMode !== 'none' && (() => {
              const waterLeftExtCm = isWaterLeft && run.canWaterfallLeft ? stoneThicknessCm : 0;
              const waterRightExtCm = isWaterRight && run.canWaterfallRight ? stoneThicknessCm : 0;

              const effectiveExtLeftCm = bsExtLeftCm + waterLeftExtCm;
              const effectiveExtRightCm = bsExtRightCm + waterRightExtCm;

              const bsLenCm = Math.max(0.1, totalRunLengthCm + effectiveExtLeftCm + effectiveExtRightCm);
              const bsCenterShiftX = (effectiveExtRightCm - effectiveExtLeftCm) / 2;

              return (
                <mesh
                  position={[
                    bsCenterShiftX,
                    cabTopY +
                      stoneThicknessCm +
                      (backsplashMode === 'standard_5cm' ? backsplashHeightCm / 2 : 27.5),
                    -run.cabinets[0].depth / 2 + stoneThicknessCm / 2,
                  ]}
                  castShadow={!isTransparent}
                  receiveShadow={!isTransparent}
                >
                  <boxGeometry
                    args={[
                      bsLenCm,
                      backsplashMode === 'standard_5cm' ? backsplashHeightCm : 55,
                      stoneThicknessCm,
                    ]}
                  />
                  <meshStandardMaterial {...getCountertopMatProps()} />
                  {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                </mesh>
              );
            })()}

            {/* Remate Lateral Cascada (Waterfall) Izquierda - Solo si el extremo está libre (sin despensa ni esquina) */}
            {(() => {
              if (!isWaterLeft || !run.canWaterfallLeft) return null;
              return (
                <mesh
                  position={[
                    -totalRunLengthCm / 2 - stoneThicknessCm / 2,
                    (cabTopY + stoneThicknessCm) / 2,
                    localZShift,
                  ]}
                  castShadow={!isTransparent}
                  receiveShadow={!isTransparent}
                >
                  <boxGeometry
                    args={[stoneThicknessCm, cabTopY + stoneThicknessCm, depthCm]}
                  />
                  <meshStandardMaterial {...getCountertopMatProps()} />
                  {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                </mesh>
              );
            })()}

            {/* Remate Lateral Cascada (Waterfall) Derecha - Solo si el extremo está libre (sin despensa ni esquina) */}
            {(() => {
              if (!isWaterRight || !run.canWaterfallRight) return null;
              return (
                <mesh
                  position={[
                    totalRunLengthCm / 2 + stoneThicknessCm / 2,
                    (cabTopY + stoneThicknessCm) / 2,
                    localZShift,
                  ]}
                  castShadow={!isTransparent}
                  receiveShadow={!isTransparent}
                >
                  <boxGeometry
                    args={[stoneThicknessCm, cabTopY + stoneThicknessCm, depthCm]}
                  />
                  <meshStandardMaterial {...getCountertopMatProps()} />
                  {isTransparent && <Edges scale={1} threshold={15} color="#555555" />}
                </mesh>
              );
            })()}
          </group>
        );
      })}
    </group>
  );
}
