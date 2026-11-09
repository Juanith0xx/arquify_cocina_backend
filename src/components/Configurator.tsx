import { useState } from 'react';
import { useStore } from '../store';
import { exportToPDF } from '../utils/manufacturing';
import { Download, FileText, Plus, Trash2, Camera } from 'lucide-react';
import { TexturesSection } from './TexturesSection';
import { exportToExcel } from '../utils/excelGenerator';
import { FileSpreadsheet } from 'lucide-react';
import { NanoBananaRenderModal } from './common/NanoBananaRenderModal';

const sectionTitle = "text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-3 mt-6 first:mt-0";
const labelClass = "text-[10px] uppercase tracking-widest text-slate-400";
const btnClass = "w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-center cursor-pointer hover:border-orange-500/50 hover:bg-white/10 transition-colors text-[10px] uppercase tracking-wide text-slate-300";
const activeBtnClass = "w-full p-2.5 bg-orange-500/10 border border-orange-500 rounded-lg text-center cursor-pointer text-orange-500 transition-colors text-[10px] uppercase tracking-wide font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]";

const ToggleBtn = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button onClick={onClick} className={active ? activeBtnClass : btnClass}>
    {label}
  </button>
);

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




export function Configurator() {
  const state = useStore();
  const [designName, setDesignName] = useState('');
  const [isNanoBananaModalOpen, setIsNanoBananaModalOpen] = useState(false);

  const activeMod = state.modules.find(m => m.id === state.activeModuleId);

  return (
    <aside className="relative z-20 w-full lg:w-[360px] bg-black/60 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 flex-1 lg:flex-none min-h-0 h-auto lg:h-full overflow-y-auto p-4 sm:p-6 flex flex-col custom-scrollbar pointer-events-auto">
      
      {/* Botón NanoBanana AI Render */}
      <div className="mb-4">
        <button
          onClick={() => setIsNanoBananaModalOpen(true)}
          className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer"
        >
          <Camera size={16} />
          <span>Render Fotográfico NanoBanana AI</span>
        </button>
      </div>

      <h2 className={sectionTitle}>Composición Modular</h2>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {state.modules.map((m, i) => (
          <button 
            key={m.id} 
            onClick={() => state.setActiveModule(state.activeModuleId === m.id ? null : m.id)} 
            className={`flex-shrink-0 px-4 py-2 rounded-md whitespace-nowrap text-[10px] uppercase tracking-widest font-bold transition-all ${state.activeModuleId === m.id ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.3)] border border-orange-400' : 'bg-white/10 text-slate-300 border border-transparent hover:bg-white/20'}`}
          >
            Mod {i + 1}
          </button>
        ))}
        <button onClick={state.addModule} className="flex-shrink-0 w-8 h-8 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 font-bold transition-colors flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      {activeMod && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6 shadow-inner">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h3 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">Configurar Módulo</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => state.setActiveModule(null)} 
                className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/10 hover:border-white/20 transition-colors"
                title="Cerrar modo individual y volver a global"
              >
                Cerrar
              </button>
              {state.modules.length > 1 && (
                <button onClick={() => state.removeModule(activeMod.id)} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest">
                  <Trash2 size={12} /> Eliminar
                </button>
              )}
            </div>
          </div>
          <SliderControl label="Ancho del Módulo" value={activeMod.width} min={30} max={120} unit="cm" onChange={(v) => state.updateModule(activeMod.id, { width: v })} />
          <SliderControl label="Repisas Horizontales" value={activeMod.shelves} min={0} max={activeMod.hasHanger ? 2 : 10} onChange={(v) => state.updateModule(activeMod.id, { shelves: v })} />
          <SliderControl label="Cajones" value={activeMod.drawers} min={0} max={activeMod.hasHanger ? 3 : 6} onChange={(v) => state.updateModule(activeMod.id, { drawers: v })} />
          <div className="mt-4 flex flex-col gap-2">
            <ToggleBtn active={!!activeMod.hasHanger} onClick={() => state.updateModule(activeMod.id, { hasHanger: !activeMod.hasHanger })} label="Barra de Colgar Ropa" />
            <ToggleBtn active={activeMod.doors} onClick={() => state.updateModule(activeMod.id, { doors: !activeMod.doors })} label="Puertas Frontales" />
            {activeMod.doors && activeMod.drawers > 0 && (
              <ToggleBtn active={activeMod.innerDrawers !== false} onClick={() => state.updateModule(activeMod.id, { innerDrawers: activeMod.innerDrawers === false ? true : false })} label="Cajones Interiores (Ocultos)" />
            )}
          </div>
        </div>
      )}

      <div onClick={() => { if (state.activeModuleId) state.setActiveModule(null); }}>
        <h2 className={sectionTitle}>Dimensiones Globales</h2>
      </div>
      <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest leading-relaxed">Formato de Melamina Máx: 250 x 183 cm</p>
      <div className="flex flex-col gap-1">
        <SliderControl label="Alto Total" value={state.height} min={50} max={250} unit="cm" onChange={(v) => { if (state.activeModuleId) state.setActiveModule(null); state.setHeight(v); }} />
        <SliderControl label="Profundidad" value={state.depth} min={20} max={183} unit="cm" onChange={(v) => { if (state.activeModuleId) state.setActiveModule(null); state.setDepth(v); }} />
        
        <div className="flex flex-col gap-2 mb-2 mt-2">
          <label className={labelClass}>Grosor Muro (mm)</label>
          <div className="flex gap-2">
            {[1.5, 1.8, 2.5].map((val) => (
              <button 
                key={val} 
                onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.setThickness(val); }}
                className={`flex-1 py-1.5 rounded text-xs uppercase tracking-widest font-mono transition-colors ${state.thickness === val ? 'bg-orange-500 text-black font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
              >
                {val * 10}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div onClick={() => { if (state.activeModuleId) state.setActiveModule(null); }}>
        <h2 className={sectionTitle}>Estructura Perimetral</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ToggleBtn active={state.showLeftWall} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleLeftWall(); }} label="Lat. Izquierdo" />
        <ToggleBtn active={state.showRightWall} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleRightWall(); }} label="Lat. Derecho" />
        <ToggleBtn active={state.showTopWall} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleTopWall(); }} label="Techo Superior" />
        <ToggleBtn active={state.showBottomWall} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleBottomWall(); }} label="Base Inferior" />
        <ToggleBtn active={state.showBackWall} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleBackWall(); }} label="Placa Fondo" />
      </div>

      <div onClick={() => { if (state.activeModuleId) state.setActiveModule(null); }}>
        <h2 className={sectionTitle}>Zócalo y Patas</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <ToggleBtn active={state.showSocle} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleSocle(); }} label="Zócalo" />
        <ToggleBtn active={state.showLegs} onClick={() => { if (state.activeModuleId) state.setActiveModule(null); state.toggleLegs(); }} label="Patas" />
      </div>

      <div onClick={() => { if (state.activeModuleId) state.setActiveModule(null); }}>
        <TexturesSection />
      </div>

      {[state.structureMaterial, state.doorMaterial, state.drawerFrontMaterial, state.drawerInnerMaterial, state.shelfMaterial].includes('hpl') && (
        <div className="mb-6 p-3 border border-orange-500/30 rounded-lg bg-orange-500/10">
          <ToggleBtn active={state.hplBalancer} onClick={() => state.setHplBalancer(!state.hplBalancer)} label="Trascara: Balancer Blanco (0.9mm)" />
          <p className="text-[9px] text-slate-400 mt-2 leading-tight">Si se activa, la cara interior (trascara) de las piezas enchapadas llevará HPL Blanco de 0.9mm. Si se apaga, se enchapará por ambas caras con el diseño elegido.</p>
        </div>
      )}

      

      <div className="mt-8 pt-6 border-t border-white/10 mb-8">
        <h2 className={sectionTitle}>Ingeniería y Producción</h2>

        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Espesor Tapacanto - Gabinetes (mm)</label>
          <div className="flex gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((t) => (
              <button 
                key={t}
                onClick={() => state.setEdgeBandingThicknessCabinets(t as any)}
                className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.edgeBandingThicknessCabinets === t ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
              >
                {t.toFixed(1)}
              </button>
            ))}
          </div>
          
          <label className={labelClass + " mt-3"}>Espesor Tapacanto - Frentes (mm)</label>
          <div className="flex gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((t) => (
              <button 
                key={t}
                onClick={() => state.setEdgeBandingThicknessFronts(t as any)}
                className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.edgeBandingThicknessFronts === t ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
              >
                {t.toFixed(1)}
              </button>
            ))}
          </div>
        </div>


        <div className="flex flex-col gap-2 mb-4">
          <label className={labelClass}>Tipo de Ensamblaje</label>
          <div className="flex gap-2">
            <button 
              onClick={() => state.setAssemblyType('spax')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.assemblyType === 'spax' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Soberbio / Spax
            </button>
            <button 
              onClick={() => state.setAssemblyType('minifix')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.assemblyType === 'minifix' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Minifix
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Herrajes de Cajón</label>
          <div className="flex gap-2">
            <button 
              onClick={() => state.setDrawerHardware('Provelcar')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.drawerHardware === 'Provelcar' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Provelcar
            </button>
            <button 
              onClick={() => state.setDrawerHardware('Hafele')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.drawerHardware === 'Hafele' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Häfele
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Armado de Cajón</label>
          <div className="flex gap-2">
            <button 
              onClick={() => state.setDrawerAssemblyType('spax')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.drawerAssemblyType === 'spax' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Soberbio / Spax
            </button>
            <button 
              onClick={() => state.setDrawerAssemblyType('minifix')}
              className={`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${state.drawerAssemblyType === 'minifix' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}`}
            >
              Minifix
            </button>
          </div>
        </div>
      </div>

      <h2 className={sectionTitle}>Visualización</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <ToggleBtn active={state.showDimensions} onClick={state.toggleDimensions} label="Mostrar Cotas" />
          {state.showDimensions && (
            <input 
              type="range" 
              min={1} 
              max={5} 
              step={1}
              value={state.dimensionLevel} 
              onChange={(e) => state.setDimensionLevel(Number(e.target.value))}
              className="w-full h-1.5 mt-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
              title="Nivel de Detalle de Cotas"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <ToggleBtn active={state.showDecorations} onClick={state.toggleDecorations} label="Ropa y Deco" />
          <ToggleBtn active={state.isTransparent} onClick={state.toggleTransparent} label="Modo Transparente" />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h2 className={sectionTitle}>Guardar Diseño</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Nombre..." value={designName} onChange={(e) => setDesignName(e.target.value)} className="flex-1 bg-white/5 border border-white/10 p-2 rounded text-white text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors" />
          <button onClick={() => { if (designName) { state.saveDesign(designName); setDesignName(''); } }} className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-4 rounded text-[10px] uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            Guardar
          </button>
        </div>
        
        {state.savedDesigns.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <label className={labelClass}>Diseños Guardados</label>
            <div className="flex flex-col gap-2">
              {state.savedDesigns.map(name => (
                <button key={name} onClick={() => state.loadDesign(name)} className="w-full text-left p-3 bg-white/5 border border-white/10 rounded-lg hover:border-orange-500/30 hover:bg-white/10 transition-colors text-xs text-slate-300 flex justify-between items-center group">
                  <span className="font-medium">{name}</span>
                  <span className="text-[10px] text-orange-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest">Cargar</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-8 pt-6 border-t border-white/10">
          <button 
            onClick={exportToExcel} 
            className="flex items-center justify-center gap-2 w-full p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-[11px] uppercase tracking-widest font-bold shadow-lg"
          >
            <FileSpreadsheet size={16} />
            Exportar Excel CAD/CAM
          </button>
          
          <button 
            onClick={() => state.setIsPrinting(true)} 
            className="flex items-center justify-center gap-2 w-full p-2.5 bg-rose-600/20 border border-rose-500/50 rounded-lg hover:bg-rose-600/40 transition-colors text-[10px] uppercase tracking-wide text-rose-400 font-bold"
          >
            <FileText size={14} />
            Planos de Fabricación (PDF)
          </button>
        </div>
      </div>

      <NanoBananaRenderModal
        isOpen={isNanoBananaModalOpen}
        onClose={() => setIsNanoBananaModalOpen(false)}
      />
    </aside>
  );
}
