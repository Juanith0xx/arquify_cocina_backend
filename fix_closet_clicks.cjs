const fs = require('fs');
let content = fs.readFileSync('src/components/Closet.tsx', 'utf8');

// Replace AnimatedDrawer onClickAction
content = content.replace(
  `onClickAction={() => {
              state.setActiveModule(mod.id);
            }}>
            {drawerElements}`,
  `onClickAction={() => {
              state.setActiveModule(mod.id);
              const overrides = mod.overrides || {};
              const openElements = { ...(overrides.openElements || {}) };
              const current = openElements[\`drawer-\${d}\`] ?? overrides.isOpen ?? false;
              openElements[\`drawer-\${d}\`] = !current;
              
              if (!current && mod.innerDrawers && mod.doors) {
                const doorsCount = mod.width > 60 ? 2 : 1;
                for (let di = 0; di < doorsCount; di++) {
                   openElements[\`door-\${di}\`] = true;
                }
              }
              state.updateModuleOverrides(mod.id, { openElements });
            }}>
            {drawerElements}`
);

// Replace AnimatedDoor onClickAction
content = content.replace(
  `onClickAction={() => {
              state.setActiveModule(mod.id);
            }}
          />`,
  `onClickAction={() => {
              state.setActiveModule(mod.id);
              const overrides = mod.overrides || {};
              const openElements = { ...(overrides.openElements || {}) };
              const current = openElements[\`door-\${i}\`] ?? overrides.isOpen ?? false;
              openElements[\`door-\${i}\`] = !current;
              
              if (current && mod.innerDrawers && mod.drawers > 0) {
                for (let dj = 0; dj < mod.drawers; dj++) {
                  openElements[\`drawer-\${dj}\`] = false;
                }
              }
              state.updateModuleOverrides(mod.id, { openElements });
            }}
          />`
);

fs.writeFileSync('src/components/Closet.tsx', content);
