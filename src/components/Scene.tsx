import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Closet } from './Closet';
import { useStore } from '../store';

function SceneContents() {
  const depth = useStore((state) => state.depth);

  return (
    <>
      <color attach="background" args={['#242424']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 150]} castShadow intensity={1.2} shadow-mapSize={[2048, 2048]} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      
      <group position={[0, -75, 0]}>
        <Suspense fallback={null}>
          <Closet />
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={400} blur={2.5} far={20} />
        
        {/* Room Floor */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        

              {/* Room Back Wall */}
        <mesh position={[0, 400, -depth / 2 - 1]} receiveShadow>
          <planeGeometry args={[2000, 1000]} />
          <meshStandardMaterial color="#404040" roughness={0.9} />
        </mesh>
      </group>
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05} 
        minAzimuthAngle={-Math.PI / 2 + 0.1}
        maxAzimuthAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

export function Scene() {
  const setActiveModuleId = useStore((state) => state.setActiveModule);
  return (
    <div className="w-full h-full bg-[#1a1a1a]">
      <Canvas 
        camera={{ position: [200, 150, 300], fov: 45 }}
        onPointerMissed={() => setActiveModuleId(null)}
      >
        <SceneContents />
      </Canvas>
    </div>
  );
}
