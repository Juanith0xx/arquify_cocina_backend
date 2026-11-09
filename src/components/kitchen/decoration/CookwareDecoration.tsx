import React from 'react';

interface CookwareProps {
  type?: 'pot' | 'pan' | 'kettle';
  scale?: number;
}

export const CookwareDecoration: React.FC<CookwareProps> = ({
  type = 'pot',
  scale = 1,
}) => {
  // Materiales de alta fidelidad Three.js
  const stainlessSteel = (
    <meshStandardMaterial
      color="#e2e8f0"
      metalness={0.92}
      roughness={0.18}
    />
  );

  const blackBakelite = (
    <meshStandardMaterial
      color="#18181b"
      roughness={0.65}
      metalness={0.1}
    />
  );

  const temperedGlass = (
    <meshPhysicalMaterial
      color="#cbd5e1"
      transmission={0.88}
      roughness={0.08}
      thickness={0.6}
      reflectivity={0.95}
      transparent
      opacity={0.6}
    />
  );

  const copperAccent = (
    <meshStandardMaterial
      color="#b45309"
      metalness={0.85}
      roughness={0.25}
    />
  );

  if (type === 'pan') {
    return (
      <group scale={[scale, scale, scale]}>
        {/* Cuerpo Sartén */}
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[14, 11, 5, 32]} />
          {stainlessSteel}
        </mesh>
        {/* Interior antiadherente grafito */}
        <mesh position={[0, 2.7, 0]}>
          <cylinderGeometry args={[13.7, 10.8, 4.8, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Mango ergonómico largo */}
        <mesh position={[0, 4, 19]} rotation={[Math.PI / 16, 0, 0]}>
          <boxGeometry args={[3, 1.8, 18]} />
          {blackBakelite}
        </mesh>
        {/* Anillo de unión de mango */}
        <mesh position={[0, 3.6, 9.5]} rotation={[Math.PI / 16, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
          {stainlessSteel}
        </mesh>
      </group>
    );
  }

  if (type === 'kettle') {
    return (
      <group scale={[scale, scale, scale]}>
        {/* Base / Cuerpo hervidor/tetera retro */}
        <mesh position={[0, 7.5, 0]}>
          <sphereGeometry args={[9, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
          {copperAccent}
        </mesh>
        {/* Fondo reforzado */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[8, 8.5, 2, 32]} />
          {stainlessSteel}
        </mesh>
        {/* Tapa */}
        <mesh position={[0, 13, 0]}>
          <cylinderGeometry args={[4.5, 4.8, 1.2, 32]} />
          {stainlessSteel}
        </mesh>
        <mesh position={[0, 14.5, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          {blackBakelite}
        </mesh>
        {/* Pico vertedor */}
        <mesh position={[0, 8.5, -9]} rotation={[-Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.8, 8, 16]} />
          {copperAccent}
        </mesh>
        {/* Asa superior arqueada */}
        <mesh position={[0, 15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[8, 0.9, 16, 32, Math.PI]} />
          {blackBakelite}
        </mesh>
      </group>
    );
  }

  // Por defecto: Olla Familiar Gourmet de Acero Inoxidable
  return (
    <group scale={[scale, scale, scale]}>
      {/* Fondo difusor triple capa */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[11, 11, 1.6, 36]} />
        {stainlessSteel}
      </mesh>
      {/* Cuerpo cilíndrico de la olla */}
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[11, 11, 13, 36, 1, true]} />
        {stainlessSteel}
      </mesh>
      {/* Interior de la olla */}
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[10.7, 10.7, 12.8, 36, 1, true]} />
        {stainlessSteel}
      </mesh>
      {/* Fondo interior */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[10.7, 10.7, 0.4, 36]} />
        {stainlessSteel}
      </mesh>
      {/* Reborde superior vertedor */}
      <mesh position={[0, 14.6, 0]}>
        <torusGeometry args={[11, 0.5, 16, 36]} />
        {stainlessSteel}
      </mesh>
      {/* Asas laterales */}
      <mesh position={[12.8, 10.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.5, 0.7, 12, 24, Math.PI]} />
        {blackBakelite}
      </mesh>
      <mesh position={[-12.8, 10.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[2.5, 0.7, 12, 24, Math.PI]} />
        {blackBakelite}
      </mesh>
      {/* Tapa de cristal templado */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[10.8, 10.8, 0.6, 36]} />
        {temperedGlass}
      </mesh>
      {/* Aro metálico perimetral de tapa */}
      <mesh position={[0, 15, 0]}>
        <torusGeometry args={[10.8, 0.4, 16, 36]} />
        {stainlessSteel}
      </mesh>
      {/* Pomo central de tapa */}
      <mesh position={[0, 16.5, 0]}>
        <cylinderGeometry args={[1.6, 1.2, 2, 20]} />
        {blackBakelite}
      </mesh>
    </group>
  );
};
