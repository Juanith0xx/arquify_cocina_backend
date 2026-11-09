
import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Closet } from './Closet';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import '@google/model-viewer';

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

function SceneExporter({ onExport }: { onExport: (url: string) => void }) {
  const { scene } = useThree();
  const exported = useRef(false);

  useEffect(() => {
    if (exported.current) return;
    
    // Give it a tiny bit of time to ensure all geometries are mounted
    const timeout = setTimeout(() => {
      const exporter = new GLTFExporter();
      
      // We only want to export the actual closet, not the environment or helpers
      const exportScene = new THREE.Scene();
      const closetGroup = scene.getObjectByName('closet-export-group');
      
      if (closetGroup) {
        exportScene.add(closetGroup.clone());
      } else {
        exportScene.add(scene.clone());
      }

      exporter.parse(
        exportScene,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          onExport(url);
          exported.current = true;
        },
        (error) => {
          console.error('An error happened during GLTF export:', error);
        },
        { binary: true }
      );
    }, 1000); // 1s wait to ensure textures/materials are ready

    return () => clearTimeout(timeout);
  }, [scene, onExport]);

  return null;
}

export function ARView() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  if (modelUrl) {
    return (
      <div className="w-screen h-screen bg-black">
        <model-viewer
          src={modelUrl}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}
        >
          <div slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-full font-bold shadow-xl tracking-widest uppercase text-sm border-2 border-white/20 whitespace-nowrap">
            Iniciar Realidad Aumentada
          </div>
        </model-viewer>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mb-6"></div>
      <h2 className="text-xl font-bold uppercase tracking-widest">Generando Modelo 3D...</h2>
      <p className="text-slate-400 mt-2 text-sm">Preparando para Realidad Aumentada</p>
      
      {/* Hidden canvas purely for generating the GLTF */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}>
        <Canvas>
          <group name="closet-export-group">
            <Closet />
          </group>
          <Environment preset="studio" />
          <SceneExporter onExport={setModelUrl} />
        </Canvas>
      </div>
    </div>
  );
}
