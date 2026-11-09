with open('src/pages/KitchenConfigurator.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 341-345
new_lines = []
skip = 0
for i, line in enumerate(lines):
    if "if (cab.type !== 'decoration' && !cab.variant?.startsWith('deco_')) {" in line:
        continue
    if "setActiveCabinet(cab.id);" in line and i > 335 and i < 350:
        new_lines.append("                                setActiveCabinet(cab.id);\n")
        continue
    if "}}" in line and i > 340 and i < 350:
        new_lines.append("                              }}\n")
        continue
    
    if "activeCabinet.type !== 'decoration' && !activeCabinet.variant?.startsWith('deco_') ? (" in line:
        new_lines.append("""        {activeCabinetId && activeCabinet ? (
           (activeCabinet.type === 'decoration' || activeCabinet.variant?.startsWith('deco_')) ? (
             <div className="mb-6">
               <h2 className={sectionTitle}>Equipamiento Seleccionado</h2>
               <div className="p-4 bg-white/5 border border-white/10 rounded-lg shadow-inner flex flex-col gap-3">
                 <div className="flex justify-between items-center border-b border-white/10 pb-2">
                   <h3 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold truncate pr-2">
                     {activeCabinet.variant === 'deco_hood' ? 'Campana FDV New Conic 90'
                        : activeCabinet.variant === 'deco_stove' ? 'Cocina FDV FS Unique 90'
                        : activeCabinet.variant === 'deco_fridge' ? 'Refrigerador FDV SBS'
                        : activeCabinet.variant === 'deco_plant' ? 'Planta Decorativa'
                        : 'Equipamiento Cocina'}
                   </h3>
                   <div className="flex items-center gap-2 shrink-0">
                     <button
                       onClick={() => {
                         const currentRot = activeCabinet.rotation || 0;
                         const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                         updateCabinet(activeCabinet.id, { rotation: nextRot });
                       }}
                       className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                       title="Girar 90°"
                     >
                       <RotateCw size={12} />
                       Girar
                     </button>
                     <button
                       onClick={() => {
                         setToolMode('move_active');
                         setViewMode('3d');
                       }}
                       className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                     >
                       <Move3D size={12} />
                       Mover
                     </button>
                     <button
                       onClick={() => removeCabinet(activeCabinet.id)}
                       className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                       title="Eliminar Equipamiento"
                     >
                       <Trash2 size={12} />
                       Eliminar
                     </button>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-lg border border-white/10 text-center">
                   <div>
                     <div className="text-[9px] uppercase tracking-widest text-slate-400">Ancho</div>
                     <div className="text-white font-mono text-xs font-bold">{activeCabinet.width} cm</div>
                   </div>
                   <div>
                     <div className="text-[9px] uppercase tracking-widest text-slate-400">Alto</div>
                     <div className="text-white font-mono text-xs font-bold">{activeCabinet.height} cm</div>
                   </div>
                   <div>
                     <div className="text-[9px] uppercase tracking-widest text-slate-400">Fondo</div>
                     <div className="text-white font-mono text-xs font-bold">{activeCabinet.depth} cm</div>
                   </div>
                 </div>

                 {activeCabinet.variant === 'deco_hood' && (
                   <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                     <SliderControl
                       label="Elevación Base Campana (desde Piso)"
                       value={Math.round(activeCabinet.position[1] - activeCabinet.height / 2)}
                       min={120}
                       max={170}
                       step={2}
                       unit="cm"
                       onChange={(newBottom) => {
                         updateCabinet(activeCabinet.id, {
                           position: [activeCabinet.position[0], newBottom + activeCabinet.height / 2, activeCabinet.position[2]]
                         });
                       }}
                     />
                   </div>
                 )}

                 <div className="flex gap-2 mt-1">
                   <button
                     onClick={() => {
                       setToolMode('move_active');
                       setViewMode('3d');
                     }}
                     className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                   >
                     <Move3D size={13} />
                     Reubicar / Mover
                   </button>
                   <button
                     onClick={() => removeCabinet(activeCabinet.id)}
                     className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                   >
                     <Trash2 size={13} />
                     Eliminar
                   </button>
                 </div>
               </div>
             </div>
           ) : (\n""")
        continue
    
    new_lines.append(line)

with open('src/pages/KitchenConfigurator.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated file successfully")
