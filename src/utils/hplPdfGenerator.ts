import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { HplBathroomState, JNF_FINISHES, HPL_STANDARD_COLORS } from '../store/hplBathroomStore';
import { calculateHplManufacturingBOM } from './hplManufacturing';
import { renderArquifyPdfLogo } from './pdfLogo';

export function exportHplBathroomPDF(state: HplBathroomState) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const bom = calculateHplManufacturingBOM(state);
  const finishInfo = JNF_FINISHES[state.hardwareFinish];
  const colorObj = HPL_STANDARD_COLORS.find((c) => c.id === state.selectedColorId);
  const colorName = state.customTextureName || colorObj?.name || 'Abet HPL';
  const dateStr = new Date().toLocaleDateString('es-CL');

  // ==========================================
  // PÁGINA 1: PORTADA TÉCNICA Y RESUMEN GENERAL
  // ==========================================
  // Header oscuro con acento elegante
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  renderArquifyPdfLogo(doc, 14, 14, 22);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ESPECIFICACIÓN TÉCNICA Y DESPIECE - SEPARADORES DE BAÑO HPL', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Fecha: ${dateStr} | Versión: 2.4-BIM`, 150, 21);

  let yPos = 40;

  // Cuadro de Resumen Ejecutivo
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, 182, 48, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS CLAVE DEL SISTEMA SANITARIO', 20, yPos + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`• Paneles Fenólicos: Marca Abet Laminati (Acabado: ${colorName})`, 20, yPos + 16);
  doc.text(`• Quincallería y Herrajes: JNF Architectural Hardware (Abstracta Chile)`, 20, yPos + 22);
  doc.text(`• Acabado Herrajes: ${finishInfo.name} (${finishInfo.code})`, 20, yPos + 28);
  doc.text(`• Sistema Estabilizador: ${state.stabilizerSystem === 'round_19' ? 'Tubo Redondo Ø19mm Inox AISI 304' : state.stabilizerSystem === 'square_20' ? 'Tubo Cuadrado 20x20mm Inox AISI 304' : 'Perfil U Aluminio Continuo'}`, 20, yPos + 34);
  doc.text(`• Dimensiones: Altura Panel ${state.panelHeight} mm | Despeje Suelo ${state.footHeight} mm (Altura Total ${state.panelHeight + state.footHeight} mm)`, 20, yPos + 40);

  yPos += 58;

  // Cuadro de Espesores Independientes por Pieza
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos, 182, 32, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPESORES INDEPENDIENTES ESPECIFICADOS (ABET LAMINATI)', 20, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Puertas: ${state.thicknessDoor} mm`, 20, yPos + 15);
  doc.text(`Pilastras Frontales: ${state.thicknessPilaster} mm`, 70, yPos + 15);
  doc.text(`Separadores Divisorios: ${state.thicknessDivider} mm`, 125, yPos + 15);
  doc.text(`Pantallas Urinarios: ${state.thicknessUrinal} mm`, 20, yPos + 23);
  doc.text(`Formato Planchas: ${bom.nesting.selectedFormat.name}`, 70, yPos + 23);
  doc.text(`Aprovechamiento Placa: ${bom.nesting.globalEfficiencyPct}%`, 125, yPos + 23);

  yPos += 42;

  // Tabla Resumen de Costos y Partidas
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO Y VALORIZACIÓN ESTIMADA', 14, yPos);

  yPos += 4;

  const costTableData = [
    ['1. Paneles HPL Abet Laminati', `Suministro de ${bom.metrics.totalSheetsCount} placas (${bom.metrics.totalHplAreaM2} m² útiles)`, `$${bom.costs.hplMaterialClp.toLocaleString('es-CL')}`],
    ['2. Quincallería JNF Inox/PVD', `Suministro de ${bom.metrics.hardwarePiecesCount} piezas según catálogo oficial`, `$${bom.costs.hardwareClp.toLocaleString('es-CL')}`],
    ['3. Mecanizado y Perforación CNC', 'Corte con disco diamantado, canteado y pasantes de seguridad', `$${bom.costs.machiningAndCncClp.toLocaleString('es-CL')}`],
    ['4. Instalación en Obra', `Montaje para ${bom.metrics.totalCubicles} cabinas + ${bom.metrics.urinalScreensCount} urinarios`, `$${bom.costs.assemblyLaborClp.toLocaleString('es-CL')}`],
    ['SUBTOTAL NETO', '', `$${bom.costs.subtotalNetoClp.toLocaleString('es-CL')}`],
    ['IVA (19%)', '', `$${bom.costs.iva19Clp.toLocaleString('es-CL')}`],
    ['TOTAL GENERAL (IVA INCLUIDO)', '', `$${bom.costs.totalBrutoClp.toLocaleString('es-CL')}`],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Item / Partida', 'Descripción Técnica', 'Monto (CLP)']],
    body: costTableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 85 },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // ==========================================
  // PÁGINA 2: LISTADO DE CORTE / DESPIECE HPL
  // ==========================================
  doc.addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTADO DE PIEZAS DE CORTE HPL - ABET LAMINATI', 14, 13);

  const partsRows = bom.parts.map((p, idx) => [
    idx + 1,
    p.name,
    p.cubicleName || '-',
    `${Math.round(p.width)} x ${Math.round(p.height)} mm`,
    `${p.thickness} mm`,
    p.qty,
    `${Math.round(((p.width * p.height) / 1000000) * p.qty * 100) / 100} m²`,
    p.colorName,
  ]);

  (doc as any).autoTable({
    startY: 28,
    head: [['N°', 'Pieza / Elemento', 'Módulo', 'Dimensiones', 'Espesor', 'Cant.', 'Área', 'Acabado']],
    body: partsRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // ==========================================
  // PÁGINA 3: LISTADO DE QUINCALLERÍA JNF
  // ==========================================
  doc.addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('QUINCALLERÍA Y HERRAJES JNF ARCHITECTURAL HARDWARE', 14, 13);

  const hwRows = bom.hardware.map((h, idx) => [
    idx + 1,
    h.code,
    h.name,
    h.qty,
    h.finish,
    `$${h.unitPriceClp.toLocaleString('es-CL')}`,
    `$${h.totalPriceClp.toLocaleString('es-CL')}`,
    h.pageRef,
  ]);

  (doc as any).autoTable({
    startY: 28,
    head: [['N°', 'Código JNF', 'Nombre Herraje', 'Cant.', 'Acabado', 'P. Unit.', 'Total (CLP)', 'Catálogo']],
    body: hwRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Especificaciones de montaje y tornillería JNF al pie
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < 240) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, finalY, 182, 38, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ESPECIFICACIONES DE MONTAJE Y TORNILLERÍA DE SEGURIDAD JNF', 20, finalY + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('1. Fijación de Bisagras: Usar exclusivamente tornillos pasantes inox SM.042.A para evitar fracturas en núcleo fenólico.', 20, finalY + 14);
    doc.text('2. Cierres y Cerrojos: Mecanizado con fresado de precisión en puerta para snib indicador libre/ocupado SM.031.', 20, finalY + 20);
    doc.text('3. Pies Regulables: Anclaje al piso con perno de expansión AISI 316. Altura regulable en obra con panel ya fijado.', 20, finalY + 26);
    doc.text('4. Tubo Aéreo de Rigidización: Fijación con soportes SM.002.19 / SM.063 en coronación y anclaje a muros perimetrales.', 20, finalY + 32);
  }

  // Guardar archivo PDF
  doc.save(`Plano_Especificacion_Cabinas_HPL_JNF_${state.cubicles.length}Cabinas.pdf`);
}
