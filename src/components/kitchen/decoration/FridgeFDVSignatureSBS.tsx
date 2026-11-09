import React from 'react';
import { Text } from '@react-three/drei';

interface FridgeProps {
  width?: number;  // 91 cm
  height?: number; // 177 cm
  depth?: number;  // 67 cm
}

export const FridgeFDVSignatureSBS: React.FC<FridgeProps> = ({
  width = 91,
  height = 177,
  depth = 67,
}) => {
  // Materiales en Acero Inoxidable Silver Gris Claro
  const darkInoxMat = (
    <meshStandardMaterial
      color="#d0d5da"
      metalness={0.32}
      roughness={0.4}
    />
  );

  const darkCabinetBodyMat = (
    <meshStandardMaterial
      color="#b8bec4"
      metalness={0.28}
      roughness={0.45}
    />
  );

  const stainlessSteelHandleMat = (
    <meshStandardMaterial
      color="#e2e8f0"
      metalness={0.92}
      roughness={0.18}
    />
  );

  const dispenserBackMat = (
    <meshStandardMaterial
      color="#0a0a0b"
      metalness={0.3}
      roughness={0.7}
    />
  );

  const displayScreenMat = (
    <meshStandardMaterial
      color="#050608"
      metalness={0.1}
      roughness={0.15}
    />
  );

  // Proporción Side-by-Side: Puerta Freezer (Izq) ~37 cm, Puerta Refri (Der) ~53 cm
  const gap = 0.4;
  const leftDoorW = 37.5;
  const rightDoorW = width - leftDoorW - gap;
  const doorH = height - 5;
  const doorThickness = 4.5;
  const frontZ = depth / 2 - doorThickness / 2;

  // Centro de puertas en X
  const leftDoorX = -width / 2 + leftDoorW / 2;
  const rightDoorX = width / 2 - rightDoorW / 2;

  // Handle parameters
  const handleLength = 110;
  const handleRadius = 1.1;
  const handleOffsetZ = doorThickness / 2 + 3.2;

  return (
    <group>
      {/* 1. Gabinete Principal / Carcasa Posterior */}
      <mesh position={[0, -0.5, -doorThickness / 2]}>
        <boxGeometry args={[width - 0.4, height - 1.0, depth - doorThickness]} />
        {darkCabinetBodyMat}
      </mesh>

      {/* Tapa superior de bisagras */}
      <mesh position={[0, height / 2 - 1.2, 0]}>
        <boxGeometry args={[width, 2.4, depth]} />
        {darkInoxMat}
      </mesh>

      {/* 2. Puerta Izquierda: Freezer con Dispensador de Hielo/Agua */}
      <group position={[leftDoorX, -1, frontZ]}>
        {/* Cuerpo de la puerta */}
        <mesh>
          <boxGeometry args={[leftDoorW, doorH, doorThickness]} />
          {darkInoxMat}
        </mesh>

        {/* Borde Biselado / Sello magnético */}
        <mesh position={[0, 0, -doorThickness / 2 - 0.2]}>
          <boxGeometry args={[leftDoorW - 0.6, doorH - 0.6, 0.4]} />
          <meshStandardMaterial color="#0f1115" />
        </mesh>

        {/* Cavidad / Nicho del Dispensador de Agua y Hielo */}
        <group position={[0, 18, doorThickness / 2 - 1.0]}>
          {/* Marco exterior del dispensador */}
          <mesh position={[0, 0, 0.4]}>
            <boxGeometry args={[20, 28, 1.2]} />
            <meshStandardMaterial color="#111317" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Nicho embutido */}
          <mesh position={[0, -4, -0.6]}>
            <boxGeometry args={[17, 18, 2.2]} />
            {dispenserBackMat}
          </mesh>

          {/* Bandeja antigoteo en la base del nicho */}
          <mesh position={[0, -12, 0]}>
            <boxGeometry args={[16, 1.0, 2.0]} />
            <meshStandardMaterial color="#2d3139" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Palanca / Pulsador de dispensado */}
          <mesh position={[0, -2, -1.2]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[6.5, 9, 0.5]} />
            <meshStandardMaterial color="#22252a" metalness={0.7} roughness={0.4} />
          </mesh>

          {/* Boquilla de agua de acero */}
          <mesh position={[0, 4.5, -0.6]}>
            <cylinderGeometry args={[0.5, 0.5, 1.2, 16]} />
            {stainlessSteelHandleMat}
          </mesh>

          {/* Pantalla Táctil LED Superior con Controles */}
          <group position={[0, 8.5, 0.95]}>
            <mesh>
              <boxGeometry args={[18, 6.5, 0.2]} />
              {displayScreenMat}
            </mesh>

            {/* Display de temperatura & modos */}
            <Text
              position={[-4.5, 1.0, 0.15]}
              fontSize={1.7}
              color="#38bdf8"
              fontWeight="bold"
              anchorX="center"
              anchorY="middle"
            >
              -18°C
            </Text>
            <Text
              position={[-4.5, -1.2, 0.15]}
              fontSize={0.9}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              FREEZER
            </Text>

            <Text
              position={[4.5, 1.0, 0.15]}
              fontSize={1.7}
              color="#38bdf8"
              fontWeight="bold"
              anchorX="center"
              anchorY="middle"
            >
              4°C
            </Text>
            <Text
              position={[4.5, -1.2, 0.15]}
              fontSize={0.9}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              FRIDGE
            </Text>

            {/* Íconos de Agua / Hielo Cubos / Hielo Picado */}
            <Text
              position={[0, 1.2, 0.15]}
              fontSize={1.0}
              color="#e0f2fe"
              anchorX="center"
              anchorY="middle"
            >
              [ ICE / WATER ]
            </Text>
            <Text
              position={[0, -1.2, 0.15]}
              fontSize={0.75}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
            >
              • NO FROST •
            </Text>
          </group>
        </group>

        {/* Manilla Tubular Vertical Puerta Izquierda */}
        <group position={[leftDoorW / 2 - 3.5, 0, handleOffsetZ]}>
          {/* Barra Vertical */}
          <mesh>
            <cylinderGeometry args={[handleRadius, handleRadius, handleLength, 24]} />
            {stainlessSteelHandleMat}
          </mesh>
          {/* Soportes superior e inferior */}
          <mesh position={[0, handleLength / 2 - 6, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelHandleMat}
          </mesh>
          <mesh position={[0, -handleLength / 2 + 6, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelHandleMat}
          </mesh>
        </group>
      </group>

      {/* 3. Puerta Derecha: Refrigerador 513L */}
      <group position={[rightDoorX, -1, frontZ]}>
        <mesh>
          <boxGeometry args={[rightDoorW, doorH, doorThickness]} />
          {darkInoxMat}
        </mesh>

        <mesh position={[0, 0, -doorThickness / 2 - 0.2]}>
          <boxGeometry args={[rightDoorW - 0.6, doorH - 0.6, 0.4]} />
          <meshStandardMaterial color="#0f1115" />
        </mesh>

        {/* Manilla Tubular Vertical Puerta Derecha */}
        <group position={[-rightDoorW / 2 + 3.5, 0, handleOffsetZ]}>
          {/* Barra Vertical */}
          <mesh>
            <cylinderGeometry args={[handleRadius, handleRadius, handleLength, 24]} />
            {stainlessSteelHandleMat}
          </mesh>
          {/* Soportes superior e inferior */}
          <mesh position={[0, handleLength / 2 - 6, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelHandleMat}
          </mesh>
          <mesh position={[0, -handleLength / 2 + 6, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 20]} />
            {stainlessSteelHandleMat}
          </mesh>
        </group>

        {/* Emblema FDV Signature */}
        <group position={[0, doorH / 2 - 12, doorThickness / 2 + 0.1]}>
          <Text
            fontSize={2.4}
            color="#cbd5e1"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            FDV
          </Text>
          <Text
            position={[0, -2.4, 0]}
            fontSize={0.85}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
          >
            SIGNATURE 2.0
          </Text>
        </group>
      </group>

      {/* 4. Rejilla de Ventilación Inferior & Patas de Apoyo */}
      <group position={[0, -height / 2 + 2, frontZ - 1]}>
        <mesh>
          <boxGeometry args={[width - 2, 3.6, doorThickness + 2]} />
          <meshStandardMaterial color="#111317" roughness={0.9} />
        </mesh>
        {/* Ranuras de rejilla */}
        {[-30, -15, 0, 15, 30].map((slotX, sIdx) => (
          <mesh key={`slot-${sIdx}`} position={[slotX, 0, doorThickness / 2 + 0.8]}>
            <boxGeometry args={[10, 0.5, 0.4]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        ))}
      </group>
    </group>
  );
};
