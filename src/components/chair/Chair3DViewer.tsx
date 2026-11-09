import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ChairModel } from './ChairModel';
import { useChairStore } from '../../store/chairStore';
import {
  RotateCcw,
  Layers,
  Sparkles,
  Boxes,
  Sun,
  Moon,
  Ruler,
} from 'lucide-react';

export function Chair3DViewer() {
  const controlsRef = useRef<any>(null);
  const [isLightMode, setIsLightMode] = useState(true);
  const autoRotate = useChairStore((state) => state.autoRotate);
  const setAutoRotate = useChairStore((state) => state.setAutoRotate);
  const showDimensions3D = useChairStore((state) => state.showDimensions3D);
  const setShowDimensions3D = useChairStore((state) => state.setShowDimensions3D);
  const explodedView = useChairStore((state) => state.explodedView);
  const setExplodedView = useChairStore((state) => state.setExplodedView);

  const handleSetCamera = (view: 'iso' | 'front' | 'side' | 'top' | 'rear') => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    switch (view) {
      case 'iso':
        controls.object.position.set(0.9, 0.7, 1.1);
        controls.target.set(0, 0.45, 0);
        break;
      case 'front':
        controls.object.position.set(0, 0.45, 1.4);
        controls.target.set(0, 0.45, 0);
        break;
      case 'side':
        controls.object.position.set(1.4, 0.45, 0);
        controls.target.set(0, 0.45, 0);
        break;
      case 'top':
        controls.object.position.set(0, 1.5, 0.01);
        controls.target.set(0, 0.45, 0);
        break;
      case 'rear':
        controls.object.position.set(0, 0.55, -1.4);
        controls.target.set(0, 0.45, 0);
        break;
    }
    controls.update();
  };

  const bgColor = isLightMode ? '#F1F5F9' : '#111318';
  const gridPrimary = isLightMode ? '#94A3B8' : '#334155';
  const gridSecondary = isLightMode ? '#E2E8F0' : '#1E293B';

  return (
    <div className={`relative w-full h-full overflow-hidden select-none transition-colors duration-300 ${isLightMode ? 'bg-slate-100' : 'bg-[#111318]'}`}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0.9, 0.7, 1.1], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={[bgColor]} />

        {/* Ambient & Studio Directional Lights for Clear Visibility */}
        <ambientLight intensity={isLightMode ? 0.95 : 0.65} />
        <directionalLight
          position={[4, 7, 4]}
          intensity={isLightMode ? 1.4 : 1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-1.5}
          shadow-camera-right={1.5}
          shadow-camera-top={1.5}
          shadow-camera-bottom={-1.5}
          shadow-camera-near={0.5}
          shadow-camera-far={12}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-4, 5, -4]} intensity={isLightMode ? 0.75 : 0.5} color="#E0F2FE" />
        <pointLight position={[0, -0.4, 0]} intensity={isLightMode ? 0.35 : 0.2} />

        {/* Ground grid */}
        <gridHelper args={[6, 24, gridPrimary, gridSecondary]} position={[0, -0.001, 0]} />

        {/* Contact Shadow for realism under legs */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={isLightMode ? 0.45 : 0.7}
          scale={2.4}
          blur={1.6}
          far={1.5}
        />

        {/* The Parametric Chair Model */}
        <ChairModel />

        {/* Camera Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 0.45, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={0.5}
          maxDistance={3.5}
          maxPolarAngle={Math.PI / 2 + 0.05}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Camera Angle Quick Presets (Top-Left) */}
      <div className={`absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-xl ${
        isLightMode
          ? 'bg-white/90 border-slate-200 text-slate-700'
          : 'bg-zinc-900/85 border-zinc-800 text-slate-300'
      }`}>
        <button
          onClick={() => handleSetCamera('iso')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-slate-300 hover:text-white'
          }`}
          title="Vista isométrica"
        >
          Isométrica
        </button>
        <button
          onClick={() => handleSetCamera('front')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-slate-300 hover:text-white'
          }`}
          title="Vista frontal"
        >
          Frente
        </button>
        <button
          onClick={() => handleSetCamera('side')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-slate-300 hover:text-white'
          }`}
          title="Vista lateral"
        >
          Lateral
        </button>
        <button
          onClick={() => handleSetCamera('rear')}
          className="px-2.5 py-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 rounded-lg transition-all border border-orange-500/30 dark:text-orange-400"
          title="Ver respaldo por detrás"
        >
          Dorso Respaldo
        </button>
        <button
          onClick={() => handleSetCamera('top')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-slate-300 hover:text-white'
          }`}
          title="Vista en planta"
        >
          Planta
        </button>
      </div>

      {/* Floating Toolbar (Bottom-Center) */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-2xl ${
        isLightMode
          ? 'bg-white/95 border-slate-200 shadow-slate-300/50'
          : 'bg-zinc-900/95 border-zinc-800 shadow-black/80'
      }`}>
        {/* Toggle 3D Dimensions Button - ACTIVAR / DESACTIVAR COTAS */}
        <button
          id="btn-toggle-cotas-3d"
          onClick={() => setShowDimensions3D(!showDimensions3D)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            showDimensions3D
              ? 'bg-orange-600 text-white shadow-orange-500/30'
              : isLightMode
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              : 'text-slate-300 hover:text-white hover:bg-zinc-800 border border-zinc-700'
          }`}
          title={showDimensions3D ? 'Ocultar cotas y dimensiones 3D' : 'Activar cotas y dimensiones 3D'}
        >
          <Ruler size={15} />
          <span>{showDimensions3D ? 'Cotas: ON' : 'Cotas: OFF'}</span>
        </button>

        <div className={`h-4 w-px ${isLightMode ? 'bg-slate-200' : 'bg-zinc-800'}`} />

        {/* Toggle Exploded View */}
        <button
          onClick={() => setExplodedView(!explodedView)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            explodedView
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Despiece / Vista explosionada de ensamble"
        >
          <Boxes size={14} />
          <span>Despiece</span>
        </button>

        {/* Toggle Auto Rotation */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            autoRotate
              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/50'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Rotación automática 360°"
        >
          <Sparkles size={14} />
          <span>Giro 360°</span>
        </button>

        {/* Toggle Background Light/Dark Mode */}
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className={`p-1.5 rounded-xl transition-all ${
            isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-zinc-800'
          }`}
          title={isLightMode ? 'Cambiar a fondo oscuro' : 'Cambiar a fondo claro'}
        >
          {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Reset Camera Button */}
        <button
          onClick={() => handleSetCamera('iso')}
          className={`p-1.5 rounded-xl transition-all ${
            isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Restablecer posición de cámara"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Technical Spec Badge (Bottom-Right) */}
      <div className={`hidden sm:flex absolute bottom-4 right-4 z-20 flex-col gap-1 backdrop-blur-md p-2.5 rounded-xl border text-[10px] font-mono pointer-events-none shadow-lg ${
        isLightMode
          ? 'bg-white/90 border-slate-200 text-slate-600'
          : 'bg-black/80 border-zinc-800 text-slate-400'
      }`}>
        <div className={`font-bold flex items-center gap-1.5 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Plano Proyecto Hormiga
        </div>
        <div>Asiento: 446 × 431 × 12 mm</div>
        <div>Respaldo: 461 × 219 mm (R396)</div>
        <div>Estructura: Barra/Tubo Ø 16 mm</div>
        <div>H Total: 775 mm | H Asiento: 450 mm</div>
      </div>
    </div>
  );
}
