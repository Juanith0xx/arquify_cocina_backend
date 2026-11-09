import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CabinetType, useKitchenStore } from '../store/kitchenStore';
import { generateKitchenPartsList, generateKitchenHardwareList, HARDWARE_SPECS, isHplFinish } from './kitchenManufacturing';
import { generateCountertopPieces } from './countertopNesting';
import { renderArquifyPdfLogo } from './pdfLogo';
import { getFriendlyColorName } from './colorNames';

export { getFriendlyColorName };

export function exportKitchenPDF(cabinets: CabinetType[], state: any, filename = 'ficha_tecnica_cocina.pdf') {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateStr = new Date().toLocaleDateString('es-CL');

  const realCabinets = cabinets.filter(c => c.type !== 'decoration' && !c.variant?.startsWith('deco_'));
  const allParts = generateKitchenPartsList(cabinets);
  const hardwareList = generateKitchenHardwareList(cabinets);
  const hwKey = (state.drawerHardware === 'Hafele' ? 'Hafele' : 'Provelcar') as keyof typeof HARDWARE_SPECS;
  const hwSpec = HARDWARE_SPECS[hwKey] || HARDWARE_SPECS.Provelcar;
  const rawThick = state.thickness || 1.8;
  const thicknessMm = Math.round((rawThick >= 1.2 ? rawThick : 1.8) * 10);
  const customTextures = state.customTextures || [];

  // ==========================================
  // PÁGINA 1: PORTADA TÉCNICA Y RESUMEN GENERAL
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  renderArquifyPdfLogo(doc, 14, 14, 22);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PLANOS DE FABRICACIÓN, DESPIECE CAD/CAM & CUBICACIÓN', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Fecha: ${dateStr} | Versión: 2.4-BIM Cocina`, 135, 21);

  let yPos = 38;

  // Cuadro de Resumen Ejecutivo
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, 182, 44, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPECIFICACIONES TÉCNICAS GENERALES', 20, yPos + 6.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const baseCount = realCabinets.filter(c => c.type === 'base').length;
  const wallCount = realCabinets.filter(c => c.type === 'wall').length;
  const tallCount = realCabinets.filter(c => c.type === 'tall').length;
  const islandCount = realCabinets.filter(c => c.type === 'island').length;

  const tcCab = (state.edgeBandingThicknessCabinets || 0.45).toFixed(2);
  const tcFront = (state.edgeBandingThicknessFronts || 2.0).toFixed(2);
  doc.text(`• Total Módulos: ${realCabinets.length} unid. (Bajos: ${baseCount}, Aéreos: ${wallCount}, Torres: ${tallCount}, Islas: ${islandCount})`, 20, yPos + 13.5);
  doc.text(`• Espesor Melamina Estructura: ${thicknessMm} mm (Tapacanto PVC 22x${tcCab} mm)`, 20, yPos + 19.5);
  const frontSpecDesc = state.doorMaterial === 'hpl'
    ? `${thicknessMm} mm (Sustrato MDF ${thicknessMm}mm + HPL Abet 0.9mm)`
    : `${thicknessMm} mm (Tapacanto PVC 22x${tcFront} mm alto impacto)`;
  doc.text(`• Frentes y Puertas: ${frontSpecDesc}`, 20, yPos + 25.5);
  doc.text(`• Traseras y Fondos de Cajón: Durolac / MDF 3.5 mm ranurado a 15 mm`, 20, yPos + 31.5);
  doc.text(`• Sistema de Herrajes: ${hwSpec.slideName} (Holgura SKW: -${hwSpec.slideClearanceTotal} mm, Descuento SKL: -${hwSpec.drawerLengthDeduction} mm)`, 20, yPos + 37.5);

  yPos += 50;

  // TABLA 1: Listado de Módulos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RELACIÓN DE GABINETES Y MÓDULOS DEL PROYECTO', 14, yPos);

  const cabRows = realCabinets.map((c, i) => {
    const tagPrefix = c.type === 'wall' ? 'A' : c.type === 'tall' ? 'T' : c.type === 'island' ? 'I' : 'B';
    const tag = `${tagPrefix}-${i + 1}`;
    const typeLabel = c.type === 'base' ? 'Módulo Bajo' : c.type === 'wall' ? 'Módulo Aéreo' : c.type === 'tall' ? 'Torre/Despensa' : 'Isla';
    const variantLabel = c.variant ? c.variant.replace(/_/g, ' ') : 'Estándar';
    const doorCol = getFriendlyColorName(c.doorColor || state.doorColor, customTextures);
    const structCol = getFriendlyColorName(c.structureColor || state.structureColor, customTextures);
    return [
      tag,
      typeLabel,
      `${c.width} x ${c.height} x ${c.depth} cm`,
      variantLabel,
      doorCol,
      structCol
    ];
  });

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Tag', 'Tipo', 'Dimensiones (An x Al x Pr)', 'Configuración', 'Color Puertas', 'Color Cuerpo']],
    body: cabRows,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 34 },
      4: { cellWidth: 31 },
      5: { cellWidth: 31 }
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PÁGINA 2: DESPIECE COMPLETO DE PIEZAS (CAD/CAM)
  // ==========================================
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PLANILLA DE DESPIECE TÉCNICO Y TAPACANTOS (PIEZAS DE CORTE)', 14, 11);

  const partsRows = allParts.map((p, idx) => [
    `${idx + 1}`,
    p.name.replace(/\(Cab \d+ [^)]+\)/, ''),
    `${p.qty}`,
    p.length.toFixed(1),
    p.width.toFixed(1),
    `${Math.round(p.thickness)} mm`,
    p.edgeL1 || p.edgeL2 ? 'Largo' : '-',
    p.edgeW1 || p.edgeW2 ? 'Ancho' : '-',
    p.notes || 'Estándar'
  ]);

  autoTable(doc, {
    startY: 22,
    head: [['#', 'Nombre Pieza', 'Cant.', 'Largo (mm)', 'Ancho (mm)', 'Espesor', 'TC Largo', 'TC Ancho', 'Mecanizado / Notas']],
    body: partsRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 18 }
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PÁGINA 3: RESUMEN DE OPTIMIZACIÓN (NESTING)
  // ==========================================
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RESUMEN DE CUBICACIÓN Y OPTIMIZACIÓN DE PLANCHAS (NESTING 2D)', 14, 11);

  // Calcular cubicación agrupada
  const structParts = allParts.filter(p => p.thickness >= 15 && (!p.name.includes('Puerta') && !p.name.includes('Frente') && !p.name.includes('Panel Ciego') || p.name.toLowerCase().includes('contrafrente')));
  const doorParts = allParts.filter(p => p.thickness >= 15 && (p.name.includes('Puerta') || p.name.includes('Frente') || p.name.includes('Panel Ciego')) && !p.name.toLowerCase().includes('contrafrente'));
  const backParts = allParts.filter(p => p.thickness < 15 || p.name.includes('Fondo') || p.name.includes('Trasera'));

  const structM2 = structParts.reduce((acc, p) => acc + (p.length * p.width * p.qty) / 1000000, 0);
  const doorM2 = doorParts.reduce((acc, p) => acc + (p.length * p.width * p.qty) / 1000000, 0);
  const backM2 = backParts.reduce((acc, p) => acc + (p.length * p.width * p.qty) / 1000000, 0);

  const sheetMelM2 = (2.50 * 1.83); // 4.575 m²
  const sheetDurolacM2 = (2.44 * 1.83); // 4.465 m²

  const structSheets = Math.ceil((structM2 * 1.15) / sheetMelM2) || 1;
  const doorSheets = Math.ceil((doorM2 * 1.15) / sheetMelM2) || (doorParts.length > 0 ? 1 : 0);
  const backSheets = Math.ceil((backM2 * 1.12) / sheetDurolacM2) || (backParts.length > 0 ? 1 : 0);

  const isDoorHPL = doorParts.some(p => isHplFinish(p.material, state.doorMaterial)) || state.doorMaterial === 'hpl';
  const sheetHplM2 = (3.05 * 1.30); // 3.965 m²
  const hplDoorM2 = doorParts.reduce((acc, p) => acc + (((p.length + 10) * (p.width + 10) * p.qty) / 1000000), 0);
  const hplSheets = Math.ceil((hplDoorM2 * 1.15) / sheetHplM2) || (doorParts.length > 0 ? 1 : 0);
  const mdfSustratoSheets = Math.ceil((doorM2 * 1.18) / sheetDurolacM2) || (doorParts.length > 0 ? 1 : 0);

  const nestingSummary = [
    ['Melamina Estructura y Cajones', `${thicknessMm} mm`, '2500 x 1830 mm', `${structParts.reduce((a, b) => a + b.qty, 0)} unid.`, `${structM2.toFixed(2)} m²`, `${structSheets} planchas`, `${Math.min(92, Math.round((structM2 / (structSheets * sheetMelM2)) * 100))}%`],
    ...(isDoorHPL
      ? [
          ['Laminado HPL Puertas (Abet Laminati)', '0.9 mm', '3050 x 1300 mm', `${doorParts.reduce((a, b) => a + b.qty, 0)} unid.`, `${hplDoorM2.toFixed(2)} m²`, `${hplSheets} planchas`, hplSheets > 0 ? `${Math.min(92, Math.round((hplDoorM2 / (hplSheets * sheetHplM2)) * 100))}%` : '-'],
          ['MDF Crudo 18mm Sustrato Base', '18 mm', '2440 x 1830 mm', `${doorParts.reduce((a, b) => a + b.qty, 0)} unid.`, `${doorM2.toFixed(2)} m²`, `${mdfSustratoSheets} planchas`, mdfSustratoSheets > 0 ? `${Math.min(92, Math.round((doorM2 / (mdfSustratoSheets * sheetDurolacM2)) * 100))}%` : '-'],
        ]
      : [
          ['Melamina Puertas y Frentes', `${thicknessMm} mm`, '2500 x 1830 mm', `${doorParts.reduce((a, b) => a + b.qty, 0)} unid.`, `${doorM2.toFixed(2)} m²`, `${doorSheets} planchas`, doorSheets > 0 ? `${Math.min(92, Math.round((doorM2 / (doorSheets * sheetMelM2)) * 100))}%` : '-'],
        ]
    ),
    ['Durolac / MDF Traseras y Fondos', '3.5 mm', '2440 x 1830 mm', `${backParts.reduce((a, b) => a + b.qty, 0)} unid.`, `${backM2.toFixed(2)} m²`, `${backSheets} planchas`, backSheets > 0 ? `${Math.min(94, Math.round((backM2 / (backSheets * sheetDurolacM2)) * 100))}%` : '-'],
  ];

  autoTable(doc, {
    startY: 24,
    head: [['Material / Sustrato', 'Espesor', 'Formato Plancha', 'Piezas', 'Área Neta', 'Planchas Est.', 'Rendimiento']],
    body: nestingSummary,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  let nextY = (doc as any).lastAutoTable.finalY + 12;

  // TABLA 4: QUINCALLERÍA Y HERRAJES (BOM)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. LISTADO CONSOLIDADO DE QUINCALLERÍA, HERRAJES Y FIJACIONES (BOM)', 14, nextY);

  const hwRows = hardwareList.map(h => [
    h.Categoria,
    h.Item,
    `${h.Cantidad} ${h.Unidad}`,
    h.Detalles
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Categoría', 'Ítem / Herraje', 'Cantidad', 'Especificación Técnica']],
    body: hwRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 52 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 80 }
    },
    margin: { left: 14, right: 14 }
  });

  // =========================================================================
  // PÁGINA 3: MARMOLERÍA TÉCNICA QSTONE (CUARZO & SINTERIZADO), CORTE & ENCASTRES
  // =========================================================================
  const kStore = useKitchenStore.getState();
  const ctBOM = generateCountertopPieces(cabinets, kStore.countertopConfig, kStore.qstoneCatalog, kStore.islandBackConfig, kStore.walls, kStore.architecturalElements, kStore.roomConfig);

  if (kStore.countertopConfig?.enabled && ctBOM && ctBOM.pieces.length > 0) {
    doc.addPage('a4', 'p');

    // Header superior
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 28, 'F');

    renderArquifyPdfLogo(doc, 14, 13, 20);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ESPECIFICACIONES DE MARMOLERÍA, DESPIECE Y OPTIMIZACIÓN (QSTONE)', 14, 21);

    doc.setFontSize(8);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text(`Proveedor: Qstone | Material: ${ctBOM.product.name} (${ctBOM.product.thicknessMm} mm)`, 105, 20);

    let ctY = 36;

    // Cuadro resumen de producto
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, ctY, 182, 38, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PARÁMETROS TÉCNICOS DE INSTALACIÓN Y FABRICACIÓN', 18, ctY + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const isSint = ctBOM.product.materialType === 'sinterizado';
    const regrueso = kStore.countertopConfig.regruesoCm;
    const bType = kStore.countertopConfig.buildingType === 'edificio' ? 'Edificio (máx 200 cm)' : 'Casa (máx 250 cm)';

    doc.text(`• Material: ${ctBOM.product.name} | Espesor: ${ctBOM.product.thicknessMm} mm | Formato Plancha: ${(ctBOM.product.sheetWidthMm/10)} x ${(ctBOM.product.sheetHeightMm/10)} cm`, 18, ctY + 12);
    doc.text(`• Criterio Estructural: ${isSint ? 'SINTERIZADO 12mm -> Requiere Tapa Continua de Melamina Completa en módulos base' : 'CUARZO -> Sistema tradicional con barras de amarre superior 10cm'}`, 18, ctY + 17);
    doc.text(`• Faldón / Regrueso Delantero: ${regrueso > 0 ? `${regrueso} cm (con deducción automática en altura de primer frente de cajón)` : 'Sin regrueso (0 cm)'}`, 18, ctY + 22);
    doc.text(`• Respaldo Muro: ${kStore.countertopConfig.backsplashMode === 'standard_5cm' ? 'Zócalo estándar 50 mm' : kStore.countertopConfig.backsplashMode === 'full_height' ? 'Revestimiento completo hasta muebles aéreos' : 'Sin respaldo'} | Uniones: Ortogonales a 90°`, 18, ctY + 27);
    doc.text(`• Logística: ${bType} | Corte con disco diamantado (Kerf 3.5 mm) | Remates: ${kStore.countertopConfig.waterfallLeft ? 'Cascada Izq [x] ' : ''}${kStore.countertopConfig.waterfallRight ? 'Cascada Der [x]' : ''}`, 18, ctY + 32);

    // Tabla de Despiece de Marmolería
    ctY = ctY + 44;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DESPIECE TÉCNICO DE PIEZAS DE PIEDRA (DISCO KERF 3.5 mm)', 14, ctY);

    const pieceRows = ctBOM.pieces.map(p => [
      p.id,
      p.name,
      `${p.lengthMm} mm`,
      `${p.widthMm} mm`,
      `${p.thicknessMm} mm`,
      `${p.areaM2.toFixed(3)} m²`,
      `${p.edgePolishingM.toFixed(2)} m`
    ]);

    autoTable(doc, {
      startY: ctY + 3,
      head: [['Cód', 'Descripción de Pieza', 'Largo', 'Ancho', 'Esp.', 'Área Neta', 'Canto Pulido']],
      body: pieceRows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 64 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    let nextCtY = (doc as any).lastAutoTable.finalY + 8;

    // Resumen de Nesting y Presupuesto
    const nestingStoneRows = [
      ['Área Neta Requerida (Cubiertas y faldones)', `${ctBOM.totalNetAreaM2} m²`],
      ['Planchas Qstone Estimadas (3200 x 1600 mm, 5.12 m²/plancha)', `${ctBOM.slabsCount} unid. (${ctBOM.grossBilledM2} m² brutos)`],
      ['Rendimiento de Aprovechamiento Nesting (Kerf 3.5mm)', `${ctBOM.efficiencyPercent} %`],
      ['Total Metros Lineales de Canto Pulido', `${ctBOM.totalLinearEdgeM} m lineales`],
      ['Perforaciones y Encastres (Lavaplatos / Encimera)', `${ctBOM.cutouts.length} unidades (${ctBOM.cutouts.map(c => c.modelName).join(', ') || 'Ninguno'})`],
      ['Valor Material Qstone', `$${ctBOM.materialCostClp.toLocaleString('es-CL')} CLP ($${ctBOM.product.priceM2Clp.toLocaleString('es-CL')}/m²)`],
      ['Valor Estimado Elaboración, Pulido & Encastres', `$${ctBOM.fabricationCostClp.toLocaleString('es-CL')} CLP`],
      ['PRESUPUESTO TOTAL ESTIMADO CUBIERTA', `$${ctBOM.totalCostClp.toLocaleString('es-CL')} CLP`]
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RESUMEN DE OPTIMIZACIÓN DE CORTE (NESTING) & PRESUPUESTO QSTONE', 14, nextCtY);

    autoTable(doc, {
      startY: nextCtY + 3,
      head: [['Concepto Técnico / Rendimiento', 'Detalle']],
      body: nestingStoneRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 82, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // PÁGINA GRÁFICA DE OPTIMIZACIÓN DE CORTE EN PLANCHA (NESTING 3200 x 1600 mm)
    if (ctBOM.slabsLayout && ctBOM.slabsLayout.length > 0) {
      for (const slab of ctBOM.slabsLayout) {
        doc.addPage('a4', 'l'); // Landscape 297 x 210 mm

        // Encabezado superior
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 297, 24, 'F');

        renderArquifyPdfLogo(doc, 14, 11, 18);

        doc.setTextColor(248, 250, 252);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`PLANO DE OPTIMIZACIÓN DE CORTE EN PLANCHA QSTONE (3200 x 1600 mm) - PLANCHA #${slab.slabIndex} DE ${ctBOM.slabsCount}`, 14, 18);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(251, 191, 36);
        doc.text(`Material: ${ctBOM.product.name} (${ctBOM.product.thicknessMm} mm) | Criterio Logístico: ${kStore.countertopConfig.buildingType === 'edificio' ? 'Edificio (máx 200cm)' : 'Casa (máx 250cm)'} | Kerf: 3.5mm`, 130, 18);

        // Barra informativa de rendimiento
        const infoY = 28;
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, infoY, 269, 12, 1.5, 1.5, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rendimiento Plancha: ${slab.efficiencyPercent}%`, 18, infoY + 7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Área Utilizada: ${slab.usedAreaM2} m²`, 75, infoY + 7.5);
        doc.text(`• Retazo Aprovechable: ${slab.offcutAreaM2} m²`, 135, infoY + 7.5);
        doc.text(`• Total Piezas en Plancha: ${slab.pieces.length} unidades`, 195, infoY + 7.5);

        // Área gráfica de la plancha (Escala: 3200mm -> 240mm, 1600mm -> 120mm; factor = 0.075)
        const slabOriginX = 28;
        const slabOriginY = 46;
        const slabDrawW = 240;
        const slabDrawH = 120;
        const scale = slabDrawW / slab.slabWidthMm; // 0.075

        // Fondo de plancha (Retazo / Descarte)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.8);
        doc.rect(slabOriginX, slabOriginY, slabDrawW, slabDrawH, 'FD');

        // Margen de despunte perimetral (10mm)
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.rect(slabOriginX + 10 * scale, slabOriginY + 10 * scale, (slab.slabWidthMm - 20) * scale, (slab.slabHeightMm - 20) * scale, 'D');
        doc.setLineDashPattern([], 0); // Reset dash

        // Cotas perimetrales de la plancha
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${slab.slabWidthMm} mm`, slabOriginX + slabDrawW / 2 - 8, slabOriginY - 2);
        doc.text(`${slab.slabHeightMm} mm`, slabOriginX - 14, slabOriginY + slabDrawH / 2);

        // Renderizar piezas colocadas
        for (const p of slab.pieces) {
          const px = slabOriginX + p.x * scale;
          const py = slabOriginY + p.y * scale;
          const pw = p.widthMm * scale;
          const ph = p.lengthMm * scale;

          // Color según tipo de pieza
          if (p.type === 'slab') {
            doc.setFillColor(254, 243, 199); // amber-100
            doc.setDrawColor(217, 119, 6);   // amber-600
          } else if (p.type === 'apron') {
            doc.setFillColor(255, 237, 213); // orange-100
            doc.setDrawColor(234, 88, 12);   // orange-600
          } else if (p.type === 'backsplash') {
            doc.setFillColor(224, 242, 254); // sky-100
            doc.setDrawColor(2, 132, 199);   // sky-600
          } else {
            doc.setFillColor(243, 232, 255); // purple-100
            doc.setDrawColor(147, 51, 234);  // purple-600
          }

          doc.setLineWidth(0.4);
          doc.rect(px, py, pw, ph, 'FD');

          // Si contiene encastre de lavaplatos o encimera, dibujar el hueco en líneas discontinuas
          if (p.hasCutout && pw > 25 && ph > 20) {
            const cutW = (p.hasCutout === 'sink' ? 695 : 550) * scale;
            const cutD = (p.hasCutout === 'sink' ? 400 : 470) * scale;
            const cutX = px + (pw - cutW) / 2;
            const cutY = py + (ph - cutD) / 2;

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(220, 38, 38); // red-600
            doc.setLineWidth(0.3);
            doc.setLineDashPattern([1, 1], 0);
            doc.rect(cutX, cutY, cutW, cutD, 'FD');
            doc.setLineDashPattern([], 0);

            doc.setFontSize(5);
            doc.setTextColor(185, 28, 28);
            doc.setFont('helvetica', 'bold');
            doc.text(p.hasCutout === 'sink' ? 'CALADO LAVAPLATOS' : 'CALADO ENCIMERA', cutX + 1.5, cutY + cutD / 2 + 1.5);
          }

          // Etiqueta de la pieza
          if (pw > 14 && ph > 6) {
            doc.setFontSize(ph < 10 || pw < 20 ? 5 : 6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            const labelText = p.pieceId;
            doc.text(labelText, px + 2, py + (ph < 10 ? ph / 2 + 1.5 : 4.5));

            if (ph >= 12 && pw >= 24) {
              doc.setFontSize(5.5);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(71, 85, 105);
              doc.text(`${p.widthMm} x ${p.lengthMm} mm`, px + 2, py + 8.5);
            }
          }
        }

        // Leyenda inferior de colores
        const legendY = 175;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('LEYENDA TÉCNICA:', 28, legendY + 4);

        const legendItems = [
          { label: 'Cubierta Horizontal', fill: [254, 243, 199], stroke: [217, 119, 6] },
          { label: 'Faldón / Regrueso', fill: [255, 237, 213], stroke: [234, 88, 12] },
          { label: 'Respaldo / Zócalo', fill: [224, 242, 254], stroke: [2, 132, 199] },
          { label: 'Pata Cascada', fill: [243, 232, 255], stroke: [147, 51, 234] },
          { label: 'Encastre / Calado', fill: [255, 255, 255], stroke: [220, 38, 38] },
        ];

        let legX = 65;
        for (const item of legendItems) {
          doc.setFillColor(item.fill[0], item.fill[1], item.fill[2]);
          doc.setDrawColor(item.stroke[0], item.stroke[1], item.stroke[2]);
          doc.setLineWidth(0.3);
          doc.rect(legX, legendY, 5, 5, 'FD');

          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(item.label, legX + 7, legendY + 3.8);

          legX += 40;
        }

        // Pie de página con normas de corte CNC
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('NOTAS DE CORTE: Espesor de corte por disco de diamante (Kerf) = 3.5 mm • Cortes ortogonales a 90° con puente CNC • Rectificación y pulido perimetral según despiece.', 28, 190);
      }
    }
  }

  // Guardar documento
  doc.save(filename);
}
