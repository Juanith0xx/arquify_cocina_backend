const fs = require('fs');
let content = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

const oldAsideMatch = /\{activeCabinetId && activeCabinet && \([\s\S]*?<\/aside>\n\s*\)\}/;

const newSidebar = `{activeCabinetId && activeCabinet && (
      <aside className="relative z-20 w-96 shrink-0 bg-black/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col custom-scrollbar pointer-events-auto">
        <h2 className={sectionTitle}>Configurar Módulo</h2>
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6 shadow-inner">
           <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">{activeCabinet.variant || activeCabinet.type}</h3>
              <button onClick={() => {
                 useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));
              }} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest">
                 <Trash2 size={12} />
                 Eliminar
              </button>
           </div>
           
           <SliderControl label="Ancho del Módulo" value={activeCabinet.width} min={activeCabinet.variant === "spice_rack" ? 15 : 30} max={120} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinet.id, { width: v })} />
           <SliderControl label="Alto Total" value={activeCabinet.height} min={activeCabinet.type === 'base' ? 70 : 40} max={activeCabinet.type === 'tall' ? 240 : 100} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinet.id, { height: v })} />
           <SliderControl label="Profundidad" value={activeCabinet.depth} min={30} max={80} step={5} unit="cm" onChange={(v) => updateCabinet(activeCabinet.id, { depth: v })} />
        </div>

        <h2 className={sectionTitle}>Diseño Local (Por Pieza)</h2>
        <div className="flex flex-col gap-2">
            <button onClick={() => updateCabinet(activeCabinet.id, { color: '#f8fafc' })} className={activeCabinet.color === '#f8fafc' ? activeBtnClass : btnClass}>
               Blanco Liso
            </button>
            <button onClick={() => updateCabinet(activeCabinet.id, { color: '#64748b' })} className={activeCabinet.color === '#64748b' ? activeBtnClass : btnClass}>
               Gris Grafito
            </button>
            <button onClick={() => updateCabinet(activeCabinet.id, { color: '#8b5a2b' })} className={activeCabinet.color === '#8b5a2b' ? activeBtnClass : btnClass}>
               Roble Natural
            </button>
        </div>
      </aside>
   )}`;

content = content.replace(oldAsideMatch, newSidebar);

// I might have messed up the previous replace, let's just make sure.
// Let's actually git checkout or restore the file if it's too broken, but we can just regex replace everything after `<div className="flex-1 relative bg-[#111]">...</div>`
