const fs = require('fs');
let code = fs.readFileSync('src/utils/kitchenManufacturing.ts', 'utf8');

if (!code.includes("import { useKitchenStore }")) {
    code = code.replace(
        "import { useStore } from '../store';",
        "import { useStore } from '../store';\nimport { useKitchenStore } from '../store/kitchenStore';"
    );
}

const hardwareReplacement = `
    const state = useStore.getState();
    const kState = useKitchenStore.getState();
    let totalHinges = 0;
    let totalDrawerSlides = 0;
    let totalScrews = 0;
    let totalBaseWidth = 0;
    
    cabinets.forEach(cab => {
        totalScrews += 20; // Base assembly
        if (cab.variant === '1_door' || cab.variant === 'spice_rack' || cab.variant === '1_door_1_drawer') {
            totalHinges += 2;
        } else if (cab.variant === '2_doors') {
            totalHinges += 4;
        }
        
        if (cab.variant === '4_drawers') totalDrawerSlides += 4;
        if (cab.variant === '2_pot_drawers') totalDrawerSlides += 2;
        if (cab.variant === '1_door_1_drawer') totalDrawerSlides += 1;

        if (cab.type === 'base' || cab.type === 'island' || cab.type === 'tall') {
            totalBaseWidth += cab.width;
        }
    });
    
    hardware.push({ Item: 'Tornillos Spax 4x50', Cantidad: totalScrews, 'Unidad': 'un' });
    if (totalHinges > 0) hardware.push({ Item: 'Bisagras Rectas Cierre Suave', Cantidad: totalHinges, 'Unidad': 'un' });
    if (totalDrawerSlides > 0) hardware.push({ Item: \`Correderas Ocultas \${state.drawerHardware}\`, Cantidad: totalDrawerSlides, 'Unidad': 'par' });
    if (cabinets.filter(c => c.type === 'base' || c.type === 'island' || c.type === 'tall').length > 0) {
        hardware.push({ Item: 'Patas Regulables 10cm', Cantidad: cabinets.filter(c => c.type === 'base' || c.type === 'island' || c.type === 'tall').length * 4, 'Unidad': 'un' });
    }

    if (kState.showSocle && totalBaseWidth > 0) {
        // Tiras de zócalo (3000mm)
        // Convert width from cm to mm
        const totalBaseWidthMm = totalBaseWidth * 10; 
        const socleStrips = Math.ceil(totalBaseWidthMm / 3000);
        hardware.push({ Item: 'Zócalo de PVC/Aluminio (Tira 3m)', Cantidad: socleStrips, 'Unidad': 'un' });
        
        // Uniones rectas (simplificado)
        const straightJoints = Math.max(0, socleStrips - 1);
        if (straightJoints > 0) {
            hardware.push({ Item: 'Unión Recta para Zócalo', Cantidad: straightJoints, 'Unidad': 'un' });
        }

        // Escuadras 90 grados (estimado, 1 por cada cambio de módulo si quisieramos, pero pongamos 2 como base para islas o esquinas)
        // Check if there are base cabinets with different rotations or just provide a minimum if there's multiple bases
        let hasCorner = false;
        let firstRot = null;
        cabinets.filter(c => c.type === 'base' || c.type === 'island').forEach(c => {
            if (firstRot === null) firstRot = c.rotation;
            else if (firstRot !== c.rotation) hasCorner = true;
        });

        const cornerJoints = hasCorner ? 2 : 0;
        if (cornerJoints > 0) {
            hardware.push({ Item: 'Escuadra 90° para Zócalo', Cantidad: cornerJoints, 'Unidad': 'un' });
        } else if (cabinets.length > 2) {
             // Just in case, add 1 corner if there are many cabinets, maybe an L shape not perfectly detected
             hardware.push({ Item: 'Escuadra 90° para Zócalo', Cantidad: 1, 'Unidad': 'un' });
        }
    }
`;

const searchHardware = `    const state = useStore.getState();
    let totalHinges = 0;
    let totalDrawerSlides = 0;
    let totalScrews = 0;
    
    cabinets.forEach(cab => {
        totalScrews += 20; // Base assembly
        if (cab.variant === '1_door' || cab.variant === 'spice_rack' || cab.variant === '1_door_1_drawer') {
            totalHinges += 2;
        } else if (cab.variant === '2_doors') {
            totalHinges += 4;
        }
        
        if (cab.variant === '4_drawers') totalDrawerSlides += 4;
        if (cab.variant === '2_pot_drawers') totalDrawerSlides += 2;
        if (cab.variant === '1_door_1_drawer') totalDrawerSlides += 1;
    });
    
    hardware.push({ Item: 'Tornillos Spax 4x50', Cantidad: totalScrews, 'Unidad': 'un' });
    if (totalHinges > 0) hardware.push({ Item: 'Bisagras Rectas Cierre Suave', Cantidad: totalHinges, 'Unidad': 'un' });
    if (totalDrawerSlides > 0) hardware.push({ Item: \`Correderas Ocultas \${state.drawerHardware}\`, Cantidad: totalDrawerSlides, 'Unidad': 'par' });
    if (cabinets.filter(c => c.type === 'base' || c.type === 'island').length > 0) {
        hardware.push({ Item: 'Patas Regulables 15cm', Cantidad: cabinets.filter(c => c.type === 'base' || c.type === 'island').length * 4, 'Unidad': 'un' });
    }`;

code = code.replace(searchHardware, hardwareReplacement);

fs.writeFileSync('src/utils/kitchenManufacturing.ts', code);
console.log("Hardware list updated with Socle");
