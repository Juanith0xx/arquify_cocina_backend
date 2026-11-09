import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SpecialFurnitureState, SPECIAL_COLORS, ABET_TEXTURES } from '../store/specialFurnitureStore';
import { renderArquifyPdfLogo } from './pdfLogo';

export interface SpecialPart {
  id: string;
  name: string;
  category: 'Estructura' | 'Puertas y Vidrios' | 'Cajón' | 'Fondo y Repisas' | 'Base Metálica';
  qty: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  material: string;
  edgeL1: boolean;
  edgeL2: boolean;
  edgeW1: boolean;
  edgeW2: boolean;
  notes: string;
}

export interface SpecialHardwareItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unit: string;
  category: 'Unión Estructural' | 'Apertura y Movimiento' | 'Soportes de Vidrio' | 'Nivelación y Base';
  description: string;
}

export function generateSpecialPartsList(state: SpecialFurnitureState): SpecialPart[] {
  const parts: SpecialPart[] = [];
  const { width, height, depth, thickness, legHeight, exteriorColor, backTexture } = state;
  
  const extColorConfig = SPECIAL_COLORS.find(c => c.id === exteriorColor) || SPECIAL_COLORS[0];
  const abetConfig = ABET_TEXTURES.find(t => t.id === backTexture) || ABET_TEXTURES[0];

  const bodyHeight = height - legHeight; // Altura útil del cuerpo de madera
  const innerWidth = width - 2 * thickness;
  const innerHeight = bodyHeight - 2 * thickness;
  const innerDepth = depth - thickness - 2; // Descuenta fondo y holgura frontal

  // 1. Estructura Exterior (Laterales, Techo, Base)
  parts.push({
    id: 'lat_izq',
    name: 'Lateral Izquierdo',
    category: 'Estructura',
    qty: 1,
    lengthMm: Math.round(bodyHeight * 10),
    widthMm: Math.round(depth * 10),
    thicknessMm: Math.round(thickness * 10),
    material: `Melamina/Laca ${extColorConfig.name}`,
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Mecanizado Minifix + perforaciones para soportes de vidrio'
  });

  parts.push({
    id: 'lat_der',
    name: 'Lateral Derecho',
    category: 'Estructura',
    qty: 1,
    lengthMm: Math.round(bodyHeight * 10),
    widthMm: Math.round(depth * 10),
    thicknessMm: Math.round(thickness * 10),
    material: `Melamina/Laca ${extColorConfig.name}`,
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Mecanizado Minifix + perforaciones para soportes de vidrio'
  });

  parts.push({
    id: 'techo',
    name: 'Techo Superior',
    category: 'Estructura',
    qty: 1,
    lengthMm: Math.round(innerWidth * 10),
    widthMm: Math.round(depth * 10),
    thicknessMm: Math.round(thickness * 10),
    material: `Melamina/Laca ${extColorConfig.name}`,
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Ensamble superior con pernos Minifix'
  });

  parts.push({
    id: 'base_inf',
    name: 'Base Inferior',
    category: 'Estructura',
    qty: 1,
    lengthMm: Math.round(innerWidth * 10),
    widthMm: Math.round(depth * 10),
    thicknessMm: Math.round(thickness * 10),
    material: `Melamina/Laca ${extColorConfig.name}`,
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Fijación a patas metálicas inferiores con insertos roscados M6/M8'
  });

  // 2. Fondo Decorativo Abet Laminati
  parts.push({
    id: 'fondo_abet',
    name: `Fondo Trasero Abet Laminati (${abetConfig.name})`,
    category: 'Fondo y Repisas',
    qty: 1,
    lengthMm: Math.round((innerHeight + 1.2) * 10),
    widthMm: Math.round((innerWidth + 1.2) * 10),
    thicknessMm: 6,
    material: `HPL Abet Laminati ${abetConfig.name} (${abetConfig.code}) e=0.9mm sobre MDF 5.5mm`,
    edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Montaje en ranura perimetral o rebaje posterior de 10x6mm'
  });

  // 3. Puertas con Marco Delgado de Madera (3.5 cm) y Vidrio
  const doorWidth = (width - 0.4) / 2; // 2 puertas con 4mm de holgura central
  const doorHeight = bodyHeight - 0.4;
  const frameWidthMm = 35; // 3.5 cm ancho del listón de madera esbelto
  const frameThicknessMm = 20; // 20mm de espesor

  parts.push({
    id: 'puerta_largueros',
    name: 'Largueros Marco Puerta (Madera Clara Esbelta)',
    category: 'Puertas y Vidrios',
    qty: 4,
    lengthMm: Math.round(doorHeight * 10),
    widthMm: frameWidthMm,
    thicknessMm: frameThicknessMm,
    material: 'Madera Sólida / Enchapado Madera Clara Natural (Perfil 35mm)',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Ranura interior 6mm para alojar vidrio con perfil de goma'
  });

  parts.push({
    id: 'puerta_travesanos',
    name: 'Travesaños Marco Puerta (Madera Clara Esbelta)',
    category: 'Puertas y Vidrios',
    qty: 4,
    lengthMm: Math.round((doorWidth * 10) - (2 * frameWidthMm)),
    widthMm: frameWidthMm,
    thicknessMm: frameThicknessMm,
    material: 'Madera Sólida / Enchapado Madera Clara Natural (Perfil 35mm)',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Unión a inglete o espiga recta con tarugos de madera'
  });

  const glassWidthMm = Math.round((doorWidth * 10) - (2 * frameWidthMm) + 16);
  const glassHeightMm = Math.round((doorHeight * 10) - (2 * frameWidthMm) + 16);

  parts.push({
    id: 'vidrio_puertas',
    name: 'Panel Vidrio Puerta Frontal',
    category: 'Puertas y Vidrios',
    qty: 2,
    lengthMm: glassHeightMm,
    widthMm: glassWidthMm,
    thicknessMm: 4,
    material: 'Vidrio Templado Incoloro 4mm con Cuadrícula de Seguridad / Ahumado',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Bordes pulidos con canto plano brillante'
  });

  // 4. Repisas Interiores de Cristal Templado
  parts.push({
    id: 'repisas_vidrio',
    name: 'Repisas Interiores de Cristal',
    category: 'Fondo y Repisas',
    qty: 2,
    lengthMm: Math.round((innerWidth - 0.4) * 10),
    widthMm: Math.round((innerDepth - 2) * 10),
    thicknessMm: 6,
    material: 'Cristal Templado Extra Claro 6mm',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Cantos perimetrales pulidos al diamante'
  });

  // 5. Tapa Superior de Repisa del Cajón (Madera Clara)
  parts.push({
    id: 'repisa_tapa_cajon',
    name: 'Tapa Superior de Repisa sobre Cajón',
    category: 'Cajón',
    qty: 1,
    lengthMm: Math.round(innerWidth * 10),
    widthMm: Math.round(innerDepth * 10),
    thicknessMm: Math.round(thickness * 10),
    material: 'Melamina Madera Clara (Roble / Maple Natural)',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Cierre superior del cajón y base de repisa para vano superior vitrina'
  });

  // 6. Cajón Central en Melamina Madera Clara
  const drawerHeightMm = 180; // 18 cm
  const drawerDepthMm = Math.min(450, Math.floor((innerDepth - 2) / 5) * 50); // Corredera nominal estándar
  const drawerBoxHeightMm = 120;
  const drawerBoxWidthMm = Math.round((innerWidth * 10) - 49); // Holgura Provelcar / Hafele 49mm

  parts.push({
    id: 'cajon_frente',
    name: 'Frente de Cajón Central',
    category: 'Cajón',
    qty: 1,
    lengthMm: Math.round((innerWidth - 0.4) * 10),
    widthMm: drawerHeightMm,
    thicknessMm: Math.round(thickness * 10),
    material: 'Melamina Madera Clara (Roble / Maple Natural)',
    edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
    notes: 'Tapacanto PVC 2mm perimetral de alta resistencia'
  });

  parts.push({
    id: 'cajon_laterales',
    name: 'Laterales de Cajón Interior',
    category: 'Cajón',
    qty: 2,
    lengthMm: drawerDepthMm,
    widthMm: drawerBoxHeightMm,
    thicknessMm: 15,
    material: 'Melamina Lino / Gris Texturado 15mm',
    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Ranura de 5mm a 10mm de la base para fondo'
  });

  parts.push({
    id: 'cajon_contrafrente',
    name: 'Contrafrente de Cajón Interior',
    category: 'Cajón',
    qty: 1,
    lengthMm: drawerBoxWidthMm - 30,
    widthMm: drawerBoxHeightMm - 15,
    thicknessMm: 15,
    material: 'Melamina Lino / Gris Texturado 15mm',
    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Testero frontal interior para ensamble y fijación de frente exterior'
  });

  parts.push({
    id: 'cajon_trasera',
    name: 'Trasera de Cajón Interior',
    category: 'Cajón',
    qty: 1,
    lengthMm: drawerBoxWidthMm - 30,
    widthMm: drawerBoxHeightMm - 15,
    thicknessMm: 15,
    material: 'Melamina Lino / Gris Texturado 15mm',
    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Ensamble con tornillos 4.0x35'
  });

  parts.push({
    id: 'cajon_fondo',
    name: 'Fondo de Cajón',
    category: 'Cajón',
    qty: 1,
    lengthMm: drawerDepthMm - 10,
    widthMm: drawerBoxWidthMm - 14,
    thicknessMm: 5.5,
    material: 'HDF / Durolac Blanco 5.5mm',
    edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Encaje ranurado'
  });

  // 6. Base Estructural Metálica y Patas
  parts.push({
    id: 'base_metal',
    name: 'Bastidor Metálico Inferior Soldado',
    category: 'Base Metálica',
    qty: 1,
    lengthMm: Math.round(width * 10),
    widthMm: Math.round(depth * 10),
    thicknessMm: Math.round(legHeight * 10),
    material: 'Perfil de Acero Cuadrado 25x25x1.5mm Esmaltado Negro Mate',
    edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
    notes: 'Estructura perimetral que abraza el cuerpo de madera con pletinas perforadas'
  });

  return parts;
}

export function generateSpecialHardwareList(state: SpecialFurnitureState): SpecialHardwareItem[] {
  const { hardwareBrand, assemblyType, height, legHeight } = state;
  const brandName = hardwareBrand || 'Hafele';
  const doorHeightMm = Math.round((height - legHeight - 0.4) * 10);
  const hingesPerDoor = doorHeightMm <= 900 ? 2 : doorHeightMm <= 1500 ? 3 : doorHeightMm <= 2000 ? 4 : 5;
  const totalHinges = 2 * hingesPerDoor;

  return [
    {
      id: 'h_minifix',
      name: assemblyType === 'minifix' ? `Sistema Minifix Rastex 15 + Perno (${brandName})` : 'Tornillos Confirmat 7x50mm',
      sku: 'FIX-MNX-150',
      qty: 12,
      unit: 'un',
      category: 'Unión Estructural',
      description: 'Caja excéntrica niquelada con perno autorroscante de 34mm y tapa embellecedora plástica'
    },
    {
      id: 'h_tarugos',
      name: 'Tarugos de Madera Haya Ranurados 8x30mm',
      sku: 'WOOD-DOW-0830',
      qty: 16,
      unit: 'un',
      category: 'Unión Estructural',
      description: 'Guía de precisión estructural entre laterales, techo y base'
    },
    {
      id: 'h_bisagras',
      name: `Bisagras Cazoleta para Marco Madera Cierre Suave (${brandName})`,
      sku: 'HINGE-WOD-35SS',
      qty: totalHinges,
      unit: 'un',
      category: 'Apertura y Movimiento',
      description: `Bisagra de 110° con pistón hidráulico (${hingesPerDoor} bisagras/hoja para puerta H=${doorHeightMm}mm), regulación tridimensional 3D`
    },
    {
      id: 'h_correderas',
      name: `Juego Correderas Telescópicas Ocultas Cierre Suave (${brandName})`,
      sku: 'SLIDE-UND-400SS',
      qty: 1,
      unit: 'juego',
      category: 'Apertura y Movimiento',
      description: 'Extracción total con clip de acople rápido y ajuste de altura frontal'
    },
    {
      id: 'h_soportes_vidrio',
      name: 'Soportes de Repisa Pelícano / Perno con Ventosa de Goma',
      sku: 'SUP-GLS-VAC',
      qty: 8,
      unit: 'un',
      category: 'Soportes de Vidrio',
      description: 'Perno metálico niquelado d=5mm con ventosa de silicona transparente antideslizante'
    },
    {
      id: 'h_tiradores',
      name: 'Tiradores Verticales Perfil Barra Slim Negro Mate 200mm',
      sku: 'HDL-BAR-BLK200',
      qty: 2,
      unit: 'un',
      category: 'Apertura y Movimiento',
      description: 'Aluminio extruido anodizado negro mate con fijación trasera rosca M4'
    },
    {
      id: 'h_regatones',
      name: 'Regatones Niveladores Articulados M8 con Base Inox/Goma',
      sku: 'FEET-LVL-M8CR',
      qty: 4,
      unit: 'un',
      category: 'Nivelación y Base',
      description: 'Espárrago roscado M8x35mm con base circular cromada d=30mm y pad de goma antirralladuras'
    },
    {
      id: 'h_tornillos',
      name: 'Set Tornillos Fijación Madera y Herrajes (3.5x15 + 4.0x30)',
      sku: 'SCRW-SET-50',
      qty: 40,
      unit: 'un',
      category: 'Unión Estructural',
      description: 'Tornillos bicromatados cabeza avellanada Philips'
    }
  ];
}

export function exportSpecialFurnitureExcel(state: SpecialFurnitureState) {
  const parts = generateSpecialPartsList(state);
  const hardware = generateSpecialHardwareList(state);
  const extColorConfig = SPECIAL_COLORS.find(c => c.id === state.exteriorColor) || SPECIAL_COLORS[0];
  const abetConfig = ABET_TEXTURES.find(t => t.id === state.backTexture) || ABET_TEXTURES[0];

  const wb = XLSX.utils.book_new();

  // 1. Resumen Ejecutivo de Fabricación
  const summaryRows = [
    ['FICHA TÉCNICA Y ESPECIFICACIONES DE FABRICACIÓN - MUEBLE ESPECIAL (APARADOR)'],
    ['Proyecto:', 'Aparador Vitrina de Autor'],
    ['Fecha Generación:', new Date().toLocaleDateString('es-CL')],
    ['Dimensiones Generales (Ancho x Alto x Fondo):', `${state.width} cm x ${state.height} cm x ${state.depth} cm`],
    ['Altura del Cuerpo de Madera:', `${state.height - state.legHeight} cm`],
    ['Altura de Patas Metálicas:', `${state.legHeight} cm`],
    ['Espesor de Tableros Estructurales:', `${state.thickness * 10} mm`],
    ['Color Paredes / Estructura Exterior:', `${extColorConfig.name} (${extColorConfig.hex})`],
    ['Textura Fondo Interior (Abet Laminati):', `${abetConfig.name} - ${abetConfig.finish} (${abetConfig.code})`],
    ['Frentes de Puertas:', 'Marco de Madera Clara Natural + Vidrio Templado Incoloro / Cuadrícula'],
    ['Módulo Central:', 'Cajón en Melamina Madera Clara con correderas ocultas cierre suave'],
    ['Repisas Interiores:', '2 Repisas en Cristal Templado Extra Claro e=6mm'],
    ['Sistema de Base:', 'Bastidor de acero tubular cuadrado 25x25mm negro con 4 regatones regulables M8'],
    []
  ];

  // 2. Tabla de Despiece
  const partsHeader = [
    'N°', 'Pieza / Componente', 'Categoría', 'Cant.', 'Largo (mm)', 'Ancho (mm)', 'Espesor (mm)', 'Material / Acabado', 'Canto L1', 'Canto L2', 'Canto A1', 'Canto A2', 'Observaciones Técnicas'
  ];

  const partsRows = parts.map((p, idx) => [
    idx + 1,
    p.name,
    p.category,
    p.qty,
    p.lengthMm,
    p.widthMm,
    p.thicknessMm,
    p.material,
    p.edgeL1 ? 'PVC' : '-',
    p.edgeL2 ? 'PVC' : '-',
    p.edgeW1 ? 'PVC' : '-',
    p.edgeW2 ? 'PVC' : '-',
    p.notes
  ]);

  // 3. Tabla de Herrajes
  const hwHeader = ['N°', 'Herraje / Accesorio', 'Código SKU', 'Cant.', 'Unidad', 'Categoría', 'Especificación y Montaje'];
  const hwRows = hardware.map((h, idx) => [
    idx + 1,
    h.name,
    h.sku,
    h.qty,
    h.unit,
    h.category,
    h.description
  ]);

  const sheetData = [
    ...summaryRows,
    ['--- LISTADO DE PIEZAS DE CORTE Y MECANIZADO (CUTTING LIST) ---'],
    partsHeader,
    ...partsRows,
    [],
    ['--- LISTADO DE HERRAJES, FIJACIONES Y ACCESORIOS (BOM) ---'],
    hwHeader,
    ...hwRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Styling
  ws['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 20 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 45 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Fabricacion Aparador');
  XLSX.writeFile(wb, `Aparador_Especial_${state.width}x${state.height}x${state.depth}.xlsx`);
}

export function exportSpecialFurniturePDF(state: SpecialFurnitureState) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const parts = generateSpecialPartsList(state);
  const hardware = generateSpecialHardwareList(state);
  const extColorConfig = SPECIAL_COLORS.find(c => c.id === state.exteriorColor) || SPECIAL_COLORS[0];
  const abetConfig = ABET_TEXTURES.find(t => t.id === state.backTexture) || ABET_TEXTURES[0];

  // Header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 28, 'F');
  
  renderArquifyPdfLogo(doc, 14, 14, 22);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Línea Muebles Especiales | Aparador Vitrina de Autor', 14, 22);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 160, 22);

  // Technical Summary Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPECIFICACIONES DE DISEÑO Y MATERIALIDAD', 14, 34);

  const specs = [
    `Dimensiones: ${state.width} cm (Ancho) x ${state.height} cm (Alto) x ${state.depth} cm (Fondo)`,
    `Cuerpo de Madera: ${state.height - state.legHeight} cm | Patas Metálicas: ${state.legHeight} cm | Espesor: ${state.thickness * 10} mm`,
    `Estructura Exterior: ${extColorConfig.name} (${extColorConfig.description})`,
    `Fondo Interior: Abet Laminati ${abetConfig.name} (${abetConfig.code}) - ${abetConfig.finish}`,
    `Puertas y Frente Cajón: Marco de Madera Clara con Vidrio Templado + Frente Melamina Madera Clara`,
    `Base Estructural: Bastidor tubular de acero 25x25mm esmaltado negro con 4 regatones cromados M8`
  ];

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  specs.forEach((text, i) => {
    doc.text(`• ${text}`, 16, 40 + i * 5);
  });

  // Table 1: Cutting List
  // @ts-ignore
  doc.autoTable({
    startY: 75,
    head: [['N°', 'Pieza', 'Cant', 'Largo', 'Ancho', 'Esp.', 'Material / Acabado', 'Notas']],
    body: parts.map((p, idx) => [
      idx + 1,
      p.name,
      p.qty,
      `${p.lengthMm} mm`,
      `${p.widthMm} mm`,
      `${p.thicknessMm} mm`,
      p.material,
      p.notes
    ]),
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 42 },
      2: { cellWidth: 10 },
      3: { cellWidth: 16 },
      4: { cellWidth: 16 },
      5: { cellWidth: 12 },
      6: { cellWidth: 46 },
      7: { cellWidth: 40 }
    }
  });

  // Table 2: Hardware List
  // @ts-ignore
  const lastY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTADO DE HERRAJES Y FIJACIONES (BOM)', 14, lastY);

  // @ts-ignore
  doc.autoTable({
    startY: lastY + 4,
    head: [['N°', 'Herraje / Accesorio', 'SKU', 'Cant', 'Un.', 'Categoría', 'Descripción Técnica']],
    body: hardware.map((h, idx) => [
      idx + 1,
      h.name,
      h.sku,
      h.qty,
      h.unit,
      h.category,
      h.description
    ]),
    theme: 'grid',
    headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] }
  });

  doc.save(`Aparador_Especial_Plano_${state.width}x${state.height}x${state.depth}.pdf`);
}
