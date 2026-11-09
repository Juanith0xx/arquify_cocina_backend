import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import { SpecialFurniture3D } from './SpecialFurniture3D';
import { useSpecialFurnitureStore } from '../../store/specialFurnitureStore';

export function SpecialScene() {
  const { height, depth } = useSpecialFurnitureStore();

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]">
      <Canvas
        shadows
        camera={{ position: [130, 110, 190], fov: 40 }}
        className="w-full h-full"
      >
        {/* Studio Neutral Lighting */}
        <ambientLight intensity={0.85} color="#ffffff" />
        
        {/* Key Light */}
        <directionalLight
          position={[120, 220, 140]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color="#fffdfa"
        />
        
        {/* Fill Light (Soft Cool Grey) */}
        <directionalLight position={[-120, 100, -80]} intensity={0.6} color="#dbeafe" />
        
        {/* Ground Bounce / Rim Light to highlight dark steel legs */}
        <directionalLight position={[0, -50, 100]} intensity={0.4} color="#f8fafc" />
        <pointLight position={[0, height + 40, depth + 50]} intensity={0.5} color="#ffffff" />

        {/* Studio Ground Disc */}
        <group position={[0, -height / 3.5, 0]}>
          <SpecialFurniture3D />

          {/* Contact Shadows for Grounding */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.7}
            scale={220}
            blur={1.8}
            far={100}
            color="#1e293b"
          />

          {/* Subtle Studio Floor Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[500, 500]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
        </group>

        <OrbitControls
          makeDefault
          minDistance={50}
          maxDistance={420}
          maxPolarAngle={Math.PI / 2 + 0.04}
          target={[0, 15, 0]}
        />
      </Canvas>
    </div>
  );
}
