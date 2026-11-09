import React from 'react';

interface PlantProps {
  width?: number;  // 40 cm
  height?: number; // 95 cm
  depth?: number;  // 40 cm
}

export const PlantDecoration: React.FC<PlantProps> = ({
  width = 40,
  height = 95,
  depth = 40,
}) => {
  // Dimensiones del macetero y soporte
  const standH = 22;
  const potH = 28;
  const potRadiusTop = 15;
  const potRadiusBottom = 12.5;

  const yBottom = -height / 2;

  // Materiales
  const ceramicPotMat = (
    <meshStandardMaterial
      color="#f1f5f9"
      roughness={0.25}
      metalness={0.05}
    />
  );

  const woodStandMat = (
    <meshStandardMaterial
      color="#8c5836"
      roughness={0.7}
      metalness={0.1}
    />
  );

  const soilMat = (
    <meshStandardMaterial
      color="#2a1f18"
      roughness={0.95}
      metalness={0.0}
    />
  );

  const stemMat = (
    <meshStandardMaterial
      color="#2d5229"
      roughness={0.6}
      metalness={0.05}
    />
  );

  const leafDeepGreenMat = (
    <meshStandardMaterial
      color="#1d4d23"
      roughness={0.35}
      metalness={0.1}
      side={2} // DoubleSide
    />
  );

  const leafFreshGreenMat = (
    <meshStandardMaterial
      color="#2d6e35"
      roughness={0.3}
      metalness={0.1}
      side={2}
    />
  );

  const leafLightGreenMat = (
    <meshStandardMaterial
      color="#448d4e"
      roughness={0.3}
      metalness={0.08}
      side={2}
    />
  );

  // Hojas botánicas tipo Monstera/Ficus Lyrata con posición, escala, rotaciones
  const leaves = [
    // Centro alto
    { pos: [0, 68, 0], rot: [0.2, 0.4, 0.3], scale: [1.2, 1.4, 1.2], mat: leafLightGreenMat },
    { pos: [3, 62, -2], rot: [-0.3, 1.2, -0.2], scale: [1.1, 1.3, 1.1], mat: leafFreshGreenMat },
    // Nivel superior medio
    { pos: [-8, 54, 5], rot: [0.5, -0.6, -0.4], scale: [1.3, 1.5, 1.3], mat: leafDeepGreenMat },
    { pos: [9, 52, 6], rot: [0.6, 0.8, 0.5], scale: [1.3, 1.5, 1.3], mat: leafFreshGreenMat },
    { pos: [-6, 50, -7], rot: [-0.6, -1.2, -0.3], scale: [1.2, 1.4, 1.2], mat: leafDeepGreenMat },
    { pos: [7, 48, -8], rot: [-0.5, 1.5, 0.4], scale: [1.2, 1.4, 1.2], mat: leafDeepGreenMat },
    // Nivel intermedio frondoso
    { pos: [-12, 42, 2], rot: [0.3, -1.5, -0.6], scale: [1.4, 1.6, 1.4], mat: leafFreshGreenMat },
    { pos: [13, 40, -1], rot: [0.2, 1.6, 0.7], scale: [1.4, 1.6, 1.4], mat: leafDeepGreenMat },
    { pos: [2, 38, 12], rot: [0.8, 0.1, 0.2], scale: [1.4, 1.6, 1.4], mat: leafFreshGreenMat },
    { pos: [-3, 36, -12], rot: [-0.8, 3.1, -0.2], scale: [1.3, 1.5, 1.3], mat: leafDeepGreenMat },
    // Nivel bajo desbordante
    { pos: [-10, 32, 10], rot: [0.9, -0.7, -0.7], scale: [1.3, 1.4, 1.3], mat: leafDeepGreenMat },
    { pos: [11, 30, 9], rot: [0.9, 0.8, 0.7], scale: [1.3, 1.4, 1.3], mat: leafFreshGreenMat },
    { pos: [-9, 28, -9], rot: [-0.9, -2.4, -0.6], scale: [1.2, 1.3, 1.2], mat: leafDeepGreenMat },
    { pos: [10, 27, -10], rot: [-0.9, 2.3, 0.6], scale: [1.2, 1.3, 1.2], mat: leafFreshGreenMat },
  ];

  return (
    <group>
      {/* 1. Base / Soporte Trípode de Madera */}
      <group position={[0, yBottom, 0]}>
        {/* 4 Patas de Madera */}
        {[
          [-potRadiusBottom + 1, -potRadiusBottom + 1],
          [potRadiusBottom - 1, -potRadiusBottom + 1],
          [-potRadiusBottom + 1, potRadiusBottom - 1],
          [potRadiusBottom - 1, potRadiusBottom - 1],
        ].map(([px, pz], pIdx) => (
          <mesh key={`pstand-${pIdx}`} position={[px, standH / 2, pz]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.4, standH, 16]} />
            {woodStandMat}
          </mesh>
        ))}

        {/* Travesaño cruzado de soporte */}
        <mesh position={[0, standH - 7, 0]}>
          <boxGeometry args={[potRadiusBottom * 2 - 1, 2.2, 2.2]} />
          {woodStandMat}
        </mesh>
        <mesh position={[0, standH - 7, 0]}>
          <boxGeometry args={[2.2, 2.2, potRadiusBottom * 2 - 1]} />
          {woodStandMat}
        </mesh>
      </group>

      {/* 2. Macetero Cilíndrico de Cerámica */}
      <group position={[0, yBottom + standH - 5 + potH / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[potRadiusTop, potRadiusBottom, potH, 32, 1, true]} />
          {ceramicPotMat}
        </mesh>
        {/* Base del macetero */}
        <mesh position={[0, -potH / 2 + 0.5, 0]}>
          <cylinderGeometry args={[potRadiusBottom - 0.2, potRadiusBottom - 0.2, 1, 32]} />
          {ceramicPotMat}
        </mesh>
        {/* Borde redondeado superior */}
        <mesh position={[0, potH / 2, 0]}>
          <torusGeometry args={[potRadiusTop, 0.8, 16, 32]} />
          {ceramicPotMat}
        </mesh>

        {/* 3. Tierra Orgánica con Piedras Decorativas */}
        <mesh position={[0, potH / 2 - 2.5, 0]}>
          <cylinderGeometry args={[potRadiusTop - 1.0, potRadiusTop - 1.0, 1.5, 32]} />
          {soilMat}
        </mesh>
        {/* Piedras decorativas blancas en la superficie */}
        {[
          [5, potH / 2 - 1.6, 4],
          [-6, potH / 2 - 1.6, 5],
          [7, potH / 2 - 1.6, -3],
          [-5, potH / 2 - 1.6, -6],
          [0, potH / 2 - 1.6, 7],
          [2, potH / 2 - 1.6, -8],
        ].map(([sx, sy, sz], sIdx) => (
          <mesh key={`stone-${sIdx}`} position={[sx, sy, sz]}>
            <sphereGeometry args={[1.1, 8, 8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* 4. Tallos Botánicos Principales */}
      <group position={[0, yBottom + standH + potH - 7, 0]}>
        {/* Tronco / Tallo central principal */}
        <mesh position={[0, 18, 0]} rotation={[0.05, 0.2, 0.05]}>
          <cylinderGeometry args={[0.9, 1.4, 38, 16]} />
          {stemMat}
        </mesh>
        {/* Tallo rama izquierda */}
        <mesh position={[-5, 14, 2]} rotation={[-0.1, -0.4, 0.28]}>
          <cylinderGeometry args={[0.7, 1.1, 30, 16]} />
          {stemMat}
        </mesh>
        {/* Tallo rama derecha */}
        <mesh position={[4, 15, -2]} rotation={[0.2, 0.3, -0.25]}>
          <cylinderGeometry args={[0.7, 1.1, 32, 16]} />
          {stemMat}
        </mesh>

        {/* 5. Hojas Botánicas en 3D (Modeladas con curvatura natural) */}
        {leaves.map((leaf, lIdx) => (
          <group
            key={`leaf-${lIdx}`}
            position={leaf.pos as [number, number, number]}
            rotation={leaf.rot as [number, number, number]}
            scale={leaf.scale as [number, number, number]}
          >
            {/* Pecíolo / Tallito de la hoja */}
            <mesh position={[0, -3.5, 0]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.3, 7, 8]} />
              {stemMat}
            </mesh>

            {/* Limbo de la Hoja (Forma elíptica elegante con nervadura central) */}
            <mesh position={[0, 3, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[5.5, 12, 16, 2, false, 0, Math.PI * 2]} />
              {leaf.mat}
            </mesh>
            {/* Nervadura central en relieve */}
            <mesh position={[0, 3, 0.4]}>
              <boxGeometry args={[0.3, 10, 0.2]} />
              {stemMat}
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
