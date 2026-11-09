const fs = require('fs');

// 1. Actualizar el Store de Zustand para permitir editar propiedades
let store = fs.readFileSync('src/store/kitchenStore.ts', 'utf8');
if (!store.includes('updateCabinet')) {
   store = store.replace(
      `setDrawingStart: (pos: [number, number] | null) => void;`,
      `setDrawingStart: (pos: [number, number] | null) => void;\n  updateCabinet: (id: string, updates: Partial<CabinetType>) => void;`
   );
   store = store.replace(
      `setDrawingStart: (pos) => set({ drawingStart: pos }),`,
      `setDrawingStart: (pos) => set({ drawingStart: pos }),\n  updateCabinet: (id, updates) => set((state) => ({ cabinets: state.cabinets.map(c => c.id === id ? { ...c, ...updates } : c) })),`
   );
   fs.writeFileSync('src/store/kitchenStore.ts', store);
}

// 2. Inyectar la barra lateral derecha en KitchenConfigurator
let config = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

if (!config.includes('Panel de Propiedades')) {
    config = config.replace(
       `const { viewMode, setViewMode, toolMode, setToolMode } = useKitchenStore();`,
       `const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();\n  const activeCabinet = cabinets.find(c => c.id === activeCabinetId);`
    );
    
    const rightSidebar = `
   {activeCabinetId && activeCabinet && (
      <div className="w-80 bg-zinc-900 border-l border-white/10 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar">
         {/* Panel de Propiedades */}
         <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h3 className="text-xs uppercase tracking-widest text-white font-bold">Propiedades</h3>
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-mono font-bold uppercase tracking-wider">{activeCabinet.type}</div>
         </div>
         <div className="p-6 flex flex-col gap-8">
            <div className="flex flex-col gap-5">
               <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Dimensiones
               </h4>
               
               <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-400">
                     <span>Ancho (cm)</span>
                     <span className="font-mono text-white bg-black/50 px-2 py-0.5 rounded">{activeCabinet.width}</span>
                  </div>
                  <input type="range" min="30" max="120" step="5" value={activeCabinet.width} onChange={(e) => updateCabinet(activeCabinet.id, { width: parseInt(e.target.value) })} className="w-full accent-blue-500 cursor-pointer" />
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-400">
                     <span>Alto (cm)</span>
                     <span className="font-mono text-white bg-black/50 px-2 py-0.5 rounded">{activeCabinet.height}</span>
                  </div>
                  <input type="range" min={activeCabinet.type === 'base' ? 70 : 40} max={activeCabinet.type === 'tall' ? 240 : 100} step="5" value={activeCabinet.height} onChange={(e) => updateCabinet(activeCabinet.id, { height: parseInt(e.target.value) })} className="w-full accent-blue-500 cursor-pointer" />
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-400">
                     <span>Profundidad (cm)</span>
                     <span className="font-mono text-white bg-black/50 px-2 py-0.5 rounded">{activeCabinet.depth}</span>
                  </div>
                  <input type="range" min="30" max="80" step="5" value={activeCabinet.depth} onChange={(e) => updateCabinet(activeCabinet.id, { depth: parseInt(e.target.value) })} className="w-full accent-blue-500 cursor-pointer" />
               </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
               <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Acabado
               </h4>
               <div className="grid grid-cols-1 gap-2">
                   <button onClick={() => updateCabinet(activeCabinet.id, { color: '#f8fafc' })} className={\`flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-white/10 border transition-all \${activeCabinet.color === '#f8fafc' ? 'border-orange-500' : 'border-white/5'}\`}>
                      <div className="w-6 h-6 rounded-full bg-[#f8fafc] border border-white/20"></div>
                      <span className="text-xs text-slate-300 font-semibold">Blanco Liso</span>
                   </button>
                   <button onClick={() => updateCabinet(activeCabinet.id, { color: '#64748b' })} className={\`flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-white/10 border transition-all \${activeCabinet.color === '#64748b' ? 'border-orange-500' : 'border-white/5'}\`}>
                      <div className="w-6 h-6 rounded-full bg-[#64748b] border border-white/20"></div>
                      <span className="text-xs text-slate-300 font-semibold">Gris Grafito</span>
                   </button>
                   <button onClick={() => updateCabinet(activeCabinet.id, { color: '#8b5a2b' })} className={\`flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-white/10 border transition-all \${activeCabinet.color === '#8b5a2b' ? 'border-orange-500' : 'border-white/5'}\`}>
                      <div className="w-6 h-6 rounded-full bg-[#8b5a2b] border border-white/20"></div>
                      <span className="text-xs text-slate-300 font-semibold">Roble Natural</span>
                   </button>
               </div>
            </div>
         </div>
      </div>
   )}
   </main>`;
    
    config = config.replace('</main>', rightSidebar);
    fs.writeFileSync('src/pages/KitchenConfigurator.tsx', config);
}
