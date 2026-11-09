const fs = require('fs');
let code = fs.readFileSync('src/store/kitchenStore.ts', 'utf8');

code = code.replace(
  `color: string;`,
  `color: string;
  structureColor?: string;
  doorColor?: string;
  drawerFrontColor?: string;
  drawerInnerColor?: string;
  shelfColor?: string;
  backColor?: string;
  socleColor?: string;`
);

fs.writeFileSync('src/store/kitchenStore.ts', code);
