import React from 'react';
import { CubicleConfig, UrinalScreenConfig } from '../../store/hplBathroomStore';

interface FixturesProps {
  cubicles: CubicleConfig[];
  urinalScreens: UrinalScreenConfig[];
  batteryOriginX: number; // m
  batteryOriginZ: number; // m
  urinalsWallZ: number;   // m
  thicknessDivider?: number; // mm
}

export const HplSanitaryFixtures: React.FC<FixturesProps> = ({
  cubicles,
  batteryOriginX,
  urinalsWallZ,
  thicknessDivider = 12,
}) => {
  let currentX = batteryOriginX;
  const thickDividerM = thicknessDivider / 1000;

  return (
    <group name="SanitaryFixturesGroup">
      {/* TAZAS DE INODORO (WC) SIEMPRE PEGADAS AL MURO DE FONDO */}
      {cubicles.map((cab, idx) => {
        const cabWidthM = cab.cubicleWidth / 1000;
        const cabDepthM = cab.cubicleDepth / 1000;
        const wcCenterX = currentX + cabWidthM / 2;
        // El estanque del WC queda exactamente adosado y enrasado al muro de fondo (urinalsWallZ)
        const wcCenterZ = urinalsWallZ + 0.30;
        currentX += cabWidthM;

        // El papel higiénico se monta en el panel lateral derecho del cubículo
        // Si es el último cubículo y la batería no tiene panel derecho cerrado, se monta en el lateral izquierdo
        const mountOnRight = idx < cubicles.length - 1 || true;
        const sideOffset = mountOnRight ? cabWidthM / 2 - thickDividerM / 2 : -cabWidthM / 2 + thickDividerM / 2;
        const sign = mountOnRight ? -1 : 1;

        return (
          <group key={`wc_${cab.id}`} position={[wcCenterX, 0, wcCenterZ]}>
            {/* Taza cerámica blanca */}
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.18, 0.15, 0.4, 16]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.15} metalness={0.05} />
            </mesh>

            {/* Asiento y tapa */}
            <mesh position={[0, 0.42, 0.03]} rotation={[-0.05, 0, 0]}>
              <boxGeometry args={[0.38, 0.04, 0.44]} />
              <meshStandardMaterial color="#F1F5F9" roughness={0.2} />
            </mesh>

            {/* Tanque / pulsador embutido o mochila */}
            <mesh position={[0, 0.65, -0.22]} castShadow>
              <boxGeometry args={[0.38, 0.5, 0.16]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
            </mesh>

            {/* Pulsador cromado */}
            <mesh position={[0, 0.85, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.015, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Porta rollo de papel higiénico JNF adosado a la cara interna del panel lateral */}
            <group position={[sideOffset, 0.72, 0.15]}>
              {/* Placa de anclaje atornillada al panel lateral HPL */}
              <mesh position={[sign * 0.003, 0, 0]}>
                <boxGeometry args={[0.006, 0.08, 0.08]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Brazo cilíndrico soporte que sale del panel lateral hacia el interior de la cabina */}
              <mesh position={[sign * 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.007, 0.007, 0.08, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Tapa / Visera superior en acero inox satinado */}
              <mesh position={[sign * 0.045, 0.055, 0]}>
                <boxGeometry args={[0.08, 0.004, 0.14]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Rollo de papel higiénico montado en el vástago */}
              <mesh position={[sign * 0.045, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.055, 0.055, 0.12, 20]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
              {/* Cilindro interior de cartón */}
              <mesh position={[sign * 0.045, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.122, 16]} />
                <meshStandardMaterial color="#D4A373" roughness={0.9} />
              </mesh>
            </group>

            {/* Si es PMR: Barras de apoyo abatibles en acero inox */}
            {cab.isPmr && (
              <group position={[-0.35, 0.75, 0.1]}>
                {/* Barra fija lateral */}
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.016, 0.016, 0.6, 12]} />
                  <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Soporte a muro */}
                <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
