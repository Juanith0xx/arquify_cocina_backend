const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

// The component already has: const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();
// I need to add: const globalState = useStore();
if (!code.includes('const globalState = useStore();')) {
    code = code.replace(
        'const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();',
        'const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();\n  const globalState = useStore();'
    );
}

// Now replace all useStore.getState() with globalState
code = code.replace(/useStore\.getState\(\)\./g, 'globalState.');

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
console.log("Made sidebar reactive.");
