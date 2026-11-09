const fs = require('fs');
let config = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');
config = config.replace(
    `<button onClick={() => {
                 useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));`,
    `<button onClick={() => { setToolMode('move_active'); setViewMode('3d'); }} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-widest mr-4">
                 <Move3D size={12} />
                 Mover
              </button>
              <button onClick={() => {
                 useKitchenStore.setState(state => ({ cabinets: state.cabinets.filter(c => c.id !== activeCabinetId), activeCabinetId: null }));`
);
fs.writeFileSync('src/pages/KitchenConfigurator.tsx', config);
