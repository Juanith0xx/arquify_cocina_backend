import React from 'react';
import { Billboard } from '@react-three/drei';

interface HumanScaleProps {
  position?: [number, number, number];
  height?: number; // en cm, por defecto 172 cm
  opacity?: number;
}

export const HumanScaleDecoration: React.FC<HumanScaleProps> = ({
  position = [0, 0, 0],
  height = 172,
  opacity = 0.85,
}) => {
  // Figura humana estilizada arquitectónica 3D de escala
  // Construida con geometría estilizada y materiales mates tipo silueta de concurso arquitectónico
  const headRadius = 10;
  const torsoH = 55;
  const legsH = 95;
  const totalH = legsH + torsoH + headRadius * 2 + 5;
  const scaleFactor = height / totalH;

  const mat = (
    <meshStandardMaterial
      color="#334155"
      roughness={0.8}
      metalness={0.1}
      transparent
      opacity={opacity}
    />
  );

  const accentMat = (
    <meshStandardMaterial
      color="#475569"
      roughness={0.7}
      metalness={0.15}
      transparent
      opacity={opacity}
    />
  );

  return (
    <group position={position} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* Sombra de contacto en piso */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.75, 1]}>
        <circleGeometry args={[18, 32]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.35} />
      </mesh>

      {/* Piernas */}
      <mesh position={[-6, legsH / 2, 0]}>
        <capsuleGeometry args={[3.8, legsH - 8, 8, 16]} />
        {mat}
      </mesh>
      <mesh position={[6, legsH / 2, 0]}>
        <capsuleGeometry args={[3.8, legsH - 8, 8, 16]} />
        {mat}
      </mesh>

      {/* Torso / Chaqueta */}
      <mesh position={[0, legsH + torsoH / 2, 0]}>
        <capsuleGeometry args={[11, torsoH - 10, 8, 16]} />
        {accentMat}
      </mesh>

      {/* Brazos descansados */}
      <mesh position={[-14, legsH + torsoH / 2 - 4, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[3.2, torsoH - 12, 6, 12]} />
        {mat}
      </mesh>
      <mesh position={[14, legsH + torsoH / 2 - 4, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[3.2, torsoH - 12, 6, 12]} />
        {mat}
      </mesh>

      {/* Cuello */}
      <mesh position={[0, legsH + torsoH + 3, 0]}>
        <cylinderGeometry args={[4, 4.5, 6, 16]} />
        {mat}
      </mesh>

      {/* Cabeza */}
      <mesh position={[0, legsH + torsoH + 3 + headRadius, 0]}>
        <sphereGeometry args={[headRadius, 24, 24]} />
        {mat}
      </mesh>
    </group>
  );
};
