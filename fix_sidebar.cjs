const fs = require('fs');
let content = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

content = content.replace(
  `{activeCabinetId && activeCabinet && (`,
  `{activeCabinetId && (
      <aside className="relative z-20 w-96 shrink-0 bg-black/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col custom-scrollbar pointer-events-auto">
        <h2 className={sectionTitle}>Configurar Módulo</h2>
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6 shadow-inner">
           <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">{activeCabinet?.variant || activeCabinet?.type}</h3>
              <button onClick={() => {
                 useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));
              }} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest">
                 <Trash2 size={12} />
                 Eliminar
              </button>
           </div>
           
           <SliderControl label="Ancho del Módulo" value={activeCabinet?.width || 0} min={activeCabinet?.variant === "spice_rack" ? 15 : 30} max={120} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinetId, { width: v })} />
           <SliderControl label="Alto Total" value={activeCabinet?.height || 0} min={activeCabinet?.type === 'base' ? 70 : 40} max={activeCabinet?.type === 'tall' ? 240 : 100} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinetId, { height: v })} />
           <SliderControl label="Profundidad" value={activeCabinet?.depth || 0} min={30} max={80} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinetId, { depth: v })} />
        </div>

        <h2 className={sectionTitle}>Diseño Local (Por Pieza)</h2>
        <div className="flex flex-col gap-2">
            <button onClick={() => updateCabinet(activeCabinetId, { color: '#f8fafc' })} className={activeCabinet?.color === '#f8fafc' ? activeBtnClass : btnClass}>
               Blanco Liso
            </button>
            <button onClick={() => updateCabinet(activeCabinetId, { color: '#64748b' })} className={activeCabinet?.color === '#64748b' ? activeBtnClass : btnClass}>
               Gris Grafito
            </button>
            <button onClick={() => updateCabinet(activeCabinetId, { color: '#8b5a2b' })} className={activeCabinet?.color === '#8b5a2b' ? activeBtnClass : btnClass}>
               Roble Natural
            </button>
        </div>
      </aside>
   )}`
);

// We need to also remove the OLD aside body if we just did a replace, wait.
// Actually, `content.replace` above replaced `{activeCabinetId && activeCabinet && (` with the WHOLE NEW ASIDE.
// Oh wait, then we have two asides!
