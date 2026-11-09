const fs = require('fs');

const kitchenManufacturing = `import { CabinetType } from '../store/kitchenStore';
import { useStore } from '../store';
import { Part, generateEdgeBandingList, generateHardwareList } from './manufacturing';

export function getNominalSlideLength(nominalDepth: number): number {
    const validLengths = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
    let maxValid = 25;
    for (const l of validLengths) {
        if (l <= nominalDepth) {
            maxValid = l;
        } else {
            break;
        }
    }
    return maxValid;
}

export function generateKitchenPartsList(cabinets: CabinetType[]): Part[] {
  const parts: Part[] = [];
  const state = useStore.getState();
  const thickness = state.thickness; // thickness in cm
  
  cabinets.forEach((cab, index) => {
    const cabName = \`(Cab \${index+1} \${cab.type})\`;
    const w = cab.width;
    const h = cab.height;
    const d = cab.depth;
    
    // Base cabinet legs
    const legsHeight = (cab.type === 'base' || cab.type === 'island') ? 15 : 0;
    const cabH = h - legsHeight;
    const innerW = w - thickness * 2;
    const innerH = cabH - thickness * ((cab.type === 'base' || cab.type === 'island') ? 1 : 2);
    
    // 1. Laterales (Sides)
    parts.push({
      name: \`Lateral \${cabName}\`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 2,
      length: cabH * 10,
      width: d * 10,
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true, edgeL2: false, edgeW1: true, edgeW2: true,
      notes: 'Laterales del gabinete'
    });

    // 2. Base
    parts.push({
      name: \`Piso \${cabName}\`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 1,
      length: innerW * 10,
      width: d * 10,
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
      notes: 'Piso del gabinete'
    });

    // 3. Techo o Barras de Armado
    if (cab.type === 'base' || cab.type === 'island') {
        // Barras superior delantera
        parts.push({
            name: \`Barra Frontal \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: 10 * 10, // 10 cm width
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
        });
        // Barra trasera
        parts.push({
            name: \`Barra Trasera \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: 10 * 10, // 10 cm width
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
        });
    } else {
        // Wall or Tall cabinet has a full top
        parts.push({
            name: \`Techo \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: d * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Techo del gabinete'
        });
    }

    // 4. Fondo (Back panel)
    // using 1.5 cm for calculation, though in code we used thickness
    parts.push({
        name: \`Fondo Traseara \${cabName}\`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: innerH * 10,
        thickness: thickness * 10,
        material: cab.backColor || state.structureColor,
        edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false
    });

    // 5. Repisas (Shelves) if applicable
    if (cab.variant === '2_doors' || cab.variant === '1_door') {
        parts.push({
            name: \`Repisa \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (innerW - 0.2) * 10,
            width: (d - 5) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
        });
    }

    // 6. Frentes (Doors/Drawers)
    const gap = 0.3; // 3mm gap
    const frontMat = cab.doorColor || state.doorColor;
    if (cab.variant === '1_door' || cab.variant === 'spice_rack') {
        parts.push({
            name: \`Puerta Frontal \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap*2) * 10,
            width: (w - gap*2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
        });
    } else if (cab.variant === '2_doors') {
        parts.push({
            name: \`Puerta Frontal \${cabName}\`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 2,
            length: (cabH - gap*2) * 10,
            width: ((w - gap*3)/2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
        });
    } else if (cab.variant === '4_drawers' || cab.variant === '2_pot_drawers' || cab.variant === '1_door_1_drawer') {
        let drawCount = 0;
        let drawerHeights: number[] = [];
        
        if (cab.variant === '4_drawers') { drawCount = 4; drawerHeights = [(cabH - gap*5)/4, (cabH - gap*5)/4, (cabH - gap*5)/4, (cabH - gap*5)/4]; }
        if (cab.variant === '2_pot_drawers') { drawCount = 2; drawerHeights = [(cabH - gap*3)/2, (cabH - gap*3)/2]; }
        if (cab.variant === '1_door_1_drawer') { drawCount = 1; drawerHeights = [18]; } // Just the drawer part
        
        drawerHeights.forEach((dh, i) => {
            parts.push({
                name: \`Frente Cajón \${i+1} \${cabName}\`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: dh * 10,
                width: (w - gap*2) * 10,
                thickness: thickness * 10,
                material: cab.drawerFrontColor || frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
            });
        });

        if (cab.variant === '1_door_1_drawer') {
            const doorH = cabH - gap*3 - 18;
            parts.push({
                name: \`Puerta Frontal \${cabName}\`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: doorH * 10,
                width: (w - gap*2) * 10,
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
            });
        }
        
        // Cajas de cajones
        const sideH = 12; // cm
        const slideLen = getNominalSlideLength(d - 5);
        const skw = innerW - 4.9; // mm clear inside width for drawer box calculation
        const cInnerMat = cab.drawerInnerColor || state.structureColor;

        for (let i=0; i<drawCount; i++) {
            // Laterales cajon
            parts.push({
                name: \`Cajón Lateral \${cabName} (\${i+1})\`,
                moduleId: cab.id, moduleIndex: index, qty: 2,
                length: slideLen * 10, width: sideH * 10, thickness: thickness * 10, material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: true, edgeW2: true
            });
            // Frente y trasera caja
            parts.push({
                name: \`Cajón F/T \${cabName} (\${i+1})\`,
                moduleId: cab.id, moduleIndex: index, qty: 2,
                length: skw * 10, width: (sideH - 1.2) * 10, thickness: thickness * 10, material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
            });
            // Fondo de cajón (3mm)
            parts.push({
                name: \`Cajón Piso \${cabName} (\${i+1})\`,
                moduleId: cab.id, moduleIndex: index, qty: 1,
                length: slideLen * 10, width: skw * 10, thickness: 3, material: '#dddddd',
                edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false
            });
        }
    }
  });

  return parts;
}

export function generateKitchenHardwareList(cabinets: CabinetType[]) {
    // Similar to closet hardware generator
    const hardware = [];
    const state = useStore.getState();
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
    }
    
    return hardware;
}
`;

fs.writeFileSync('src/utils/kitchenManufacturing.ts', kitchenManufacturing);

const kitchenExcel = `import * as XLSX from 'xlsx-js-style';
import { useStore } from '../store';
import { useKitchenStore } from '../store/kitchenStore';
import { generateKitchenPartsList, generateKitchenHardwareList } from './kitchenManufacturing';
import { generateEdgeBandingList } from './manufacturing';

export const exportKitchenToExcel = () => {
  const state = useStore.getState();
  const kState = useKitchenStore.getState();
  const cabinets = kState.cabinets;
  
  const parts = generateKitchenPartsList(cabinets);
  const hardware = generateKitchenHardwareList(cabinets);
  const edgeBanding = generateEdgeBandingList(parts);
  
  const wsData = parts.map(p => ({
    Especialidad: 'Carpintería / Muebles',
    Material: p.material,
    Pieza: p.name,
    Cantidad: p.qty,
    'Largo (mm)': p.length.toFixed(1),
    'Ancho (mm)': p.width.toFixed(1),
    'Espesor (mm)': p.thickness.toFixed(1),
    'Tapacanto Largo 1': p.edgeL1 ? 'Sí' : 'No',
    'Tapacanto Largo 2': p.edgeL2 ? 'Sí' : 'No',
    'Tapacanto Ancho 1': p.edgeW1 ? 'Sí' : 'No',
    'Tapacanto Ancho 2': p.edgeW2 ? 'Sí' : 'No',
    Notas: p.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wsHardware = XLSX.utils.json_to_sheet(hardware);
  const wsEdgeBanding = XLSX.utils.json_to_sheet(edgeBanding);

  // Apply styling
  const headerStyle = {
    fill: { fgColor: { rgb: "F97316" } },
    font: { color: { rgb: "FFFFFF" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  };

  [ws, wsHardware, wsEdgeBanding].forEach(sheet => {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!sheet[address]) continue;
      sheet[address].s = headerStyle;
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Placas y Cortes (Cocina)");
  XLSX.utils.book_append_sheet(wb, wsHardware, "Herrajes e Insumos");
  XLSX.utils.book_append_sheet(wb, wsEdgeBanding, "Metros Tapacanto");

  XLSX.writeFile(wb, "Optimizacion_Cortes_Cocina.xlsx");
};
`;

fs.writeFileSync('src/utils/kitchenExcelGenerator.ts', kitchenExcel);

console.log("Kitchen manufacturing and excel generator created.");
