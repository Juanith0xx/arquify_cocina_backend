import React from 'react';
import { Text } from '@react-three/drei';
import { CookwareDecoration } from './CookwareDecoration';
import { useStore } from '../../../store';

interface StoveProps {
  width?: number;  // 90 cm
  height?: number; // 90 cm
  depth?: number;  // 60 cm
  showCookware?: boolean;
}

export const StoveFDVUnique90: React.FC<StoveProps> = ({
  width = 90,
  height = 90,
  depth = 60,
  showCookware = false,
}) => {
  const globalShowDecorations = useStore((state) => state.showDecorations);
  const shouldRenderPot = showCookware && globalShowDecorations;
  // Materiales de alta fidelidad en Acero Inoxidable Silver Gris Claro
  const stainlessSteelMat = (
    <meshStandardMaterial
      color="#d0d5da"
      metalness={0.32}
      roughness={0.4}
    />
  );

  const darkStainlessMat = (
    <meshStandardMaterial
      color="#b8bec4"
      metalness={0.28}
      roughness={0.45}
    />
  );

  const castIronMat = (
    <meshStandardMaterial
      color="#18191a"
      metalness={0.4}
      roughness={0.75}
    />
  );

  const glassMat = (
    <meshPhysicalMaterial
      color="#0a0c10"
      metalness={0.2}
      roughness={0.08}
      transmission={0.4}
      thickness={0.8}
      reflectivity={0.9}
      transparent
      opacity={0.88}
    />
  );

  const chromeMat = (
    <meshStandardMaterial
      color="#ffffff"
      metalness={0.95}
      roughness={0.1}
    />
  );

  const brassMat = (
    <meshStandardMaterial
      color="#d4af37"
      metalness={0.8}
      roughness={0.3}
    />
  );

  const legH = 8;
  const bodyH = height - legH;
  const cooktopH = 4;
  const controlH = 12;
  const ovenH = 50;
  const drawerH = bodyH - cooktopH - controlH - ovenH;

  // Centro local: y=0 en el centro del mueble
  const yBottom = -height / 2;

  return (
    <group>
      {/* 1. Patas Cilíndricas Regulables (4 esquinas) */}
      {[
        [-width / 2 + 5, -depth / 2 + 5],
        [width / 2 - 5, -depth / 2 + 5],
        [-width / 2 + 5, depth / 2 - 5],
        [width / 2 - 5, depth / 2 - 5],
      ].map(([x, z], i) => (
        <group key={`leg-${i}`} position={[x, yBottom + legH / 2, z]}>
          <mesh>
            <cylinderGeometry args={[2.2, 2.2, legH, 20]} />
            {stainlessSteelMat}
          </mesh>
          <mesh position={[0, -legH / 2 + 0.5, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 1, 20]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 2. Cuerpo Principal de Acero Inoxidable */}
      <mesh position={[0, yBottom + legH + bodyH / 2, 0]}>
        <boxGeometry args={[width, bodyH, depth - 0.5]} />
        {stainlessSteelMat}
      </mesh>

      {/* 3. Cubierta Superior de Cocción (Embutida con reborde perimetral) */}
      <group position={[0, height / 2 - cooktopH / 2, 0]}>
        {/* Plancha superior */}
        <mesh position={[0, cooktopH / 2 - 0.3, 0]}>
          <boxGeometry args={[width, 0.6, depth]} />
          {stainlessSteelMat}
        </mesh>
        {/* Cavidad antiderrame embutida */}
        <mesh position={[0, cooktopH / 2 - 0.4, 0]}>
          <boxGeometry args={[width - 6, 0.2, depth - 8]} />
          {darkStainlessMat}
        </mesh>

        {/* 5 Quemadores a Gas */}
        {/* Central Wok Triple Corona */}
        <group position={[0, cooktopH / 2 + 0.3, 0]}>
          <mesh>
            <cylinderGeometry args={[5.5, 6, 0.8, 32]} />
            {castIronMat}
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[4.2, 4.2, 0.4, 32]} />
            {brassMat}
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[3.2, 3.2, 0.3, 32]} />
            {castIronMat}
          </mesh>
          {/* Corona Wok central */}
          <mesh position={[0, 1.2, 0]}>
            <torusGeometry args={[5.2, 0.35, 12, 32]} />
            {castIronMat}
          </mesh>

          {/* Olla Gourmet de Acero Inoxidable en el quemador central */}
          {shouldRenderPot && (
            <group position={[0, cooktopH / 2 + 1.2, 0]}>
              <CookwareDecoration type="pot" scale={0.9} />
            </group>
          )}
        </group>

        {/* Quemadores Periféricos (4 unidades) */}
        {[
          [-width / 3.2, -depth / 4, 3.8], // Delantero Izq (Rápido)
          [-width / 3.2, depth / 4, 3.2],  // Trasero Izq (Semi-rápido)
          [width / 3.2, -depth / 4, 2.6],  // Delantero Der (Auxiliar)
          [width / 3.2, depth / 4, 3.2],   // Trasero Der (Semi-rápido)
        ].map(([qx, qz, r], idx) => (
          <group key={`burner-${idx}`} position={[qx, cooktopH / 2 + 0.3, qz]}>
            <mesh>
              <cylinderGeometry args={[r, r + 0.4, 0.6, 24]} />
              {castIronMat}
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[r * 0.75, r * 0.75, 0.3, 24]} />
              {castIronMat}
            </mesh>
          </group>
        ))}

        {/* 3 Parrillas Robustas de Hierro Fundido */}
        {[-width / 3, 0, width / 3].map((gx, gIdx) => (
          <group key={`grate-${gIdx}`} position={[gx, cooktopH / 2 + 1.2, 0]}>
            {/* Marco de la parrilla */}
            <mesh position={[0, 0, -depth / 2 + 6]}>
              <boxGeometry args={[width / 3.15, 1.2, 1.2]} />
              {castIronMat}
            </mesh>
            <mesh position={[0, 0, depth / 2 - 6]}>
              <boxGeometry args={[width / 3.15, 1.2, 1.2]} />
              {castIronMat}
            </mesh>
            <mesh position={[-width / 6.5, 0, 0]}>
              <boxGeometry args={[1.2, 1.2, depth - 12]} />
              {castIronMat}
            </mesh>
            <mesh position={[width / 6.5, 0, 0]}>
              <boxGeometry args={[1.2, 1.2, depth - 12]} />
              {castIronMat}
            </mesh>
            {/* Travesaños en cruz */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width / 3.15, 1.0, 1.0]} />
              {castIronMat}
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.0, 1.0, depth - 12]} />
              {castIronMat}
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Panel de Control Frontal (6 Perillas + Timer Digital) */}
      <group position={[0, height / 2 - cooktopH - controlH / 2, depth / 2 + 0.3]}>
        <mesh>
          <boxGeometry args={[width - 0.4, controlH, 0.8]} />
          {stainlessSteelMat}
        </mesh>

        {/* 6 Perillas de Mando Rotativas Cromadas */}
        {[-32, -20, -8, 8, 20, 32].map((kx, kIdx) => (
          <group key={`knob-${kIdx}`} position={[kx, -0.5, 0.6]}>
            {/* Anillo base negro */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.2, 2.2, 0.3, 24]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
            {/* Cuerpo perilla cromada */}
            <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.8, 1.9, 1.4, 24]} />
              {chromeMat}
            </mesh>
            {/* Marcador rojo/negro de posición */}
            <mesh position={[0, 1.4, 1.75]}>
              <boxGeometry args={[0.3, 0.7, 0.2]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
          </group>
        ))}

        {/* Timer Digital / Pantalla LED Centrada */}
        <group position={[0, 1.8, 0.5]}>
          <mesh>
            <boxGeometry args={[10, 3.5, 0.2]} />
            <meshStandardMaterial color="#0b0f19" roughness={0.1} />
          </mesh>
          <Text
            position={[0, 0, 0.15]}
            fontSize={1.6}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            12:00
          </Text>
        </group>
      </group>

      {/* 5. Puerta de Horno Eléctrico (3 Cristales, Manilla Tubular & Logo FDV) */}
      <group position={[0, yBottom + legH + drawerH + ovenH / 2, depth / 2 + 0.6]}>
        {/* Marco exterior de la puerta */}
        <mesh>
          <boxGeometry args={[width - 0.8, ovenH - 0.8, 1.2]} />
          {stainlessSteelMat}
        </mesh>

        {/* Gran ventana de triple cristal tintado */}
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[width - 18, ovenH - 12, 0.8]} />
          {glassMat}
        </mesh>

        {/* Interior visible del horno (Rejilla / Resistencia) */}
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[width - 20, ovenH - 14, 0.2]} />
          <meshStandardMaterial color="#1a1c20" roughness={0.9} />
        </mesh>

        {/* Manilla Tubular Horizontal de Acero Inoxidable */}
        <group position={[0, ovenH / 2 - 5, 3.2]}>
          {/* Barra horizontal */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.1, 1.1, width - 20, 24]} />
            {stainlessSteelMat}
          </mesh>
          {/* Postes de montaje laterales */}
          <mesh position={[-(width - 24) / 2, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelMat}
          </mesh>
          <mesh position={[(width - 24) / 2, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelMat}
          </mesh>
        </group>

        {/* Logotipo FDV serigrafiado */}
        <Text
          position={[0, -ovenH / 2 + 4.5, 0.7]}
          fontSize={2.6}
          color="#94a3b8"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          FDV
        </Text>
      </group>

      {/* 6. Cajón Inferior Calienta Platos */}
      <group position={[0, yBottom + legH + drawerH / 2, depth / 2 + 0.4]}>
        <mesh>
          <boxGeometry args={[width - 0.8, drawerH - 0.6, 1.0]} />
          {stainlessSteelMat}
        </mesh>
        {/* Cantería / Ranura tirador oculta */}
        <mesh position={[0, drawerH / 2 - 0.8, 0.4]}>
          <boxGeometry args={[width - 30, 0.6, 0.3]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
};
