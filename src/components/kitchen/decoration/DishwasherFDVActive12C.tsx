import React from 'react';
import { Text } from '@react-three/drei';

interface DishwasherProps {
  width?: number;  // 59.8 cm (~60 cm)
  height?: number; // 84.5 cm (82 cm sin tapa superior)
  depth?: number;  // 60 cm
}

export const DishwasherFDVActive12C: React.FC<DishwasherProps> = ({
  width = 59.8,
  height = 84.5,
  depth = 60,
}) => {
  // Materiales de alta fidelidad - Acero Inoxidable Silver & Policarbonato FDV
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

  const consolePanelMat = (
    <meshStandardMaterial
      color="#c5cbd1"
      metalness={0.3}
      roughness={0.42}
    />
  );

  const displayScreenMat = (
    <meshStandardMaterial
      color="#0a0c10"
      metalness={0.2}
      roughness={0.12}
    />
  );

  const chromeMat = (
    <meshStandardMaterial
      color="#f1f5f9"
      metalness={0.92}
      roughness={0.14}
    />
  );

  const plinthMat = (
    <meshStandardMaterial
      color="#15171a"
      metalness={0.3}
      roughness={0.85}
    />
  );

  const recessedHandleMat = (
    <meshStandardMaterial
      color="#181a1d"
      metalness={0.6}
      roughness={0.5}
    />
  );

  const footMat = (
    <meshStandardMaterial
      color="#111214"
      roughness={0.9}
    />
  );

  // Dimensiones geométricas proporcionales
  const plinthH = 8.5; // Zócalo retranqueado inferior
  const topLidH = 2.5; // Tapa superior desmontable (84.5 cm total, 82 cm sin tapa)
  const doorAndPanelH = height - plinthH - topLidH; // Altura de frente útil
  const panelH = 11.5; // Panel frontal superior de control
  const doorH = doorAndPanelH - panelH; // Puerta frontal de carga
  const frontZ = depth / 2;
  const plinthRecess = 3.5;

  return (
    <group>
      {/* 1. Patas Niveladoras Cilíndricas Regulables (4 esquinas bajo zócalo) */}
      {[
        [-width / 2 + 5, -height / 2 + 0.8, -depth / 2 + 6],
        [width / 2 - 5, -height / 2 + 0.8, -depth / 2 + 6],
        [-width / 2 + 5, -height / 2 + 0.8, frontZ - plinthRecess - 4],
        [width / 2 - 5, -height / 2 + 0.8, frontZ - plinthRecess - 4],
      ].map(([fx, fy, fz], idx) => (
        <group key={`foot-${idx}`} position={[fx, fy, fz]}>
          <mesh>
            <cylinderGeometry args={[1.6, 1.8, 1.6, 20]} />
            {footMat}
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1.0, 16]} />
            {chromeMat}
          </mesh>
        </group>
      ))}

      {/* 2. Zócalo Inferior Retranqueado (Kickplate negro/antracita técnico) */}
      <group position={[0, -height / 2 + 1.6 + plinthH / 2, frontZ - plinthRecess - 1.2]}>
        <mesh>
          <boxGeometry args={[width - 0.4, plinthH, 2.4]} />
          {plinthMat}
        </mesh>
        {/* Ranuras de ventilación inferior técnica */}
        {[-14, -7, 0, 7, 14].map((vx, vi) => (
          <mesh key={`vent-${vi}`} position={[vx, 0, 1.22]}>
            <boxGeometry args={[4.5, 0.4, 0.1]} />
            <meshStandardMaterial color="#08080a" />
          </mesh>
        ))}
      </group>

      {/* 3. Gabinete Principal / Chasis Lateral y Posterior */}
      <mesh position={[0, -height / 2 + plinthH + (height - plinthH - topLidH) / 2, -1]}>
        <boxGeometry args={[width - 0.4, height - plinthH - topLidH, depth - 2.5]} />
        {darkStainlessMat}
      </mesh>

      {/* 4. Tapa Superior Removible (Libre Instalación - 845 mm) */}
      <group position={[0, height / 2 - topLidH / 2, 0]}>
        {/* Placa de tapa con cantos suavizados */}
        <mesh>
          <boxGeometry args={[width, topLidH, depth]} />
          {stainlessSteelMat}
        </mesh>
        {/* Borde biselado frontal */}
        <mesh position={[0, 0, depth / 2]}>
          <boxGeometry args={[width, topLidH - 0.2, 0.2]} />
          {stainlessSteelMat}
        </mesh>
      </group>

      {/* 5. Panel Frontal Superior de Control (Policarbonato & Display LED Digital) */}
      <group position={[0, height / 2 - topLidH - panelH / 2, frontZ - 0.6]}>
        {/* Marco base de la consola */}
        <mesh>
          <boxGeometry args={[width - 0.6, panelH, 1.4]} />
          {consolePanelMat}
        </mesh>

        {/* Acabado frontal en acero cepillado y acrílico */}
        <mesh position={[0, 0, 0.72]}>
          <boxGeometry args={[width - 0.8, panelH - 0.4, 0.1]} />
          {stainlessSteelMat}
        </mesh>

        {/* Logotipo FDV Superior */}
        <Text
          position={[-width / 2 + 7.5, 2.8, 0.8]}
          fontSize={1.7}
          color="#475569"
          fontWeight="bold"
          letterSpacing={0.08}
          anchorX="center"
          anchorY="middle"
        >
          FDV
        </Text>

        <Text
          position={[-width / 2 + 7.5, 1.1, 0.8]}
          fontSize={0.65}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          ACTIVE 12C
        </Text>

        {/* Pantalla LED Central Digital */}
        <group position={[0, 0.8, 0.8]}>
          {/* Marco de pantalla negra */}
          <mesh>
            <boxGeometry args={[12, 4.2, 0.15]} />
            {displayScreenMat}
          </mesh>
          {/* Display Digital con tiempo restante y programa activo */}
          <Text
            position={[0, 0.2, 0.1]}
            fontSize={1.8}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            1:28
          </Text>
          {/* Iconos de estado del ciclo */}
          <Text
            position={[-3.8, -1.2, 0.1]}
            fontSize={0.6}
            color="#22d3ee"
            anchorX="center"
            anchorY="middle"
          >
            ECO
          </Text>
          <Text
            position={[0, -1.2, 0.1]}
            fontSize={0.6}
            color="#4ade80"
            anchorX="center"
            anchorY="middle"
          >
            LAVADO
          </Text>
          <Text
            position={[3.8, -1.2, 0.1]}
            fontSize={0.6}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            SECADO
          </Text>
        </group>

        {/* Botones de Control Izquierdos (Encendido & Programas) */}
        {[-18, -13, -8].map((bx, bIdx) => (
          <group key={`btn-left-${bIdx}`} position={[bx, 0.8, 0.8]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.9, 0.9, 0.3, 20]} />
              {chromeMat}
            </mesh>
            {/* LED indicador sobre botón */}
            <mesh position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial
                color={bIdx === 0 ? '#ef4444' : '#38bdf8'}
                emissive={bIdx === 0 ? '#ef4444' : '#38bdf8'}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}

        {/* Botones de Control Derechos (Media Carga, Retraso, Inicio/Pausa) */}
        {[8, 13, 18].map((bx, bIdx) => (
          <group key={`btn-right-${bIdx}`} position={[bx, 0.8, 0.8]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.9, 0.9, 0.3, 20]} />
              {chromeMat}
            </mesh>
            {/* LED indicador sobre botón */}
            <mesh position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial
                color={bIdx === 2 ? '#22c55e' : '#38bdf8'}
                emissive={bIdx === 2 ? '#22c55e' : '#38bdf8'}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}

        {/* Tirador Ergonómico Embutido Frontal (Pocket Handle) */}
        <group position={[0, -panelH / 2 + 1.2, 0.5]}>
          <mesh>
            <boxGeometry args={[32, 2.0, 1.1]} />
            {recessedHandleMat}
          </mesh>
          <mesh position={[0, 0.3, 0.55]}>
            <boxGeometry args={[32.4, 0.25, 0.2]} />
            {chromeMat}
          </mesh>
        </group>
      </group>

      {/* 6. Puerta Frontal Principal de Acero Inoxidable Silver */}
      <group position={[0, -height / 2 + plinthH + doorH / 2, frontZ - 0.6]}>
        {/* Hoja de puerta maciza en acero inoxidable */}
        <mesh>
          <boxGeometry args={[width - 0.6, doorH - 0.4, 1.4]} />
          {stainlessSteelMat}
        </mesh>

        {/* Cara frontal con fino bisel perimetral */}
        <mesh position={[0, 0, 0.72]}>
          <boxGeometry args={[width - 0.8, doorH - 0.6, 0.08]} />
          {stainlessSteelMat}
        </mesh>

        {/* Cantería divisoria superior e inferior (gap de 2mm) */}
        <mesh position={[0, doorH / 2 - 0.1, 0.7]}>
          <boxGeometry args={[width - 0.8, 0.2, 0.15]} />
          {darkStainlessMat}
        </mesh>
        <mesh position={[0, -doorH / 2 + 0.1, 0.7]}>
          <boxGeometry args={[width - 0.8, 0.2, 0.15]} />
          {darkStainlessMat}
        </mesh>

        {/* Sello magnético perimetral interior */}
        <mesh position={[0, 0, -0.75]}>
          <boxGeometry args={[width - 1.2, doorH - 1.0, 0.3]} />
          <meshStandardMaterial color="#0f1115" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};
