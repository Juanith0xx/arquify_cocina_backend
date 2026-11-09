const fs = require('fs');
let code = fs.readFileSync('src/utils/manufacturing.ts', 'utf8');

// Change the material of drawer fronts to 'Melamina Frente Cajón'
code = code.replace(
  /name: \`Frente Cajón \$\{modName\}\`,\n\s*moduleId: mod\.id,\n\s*moduleIndex: index,\n\s*qty: mod\.drawers,\n\s*length: drawerFrontWidthMm,\n\s*width: drawerFrontHeightMm,\n\s*thickness: thickness \* 10,\n\s*material: 'Melamina Frente'/,
  `name: \`Frente Cajón \${modName}\`,\n        moduleId: mod.id,\n        moduleIndex: index,\n        qty: mod.drawers,\n        length: drawerFrontWidthMm,\n        width: drawerFrontHeightMm,\n        thickness: thickness * 10,\n        material: 'Melamina Frente Cajón'`
);

fs.writeFileSync('src/utils/manufacturing.ts', code);
