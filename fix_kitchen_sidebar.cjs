const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

// 1. Añadir ToggleBtn si no existe
if (!code.includes('const ToggleBtn =')) {
    const toggleBtnDef = `
const ToggleBtn = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button onClick={onClick} className={active ? activeBtnClass : btnClass}>
    {label}
  </button>
);
`;
    code = code.replace('const SliderControl =', toggleBtnDef + 'const SliderControl =');
}

// 2. Modificar la parte del sidebar derecho
const searchString = `{activeCabinetId && activeCabinet && (
      <aside className="relative z-20 w-96 shrink-0 bg-black/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col custom-scrollbar pointer-events-auto">`;

const replacementString = `<aside className="relative z-20 w-96 shrink-0 bg-black/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col custom-scrollbar pointer-events-auto">
        {activeCabinetId && activeCabinet && (
           <>`;

if (code.includes(searchString)) {
    code = code.replace(searchString, replacementString);
} else {
    console.log("Could not find start of sidebar.");
}

// 3. Modificar el final del sidebar
const endSidebarString = `        <TexturesSection onSelectTexture={handleTextureSelect} />
      </aside>
   )}
   </main>`;

const newSidebarContent = `        <TexturesSection onSelectTexture={handleTextureSelect} />
        </>
        )}

        <h2 className={sectionTitle}>Ingeniería y Producción</h2>
        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Espesor Tapacanto - Gabinetes (mm)</label>
          <div className="flex gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((t) => (
              <button 
                key={t}
                onClick={() => useStore.getState().setEdgeBandingThicknessCabinets(t as any)}
                className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().edgeBandingThicknessCabinets === t ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
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
                onClick={() => useStore.getState().setEdgeBandingThicknessFronts(t as any)}
                className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().edgeBandingThicknessFronts === t ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
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
              onClick={() => useStore.getState().setAssemblyType('spax')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().assemblyType === 'spax' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Soberbio / Spax
            </button>
            <button 
              onClick={() => useStore.getState().setAssemblyType('minifix')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().assemblyType === 'minifix' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Minifix
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Herrajes de Cajón</label>
          <div className="flex gap-2">
            <button 
              onClick={() => useStore.getState().setDrawerHardware('Provelcar')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().drawerHardware === 'Provelcar' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Provelcar
            </button>
            <button 
              onClick={() => useStore.getState().setDrawerHardware('Hafele')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().drawerHardware === 'Hafele' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Häfele
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mb-6">
          <label className={labelClass}>Armado de Cajón</label>
          <div className="flex gap-2">
            <button 
              onClick={() => useStore.getState().setDrawerAssemblyType('spax')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().drawerAssemblyType === 'spax' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Soberbio / Spax
            </button>
            <button 
              onClick={() => useStore.getState().setDrawerAssemblyType('minifix')}
              className={\`flex-1 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors \${useStore.getState().drawerAssemblyType === 'minifix' ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50'}\`}
            >
              Minifix
            </button>
          </div>
        </div>

        <h2 className={sectionTitle}>Visualización</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <ToggleBtn active={useStore.getState().showDimensions} onClick={useStore.getState().toggleDimensions} label="Mostrar Cotas" />
            {useStore.getState().showDimensions && (
              <input 
                type="range" 
                min={1} 
                max={5} 
                step={1}
                value={useStore.getState().dimensionLevel} 
                onChange={(e) => useStore.getState().setDimensionLevel(Number(e.target.value))}
                className="w-full h-1.5 mt-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
                title="Nivel de Detalle de Cotas"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <ToggleBtn active={useStore.getState().showDecorations} onClick={useStore.getState().toggleDecorations} label="Ropa y Deco" />
            <ToggleBtn active={useStore.getState().isTransparent} onClick={useStore.getState().toggleTransparent} label="Modo Transparente" />
          </div>
        </div>
      </aside>
   </main>`;

if (code.includes(endSidebarString)) {
    code = code.replace(endSidebarString, newSidebarContent);
} else {
    console.log("Could not find end of sidebar.");
}

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
console.log("Kitchen sidebar updated successfully.");
