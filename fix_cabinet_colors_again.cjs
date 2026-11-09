const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

code = code.replace(
  /export function Cabinet\([^)]+\) \{/,
  `export function Cabinet({ id, type, variant, width, height, depth, position, rotation, color, structureColor, doorColor, drawerFrontColor, drawerInnerColor, shelfColor, backColor, socleColor }: CabinetType) {
   const cStructure = structureColor || color || '#f8fafc';
   const cDoors = doorColor || color || '#f8fafc';
   const cDrawers = drawerFrontColor || color || '#f8fafc';
   const cInner = drawerInnerColor || color || '#f8fafc';
   const cBack = backColor || color || '#f8fafc';
   const cSocle = socleColor || '#111';`
);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
