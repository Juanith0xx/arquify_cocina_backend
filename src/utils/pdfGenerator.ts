import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectItem } from '../store/adminStore';
import { renderArquifyPdfLogo } from './pdfLogo';

export function exportProjectToPdf(project: ProjectItem) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [249, 115, 22]; // #f97316 (orange-500)
  const darkColor = [24, 24, 27]; // #18181b (zinc-900)
  const slateColor = [100, 116, 139]; // slate-500

  // Header Background Bar
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 32, 210, 2, 'F');

  // Logo / Title in Bellota Font
  renderArquifyPdfLogo(doc, 14, 16, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('REPORTE TÉCNICO & FICHA DE FABRICACIÓN INDUSTRIAL', 14, 25);

  // Date / Superadmin tag
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha: ${project.date || new Date().toISOString().split('T')[0]}`, 196, 16, { align: 'right' });
  doc.setTextColor(249, 115, 22);
  doc.text('SISTEMA SUPERADMIN', 196, 24, { align: 'right' });

  // Project Info Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(project.name, 14, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(`Cliente / Referencia: ${project.client || 'General'}`, 14, 51);
  doc.text(`Tipo de Módulo: ${getModuleTypeName(project.type)}`, 14, 57);
  doc.text(`Descripción: ${project.description || 'Sin descripción adicional'}`, 14, 63);

  let currentY = 72;

  // Module-specific data generation
  if (project.type === 'kitchen') {
    renderKitchenPdf(doc, project, currentY);
  } else if (project.type === 'closet') {
    renderClosetPdf(doc, project, currentY);
  } else if (project.type === 'special') {
    renderSpecialFurniturePdf(doc, project, currentY);
  } else {
    renderGenericPdf(doc, project, currentY);
  }

  // Save the PDF
  const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ficha_tecnica.pdf`;
  doc.save(filename);
}

function getModuleTypeName(type: string): string {
  switch (type) {
    case 'kitchen':
      return 'Cocina Modular & Planificador 2D/3D';
    case 'closet':
      return 'Clóset Paramétrico Modular';
    case 'special':
      return 'Mueble Especial / Aparador Vitrina Autor';
    case 'office':
      return 'Mobiliario de Oficina (Space Planning)';
    case 'hpl-bathroom':
      return 'Cabinas Sanitarias Fenólicas HPL';
    case 'chair':
      return 'Sillas Terciado Curvo & Estructura Metálica';
    default:
      return 'Proyecto de Mobiliario 3D';
  }
}

function renderKitchenPdf(doc: jsPDF, project: ProjectItem, startY: number) {
  const d = project.data || {};
  const cabinets = d.cabinets || [];

  autoTable(doc, {
    startY: startY,
    head: [['Resumen General Cocina', 'Detalle']],
    body: [
      ['Total de Módulos / Gabinetes', `${cabinets.length} unidades`],
      ['Espesor de Tableros Cascos', `${d.thickness || 18} mm`],
      ['Módulos Bajos', `${cabinets.filter((c: any) => c.type === 'base').length} unid.`],
      ['Módulos Aéreos / Pared', `${cabinets.filter((c: any) => c.type === 'wall').length} unid.`],
      ['Módulos Torre / Despensero', `${cabinets.filter((c: any) => c.type === 'tall').length} unid.`],
      ['Presupuesto Estimado CLP', `$${(project.totalCostEstimateClp || 4200000).toLocaleString('es-CL')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  const cabRows = cabinets.map((c: any, i: number) => [
    `#${i + 1} - ${c.type.toUpperCase()}`,
    `${c.width} x ${c.height} x ${c.depth} cm`,
    c.doorColor || '#FFFFFF',
    c.structureColor || '#FFFFFF',
    'Melamina 18mm / Tapacanto 2mm',
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('LISTADO DE MÓDULOS DE COCINA', 14, finalY + 10);

  autoTable(doc, {
    startY: finalY + 14,
    head: [['Gabinete', 'Dimensiones (An x Al x Pr)', 'Color Frentes', 'Color Casco', 'Materialidad']],
    body: cabRows.length > 0 ? cabRows : [['Sin gabinetes configurados', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });
}

function renderClosetPdf(doc: jsPDF, project: ProjectItem, startY: number) {
  const d = project.data || {};
  const modules = d.modules || [];

  autoTable(doc, {
    startY: startY,
    head: [['Especificación Clóset', 'Valor']],
    body: [
      ['Altura Total', `${d.height || 240} cm`],
      ['Profundidad', `${d.depth || 60} cm`],
      ['Espesor de Placas', `${d.thickness || 18} mm`],
      ['Cantidad de Cuerpos / Módulos', `${modules.length} cuerpos`],
      ['Color Estructura', `${d.structureColor || '#FFFFFF'}`],
      ['Color Frentes / Puertas', `${d.doorColor || '#F8F9FA'}`],
      ['Presupuesto Estimado CLP', `$${(project.totalCostEstimateClp || 1800000).toLocaleString('es-CL')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  const modRows = modules.map((m: any, i: number) => [
    `Cuerpo #${i + 1}`,
    `${m.width} cm`,
    `${m.shelves} repisas`,
    `${m.drawers} cajones`,
    m.doors ? 'Con Puertas' : 'Abierto',
    m.hasHanger ? 'Sí (Barra Ovalada)' : 'No',
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('DESGLOSE DE MÓDULOS DE CLÓSET', 14, finalY + 10);

  autoTable(doc, {
    startY: finalY + 14,
    head: [['Módulo', 'Ancho', 'Repisas', 'Cajones', 'Puertas', 'Perchero']],
    body: modRows.length > 0 ? modRows : [['Sin módulos', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });
}

function renderSpecialFurniturePdf(doc: jsPDF, project: ProjectItem, startY: number) {
  const d = project.data || {};

  autoTable(doc, {
    startY: startY,
    head: [['Característica Mueble Especial', 'Detalle']],
    body: [
      ['Dimensiones (Ancho x Alto x Prof.)', `${d.width || 90} x ${d.height || 180} x ${d.depth || 42} cm`],
      ['Laminado Decorativo Fondo', `${d.abetTextureId || 'Abet Broccato 2831 (Italia)'}`],
      ['Espesor de Tableros', `${d.thickness || 1.8} cm (18 mm)`],
      ['Altura de Patas Metálicas', `${d.legHeight || 25} cm`],
      ['Acabado Marco Madera', `${d.woodColor || 'Roble / Nogal Natural'}`],
      ['Presupuesto Estimado CLP', `$${(project.totalCostEstimateClp || 1350000).toLocaleString('es-CL')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });
}

function renderGenericPdf(doc: jsPDF, project: ProjectItem, startY: number) {
  autoTable(doc, {
    startY: startY,
    head: [['Detalle General', 'Información']],
    body: [
      ['Nombre Proyecto', project.name],
      ['Cliente', project.client || 'General'],
      ['Tipo', project.type],
      ['Fecha Registro', project.date],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });
}
