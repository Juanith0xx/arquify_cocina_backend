const fs = require('fs');
const path = require('path');

const dirs = [
  'src/pages',
  'src/store',
  'src/components/kitchen'
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// 1. Migrate App.tsx to ClosetConfigurator.tsx
const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
let closetContent = appTsx.replace(
  `export default function App() {`, 
  `export function ClosetConfigurator({ onNavigate }: { onNavigate: () => void }) {`
);
closetContent = closetContent.replace(
  `<span className="text-xl font-bold tracking-tighter uppercase">Mueble<span className="text-orange-500">Studio</span></span>`,
  `<button onClick={onNavigate} className="mr-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button><span className="text-xl font-bold tracking-tighter uppercase">Mueble<span className="text-orange-500">Studio</span></span>`
);
fs.writeFileSync('src/pages/ClosetConfigurator.tsx', closetContent);

// 2. New App.tsx (Router)
const newAppTsx = `import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { ClosetConfigurator } from './pages/ClosetConfigurator';
import { KitchenConfigurator } from './pages/KitchenConfigurator';

export default function App() {
  const [route, setRoute] = useState<'home' | 'closet' | 'kitchen'>('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ar') === 'true' || params.get('config')) {
      setRoute('closet');
    }
  }, []);

  return (
    <>
      {route === 'home' && <Home onNavigate={setRoute} />}
      {route === 'closet' && <ClosetConfigurator onNavigate={() => setRoute('home')} />}
      {route === 'kitchen' && <KitchenConfigurator onNavigate={() => setRoute('home')} />}
    </>
  );
}
`;
fs.writeFileSync('src/App.tsx', newAppTsx);

// 3. Home.tsx
const homeTsx = `import React from 'react';
import { Box, LayoutDashboard, ArrowRight } from 'lucide-react';

export function Home({ onNavigate }: { onNavigate: (route: 'closet' | 'kitchen') => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans p-8 flex flex-col items-center overflow-y-auto">
      <header className="w-full max-w-6xl flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-sm rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black rotate-[-45deg]"></div>
          </div>
          <span className="text-2xl font-bold tracking-tighter uppercase">Mueble<span className="text-orange-500">Studio</span></span>
        </div>
        <div className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Suite de Diseño 3D
        </div>
      </header>

      <main className="w-full max-w-6xl flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 tracking-tight">Planifica tus espacios con <br/><span className="text-orange-500">precisión milimétrica</span></h1>
        <p className="text-slate-400 text-center max-w-2xl mb-16 text-lg">Selecciona un módulo de diseño para comenzar. Crea muebles paramétricos detallados o planifica habitaciones completas en 2D y 3D.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Closet Card */}
          <div 
            onClick={() => onNavigate('closet')}
            className="group relative bg-zinc-900 border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden flex flex-col items-start min-h-[320px]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-orange-500/20"></div>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 mb-6 z-10 relative">
              <Box size={32} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-wide mb-2 z-10 relative">Clóset Personalizado</h2>
            <p className="text-slate-400 mb-8 max-w-sm z-10 relative">Configurador paramétrico avanzado. Ajusta dimensiones, materiales, divisiones internas y herrajes en tiempo real.</p>
            <div className="mt-auto flex items-center gap-2 text-orange-500 font-bold uppercase text-xs tracking-wider group-hover:gap-4 transition-all z-10 relative">
              Iniciar Diseño <ArrowRight size={14} />
            </div>
          </div>

          {/* Kitchen Card */}
          <div 
            onClick={() => onNavigate('kitchen')}
            className="group relative bg-zinc-900 border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden flex flex-col items-start min-h-[320px]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-blue-500/20"></div>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 mb-6 z-10 relative">
              <LayoutDashboard size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-wide mb-2 z-10 relative">Planificador de Cocinas</h2>
            <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded mb-3 z-10 relative">Nuevo Motor BIM</div>
            <p className="text-slate-400 mb-8 max-w-sm z-10 relative">Dibuja muros en 2D y arrastra gabinetes inteligentes en 3D. Diseño espacial completo con imantación automática.</p>
            <div className="mt-auto flex items-center gap-2 text-blue-500 font-bold uppercase text-xs tracking-wider group-hover:gap-4 transition-all z-10 relative">
              Abrir Planificador <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/Home.tsx', homeTsx);

// 4. KitchenStore
const storeTsx = `import { create } from 'zustand';

export type ViewMode = '2d' | '3d';
export type ToolMode = 'select' | 'draw_wall' | 'place_base' | 'place_wall' | 'place_tall' | 'place_island';

export interface WallType {
  id: string;
  start: [number, number];
  end: [number, number];
  thickness: number;
  height: number;
}

export interface CabinetType {
  id: string;
  type: 'base' | 'wall' | 'tall' | 'island';
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  rotation: number;
  color: string;
}

interface KitchenState {
  viewMode: ViewMode;
  toolMode: ToolMode;
  walls: WallType[];
  cabinets: CabinetType[];
  activeCabinetId: string | null;
  drawingStart: [number, number] | null;

  setViewMode: (mode: ViewMode) => void;
  setToolMode: (mode: ToolMode) => void;
  addWall: (wall: WallType) => void;
  addCabinet: (cabinet: CabinetType) => void;
  setActiveCabinet: (id: string | null) => void;
  setDrawingStart: (pos: [number, number] | null) => void;
}

export const useKitchenStore = create<KitchenState>((set) => ({
  viewMode: '3d',
  toolMode: 'select',
  walls: [],
  cabinets: [],
  activeCabinetId: null,
  drawingStart: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setToolMode: (mode) => set({ toolMode: mode, drawingStart: null }),
  addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
  addCabinet: (cabinet) => set((state) => ({ cabinets: [...state.cabinets, cabinet] })),
  setActiveCabinet: (id) => set({ activeCabinetId: id }),
  setDrawingStart: (pos) => set({ drawingStart: pos }),
}));
`;
fs.writeFileSync('src/store/kitchenStore.ts', storeTsx);

// 5. KitchenConfigurator.tsx
const configTsx = `import React from 'react';
import { useKitchenStore } from '../store/kitchenStore';
import { KitchenScene } from '../components/kitchen/KitchenScene';
import { ArrowLeft, Box, Square, Move3D, PenTool, LayoutGrid } from 'lucide-react';

export function KitchenConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const { viewMode, setViewMode, toolMode, setToolMode } = useKitchenStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-slate-200 font-sans overflow-hidden">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={onNavigate} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tighter uppercase">Planificador<span className="text-blue-500">Cocinas</span></span>
          </div>
        </div>
        <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('2d')}
            className={\`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors \${viewMode === '2d' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-white'}\`}
          >
            Plano 2D
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={\`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors \${viewMode === '3d' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-white'}\`}
          >
            Vista 3D
          </button>
        </div>
      </nav>
      <main className="flex flex-1 overflow-hidden relative">
         <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-10 shadow-2xl">
            <div className="p-4 border-b border-white/10">
               <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Herramientas</h3>
               <div className="flex flex-col gap-2">
                  <ToolButton active={toolMode === 'select'} onClick={() => setToolMode('select')} icon={<Move3D size={16}/>} label="Seleccionar" />
                  <ToolButton active={toolMode === 'draw_wall'} onClick={() => { setToolMode('draw_wall'); setViewMode('2d'); }} icon={<PenTool size={16}/>} label="Dibujar Muro (2D)" />
               </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
               <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Catálogo Paramétrico</h3>
               <div className="flex flex-col gap-2">
                  <ToolButton active={toolMode === 'place_base'} onClick={() => { setToolMode('place_base'); setViewMode('3d'); }} icon={<Box size={16}/>} label="Mueble Base" />
                  <ToolButton active={toolMode === 'place_wall'} onClick={() => { setToolMode('place_wall'); setViewMode('3d'); }} icon={<Square size={16}/>} label="Aéreo (Mural)" />
                  <ToolButton active={toolMode === 'place_tall'} onClick={() => { setToolMode('place_tall'); setViewMode('3d'); }} icon={<LayoutGrid size={16}/>} label="Despensa / Horno" />
                  <ToolButton active={toolMode === 'place_island'} onClick={() => { setToolMode('place_island'); setViewMode('3d'); }} icon={<Box size={16}/>} label="Isla Libre" />
               </div>
            </div>
         </div>
         <div className="flex-1 relative bg-[#111]">
            <KitchenScene />
            {toolMode === 'draw_wall' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-xs font-semibold text-slate-300 pointer-events-none uppercase tracking-wider">
                Haz clic en la grilla para iniciar un muro. Pulsa ESC para cancelar.
              </div>
            )}
            {toolMode.startsWith('place_') && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-500/20 backdrop-blur-md px-6 py-3 rounded-full border border-blue-500/50 text-xs font-semibold text-blue-200 pointer-events-none uppercase tracking-wider">
                Mueve el cursor sobre un muro para imantar. Clic para posicionar.
              </div>
            )}
         </div>
      </main>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={\`flex items-center gap-3 p-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border \${active ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'}\`}
    >
      {icon}
      <span className="text-left leading-tight">{label}</span>
    </button>
  )
}
`;
fs.writeFileSync('src/pages/KitchenConfigurator.tsx', configTsx);

// 6. Wall.tsx
const wallTsx = `import React from 'react';
import { WallType } from '../../store/kitchenStore';
import { Edges } from '@react-three/drei';

export function Wall({ start, end, thickness, height }: WallType) {
   const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
   const cx = (start[0] + end[0]) / 2;
   const cz = (start[1] + end[1]) / 2;
   const rotY = Math.atan2(start[0] - end[0], start[1] - end[1]);

   return (
     <group name="wallGroup" position={[cx, height/2, cz]} rotation={[0, rotY, 0]}>
       <mesh name="wall" castShadow receiveShadow>
         <boxGeometry args={[thickness, height, length]} />
         <meshStandardMaterial color="#e5e5e5" roughness={0.9} />
         <Edges scale={1} threshold={15} color="#a3a3a3" />
       </mesh>
     </group>
   );
}
`;
fs.writeFileSync('src/components/kitchen/Wall.tsx', wallTsx);

// 7. Cabinet.tsx
const cabinetTsx = `import React from 'react';
import { CabinetType, useKitchenStore } from '../../store/kitchenStore';
import { Edges } from '@react-three/drei';

export function Cabinet({ id, type, width, height, depth, position, rotation, color }: CabinetType) {
   const { activeCabinetId, setActiveCabinet } = useKitchenStore();
   const isActive = activeCabinetId === id;

   return (
     <group 
       position={position} 
       rotation={[0, rotation, 0]} 
       onClick={(e) => { e.stopPropagation(); setActiveCabinet(id); }}
     >
       <mesh castShadow receiveShadow>
         <boxGeometry args={[width, height, depth]} />
         <meshStandardMaterial color={color} roughness={0.6} />
         <Edges scale={1.0} threshold={15} color={isActive ? "#3b82f6" : "#64748b"} />
       </mesh>
       
       {/* Simple Countertop for base/island */}
       {(type === 'base' || type === 'island') && (
         <mesh position={[0, height/2 + 1, 0]} castShadow>
           <boxGeometry args={[width + 2, 2, depth + 2]} />
           <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
         </mesh>
       )}

       {isActive && (
         <mesh>
           <boxGeometry args={[width + 4, height + 4, depth + 4]} />
           <meshBasicMaterial transparent opacity={0} depthWrite={false} />
           <Edges scale={1.0} color="#3b82f6" />
         </mesh>
       )}
     </group>
   );
}
`;
fs.writeFileSync('src/components/kitchen/Cabinet.tsx', cabinetTsx);

// 8. KitchenScene.tsx
const sceneTsx = `import React, { useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useKitchenStore } from '../../store/kitchenStore';
import { Wall } from './Wall';
import { Cabinet } from './Cabinet';

function SceneContent() {
  const { viewMode, toolMode, walls, cabinets, addWall, drawingStart, setDrawingStart, addCabinet, setToolMode, setActiveCabinet } = useKitchenStore();
  const [currentMousePos, setCurrentMousePos] = useState<[number, number] | null>(null);
  const [ghostCabinet, setGhostCabinet] = useState<{pos: [number,number,number], rot: number} | null>(null);
  const { camera, raycaster, pointer, scene } = useThree();

  const is2D = viewMode === '2d';

  useFrame(() => {
    if (toolMode === 'draw_wall' && drawingStart) {
      raycaster.setFromCamera(pointer, camera);
      const ground = scene.getObjectByName('groundPlane');
      if (ground) {
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
          const x = Math.round(intersects[0].point.x / 10) * 10;
          const z = Math.round(intersects[0].point.z / 10) * 10;
          setCurrentMousePos([x, z]);
        }
      }
    } else if (toolMode.startsWith('place_') && !is2D) {
      raycaster.setFromCamera(pointer, camera);
      const wallGroups = scene.children.filter(c => c.name === 'kitchenGroup')[0]?.children.filter(c => c.name === 'wallGroup') || [];
      const wallIntersects = raycaster.intersectObjects(wallGroups, true);
      const ground = scene.getObjectByName('groundPlane');
      const groundIntersects = ground ? raycaster.intersectObject(ground) : [];

      let placed = false;
      const isIsland = toolMode === 'place_island';
      const cabDepth = 60; 
      const cabHeight = toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : 80);
      const yOffset = toolMode === 'place_wall' ? 140 : 0; 

      if (wallIntersects.length > 0 && !isIsland) {
        const hit = wallIntersects[0];
        
        // Transform normal to world space
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
        const worldNormal = hit.face!.normal.clone().applyMatrix3(normalMatrix).normalize();
        
        const hitPoint = hit.point;
        const pos: [number,number,number] = [
          hitPoint.x + worldNormal.x * (cabDepth/2),
          yOffset + cabHeight/2,
          hitPoint.z + worldNormal.z * (cabDepth/2)
        ];
        
        // Rotation to align with wall (facing outwards)
        const rot = Math.atan2(worldNormal.x, worldNormal.z);
        setGhostCabinet({ pos, rot });
        placed = true;
      }

      if (!placed && groundIntersects.length > 0) {
        const hit = groundIntersects[0];
        const pos: [number,number,number] = [hit.point.x, yOffset + cabHeight/2, hit.point.z];
        setGhostCabinet({ pos, rot: 0 });
      }
    } else {
       setGhostCabinet(null);
       if (currentMousePos) setCurrentMousePos(null);
    }
  });

  const handlePointerDown = (e: any) => {
    if (toolMode === 'select') {
      setActiveCabinet(null);
      return;
    }
    e.stopPropagation();

    if (toolMode === 'draw_wall') {
      const pt = currentMousePos || [e.point.x, e.point.z];
      if (!drawingStart) {
        setDrawingStart(pt);
      } else {
        addWall({
          id: crypto.randomUUID(),
          start: drawingStart,
          end: pt,
          thickness: 15,
          height: 240
        });
        setDrawingStart(pt); 
      }
    } else if (toolMode.startsWith('place_') && ghostCabinet) {
      const typeMap: any = {
         'place_base': 'base',
         'place_wall': 'wall',
         'place_tall': 'tall',
         'place_island': 'island'
      };
      addCabinet({
         id: crypto.randomUUID(),
         type: typeMap[toolMode],
         width: 60,
         height: toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : 80),
         depth: 60,
         position: ghostCabinet.pos,
         rotation: ghostCabinet.rot,
         color: '#cbd5e1'
      });
      setToolMode('select');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
         setDrawingStart(null);
         setToolMode('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDrawingStart, setToolMode]);

  return (
    <>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 150]} castShadow intensity={1.2} shadow-mapSize={[2048, 2048]} />
      <Environment preset="city" />

      {is2D ? (
        <OrthographicCamera makeDefault position={[0, 1000, 0]} rotation={[-Math.PI/2, 0, 0]} zoom={2.5} near={0.1} far={2000} />
      ) : (
        <PerspectiveCamera makeDefault position={[300, 300, 400]} fov={45} />
      )}
      
      <OrbitControls 
        enableRotate={!is2D} 
        enablePitch={!is2D}
        minPolarAngle={0} 
        maxPolarAngle={is2D ? 0 : Math.PI / 2 - 0.05} 
        target={[0, 0, 0]}
      />

      <group name="kitchenGroup">
        {/* Ground Plane */}
        <mesh name="groundPlane" rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow onPointerDown={handlePointerDown}>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
        
        {is2D && (
          <Grid position={[0, 0.1, 0]} args={[2000, 2000]} infiniteGrid fadeDistance={1500} sectionColor="#666" cellColor="#333" />
        )}

        {walls.map(wall => <Wall key={wall.id} {...wall} />)}
        {cabinets.map(cab => <Cabinet key={cab.id} {...cab} />)}

        {/* Drawing Preview */}
        {toolMode === 'draw_wall' && drawingStart && currentMousePos && (
          <WallPreview start={drawingStart} end={currentMousePos} thickness={15} height={240} />
        )}

        {/* Cabinet Preview */}
        {toolMode.startsWith('place_') && ghostCabinet && !is2D && (
           <mesh position={ghostCabinet.pos} rotation={[0, ghostCabinet.rot, 0]}>
              <boxGeometry args={[60, toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : 80), 60]} />
              <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
           </mesh>
        )}
      </group>
    </>
  )
}

export function KitchenScene() {
  return (
    <Canvas shadows>
      <SceneContent />
    </Canvas>
  )
}

function WallPreview({start, end, thickness, height}: any) {
   const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
   const cx = (start[0] + end[0]) / 2;
   const cz = (start[1] + end[1]) / 2;
   const rotY = Math.atan2(start[0] - end[0], start[1] - end[1]);

   return (
     <mesh position={[cx, height/2, cz]} rotation={[0, rotY, 0]}>
       <boxGeometry args={[thickness, height, length]} />
       <meshStandardMaterial color="#3b82f6" transparent opacity={0.5} />
     </mesh>
   );
}
`;
fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', sceneTsx);
