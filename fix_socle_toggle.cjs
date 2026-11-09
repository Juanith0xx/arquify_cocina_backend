const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

code = code.replace(
    'const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();',
    'const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet, showSocle, setShowSocle } = useKitchenStore();'
);

code = code.replace(
    'active={state.showSocle} onClick={() => state.setShowSocle(!state.showSocle)}',
    'active={showSocle} onClick={() => setShowSocle(!showSocle)}'
);

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
console.log("Fixed socle toggle");
