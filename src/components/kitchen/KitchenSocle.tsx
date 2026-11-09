import React from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { calculateSocleSystem } from '../../utils/kitchenSocle';

export function KitchenSocle() {
  const cabinets = useKitchenStore((state) => state.cabinets);
  const showSocle = useKitchenStore((state) => state.showSocle);
  const socleFinish = useKitchenStore((state) => state.socleFinish || 'aluminum');
  const socleHeight = useKitchenStore((state) => state.socleHeight || 10);
  const toolMode = useKitchenStore((state) => state.toolMode);
  const activeCabinetId = useKitchenStore((state) => state.activeCabinetId);
  const walls = useKitchenStore((state) => state.walls);
  const roomConfig = useKitchenStore((state) => state.roomConfig);

  if (!showSocle) return null;

  // Filter out cabinet currently moving
  const validCabinets = cabinets.filter(
    (c) => !(toolMode === 'move_active' && c.id === activeCabinetId)
  );

  const { pieces, straightJoints, laterals, corners, socleColor } = calculateSocleSystem(
    validCabinets,
    walls,
    roomConfig?.vertices,
    socleFinish,
    socleHeight
  );

  const legsHeight = socleHeight;
  const socleThickness = 1.2;

  // Visual PBR material properties calibrated for high contrast and realistic surface
  const isBlack = socleFinish === 'black';
  const socleMetalness = isBlack ? 0.25 : 0.40;
  const socleRoughness = isBlack ? 0.70 : 0.28;
  const jointColor = isBlack ? '#1e293b' : '#94a3b8';
  const jointMetalness = isBlack ? 0.3 : 0.85;
  const jointRoughness = isBlack ? 0.7 : 0.25;

  return (
    <group name="kitchenSocleSystem">
      {/* 1. Continuous Front Socle Pieces (Tiras Frontales de Zócalo Continuas) */}
      {pieces.map((piece) => (
        <group
          key={piece.id}
          position={piece.center}
          rotation={[0, piece.rotation, 0]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[piece.length, legsHeight, socleThickness]} />
            <meshStandardMaterial
              color={socleColor}
              metalness={socleMetalness}
              roughness={socleRoughness}
            />
          </mesh>
        </group>
      ))}

      {/* 2. Straight 180° Joint Profiles (Perfil H de Unión Recta) - Only rendered at >300cm junctions */}
      {straightJoints.map((joint) => (
        <group
          key={joint.id}
          position={joint.position}
          rotation={[0, joint.rotation, 0]}
        >
          {/* Back structural clip */}
          <mesh castShadow>
            <boxGeometry args={[0.8, legsHeight + 0.15, 1.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Front brushed aluminum / black H-profile capping */}
          <mesh position={[0, 0, 0.65]}>
            <boxGeometry args={[1.8, legsHeight + 0.2, 0.35]} />
            <meshStandardMaterial color={jointColor} metalness={jointMetalness} roughness={jointRoughness} />
          </mesh>
          {/* Technical center joint groove */}
          <mesh position={[0, 0, 0.84]}>
            <boxGeometry args={[0.2, legsHeight + 0.2, 0.05]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 3. Lateral Return Socles (Zócalos Laterales en Extremos Expuestos) */}
      {laterals.map((lat) => (
        <group
          key={lat.id}
          position={lat.position}
          rotation={[0, lat.rotation, 0]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[socleThickness, legsHeight, lat.depth]} />
            <meshStandardMaterial
              color={socleColor}
              metalness={socleMetalness}
              roughness={socleRoughness}
            />
          </mesh>
        </group>
      ))}

      {/* 4. 90° Corner Connectors (Conectores Esquineros 90°) */}
      {corners.map((corn) => (
        <group
          key={corn.id}
          position={corn.position}
          rotation={[0, corn.rotation, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[1.6, legsHeight + 0.2, 1.6]} />
            <meshStandardMaterial color={isBlack ? '#0f172a' : '#475569'} metalness={jointMetalness} roughness={jointRoughness} />
          </mesh>
          <mesh position={[corn.isRight ? 0.2 : -0.2, 0, 0.2]}>
            <boxGeometry args={[0.5, legsHeight + 0.2, 0.5]} />
            <meshStandardMaterial color={jointColor} metalness={jointMetalness} roughness={jointRoughness} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
