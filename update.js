const fs = require('fs');
let content = fs.readFileSync('src/components/ModuleContextMenu.tsx', 'utf8');

// Update door click logic
content = content.replace(
  `                        newOpenElements[\`door-\${i}\`] = !current;
                        handleOverride('openElements', newOpenElements);`,
  `                        newOpenElements[\`door-\${i}\`] = !current;
                        
                        // Si es puerta y se cierra, cerramos todos los cajones interiores
                        if (current && activeModule.innerDrawers && activeModule.drawers > 0) {
                          for (let d = 0; d < activeModule.drawers; d++) {
                            newOpenElements[\`drawer-\${d}\`] = false;
                          }
                        }
                        
                        handleOverride('openElements', newOpenElements);`
);

// Update drawer click logic
content = content.replace(
  `                        newOpenElements[\`drawer-\${i}\`] = !current;
                        handleOverride('openElements', newOpenElements);`,
  `                        newOpenElements[\`drawer-\${i}\`] = !current;
                        
                        // Si se abre un cajón interior, abrimos también las puertas
                        if (!current && activeModule.innerDrawers && activeModule.doors) {
                          const doorsCount = activeModule.width > 60 ? 2 : 1;
                          for (let d = 0; d < doorsCount; d++) {
                             newOpenElements[\`door-\${d}\`] = true;
                          }
                        }
                        
                        handleOverride('openElements', newOpenElements);`
);

fs.writeFileSync('src/components/ModuleContextMenu.tsx', content);
