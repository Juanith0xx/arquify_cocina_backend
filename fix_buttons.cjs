const fs = require('fs');
let config = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

config = config.replace(
  `<h3 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">{activeCabinet.variant || activeCabinet.type}</h3>
              <button onClick={() => { setToolMode('move_active'); setViewMode('3d'); }} className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 uppercase tracking-widest mr-4">
                 <Move3D size={12} />
                 Mover
              </button>
              <button onClick={() => {
                 useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));
              }} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest">
                 <Trash2 size={12} />
                 Eliminar
              </button>`,
  `<h3 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">{activeCabinet.variant || activeCabinet.type}</h3>
              <div className="flex items-center gap-3">
                 <button onClick={() => { setToolMode('move_active'); setViewMode('3d'); }} className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 uppercase tracking-widest">
                    <Move3D size={12} />
                    Mover
                 </button>
                 <button onClick={() => {
                    useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));
                 }} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase tracking-widest">
                    <Trash2 size={12} />
                    Eliminar
                 </button>
              </div>`
);
fs.writeFileSync('src/pages/KitchenConfigurator.tsx', config);
