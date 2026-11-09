const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

const badCode = `const { viewMode, toolMode, cabinets, activeCabinetId, setViewMode, setToolMode, updateCabinet } = useKitchenStore();

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
  };
`;

code = code.replace(badCode, `const { viewMode, toolMode, cabinets, activeCabinetId, setViewMode, setToolMode, updateCabinet } = useKitchenStore();`);

if (code.includes(`const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();`)) {
    code = code.replace(
       `const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();`,
       `const { viewMode, setViewMode, toolMode, setToolMode, cabinets, activeCabinetId, updateCabinet } = useKitchenStore();
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
  };`
    );
}

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
