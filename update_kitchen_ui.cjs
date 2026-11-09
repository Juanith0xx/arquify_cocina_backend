const fs = require('fs');

let configTsx = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

const sliderAndClasses = `import React from 'react';
import { useKitchenStore } from '../store/kitchenStore';
import { KitchenScene } from '../components/kitchen/KitchenScene';
import { ArrowLeft, Box, Square, Move3D, PenTool, LayoutGrid, Trash2 } from 'lucide-react';

const sectionTitle = "text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-3 mt-6 first:mt-0";
const labelClass = "text-[10px] uppercase tracking-widest text-slate-400";
const btnClass = "w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-center cursor-pointer hover:border-orange-500/50 hover:bg-white/10 transition-colors text-[10px] uppercase tracking-wide text-slate-300";
const activeBtnClass = "w-full p-2.5 bg-orange-500/10 border border-orange-500 rounded-lg text-center cursor-pointer text-orange-500 transition-colors text-[10px] uppercase tracking-wide font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]";

const SliderControl = ({ label, value, min, max, step = 1, unit = "", onChange }: { label: string, value: number, min: number, max: number, step?: number, unit?: string, onChange: (val: number) => void }) => (
  <div className="flex flex-col gap-2 mb-2">
    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-400">
      <span>{label}</span>
      <span className="text-white font-mono">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value || 0} 
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
    />
  </div>
);

export function KitchenConfigurator`;

configTsx = configTsx.replace(
  `import React from 'react';\nimport { useKitchenStore } from '../store/kitchenStore';\nimport { KitchenScene } from '../components/kitchen/KitchenScene';\nimport { ArrowLeft, Box, Square, Move3D, PenTool, LayoutGrid } from 'lucide-react';\n\nexport function KitchenConfigurator`,
  sliderAndClasses
);

const oldSidebarStart = `{activeCabinetId && activeCabinet && (`;
const oldSidebarEnd = `   )}
   </main>`;

const newSidebar = `{activeCabinetId && activeCabinet && (
      <aside className="relative z-20 w-[360px] shrink-0 bg-black/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col custom-scrollbar pointer-events-auto">
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
   )}
   </main>`;

const startIndex = configTsx.indexOf(oldSidebarStart);
const endIndex = configTsx.indexOf(oldSidebarEnd) + oldSidebarEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  configTsx = configTsx.substring(0, startIndex) + newSidebar + configTsx.substring(endIndex);
} else {
  console.log("Could not find sidebar boundaries");
}

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', configTsx);
