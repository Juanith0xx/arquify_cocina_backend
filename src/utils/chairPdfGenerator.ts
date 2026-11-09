import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ChairState,
  CHAIR_LEGS_COLORS,
  ABET_LAMINATI_CATALOG,
  CHAIR_FIXED_DIMENSIONS,
} from '../store/chairStore';
import { renderArquifyPdfLogo } from './pdfLogo';

export function exportChairPDF(state: ChairState) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [249, 115, 22]; // Orange 500
  const darkColor: [number, number, number] = [24, 24, 27];     // Zinc 900
  const grayText: [number, number, number] = [100, 116, 139];   // Slate 500

  const legsConfig = CHAIR_LEGS_COLORS[state.legsColor];
  const seatLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.seatLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backFrontLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.backrestFrontLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backRearLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.backrestRearLaminateId) || ABET_LAMINATI_CATALOG[0];
  const qty = state.chairQuantity;

  // Header superior oscuro
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 22, 210, 1.5, 'F');

  // Logo Arquify
  renderArquifyPdfLogo(doc, 14, 14, 20);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22);
  doc.text('FICHA TÉCNICA • SILLAS TERCIADO CURVO & ABET LAMINATI', 46, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 196, 14, { align: 'right' });

  // Título del documento
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Especificación de Fabricación & Cotización', 14, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    `Cantidad: ${qty} unidad${qty > 1 ? 'es' : ''} • Matricería Fija • Formato Plancha Abet: 130 × 305 cm • Tubo Fierro Ø 22.2mm`,
    14,
    37
  );

  // Tabla 1: Especificaciones de Materiales
  autoTable(doc, {
    startY: 44,
    head: [['Componente', 'Material / Acabado Seleccionado', 'Especificación Técnica Industrial']],
    body: [
      ['Estructura & Patas', legsConfig.name, `${legsConfig.ral} • Pintura Electrostática al Horno sobre Acero`],
      ['Perfil Estructural', 'Tubo Redondo de Acero Ø 22.2 mm (7/8")', 'Calibre 1.5 mm de pared, curvado en frío CNC, regatones nylon'],
      ['Asiento (Superior)', `${seatLaminate.name} (${seatLaminate.code})`, 'Laminado Plástico HPL Abet Laminati 0.9 mm (Plancha 130x305 cm)'],
      ['Asiento (Inferior)', 'Madera Terciada Natural', 'Cara vista inferior con barniz incoloro de protección'],
      ['Respaldo (Frente)', `${backFrontLaminate.name} (${backFrontLaminate.code})`, 'Abet Laminati HPL 0.9 mm prensado sobre terciado curvo'],
      [
        'Respaldo (Dorso)',
        state.backrestSameBothSides ? 'Idéntico al frente' : `${backRearLaminate.name} (${backRearLaminate.code})`,
        'Abet Laminati HPL 0.9 mm prensado sobre terciado curvo',
      ],
      ['Alma de Conchas', 'Terciado Multilaminar Curvo 12 mm', 'Prensado en molde ergonómico con colas fenólicas'],
      ['Canto Perimetral', 'Canto Terciado Visto', 'Borde multilaminar lijado y sellado al natural con poliuretano'],
      ['Fijaciones', 'Remaches / Pernos Carrocero Inox M6', '4 fijaciones por asiento, 4 fijaciones por respaldo'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 62 },
      2: { cellWidth: 86 },
    },
  });

  const finalY1 = (doc as any).lastAutoTable.finalY || 120;

  // Tabla 2: Dimensiones Fijas según Plano de Matricería
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Dimensiones Fijas de Matricería (Planos de Fabricación)', 14, finalY1 + 10);

  autoTable(doc, {
    startY: finalY1 + 14,
    head: [['Cota Geométrica', 'Dimensión Nominal', 'Tolerancia', 'Descripción Funcional']],
    body: [
      ['Altura Total', `${CHAIR_FIXED_DIMENSIONS.totalHeight} mm`, '± 2.0 mm', 'Desde N.P.T. hasta la cúspide del respaldo'],
      ['Altura Asiento', `${CHAIR_FIXED_DIMENSIONS.seatHeight} mm`, '± 2.0 mm', 'Altura ergonómica estándar contractual / oficina'],
      ['Ancho de Asiento', `${CHAIR_FIXED_DIMENSIONS.seatWidth} mm`, '± 2.0 mm', 'Ancho útil con radio perimetral r=40mm'],
      ['Profundidad Asiento', `${CHAIR_FIXED_DIMENSIONS.seatDepth} mm`, '± 2.0 mm', 'Profundidad con curvatura cascada frontal'],
      ['Ancho de Respaldo', `${CHAIR_FIXED_DIMENSIONS.backrestWidth} mm`, '± 2.0 mm', 'Concha cóncava lumbar envolvente'],
      ['Altura de Respaldo', `${CHAIR_FIXED_DIMENSIONS.backrestHeight} mm`, '± 2.0 mm', 'Superficie de apoyo dorsal'],
      ['Ancho Exterior Patas', `${CHAIR_FIXED_DIMENSIONS.overallWidth} mm`, '± 3.0 mm', 'Separación de apoyo en piso (gran estabilidad)'],
      ['Profundidad Exterior', `${CHAIR_FIXED_DIMENSIONS.overallDepth} mm`, '± 3.0 mm', 'Proyección total de patas en piso'],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || 200;

  // Resumen de Cubicación Industrial
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY2 + 8, 182, 32, 3, 3, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Cubicación y Consumo Estimado de Materia Prima:', 18, finalY2 + 15);

  const seatAreaM2 = 0.44 * 0.43 * qty;
  const backrestAreaM2 = 0.42 * 0.28 * qty;
  const totalHplM2 = seatAreaM2 + backrestAreaM2 * 2;
  const sheetsNeeded = Math.ceil(totalHplM2 / (1.30 * 3.05 * 0.85));
  const totalSteelMeters = 4.2 * qty;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• Planchas Abet Laminati (130 × 305 cm, 3.965 m²): ${sheetsNeeded} plancha${sheetsNeeded > 1 ? 's' : ''} (Aprovechamiento ~89%)`, 18, finalY2 + 21);
  doc.text(`• Tubo de Acero Estructural Ø 22.2 × 1.5 mm: ${totalSteelMeters.toFixed(1)} metros lineales`, 18, finalY2 + 26);
  doc.text(`• Regatones plásticos Ø 22.2mm: ${qty * 4} u.  |  Pernos Carrocero / Remaches Inox M6: ${qty * 8} u.`, 18, finalY2 + 31);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento generado automáticamente por Arquify BIM Suite • www.arquify.cl', 105, 288, { align: 'center' });

  doc.save(`Ficha_Tecnica_Silla_AbetLaminati_${qty}u.pdf`);
}
