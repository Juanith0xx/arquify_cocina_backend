import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows, Sky, PerspectiveCamera } from '@react-three/drei';
import { ConcreteHouse3D } from './ConcreteHouse3D';
import { ConcreteDimensionAnnotations3D } from './ConcreteDimensionAnnotations3D';
import { useConcreteHouseStore } from '../../store/concreteHouseStore';

export function ConcreteScene() {
  const { renderMode, isDraggingOpening } = useConcreteHouseStore();

  return (
    <div className="w-full h-full relative bg-[#090d16] overflow-hidden select-none">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, toneMappingExposure: 1.1 }}
        onPointerMissed={() => {
          useConcreteHouseStore.getState().setSelectedOpeningId(null);
        }}
      >
        <PerspectiveCamera makeDefault position={[16, 11, 16]} fov={45} />
        <OrbitControls
          makeDefault
          enabled={!isDraggingOpening}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={65}
          maxPolarAngle={Math.PI / 2 - 0.02}
          target={[0, 1.3, 0]}
        />

        {/* Iluminación de Obra & Estudio */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-20, 18, -15]} intensity={0.5} color="#93c5fd" />
        <hemisphereLight args={['#e2e8f0', '#1e293b', 0.6]} />

        <Sky
          distance={450000}
          sunPosition={[25, 35, 20]}
          turbidity={4}
          rayleigh={0.6}
        />

        <Suspense fallback={null}>
          {/* Escalar de cm a metros (0.01) para R3F */}
          <group scale={[0.01, 0.01, 0.01]}>
            <ConcreteHouse3D />
            <ConcreteDimensionAnnotations3D />
          </group>
        </Suspense>

        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.65}
          scale={35}
          blur={1.6}
          far={8}
        />

        <Grid
          position={[0, -0.02, 0]}
          args={[60, 60]}
          cellSize={1}
          cellThickness={0.8}
          cellColor="#334155"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#f97316"
          fadeDistance={45}
          fadeStrength={1.2}
        />
      </Canvas>
    </div>
  );
}
