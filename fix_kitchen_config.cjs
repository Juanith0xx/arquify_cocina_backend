const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

const oldHeader = `export function KitchenConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();`;

const newHeader = `export function KitchenConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();
  const handleTextureSelect = (url: string, mat: string) => {
    if (!activeCabinetId) return;
    const part = useStore.getState().targetPart;
    if (part === 'structure') updateCabinet(activeCabinetId, { structureColor: url });
    else if (part === 'doors') updateCabinet(activeCabinetId, { doorColor: url });
    else if (part === 'drawerFronts') updateCabinet(activeCabinetId, { drawerFrontColor: url });
    else if (part === 'drawerInner') updateCabinet(activeCabinetId, { drawerInnerColor: url });
    else if (part === 'shelves') updateCabinet(activeCabinetId, { shelfColor: url });
    else if (part === 'back') updateCabinet(activeCabinetId, { backColor: url });
    else if (part === 'socle') updateCabinet(activeCabinetId, { socleColor: url });
  };`;

// wait, the previous code replacement put handleTextureSelect out of the component or replaced the wrong line. Let's fix that.
