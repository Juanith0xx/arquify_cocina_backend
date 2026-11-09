const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

if (!code.includes("import { useStore }")) {
   code = code.replace(
       `import { useKitchenStore } from '../store/kitchenStore';`,
       `import { useKitchenStore } from '../store/kitchenStore';\nimport { useStore } from '../store';\nimport { TexturesSection } from '../components/TexturesSection';`
   );
}

const textureHandler = `
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

// Insert the handler into the component
code = code.replace(
  `const { viewMode, toolMode, cabinets, activeCabinetId, setViewMode, setToolMode, updateCabinet } = useKitchenStore();`,
  `const { viewMode, toolMode, cabinets, activeCabinetId, setViewMode, setToolMode, updateCabinet } = useKitchenStore();\n${textureHandler}`
);

// Replace the old Diseño Local block
const oldSection = `<h2 className={sectionTitle}>Diseño Local (Por Pieza)</h2>
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
        </div>`;

const newSection = `<TexturesSection onSelectTexture={handleTextureSelect} />`;

code = code.replace(oldSection, newSection);

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
