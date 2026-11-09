import React, { useMemo } from 'react';
import * as THREE from 'three';
import { KitchenHandleConfig, FINISH_HEX, HandleModelId } from '../../types/handle';

interface KitchenHandle3DProps {
  config: KitchenHandleConfig;
  orientation?: 'horizontal' | 'vertical';
  isDoor?: boolean;
  isUpper?: boolean;
  thickness?: number; // Espesor de puerta en cm (e.g. 1.8)
}

export function KitchenHandle3D({ 
  config, 
  orientation = 'horizontal', 
  isDoor = false,
  isUpper = false,
  thickness = 1.8
}: KitchenHandle3DProps) {
  const { model, finish, lengthMm } = config;

  const matProps = useMemo(() => {
    switch (finish) {
      case 'negro':
        return { color: '#1c1917', metalness: 0.6, roughness: 0.4 };
      case 'satinado':
        return { color: '#cbd5e1', metalness: 0.85, roughness: 0.25 };
      case 'dorado':
        return { color: '#eab308', metalness: 0.85, roughness: 0.3 };
      case 'envejecido':
        return { color: '#78350f', metalness: 0.7, roughness: 0.45 };
      case 'gris_perla':
        return { color: '#94a3b8', metalness: 0.75, roughness: 0.35 };
      default:
        return { color: '#1c1917', metalness: 0.6, roughness: 0.4 };
    }
  }, [finish]);

  if (model === 'none') return null;

  // Convert mm to scene units (cm)
  const lenCm = lengthMm / 10;
  const isVert = orientation === 'vertical';
  const rotationZ = isVert ? Math.PI / 2 : 0;

  return (
    <group rotation={[0, 0, rotationZ]}>
      {/* 1. MODELO FORZA: Asa angular geométrica con patas a 90° */}
      {model === 'forza' && (
        <group>
          {/* Barra frontal horizontal */}
          <mesh position={[0, 0, 2.4]}>
            <boxGeometry args={[lenCm + 1.6, 1.2, 0.8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Pata izquierda */}
          <mesh position={[-lenCm / 2, 0, 1.2]}>
            <boxGeometry args={[1.6, 1.2, 1.6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Pata derecha */}
          <mesh position={[lenCm / 2, 0, 1.2]}>
            <boxGeometry args={[1.6, 1.2, 1.6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )}

      {/* 2. MODELO CE: Perfil pestaña plana sobre canto */}
      {model === 'ce' && (() => {
        const boardTh = thickness || 1.8;
        const dir = isUpper ? 1 : -1;
        return (
          <group>
            {/* Placa posterior de fijación al tablero */}
            <mesh position={[0, dir * 0.8, -boardTh + 0.1]}>
              <boxGeometry args={[lenCm, 1.4, 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Tramo sobre el canto */}
            <mesh position={[0, -dir * 0.1, -boardTh / 2]}>
              <boxGeometry args={[lenCm, 0.2, boardTh + 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Pestaña saliente frontal */}
            <mesh position={[0, -dir * 0.5, 0.7]}>
              <boxGeometry args={[lenCm, 0.2, 1.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Labio de agarre vertical frontal */}
            <mesh position={[0, -dir * 0.8, 1.3]}>
              <boxGeometry args={[lenCm, 0.6, 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      })()}

      {/* 3. MODELO MADRID: Barra tubular cilíndrica Ø12mm con voladizos */}
      {model === 'madrid' && (
        <group>
          {/* Barra tubular continua (con 2cm de voladizo en cada extremo) */}
          <mesh position={[0, 0, 2.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.6, 0.6, lenCm + 4.0, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Poste cilíndrico izquierdo */}
          <mesh position={[-lenCm / 2, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 2.6, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Poste cilíndrico derecho */}
          <mesh position={[lenCm / 2, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 2.6, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )}

      {/* 4. MODELO BALÍN: Pomo cilíndrico ergonómico con muesca para dedos */}
      {model === 'balin' && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          {/* Base cilíndrica */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 1.2, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Muesca ergonómica cóncava */}
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.6, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Cabeza cilíndrica frontal */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[1.1, 1.1, 0.8, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )}

      {/* 5. MODELO DENVER: Tirador tipo asa prismática recta en Zinc Alloy */}
      {model === 'denver' && (
        <group>
          {/* Barra frontal horizontal prismática */}
          <mesh position={[0, 0, 2.4]}>
            <boxGeometry args={[lenCm + 1.2, 0.9, 0.7]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Pata maciza prismática izquierda a 90 grados */}
          <mesh position={[-lenCm / 2, 0, 1.2]}>
            <boxGeometry args={[0.9, 0.9, 1.7]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Pata maciza prismática derecha a 90 grados */}
          <mesh position={[lenCm / 2, 0, 1.2]}>
            <boxGeometry args={[0.9, 0.9, 1.7]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )}

      {/* 6. MODELO PERILLA BERLÍN: Pomo esférico clásico Ø25 mm con cuello torneado */}
      {model === 'berlin' && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          {/* Peana cónica de apoyo al tablero */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.5, 0.8, 1.0, 20]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Cuello estrecho */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.6, 20]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Cabeza esférica achatada Ø2.5 cm */}
          <mesh position={[0, 1.9, 0]} scale={[1.25, 0.9, 1.25]}>
            <sphereGeometry args={[1.0, 24, 20]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )}

      {/* 7. MODELO OSLO: Perfil de aluminio en L para montaje posterior abrazando el canto */}
      {model === 'oslo' && (() => {
        const boardTh = thickness || 1.8;
        const dir = isUpper ? 1 : -1;
        return (
          <group>
            {/* Ala posterior de atornillado (apoyada en la cara trasera del tablero) */}
            <mesh position={[0, dir * 0.9, -boardTh + 0.1]}>
              <boxGeometry args={[lenCm, 1.4, 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Tramo horizontal que asienta sobre el canto */}
            <mesh position={[0, -dir * 0.1, -boardTh / 2]}>
              <boxGeometry args={[lenCm, 0.2, boardTh + 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Pestaña frontal en ángulo biselado ergonómico hacia adelante */}
            <mesh 
              position={[0, dir * 0.45, 0.65]} 
              rotation={[-dir * (Math.PI / 6), 0, 0]}
            >
              <boxGeometry args={[lenCm, 0.25, 1.3]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Reborde / labio ergonómico frontal de agarre */}
            <mesh position={[0, dir * 0.8, 1.2]}>
              <boxGeometry args={[lenCm, 0.45, 0.35]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}
