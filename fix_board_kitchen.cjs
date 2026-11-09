const fs = require('fs');
let code = fs.readFileSync('src/components/Board.tsx', 'utf8');

// Añadir import de useKitchenStore si no existe
if (!code.includes('useKitchenStore')) {
    code = code.replace("import { useStore } from '../store';", "import { useStore } from '../store';\nimport { useKitchenStore } from '../store/kitchenStore';");
}

// Modificar la lógica de ancho total para considerar ambos stores
const oldTotalWidth = `const modules = useStore(state => state.modules);
  const totalWidth = modules.reduce((sum, m) => sum + m.width, 0);`;

const newTotalWidth = `const closetModules = useStore(state => state.modules);
  const kitchenCabinets = useKitchenStore(state => state.cabinets);
  const totalWidth = closetModules.length > 0 
    ? closetModules.reduce((sum, m) => sum + m.width, 0)
    : kitchenCabinets.reduce((sum, m) => sum + m.width, 0);`;

if (code.includes(oldTotalWidth)) {
    code = code.replace(oldTotalWidth, newTotalWidth);
    fs.writeFileSync('src/components/Board.tsx', code);
    console.log("Board totalWidth updated");
} else {
    console.log("Could not find totalWidth logic");
}
