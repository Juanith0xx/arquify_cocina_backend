const fs = require('fs');

let code = fs.readFileSync('src/utils/kitchenExcelGenerator.ts', 'utf8');
code = code.replace(
  'export const exportKitchenToExcel = () => {',
  'export const exportKitchenToExcel = () => {\ntry {'
);
code = code.replace(
  '  XLSX.writeFile(wb, "Optimizacion_Cortes_Cocina.xlsx");\n};',
  '  XLSX.writeFile(wb, "Optimizacion_Cortes_Cocina.xlsx");\n} catch(e: any) { alert("EXCEL ERR: " + e.message + "\\n" + e.stack); }\n};'
);
fs.writeFileSync('src/utils/kitchenExcelGenerator.ts', code);

let bp = fs.readFileSync('src/components/KitchenBlueprint.tsx', 'utf8');
bp = bp.replace(
  'export function KitchenBlueprint() {',
  `export function KitchenBlueprint() {\n  try {`
);
bp = bp.replace(
  '  if (!state.isPrinting) return null;',
  `  if (!state.isPrinting) return null;\n`
);
// we must close the try around the rendering. Actually, it's easier to just wrap the body.
// Wait, I can just do a try catch around the variables generation.
const search = `  const allParts = generateKitchenPartsList(kState.cabinets);`;
const replace = `  let allParts = [];\n  try {\n    allParts = generateKitchenPartsList(kState.cabinets);\n  } catch(e: any) { alert("BP ERR: " + e.message); }`;
bp = bp.replace(search, replace);

fs.writeFileSync('src/components/KitchenBlueprint.tsx', bp);
console.log("Patched");
