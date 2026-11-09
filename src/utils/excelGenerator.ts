import * as XLSX from 'xlsx-js-style';
import { useStore } from '../store';
import { getFriendlyColorName } from './colorNames';

export const exportToExcel = () => {
  const state = useStore.getState();
  const { 
    modules, height, depth, thickness, 
    structureMaterial, doorMaterial, drawerFrontMaterial, 
    edgeBandingThicknessCabinets,
    edgeBandingThicknessFronts,
    structureColor, doorColor, drawerFrontColor, socleColor, socleMaterial,
    customTextures 
  } = state;
  
  const kerf = 3.2; // mm
  
  const hplOversize = 20; // mm
  const baseHeight = 10; // cm
  
  const dataPlacas: any[] = [];
  const dataHPL: any[] = [];
  
  // Hardware counters
  let totalHinges = 0;
  let totalDrawerSlides = 0;
  let totalScrews = 0;
  let totalDowels = 0;

  const getTextureName = (urlOrColor: string) => {
    return getFriendlyColorName(urlOrColor, customTextures);
  };
  
  // Helpers
  const addPiece = (gabinete: string, name: string, w: number, h: number, qty: number, material: string, cantosLargo: number, cantosAncho: number, colorUrl: string, edgeThickness: number, isFront: boolean) => {
    const finalW = w - (cantosAncho * (edgeThickness / 10)); 
    const finalH = h - (cantosLargo * (edgeThickness / 10));
    
    let especialidad = "Carpintería / Muebles";
    const decorName = getTextureName(colorUrl);
    
    let materialName = '';
    if (material === 'hpl') {

      const decorativeName = getTextureName(colorUrl);
      
      dataHPL.push({
        'Gabinete': gabinete,
        'Pieza': `${name} (Cara)`,
        'Material': 'HPL / Abet Laminati',
        'Decorativo': decorativeName,
        'Largo Corte HPL (mm)': ((h * 10) + hplOversize).toFixed(1),
        'Ancho Corte HPL (mm)': ((w * 10) + hplOversize).toFixed(1),
        'Cantidad': qty
      });

      if (state.hplBalancer) {
        dataHPL.push({
          'Gabinete': gabinete,
          'Pieza': `${name} (Trascara / Balanceador)`,
          'Material': 'HPL Balanceador',
          'Decorativo': 'Blanco 0.9mm',
          'Largo Corte HPL (mm)': ((h * 10) + hplOversize).toFixed(1),
          'Ancho Corte HPL (mm)': ((w * 10) + hplOversize).toFixed(1),
          'Cantidad': qty
        });
      } else {
        dataHPL.push({
          'Gabinete': gabinete,
          'Pieza': `${name} (Trascara)`,
          'Material': 'HPL / Abet Laminati',
          'Decorativo': decorativeName,
          'Largo Corte HPL (mm)': ((h * 10) + hplOversize).toFixed(1),
          'Ancho Corte HPL (mm)': ((w * 10) + hplOversize).toFixed(1),
          'Cantidad': qty
        });
      }
    
    }
    
    // Y siempre agregamos la placa de sustrato (MDF o Melamina) a dataPlacas
    // Si es HPL, el sustrato es MDF desnudo (15mm o según thickness)
    const baseMaterial = material === 'hpl' ? 'MDF Desnudo (Sustrato)' : decorName;
    
    dataPlacas.push({
      'Gabinete': gabinete,
      'Pieza': name,
      'Material': materialName || material, // Usa el material pasado (ej. 'melamina')
      'Decorativo': baseMaterial,
      'Cortes Totales': qty,
      'Cantidad': qty,
      'Largo (mm)': (h * 10).toFixed(1),
      'Ancho (mm)': (w * 10).toFixed(1),
      'Veta (Orientación)': 'Vertical',
      'Espesor (mm)': state.thickness,
      'Tapacanto Largo 1': cantosLargo > 0 ? 'Sí' : 'No',
      'Tapacanto Largo 2': cantosLargo > 1 ? 'Sí' : 'No',
      'Tapacanto Ancho 1': cantosAncho > 0 ? 'Sí' : 'No',
      'Tapacanto Ancho 2': cantosAncho > 1 ? 'Sí' : 'No',
      'isFront': isFront
    });
  };


  const baseOffset = state.showSocle ? 10 : state.showLegs ? 10 : 0;
  const sideWallHeight = height + baseOffset;
  const innerHeight = height - (state.showTopWall ? thickness : 0) - (state.showBottomWall ? thickness : 0);

  modules.forEach((mod, i) => {
    const gabName = `Gabinete ${i+1}`;
    const innerW = mod.width - (state.showLeftWall ? thickness : 0) - (state.showRightWall ? thickness : 0);

    // Laterales Exteriores (por cada módulo, según 3D)
    if (state.showLeftWall) {
      addPiece(gabName, `Lateral Izquierdo`, depth, sideWallHeight, 1, structureMaterial, 1, 2, structureColor, edgeBandingThicknessCabinets, false);
    }
    if (state.showRightWall) {
      addPiece(gabName, `Lateral Derecho`, depth, sideWallHeight, 1, structureMaterial, 1, 2, structureColor, edgeBandingThicknessCabinets, false);
    }

    // Techo y Base (por cada módulo)
    if (state.showTopWall) {
      addPiece(gabName, `Techo`, innerW, depth, 1, structureMaterial, 1, 0, structureColor, edgeBandingThicknessCabinets, false);
      totalScrews += 4;
      totalDowels += 4;
    }
    if (state.showBottomWall) {
      addPiece(gabName, `Base`, innerW, depth, 1, structureMaterial, 1, 0, structureColor, edgeBandingThicknessCabinets, false);
      totalScrews += 4;
      totalDowels += 4;
    }

    // Fondo
    if (state.showBackWall) {
      addPiece(gabName, `Fondo (MDF 3mm)`, innerW, innerHeight, 1, 'melamina', 0, 0, structureColor, edgeBandingThicknessCabinets, false);
    }

    // Zócalo
    if (state.showSocle) {
      addPiece(gabName, `Zócalo Frontal`, innerW, 10, 1, socleMaterial, 1, 0, socleColor, edgeBandingThicknessCabinets, false);
      addPiece(gabName, `Zócalo Trasero`, innerW, 10, 1, socleMaterial, 1, 0, socleColor, edgeBandingThicknessCabinets, false);
      totalScrews += 8;
    }

    // Repisas
    if (mod.shelves > 0) {
      addPiece(gabName, `Repisa`, innerW, depth - 2, mod.shelves, structureMaterial, 1, 0, structureColor, edgeBandingThicknessCabinets, false);
      totalScrews += 4 * mod.shelves;
    }

    // Puertas
    if (mod.doors) {
      const isInnerDrawer = mod.innerDrawers;
      const totalDrawersHeight = (mod.drawers > 0 && !isInnerDrawer) ? mod.drawers * 27 : 0;
      const doorSpaceHeight = height - totalDrawersHeight - (state.showTopWall ? thickness : 0);
      const doorHeight = doorSpaceHeight - 0.3;
      const doorCount = mod.width > 60 ? 2 : 1;
      const doorW = innerW / doorCount - 0.3;
      
      if (doorCount === 2) {
        addPiece(gabName, `Puerta Izquierda`, doorW, doorHeight, 1, doorMaterial, 2, 2, doorColor, edgeBandingThicknessFronts, true);
        addPiece(gabName, `Puerta Derecha`, doorW, doorHeight, 1, doorMaterial, 2, 2, doorColor, edgeBandingThicknessFronts, true);
      } else {
        addPiece(gabName, `Puerta`, doorW, doorHeight, 1, doorMaterial, 2, 2, doorColor, edgeBandingThicknessFronts, true);
      }
      
      const hingesPerDoor = doorHeight > 100 ? (doorHeight > 160 ? 4 : 3) : 2;
      totalHinges += hingesPerDoor * doorCount;
    }

    // Cajones
    if (mod.drawers > 0) {
      const isInnerDrawer = mod.doors && mod.innerDrawers;
      const frontHeight = isInnerDrawer ? 24 : 26.7;
      const frontWidth = isInnerDrawer ? innerW - 6.4 : innerW - 0.3;
      
      addPiece(gabName, `Frente Cajón`, frontWidth, frontHeight, mod.drawers, drawerFrontMaterial, 2, 2, drawerFrontColor, edgeBandingThicknessFronts, true);
      
      const drawerDepth = depth - 10;
      addPiece(gabName, `Caja Cajón Lateral`, drawerDepth, 15, mod.drawers * 2, 'melamina', 1, 0, structureColor, edgeBandingThicknessCabinets, false);
      addPiece(gabName, `Caja Cajón Trasera`, frontWidth - 5, 15, mod.drawers, 'melamina', 1, 0, structureColor, edgeBandingThicknessCabinets, false);
      addPiece(gabName, `Fondo Cajón (MDF 3mm)`, frontWidth - 5, drawerDepth, mod.drawers, 'melamina', 0, 0, structureColor, edgeBandingThicknessCabinets, false);
      
      totalDrawerSlides += mod.drawers;
      totalScrews += mod.drawers * 8;
    }
  });

  // Hoja 3: Rendimiento, Compras y Herrajes
  const m2PorPlacaMDF = 2.44 * 1.52; // 3.7 m2
  const m2PorPlacaHPL = 3.05 * 1.30; // 3.96 m2

  const placasByMaterial: Record<string, { m2: number, name: string }> = {};
  dataPlacas.forEach(p => {
    const name = p.Material;
    if (!placasByMaterial[name]) placasByMaterial[name] = { m2: 0, name };
    placasByMaterial[name].m2 += (parseFloat(p['Ancho (mm)']) * parseFloat(p['Largo (mm)']) * p.Cantidad) / 1000000;
  });

  const hplByDecorativo: Record<string, { m2: number, name: string }> = {};
  dataHPL.forEach(p => {
    const name = p.Decorativo;
    if (!hplByDecorativo[name]) hplByDecorativo[name] = { m2: 0, name };
    hplByDecorativo[name].m2 += (parseFloat(p['Ancho Corte HPL (mm)']) * parseFloat(p['Largo Corte HPL (mm)']) * p.Cantidad) / 1000000;
  });
  
  const cantosGabinetes = dataPlacas.filter(p => !p.isFront).reduce((acc, p) => {
    let cantosL = 0;
    if (p['Tapacanto Largo 1'] === 'Sí') cantosL++;
    if (p['Tapacanto Largo 2'] === 'Sí') cantosL++;
    
    let cantosA = 0;
    if (p['Tapacanto Ancho 1'] === 'Sí') cantosA++;
    if (p['Tapacanto Ancho 2'] === 'Sí') cantosA++;
    
    return acc + ((cantosL * parseFloat(p['Largo (mm)'])) + (cantosA * parseFloat(p['Ancho (mm)']))) * p.Cantidad / 1000;
  }, 0);

  const cantosFrentes = dataPlacas.filter(p => p.isFront).reduce((acc, p) => {
    let cantosL = 0;
    if (p['Tapacanto Largo 1'] === 'Sí') cantosL++;
    if (p['Tapacanto Largo 2'] === 'Sí') cantosL++;
    
    let cantosA = 0;
    if (p['Tapacanto Ancho 1'] === 'Sí') cantosA++;
    if (p['Tapacanto Ancho 2'] === 'Sí') cantosA++;
    
    return acc + ((cantosL * parseFloat(p['Largo (mm)'])) + (cantosA * parseFloat(p['Ancho (mm)']))) * p.Cantidad / 1000;
  }, 0);

  const assemblyTypeName = state.assemblyType === 'minifix' ? 'Pernos Minifix + Tarugos' : 'Tornillos Spax 4x50mm';

  const dataBoM: any[] = [];
  
  // Tableros / Melamina / Sustrato
  Object.values(placasByMaterial).forEach(mat => {
    const required = Math.ceil(mat.m2 / m2PorPlacaMDF);
    const efficiency = required > 0 ? ((mat.m2 / (required * m2PorPlacaMDF)) * 100).toFixed(1) : 0;
    dataBoM.push({ Categoria: 'Tableros', Item: `Plancha ${mat.name}`, Cantidad: required, Unidad: 'Unidades', Detalles: `Eficiencia: ${efficiency}%` });
  });
  
  // Tapacantos (+10% merma)
  const cantosGabTotal = Math.ceil(cantosGabinetes * 1.1);
  const cantosFrentesTotal = Math.ceil(cantosFrentes * 1.1);
  dataBoM.push({ Categoria: 'Insumos', Item: `Metros de Tapacanto Gabinetes (${edgeBandingThicknessCabinets}mm)`, Cantidad: cantosGabTotal, Unidad: 'Metros Lineales', Detalles: 'Incluye 10% de merma' });
  dataBoM.push({ Categoria: 'Insumos', Item: `Metros de Tapacanto Frentes (${edgeBandingThicknessFronts}mm)`, Cantidad: cantosFrentesTotal, Unidad: 'Metros Lineales', Detalles: 'Incluye 10% de merma' });
  
  // HPL
  Object.values(hplByDecorativo).forEach(hpl => {
    const required = Math.ceil(hpl.m2 / m2PorPlacaHPL);
    const efficiency = required > 0 ? ((hpl.m2 / (required * m2PorPlacaHPL)) * 100).toFixed(1) : 0;
    dataBoM.push({ Categoria: 'Enchape HPL', Item: `Plancha HPL (${hpl.name})`, Cantidad: required, Unidad: 'Unidades', Detalles: `Eficiencia: ${efficiency}%` });
  });

  dataBoM.push(
    { Categoria: 'Mecanizado', Item: 'Descuento de Sierra (Kerf)', Cantidad: kerf, Unidad: 'mm', Detalles: 'Aplicado en software de Nesting' },
    { Categoria: 'Herrajes', Item: 'Bisagras Cazoleta 35mm (Cierre Suave)', Cantidad: totalHinges, Unidad: 'Unidades', Detalles: 'Para puertas exteriores' },
    { Categoria: 'Herrajes', Item: `Juego Correderas Telescópicas (${state.drawerHardware})`, Cantidad: totalDrawerSlides, Unidad: 'Pares', Detalles: 'Fijación lateral 50cm' },
    { Categoria: 'Herrajes', Item: `Sistema de Armado (${assemblyTypeName})`, Cantidad: totalScrews, Unidad: 'Unidades', Detalles: 'Para estructura y cajones' },
    { Categoria: 'Herrajes', Item: 'Tarugos Madera 8x30mm', Cantidad: totalDowels, Unidad: 'Unidades', Detalles: 'Alineación estructural' }
  );

  
  const wb = XLSX.utils.book_new();
  const wsPlacas = XLSX.utils.json_to_sheet(dataPlacas);
  const wsHPL = XLSX.utils.json_to_sheet(dataHPL);
  const wsBoM = XLSX.utils.json_to_sheet(dataBoM);

  // Styling function
  const applyStyles = (ws, colWidths) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1"; // Header row
      if (!ws[address]) continue;
      ws[address].s = {
        fill: { patternType: "solid", fgColor: { rgb: "F97316" } }, // Orange 500
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { auto: 1 } },
          bottom: { style: "thin", color: { auto: 1 } },
          left: { style: "thin", color: { auto: 1 } },
          right: { style: "thin", color: { auto: 1 } }
        }
      };
    }

    // Apply borders to all other cells
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[address]) continue;
        
        ws[address].s = ws[address].s || {};
        ws[address].s.border = {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        };
        ws[address].s.alignment = { vertical: "center" };
      }
    }

    ws['!cols'] = colWidths.map(w => ({ wch: w }));
  };

  applyStyles(wsPlacas, [15, 20, 25, 35, 10, 15, 15, 15, 20, 20, 20, 20, 25, 20, 10]);
  applyStyles(wsHPL, [15, 25, 25, 30, 20, 20, 10]);
  applyStyles(wsBoM, [15, 55, 15, 20, 45]);

  XLSX.utils.book_append_sheet(wb, wsPlacas, "1_Corte_Sierra");
  XLSX.utils.book_append_sheet(wb, wsHPL, "2_Corte_HPL");
  XLSX.utils.book_append_sheet(wb, wsBoM, "3_BOM_y_Herrajes");
  
  XLSX.writeFile(wb, "Ingenieria_Mueble_CAD_CAM.xlsx");
};