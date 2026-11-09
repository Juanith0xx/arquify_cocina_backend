import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import { useHplBathroomStore } from '../../store/hplBathroomStore';
import { HplTilesFloorWall } from './HplTilesFloorWall';
import { HplBathroom3D } from './HplBathroom3D';
import { HplSanitaryFixtures } from './HplSanitaryFixtures';
import { RotateCcw, Eye, Sparkles } from 'lucide-react';

export function HplBathroomScene() {
  const { room, cubicles, urinalScreens, panelHeight, footHeight, toggleAllDoors } = useHplBathroomStore();
  const controlsRef = useRef<any>(null);

  const roomWidthM = room.roomWidth / 1000;
  const roomLengthM = room.roomLength / 1000;
  const roomHeightM = room.roomHeight / 1000;

  // Ubicación de la batería de cabinas en la sala (pegada al muro izquierdo y posterior)
  const totalBatteryWidthM = cubicles.reduce((acc, c) => acc + c.cubicleWidth, 0) / 1000;
  const maxDepthM = Math.max(...cubicles.map((c) => c.cubicleDepth), 1400) / 1000;

  // Centro de cabinas con encuadre interior estricto adosado al muro de fondo
  const batteryOriginX = Math.max(-roomWidthM / 2 + 0.1, Math.min(-roomWidthM / 2 + 0.3, roomWidthM / 2 - totalBatteryWidthM - 0.1));
  const batteryOriginZ = -roomLengthM / 2 + maxDepthM; // Batería frontal alineada para que el fondo toque el muro posterior
  const urinalsWallZ = -roomLengthM / 2 + 0.005; // Cara frontal del muro posterior cerámico

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0A0F1D] select-none overflow-hidden">
      {/* Floating Toolbar Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-xl shadow-xl">
        <button
          onClick={toggleAllDoors}
          className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600/30 hover:border-sky-500/50 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 hover:text-sky-300 transition-all flex items-center gap-1.5"
          title="Abrir / Cerrar puertas de cabinas"
        >
          <Eye size={14} className="text-sky-400" />
          <span>Abrir/Cerrar Puertas</span>
        </button>

        <button
          onClick={resetCamera}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all"
          title="Restablecer Cámara 3D"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Leyenda de Cota 3D en pantalla */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl text-xs text-slate-300 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[10px]">Parámetros Activos</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
          <span>Altura Total: <strong className="text-slate-200">{panelHeight + footHeight} mm</strong></span>
          <span>Despeje Suelo: <strong className="text-slate-200">{footHeight} mm</strong></span>
          <span>Largo Batería: <strong className="text-slate-200">{Math.round(totalBatteryWidthM * 1000)} mm</strong></span>
          <span>Cerámicas: <strong className="text-slate-200">60x60 cm Blanco</strong></span>
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [3.8, 2.6, 4.2], fov: 42 }}
        className="w-full h-full"
      >
        {/* Iluminación de Estudio y Sala Sanitaria */}
        <ambientLight intensity={0.7} color="#ffffff" />

        {/* Luz Principal Solar / Cenital */}
        <directionalLight
          position={[4, 6, 3]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color="#FFFDF8"
        />

        {/* Luz de Relleno Suave */}
        <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#E0F2FE" />
        <pointLight position={[0, roomHeightM - 0.2, 0]} intensity={0.8} distance={10} color="#FFFFFF" />

        {/* 1. Entorno de Cerámicas 60x60 en Suelo y Muros */}
        <HplTilesFloorWall
          roomWidth={room.roomWidth}
          roomLength={room.roomLength}
          roomHeight={room.roomHeight}
          tileColor={room.wallTileColor}
          floorColor={room.floorTileColor}
        />

        {/* 2. Artefactos Sanitarios (Inodoros y Urinarios cerámicos) */}
        {room.showFixtures && (
          <HplSanitaryFixtures
            cubicles={cubicles}
            urinalScreens={urinalScreens}
            batteryOriginX={batteryOriginX}
            batteryOriginZ={batteryOriginZ}
            urinalsWallZ={urinalsWallZ}
            thicknessDivider={useHplBathroomStore.getState().thicknessDivider}
          />
        )}

        {/* 3. Sistema Modular de Cabinas HPL Abet Laminati & Quincallería JNF */}
        <HplBathroom3D
          batteryOriginX={batteryOriginX}
          batteryOriginZ={batteryOriginZ}
          urinalsWallZ={urinalsWallZ}
        />

        {/* Sombras de Contacto */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.65}
          scale={10}
          blur={1.5}
          far={4}
          color="#0F172A"
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          minDistance={1.2}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.02} // Evita ver por debajo del suelo
          target={[batteryOriginX + totalBatteryWidthM / 2, (panelHeight + footHeight) / 2000, batteryOriginZ - maxDepthM / 2]}
        />
      </Canvas>
    </div>
  );
}
