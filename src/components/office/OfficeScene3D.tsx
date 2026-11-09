import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Grid, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useOfficeStore } from '../../store/officeStore';
import { OfficeFurniture3D } from './OfficeFurniture3D';
import { PlacedOfficeItem } from '../../types/office';

function CameraManager() {
  const { camera } = useThree();
  const cameraAngle = useOfficeStore((state) => state.cameraAngle);

  useEffect(() => {
    switch (cameraAngle) {
      case 'iso-ne':
        camera.position.set(22, 18, 22);
        camera.lookAt(0, 0, 0);
        break;
      case 'iso-nw':
        camera.position.set(-22, 18, 22);
        camera.lookAt(0, 0, 0);
        break;
      case 'top':
        camera.position.set(0, 30, 0.001);
        camera.lookAt(0, 0, 0);
        break;
      case 'perspective':
        camera.position.set(16, 12, 16);
        camera.lookAt(0, 0, 0);
        break;
    }
  }, [cameraAngle, camera]);

  return null;
}

function FloorPlanUnderlay3D() {
  const floorPlan = useOfficeStore((state) => state.floorPlan);
  const roomDimensions = useOfficeStore((state) => state.roomDimensions);

  const planTexture = useMemo(() => {
    if (!floorPlan.fileUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(floorPlan.fileUrl);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [floorPlan.fileUrl]);

  const floorWidth = floorPlan.fileUrl ? floorPlan.realWidthMeters : roomDimensions.widthMeters;
  const floorLength = floorPlan.fileUrl ? floorPlan.realHeightMeters : roomDimensions.lengthMeters;

  return (
    <group position={[floorPlan.offsetX, -0.005, floorPlan.offsetY]} rotation={[0, (floorPlan.rotationDeg * Math.PI) / 180, 0]}>
      {/* Plano base blanco técnico */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorWidth + 4, floorLength + 4]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </mesh>

      {/* Textura de la planta de arquitectura PDF si existe */}
      {planTexture && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[floorWidth, floorLength]} />
          <meshBasicMaterial
            map={planTexture}
            transparent
            opacity={floorPlan.opacity}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Contorno perimetral del espacio */}
      <lineSegments position={[0, 0.004, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(floorWidth, 0.01, floorLength)]} />
        <lineBasicMaterial color="#CBD5E1" linewidth={1.5} />
      </lineSegments>
    </group>
  );
}

function DraggableFurnitureItem({
  item,
  isSelected,
  onSelect,
  orbitControlsRef,
}: {
  item: PlacedOfficeItem;
  isSelected: boolean;
  onSelect: () => void;
  orbitControlsRef: React.RefObject<any>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const updateItemPosition = useOfficeStore((state) => state.updateItemPosition);
  const gridSnapMeters = useOfficeStore((state) => state.gridSnapMeters) || 0.05;

  return (
    <>
      <OfficeFurniture3D
        ref={meshRef}
        item={item}
        isSelected={isSelected}
        onSelect={onSelect}
      />

      {isSelected && !item.isLocked && meshRef.current && (
        <TransformControls
          object={meshRef}
          mode="translate"
          showY={false}
          size={0.7}
          translationSnap={gridSnapMeters}
          onMouseDown={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = false;
            }
          }}
          onMouseUp={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true;
            }
            if (meshRef.current) {
              const snap = gridSnapMeters || 0.05;
              const x = Math.round(meshRef.current.position.x / snap) * snap;
              const z = Math.round(meshRef.current.position.z / snap) * snap;
              const cleanX = Math.round(x * 100) / 100;
              const cleanZ = Math.round(z * 100) / 100;
              updateItemPosition(item.id, [cleanX, 0, cleanZ]);
            }
          }}
          onChange={() => {
            if (meshRef.current) {
              const snap = gridSnapMeters || 0.05;
              const x = Math.round(meshRef.current.position.x / snap) * snap;
              const z = Math.round(meshRef.current.position.z / snap) * snap;
              const cleanX = Math.round(x * 100) / 100;
              const cleanZ = Math.round(z * 100) / 100;
              updateItemPosition(item.id, [cleanX, 0, cleanZ]);
            }
          }}
        />
      )}
    </>
  );
}

export function OfficeScene3D() {
  const placedItems = useOfficeStore((state) => state.placedItems);
  const selectedItemId = useOfficeStore((state) => state.selectedItemId);
  const selectItem = useOfficeStore((state) => state.selectItem);
  const rotateItem = useOfficeStore((state) => state.rotateItem);
  const duplicateItem = useOfficeStore((state) => state.duplicateItem);
  const removeItem = useOfficeStore((state) => state.removeItem);
  const toggleItemReturnSide = useOfficeStore((state) => state.toggleItemReturnSide);
  const toggleItemLock = useOfficeStore((state) => state.toggleItemLock);
  const moveItemDelta = useOfficeStore((state) => state.moveItemDelta);
  const showGrid = useOfficeStore((state) => state.showGrid);
  const controlsRef = useRef<any>(null);

  // Atajos de teclado en la vista 3D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItemId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = e.shiftKey ? 0.5 : 0.05;

      if (e.key.toLowerCase() === 'r') {
        rotateItem(selectedItemId, Math.PI / 4);
      } else if (e.key.toLowerCase() === 'd') {
        duplicateItem(selectedItemId);
      } else if (e.key.toLowerCase() === 'l') {
        toggleItemLock(selectedItemId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeItem(selectedItemId);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveItemDelta(selectedItemId, 0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveItemDelta(selectedItemId, 0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveItemDelta(selectedItemId, -step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveItemDelta(selectedItemId, step, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, rotateItem, duplicateItem, toggleItemLock, removeItem, moveItemDelta]);

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);

  return (
    <div className="w-full h-full relative bg-[#F8FAFC]">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [20, 16, 20], fov: 38, near: 0.1, far: 200 }}
        onPointerMissed={() => selectItem(null)}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <CameraManager />

        {/* Iluminación tipo Render Axonométrico Profesional */}
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-20, 20, -15]} intensity={0.5} color="#E0F2FE" />
        <directionalLight position={[0, 20, -25]} intensity={0.4} color="#FFFBEB" />

        {/* Plano de arquitectura (Underlay PDF) */}
        <FloorPlanUnderlay3D />

        {/* Grilla técnica métrica tenue */}
        {showGrid && (
          <Grid
            position={[0, 0.001, 0]}
            args={[40, 40]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#E2E8F0"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#CBD5E1"
            fadeDistance={35}
            fadeStrength={1}
          />
        )}

        {/* Todos los muebles en escena con soporte de arrastre y selección */}
        {placedItems.map((item) => (
          <DraggableFurnitureItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            onSelect={() => selectItem(item.id)}
            orbitControlsRef={controlsRef}
          />
        ))}

        {/* Sombras de contacto suaves difusas */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.45}
          scale={35}
          blur={2}
          far={10}
          resolution={1024}
          color="#000000"
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          minDistance={3}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2 - 0.05}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Barra inferior flotante en 3D para el mueble seleccionado */}
      {selectedItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-zinc-900/95 backdrop-blur-md border border-orange-500/40 p-2.5 px-4 rounded-2xl shadow-2xl text-white animate-in slide-in-from-bottom-3 duration-200">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-orange-400">{selectedItem.name}</p>
              {selectedItem.isLocked && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold rounded">
                  Fijado
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Pos: [X: {selectedItem.position[0].toFixed(2)}m, Z: {selectedItem.position[2].toFixed(2)}m] | {selectedItem.dimensionsCm.width}x{selectedItem.dimensionsCm.depth} cm
            </p>
          </div>

          <div className="w-[1px] h-6 bg-zinc-700 mx-1" />

          {/* D-Pad de Micro-desplazamiento con botones */}
          <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800" title="Mover con botones de paso fino">
            <button
              onClick={() => moveItemDelta(selectedItem.id, -0.05, 0)}
              disabled={selectedItem.isLocked}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Mover Izquierda 5 cm (←)"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveItemDelta(selectedItem.id, 0, -0.05)}
                disabled={selectedItem.isLocked}
                className="p-1 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
                title="Mover Arriba 5 cm (↑)"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={() => moveItemDelta(selectedItem.id, 0, 0.05)}
                disabled={selectedItem.isLocked}
                className="p-1 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
                title="Mover Abajo 5 cm (↓)"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <button
              onClick={() => moveItemDelta(selectedItem.id, 0.05, 0)}
              disabled={selectedItem.isLocked}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Mover Derecha 5 cm (→)"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Botón Fijar / Bloquear en Plano */}
          <button
            onClick={() => toggleItemLock(selectedItem.id)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedItem.isLocked
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-slate-200'
            }`}
            title={selectedItem.isLocked ? 'Desbloquear para mover' : 'Fijar posición en el plano para no moverlo por error (Tecla L)'}
          >
            {selectedItem.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{selectedItem.isLocked ? 'Fijado' : 'Fijar Posición'}</span>
          </button>

          {/* Rotar */}
          <button
            onClick={() => rotateItem(selectedItem.id, Math.PI / 4)}
            disabled={selectedItem.isLocked}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Rotar 45° (Tecla R)"
          >
            <RotateCw size={14} />
            <span>Rotar 45°</span>
          </button>

          {/* Invertir retorno para escritorios en L */}
          {(selectedItem.type === 'desk-executive-l' || selectedItem.type === 'desk-open-l') && (
            <button
              onClick={() => toggleItemReturnSide(selectedItem.id)}
              disabled={selectedItem.isLocked}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Cambiar mano de retorno (Izquierda / Derecha)"
            >
              Mano: {selectedItem.returnSide === 'left' ? 'Izq' : 'Der'}
            </button>
          )}

          {/* Duplicar */}
          <button
            onClick={() => duplicateItem(selectedItem.id)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Duplicar Puesto (Tecla D)"
          >
            <Copy size={14} />
            <span>Duplicar</span>
          </button>

          {/* Eliminar */}
          <button
            onClick={() => removeItem(selectedItem.id)}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Eliminar (Tecla Supr)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
