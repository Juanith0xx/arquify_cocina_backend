import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderArquifyPdfLogo } from './pdfLogo';
import {
  ConcreteHouseDimensions,
  ConcreteOpening,
  ConcreteInteriorWall,
  WallThicknessMm,
  WallMeshType,
  ConcreteGrade,
  ConcreteSlump,
  ConcreteFoundationType,
  SlabType,
  RebarSteelQuality,
  ConcreteWallSystemType,
  ConcreteMezzanineSystemType,
  ConcreteRoofStructureType,
} from '../store/concreteHouseStore';
import { calculateConcreteHouseBOM, ConcreteSummaryMetrics } from './concreteManufacturing';

export function exportConcreteHouseToPdf(
  dims: ConcreteHouseDimensions,
  wallThicknessMm: WallThicknessMm,
  meshType: WallMeshType,
  concreteGrade: ConcreteGrade,
  concreteSlump: ConcreteSlump,
  foundationType: ConcreteFoundationType,
  slabType: SlabType,
  rebarQuality: RebarSteelQuality,
  meshDiameterMm: number,
  openings: ConcreteOpening[],
  interiorWalls: ConcreteInteriorWall[] = [],
  wallSystemType: ConcreteWallSystemType = 'hormigon_armado_total',
  mezzanineSystemType: ConcreteMezzanineSystemType = 'losa_hormigon_armado',
  roofStructureType: ConcreteRoofStructureType = 'dos_aguas_hormigon'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const metrics: ConcreteSummaryMetrics = calculateConcreteHouseBOM(
    dims,
    wallThicknessMm,
    meshType,
    concreteGrade,
    concreteSlump,
    foundationType,
    slabType,
    rebarQuality,
    meshDiameterMm,
    openings,
    interiorWalls,
    wallSystemType,
    mezzanineSystemType,
    roofStructureType
  );

  // Colores corporativos de ingeniería
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [234, 88, 12]; // Orange 600
  const grayColor = [100, 116, 139]; // Slate 500

  // 1. Encabezado
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  renderArquifyPdfLogo(doc, 14, 13, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MEMORIA TÉCNICA Y CUBICACIÓN ESTRUCTURAL', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 200, 200);
  doc.text('VIVIENDA 1 Y 2 NIVELES • NCh430 / NCh2123 / NCh1928 / NCh1198 / NCh170 / D.S. N°60', 14, 26);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 160, 20);

  // 2. Ficha del Proyecto
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. CONFIGURACIÓN SISTEMA ESTRUCTURAL (3 PASOS) Y PARÁMETROS', 14, 35);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const col1X = 18;
  const col2X = 105;

  const wallSystemText = wallSystemType === 'hormigon_armado_total' ? 'H.A. Total (NCh430)' : 'Albañilería Confinada (NCh2123)';
  const mezText = dims.levels > 1 ? (mezzanineSystemType === 'losa_hormigon_armado' ? 'Losa H.A. 12cm' : 'Entrepiso Liviano Madera C24') : 'No aplica (1 nivel)';
  const roofText = roofStructureType === 'dos_aguas_hormigon' ? 'Losa Dos Aguas H.A.' : roofStructureType === 'losa_plana_hormigon' ? 'Losa Plana H.A.' : 'Techumbre Liviana Madera';

  doc.text(`• Paso 1 (Muros): ${wallSystemText}`, col1X, 44);
  doc.text(`• Paso 2 (Entrepiso): ${mezText}`, col1X, 50);
  doc.text(`• Paso 3 (Techumbre): ${roofText}`, col1X, 56);
  doc.text(`• Sup. Construida: ${metrics.totalBuiltAreaM2.toFixed(1)} m² (${dims.levels} Niveles)`, col1X, 62);
  doc.text(`• Planta: ${(dims.width / 100).toFixed(2)} x ${(dims.length / 100).toFixed(2)} m (H: ${(dims.wallHeight / 100).toFixed(2)} m)`, col1X, 68);

  doc.text(`• Espesor Muros: ${wallThicknessMm} mm (${meshType === 'malla_central' ? 'Malla Central' : 'Doble Malla'})`, col2X, 44);
  doc.text(`• Hormigón: ${concreteGrade.replace('_', ' / ')} (Cono ${concreteSlump === 'fluido_18cm' ? '≥18cm' : '10-12cm'})`, col2X, 50);
  doc.text(`• Fundación: ${foundationType === 'losa_fundacion_suples' ? 'Losa Suples (ICH 17)' : 'Cimiento Corrido (ICH 20)'}`, col2X, 56);
  doc.text(`• Acero Refuerzo: ${rebarQuality.replace('_', '-')} + Malla AT56-50H`, col2X, 62);
  doc.text(`• Vanos: ${metrics.totalOpeningsCount} un (${metrics.openingsAreaM2.toFixed(1)} m² descontados)`, col2X, 68);

  // 3. Resumen Global de Partidas (Indicadores clave)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. BALANCE DE CUBICACIÓN INDUSTRIAL', 14, 82);

  const metricsBoxes = [
    { title: 'VOLUMEN HORMIGÓN', val: `${metrics.totalConcreteM3.toFixed(1)} m³`, sub: `~ ${metrics.mixerTruckLoads} Mixers` },
    { title: 'SUPERFICIE MOLDAJE', val: `${metrics.totalFormworkM2.toFixed(1)} m²`, sub: `${metrics.releaseAgentLiters} L Desmoldante` },
    { title: 'ENFIERRADURA TOTAL', val: `${metrics.totalSteelKg.toFixed(0)} kg`, sub: `Cuantía: ${metrics.steelRatioKgM3.toFixed(1)} kg/m³` },
    { title: 'TOTAL PRESUPUESTO', val: `$ ${(metrics.totalCostClp / 1000000).toFixed(2)} M`, sub: `$ ${metrics.costPerM2Clp.toLocaleString('es-CL')}/m²` },
  ];

  metricsBoxes.forEach((bx, idx) => {
    const bxX = 14 + idx * 47;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(bxX, 86, 44, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(bx.title, bxX + 3, 91);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text(bx.val, bxX + 3, 98);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(bx.sub, bxX + 3, 104);
  });

  // 4. Tabla de Partidas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DESGLOSE DE PARTIDAS Y MATERIALES (BOM)', 14, 116);

  const tableBody = metrics.items.map((it, i) => [
    (i + 1).toString(),
    it.category,
    it.name,
    it.unit,
    it.quantity.toLocaleString('es-CL'),
    `$ ${it.unitPriceClp.toLocaleString('es-CL')}`,
    `$ ${it.totalPriceClp.toLocaleString('es-CL')}`,
    it.normReference,
  ]);

  // Fila total
  tableBody.push([
    '',
    '',
    'TOTAL OBRA GRUESA HORMIGÓN ARMADO',
    '',
    '',
    '',
    `$ ${metrics.totalCostClp.toLocaleString('es-CL')}`,
    'PRECIO ESTIMADO',
  ]);

  autoTable(doc, {
    startY: 120,
    head: [['#', 'Categoría', 'Descripción del Material', 'Unid.', 'Cant.', 'P. Unit.', 'Total CLP', 'Norma / Ref.']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 55 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 24, fontSize: 6.5 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 242, 242];
        data.cell.styles.textColor = [153, 27, 27];
      }
    },
  });

  // 5. Pie de página y firma normativa
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  if (finalY < 265) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento técnico generado automáticamente conforme al Manual de Detallamiento ICH y NCh430. Los diámetros de refuerzo y espesores de muro deben ser validados por el Ingeniero Calculista del proyecto.',
      14,
      finalY + 8,
      { maxWidth: 182 }
    );
  }

  // Descarga
  doc.save(`Ficha_Tecnica_Hormigon_${dims.width / 100}x${dims.length / 100}m_${new Date().toISOString().slice(0, 10)}.pdf`);
}
