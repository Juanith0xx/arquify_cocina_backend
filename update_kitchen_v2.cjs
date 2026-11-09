const fs = require('fs');

// 1. UPDATE KITCHEN STORE
const storeContent = `import { create } from 'zustand';

export type ViewMode = '2d' | '3d';
export type ToolMode = 'select' | 'draw_wall' | 'place_base_1_door' | 'place_base_2_doors' | 'place_base_1_door_1_drawer' | 'place_base_4_drawers' | 'place_base_2_pot_drawers' | 'place_base_spice_rack' | 'place_wall' | 'place_tall' | 'place_island';

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
  variant?: string;
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
  updateCabinet: (id: string, updates: Partial<CabinetType>) => void;
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
  updateCabinet: (id, updates) => set((state) => ({ cabinets: state.cabinets.map(c => c.id === id ? { ...c, ...updates } : c) })),
}));
`;
fs.writeFileSync('src/store/kitchenStore.ts', storeContent);


// 2. UPDATE KITCHEN SCENE (GHOST CABINET LOGIC)
let sceneTsx = fs.readFileSync('src/components/kitchen/KitchenScene.tsx', 'utf8');

// Replace ghost cabinet creation block to respect variants default widths
sceneTsx = sceneTsx.replace(
  /addCabinet\(\{[\s\S]*?\}\);/m,
  `const isBase = toolMode.startsWith('place_base_');
      const cabType = isBase ? 'base' : toolMode.replace('place_', '');
      const cabVariant = isBase ? toolMode.replace('place_base_', '') : 'open';
      
      let cabWidth = 60;
      if (cabVariant === 'spice_rack') cabWidth = 15;
      if (cabVariant === '2_doors' || cabVariant === '2_pot_drawers') cabWidth = 80;

      addCabinet({
         id: crypto.randomUUID(),
         type: cabType as any,
         variant: cabVariant,
         width: cabWidth,
         height: cabType === 'tall' ? 200 : (cabType === 'wall' ? 60 : 80),
         depth: 60,
         position: ghostCabinet.pos,
         rotation: ghostCabinet.rot,
         color: '#f8fafc'
      });`
);

// Fix ghost preview width for variants
sceneTsx = sceneTsx.replace(
  /<boxGeometry args=\{\[60, toolMode === 'place_tall' \? 200 : \(toolMode === 'place_wall' \? 60 : 80\), 60\]\} \/>/m,
  `<boxGeometry args={[
                  toolMode === 'place_base_spice_rack' ? 15 : (toolMode.includes('2_doors') || toolMode.includes('pot_drawers') ? 80 : 60), 
                  toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : 80), 
                  60
              ]} />`
);
fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', sceneTsx);


// 3. UPDATE CABINET.TSX (ADDING FRONTS)
const cabinetTsx = `import React from 'react';
import { CabinetType, useKitchenStore } from '../../store/kitchenStore';
import { Edges } from '@react-three/drei';
import { Board } from '../Board';

export function Cabinet({ id, type, variant, width, height, depth, position, rotation, color }: CabinetType) {
   const { activeCabinetId, setActiveCabinet } = useKitchenStore();
   const isActive = activeCabinetId === id;
   const thickness = 1.5;

   const renderParametricBody = () => {
      const isBaseOrTall = type === 'base' || type === 'tall' || type === 'island';
      const legsHeight = isBaseOrTall ? 15 : 0;
      const cabH = height - legsHeight;
      const innerW = width - (thickness * 2);
      const gap = 0.3; // 3mm de cantería
      const frontZ = depth/2 + thickness/2;

      const renderFronts = () => {
         if (!variant || variant === 'open') return null;
         
         if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} color={color} />;
         }
         
         if (variant === '2_doors') {
            const doorW = (width - gap*3) / 2;
            return (
               <>
                  <Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={color} />
                  <Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={color} />
               </>
            );
         }
         
         if (variant === '1_door_1_drawer') {
            const drawerH = 15;
            const doorH = cabH - drawerH - gap*3;
            return (
               <>
                  <Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} color={color} />
                  <Board position={[0, legsHeight + gap*2 + doorH + drawerH/2, frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
               </>
            );
         }
         
         if (variant === '4_drawers') {
            const drawerH = (cabH - gap*5) / 4;
            return (
               <>
                  {[0,1,2,3].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
                  ))}
               </>
            );
         }
         
         if (variant === '2_pot_drawers') {
            const drawerH = (cabH - gap*3) / 2;
            return (
               <>
                  {[0,1].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
                  ))}
               </>
            );
         }
         return null;
      };

      return (
         <group position={[0, -height/2, 0]}>
            {isBaseOrTall && (
               <>
                  <mesh position={[-width/2 + 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[-width/2 + 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
               </>
            )}
            
            <Board position={[-width/2 + thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={color} />
            <Board position={[width/2 - thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={color} />
            <Board position={[0, legsHeight + thickness/2, 0]} args={[innerW, thickness, depth]} color={color} />
            <Board position={[0, legsHeight + cabH/2, -depth/2 + thickness/2]} args={[innerW, cabH - thickness*2, thickness]} color={color} />
            
            {type === 'base' || type === 'island' ? (
               <>
                  <Board position={[0, height - thickness/2, depth/2 - 5]} args={[innerW, thickness, 10]} color={color} />
                  <Board position={[0, height - thickness/2, -depth/2 + thickness + 5]} args={[innerW, thickness, 10]} color={color} />
               </>
            ) : (
               <Board position={[0, height - thickness/2, 0]} args={[innerW, thickness, depth]} color={color} />
            )}

            {renderFronts()}
         </group>
      );
   };

   return (
     <group position={position} rotation={[0, rotation, 0]} onClick={(e) => { e.stopPropagation(); setActiveCabinet(id); }}>
       {renderParametricBody()}
       {(type === 'base' || type === 'island') && (
         <mesh position={[0, height/2 + 1, 0]} castShadow>
           <boxGeometry args={[width + 2, 2, depth + 2]} />
           <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
         </mesh>
       )}
       {isActive && (
         <mesh>
           <boxGeometry args={[width + 2, height + 2, depth + 2]} />
           <meshBasicMaterial transparent opacity={0} depthWrite={false} />
           <Edges scale={1.0} color="#3b82f6" threshold={15} />
         </mesh>
       )}
     </group>
   );
}
`;
fs.writeFileSync('src/components/kitchen/Cabinet.tsx', cabinetTsx);

// 4. UPDATE KITCHEN CONFIGURATOR (UI & Shrink-0)
let configTsx = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

// Replace left sidebar classes
configTsx = configTsx.replace(
  'className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-10 shadow-2xl"',
  'className="w-64 shrink-0 bg-zinc-900 border-r border-white/10 flex flex-col z-10 shadow-2xl"'
);

// Replace right sidebar classes
configTsx = configTsx.replace(
  'className="w-80 bg-zinc-900 border-l border-white/10 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar"',
  'className="w-80 shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar"'
);

// Insert expanded catalog
const oldCatalog = `<ToolButton active={toolMode === 'place_base'} onClick={() => { setToolMode('place_base'); setViewMode('3d'); }} icon={<Box size={16}/>} label="Mueble Base" />`;
const newCatalog = `
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Bases</h3>
                  <div className="flex flex-col gap-1 mb-4">
                     <ToolButton active={toolMode === 'place_base_1_door'} onClick={() => { setToolMode('place_base_1_door'); setViewMode('3d'); }} icon={<Box size={14}/>} label="1 Puerta" />
                     <ToolButton active={toolMode === 'place_base_1_door_1_drawer'} onClick={() => { setToolMode('place_base_1_door_1_drawer'); setViewMode('3d'); }} icon={<Box size={14}/>} label="1 Pta + 1 Cajón" />
                     <ToolButton active={toolMode === 'place_base_2_doors'} onClick={() => { setToolMode('place_base_2_doors'); setViewMode('3d'); }} icon={<Box size={14}/>} label="2 Puertas" />
                     <ToolButton active={toolMode === 'place_base_4_drawers'} onClick={() => { setToolMode('place_base_4_drawers'); setViewMode('3d'); }} icon={<Box size={14}/>} label="4 Cajones" />
                     <ToolButton active={toolMode === 'place_base_2_pot_drawers'} onClick={() => { setToolMode('place_base_2_pot_drawers'); setViewMode('3d'); }} icon={<Box size={14}/>} label="2 Olleros" />
                     <ToolButton active={toolMode === 'place_base_spice_rack'} onClick={() => { setToolMode('place_base_spice_rack'); setViewMode('3d'); }} icon={<Box size={14}/>} label="Especiero" />
                  </div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Murales & Despensas</h3>
`;
configTsx = configTsx.replace(oldCatalog, newCatalog);

// Fix width slider minimum for spice racks
configTsx = configTsx.replace(
  '<input type="range" min="30"',
  '<input type="range" min={activeCabinet.variant === "spice_rack" ? 15 : 30}'
);

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', configTsx);
