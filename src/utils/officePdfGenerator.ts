import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PlacedOfficeItem, OfficeProjectStats, UnderlayFloorPlan } from '../types/office';
import { MELAMINE_FINISHES, METAL_FINISHES, SCREEN_FABRICS } from '../store/officeStore';
import { generateOfficeFloorPlanImage, captureOffice3DCanvas } from './officeScreenshot';
import { renderArquifyPdfLogo } from './pdfLogo';

export async function exportOfficeProjectToPdf(
  items: PlacedOfficeItem[],
  stats: OfficeProjectStats,
  floorPlan?: UnderlayFloorPlan,
  projectName: string = 'Propuesta de Mobiliario Corporativo'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [249, 115, 22]; // Orange 500
  const darkColor = [24, 24, 27];     // Zinc 900
  const grayText = [100, 116, 139];   // Slate 500

  // ==========================================
  // PÁGINA 1: PORTADA & VISTAS GRÁFICAS (3D + 2D)
  // ==========================================

  // Header superior
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 22, 210, 1.5, 'F');

  // Logo Arquify con tipografía Bellota
  renderArquifyPdfLogo(doc, 14, 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(249, 115, 22);
  doc.text('CORPORATE SPACE PLANNING & FURNITURE', 44, 14);

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 196, 14, { align: 'right' });

  // Título del Proyecto
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(projectName, 14, 32);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Informe Técnico de Habilitación, Cubicación de Mobiliario y Especificaciones de Fabricación', 14, 37);

  // Generar / Capturar Imágenes de Perspectiva 3D y Planta 2D
  const image3D = captureOffice3DCanvas();
  let image2D = '';
  if (floorPlan) {
    try {
      image2D = await generateOfficeFloorPlanImage(items, floorPlan, 1000, 700);
    } catch (e) {
      console.warn('No se pudo generar imagen 2D:', e);
    }
  }

  const imgWidth = 88;
  const imgHeight = 62;
  const startImgY = 43;

  // Render Box 1: Perspectiva 3D
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startImgY, imgWidth, imgHeight + 8, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('1. PERSPECTIVA 3D / RENDER DE AMBIENTACIÓN', 17, startImgY + 5.5);

  if (image3D) {
    try {
      doc.addImage(image3D, 'JPEG', 15, startImgY + 7, imgWidth - 2, imgHeight - 1);
    } catch {
      renderPlaceholderImage(doc, 15, startImgY + 7, imgWidth - 2, imgHeight - 1, 'Perspectiva 3D');
    }
  } else {
    renderPlaceholderImage(doc, 15, startImgY + 7, imgWidth - 2, imgHeight - 1, 'Perspectiva 3D');
  }

  // Render Box 2: Planta 2D
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, startImgY, imgWidth, imgHeight + 8, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('2. PLANTA TÉCNICA 2D / DISTRIBUCIÓN', 111, startImgY + 5.5);

  if (image2D) {
    try {
      doc.addImage(image2D, 'JPEG', 109, startImgY + 7, imgWidth - 2, imgHeight - 1);
    } catch {
      renderPlaceholderImage(doc, 109, startImgY + 7, imgWidth - 2, imgHeight - 1, 'Planta 2D');
    }
  } else {
    renderPlaceholderImage(doc, 109, startImgY + 7, imgWidth - 2, imgHeight - 1, 'Planta 2D');
  }

  // Resumen Ejecutivo Cards debajo de las imágenes en la Hoja 1
  const cardY = startImgY + imgHeight + 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, 42, 20, 2, 2, 'FD');
  doc.roundedRect(60, cardY, 42, 20, 2, 2, 'FD');
  doc.roundedRect(106, cardY, 42, 20, 2, 2, 'FD');
  doc.roundedRect(152, cardY, 44, 20, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('PUESTOS OPERATIVOS', 18, cardY + 6);
  doc.text('GERENCIAS / PRIVADAS', 64, cardY + 6);
  doc.text('SALAS DE REUNIÓN', 110, cardY + 6);
  doc.text('PRESUPUESTO TOTAL', 156, cardY + 6);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`${stats.workstationsCount} pers.`, 18, cardY + 15);
  doc.text(`${stats.executiveCount} of.`, 64, cardY + 15);
  doc.text(`${stats.meetingSeatsCount} pers.`, 110, cardY + 15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`$${(stats.totalCostClp / 1000000).toFixed(2)}M`, 156, cardY + 15);

  // Agrupación para tabla de despiece
  const groupedMap: { [key: string]: { item: PlacedOfficeItem; count: number; subtotal: number } } = {};
  items.forEach((item) => {
    const key = `${item.type}-${item.dimensionsCm.width}-${item.melamineFinish}-${item.metalFinish}`;
    if (!groupedMap[key]) {
      groupedMap[key] = { item, count: 0, subtotal: 0 };
    }
    groupedMap[key].count += 1;
    groupedMap[key].subtotal += item.priceClp;
  });

  const tableBody = Object.values(groupedMap).map(({ item, count, subtotal }, idx) => {
    const melName = MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish)?.name || 'Estándar';
    const metName = METAL_FINISHES.find((m) => m.id === item.metalFinish)?.name || 'Negro MT';
    return [
      idx + 1,
      item.name,
      `${item.dimensionsCm.width} x ${item.dimensionsCm.depth} x ${item.dimensionsCm.height} cm`,
      melName,
      metName,
      count,
      `$${item.priceClp.toLocaleString('es-CL')}`,
      `$${subtotal.toLocaleString('es-CL')}`,
    ];
  });

  // Título de la tabla en página 1
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('RESUMEN DE CUBICACIÓN & PRESUPUESTO', 14, cardY + 28);

  autoTable(doc, {
    startY: cardY + 31,
    head: [['#', 'Módulo de Mobiliario', 'Dimensiones', 'Cubierta MDP', 'Estructura', 'Cant.', 'Unitario', 'Total CLP']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 44 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26 },
      4: { cellWidth: 24 },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
    },
    foot: [
      ['', '', '', '', '', '', 'Neto:', `$${stats.netCostClp.toLocaleString('es-CL')}`],
      ['', '', '', '', '', '', 'IVA 19%:', `$${stats.taxIvaClp.toLocaleString('es-CL')}`],
      ['', '', '', '', '', '', 'Total CLP:', `$${stats.totalCostClp.toLocaleString('es-CL')}`],
    ],
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
  });

  // Footer con EETT
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  if (finalY < 265) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('NOTAS Y ESPECIFICACIONES TÉCNICAS:', 14, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text('• Cubiertas principales en aglomerado MDP 24 mm con tapacanto PVC 2 mm termofusionado.', 14, finalY + 12);
    doc.text('• Estructura metálica en perfiles tubulares de acero 50x50 mm con pintura electrostática microtexturada horneada.', 14, finalY + 16);
    doc.text('• Incluye canalizaciones de electrificación integradas y pasacables abatibles de aluminio.', 14, finalY + 20);
  }

  doc.save(`${projectName.replace(/\s+/g, '_')}_Arquify.pdf`);
}

function renderPlaceholderImage(doc: jsPDF, x: number, y: number, w: number, h: number, label: string) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(x, y, w, h, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`[Vista ${label}]`, x + w / 2, y + h / 2, { align: 'center' });
}

