const fs = require('fs');
let scene = fs.readFileSync('src/components/kitchen/KitchenScene.tsx', 'utf8');

scene = scene.replace(
  `{cabinets.map(cab => (
          <Cabinet key={cab.id} {...cab} />
        ))}`,
  `{cabinets.map(cab => {
          if (toolMode === 'move_active' && cab.id === useKitchenStore.getState().activeCabinetId) return null;
          return <Cabinet key={cab.id} {...cab} />;
        })}`
);

fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', scene);
