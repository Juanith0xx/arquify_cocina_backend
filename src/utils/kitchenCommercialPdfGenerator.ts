import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CabinetType, getCabinetLabel } from '../store/kitchenStore';
import { renderArquifyPdfLogo } from './pdfLogo';
import { getFriendlyColorName } from './colorNames';
import { generateCountertopPieces } from './countertopNesting';
import { CountertopConfig, DEFAULT_QSTONE_CATALOG, QstoneProductItem } from '../types/countertop';

export interface CommercialPdfOptions {
  projectName?: string;
  cabinets: CabinetType[];
  state: any;
  countertopConfig?: CountertopConfig;
  qstoneCatalog?: QstoneProductItem[];
  userInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commune?: string;
    rubro?: string;
  };
  screenshotUrl?: string; // Vista Isométrica 3D en base64
  estimatedTotalClp?: number;
}

export function exportKitchenCommercialPdf(options: CommercialPdfOptions) {
  const {
    projectName = 'Proyecto de Cocina',
    cabinets,
    state,
    countertopConfig,
    qstoneCatalog = DEFAULT_QSTONE_CATALOG,
    userInfo,
    screenshotUrl,
    estimatedTotalClp
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const realCabinets = cabinets.filter(
    (c) => c.type !== 'decoration' && !c.variant?.startsWith('deco_')
  );

  // 1. Portada / Cabecera Corporativa
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  renderArquifyPdfLogo(doc, 14, 12, 22);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN Y ESPECIFICACIÓN COMERCIAL', 14, 22);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`PROYECTO: ${projectName.toUpperCase()}`, 14, 28);
  doc.text(`FECHA DE EMISIÓN: ${dateStr.toUpperCase()}  |  VALIDEZ: 15 DÍAS`, 14, 33);

  // Etiqueta Tipo Cliente
  doc.setFontSize(8);
  doc.setTextColor(249, 115, 22); // Orange-500
  doc.text('DOCUMENTO PARA CLIENTE FINAL', pageWidth - 14, 18, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text('ESTUDIO & DISEÑO DE MOBILIARIO', pageWidth - 14, 24, { align: 'right' });
  if (userInfo?.rubro) {
    doc.text(`RUBRO: ${userInfo.rubro.toUpperCase()}`, pageWidth - 14, 29, { align: 'right' });
  }

  let yPos = 44;

  // 2. Ficha de Datos del Cliente y Ubicación
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL PROYECTISTA / CLIENTE REGISTRADO', 18, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const clientName = userInfo?.fullName || 'Cliente Particular';
  const clientEmail = userInfo?.email || 'No especificado';
  const clientPhone = userInfo?.phone || 'No especificado';
  const clientLocation = [userInfo?.commune, userInfo?.city].filter(Boolean).join(', ') || 'Chile';

  doc.text(`Titular / Solicitante: ${clientName}`, 18, yPos + 12);
  doc.text(`Correo Electrónico: ${clientEmail}`, 18, yPos + 17);
  doc.text(`Teléfono / Móvil: ${clientPhone}`, 18, yPos + 22);

  doc.text(`Ubicación de Obra: ${clientLocation}`, 110, yPos + 12);
  doc.text(`Dirección: ${userInfo?.address || 'A convenir'}`, 110, yPos + 17);
  doc.text(`Segmento / Rubro: ${userInfo?.rubro || 'Diseño de Interiores'}`, 110, yPos + 22);

  yPos += 34;

  // 3. Vista Isométrica 3D (Render / Canvas Snapshot)
  if (screenshotUrl && screenshotUrl.startsWith('data:image')) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    const imgWidth = pageWidth - 28;
    const imgHeight = 65;
    doc.roundedRect(14, yPos, imgWidth, imgHeight, 2, 2, 'FD');

    try {
      doc.addImage(screenshotUrl, 'PNG', 15, yPos + 1, imgWidth - 2, imgHeight - 2);
      doc.setFillColor(15, 23, 42);
      doc.rect(14, yPos + imgHeight - 6, 45, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('VISTA ISOMÉTRICA 3D', 18, yPos + imgHeight - 2);
    } catch (e) {
      console.warn('Error insertando snapshot 3D en PDF:', e);
    }
    yPos += 71;
  }

  // 4. Resumen Cuantitativo General
  const baseCount = realCabinets.filter((c) => c.type === 'base').length;
  const wallCount = realCabinets.filter((c) => c.type === 'wall').length;
  const tallCount = realCabinets.filter((c) => c.type === 'tall').length;
  const islandCount = realCabinets.filter((c) => c.type === 'island').length;
  const totalLinearM = (realCabinets.reduce((acc, c) => acc + (c.width || 60), 0) / 100).toFixed(2);

  // Cálculo de cubierta
  let countertopSummary = {
    model: 'No incluida',
    brand: 'N/A',
    areaM2: 0,
    thickness: '20 mm',
    hasWaterfall: false,
  };

  if (countertopConfig && countertopConfig.enabled !== false) {
    try {
      const nestResult = generateCountertopPieces(
        cabinets,
        countertopConfig,
        qstoneCatalog
      );
      if (nestResult) {
        countertopSummary = {
          model: nestResult.product?.name || 'Cuarzo / Piedra Técnica',
          brand: 'Qstone / SYSPROTEC',
          areaM2: nestResult.totalNetAreaM2 || 0,
          thickness: `${nestResult.product?.thicknessMm || 20} mm`,
          hasWaterfall: nestResult.pieces.some((p) => p.type === 'waterfall'),
        };
      }
    } catch (e) {
      console.warn('Error calculando cubierta comercial:', e);
    }
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN DE ALCANCE Y VOLUMEN', 18, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Módulos: ${realCabinets.length} un. (Bases: ${baseCount} | Aéreos: ${wallCount} | Columnas: ${tallCount} | Isla: ${islandCount})`,
    18,
    yPos + 12
  );
  doc.text(
    `Desarrollo Lineal: ${totalLinearM} m  |  Cubierta: ${countertopSummary.model} (${countertopSummary.areaM2} m² netos)`,
    18,
    yPos + 17
  );

  yPos += 27;

  // 5. Tabla de Módulos y Gabinetes (jspdf-autotable)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETALLE DE MOBILIARIO Y GABINETES', 14, yPos);
  yPos += 3;

  // Agrupar muebles por tipo y dimensiones
  const groupedCabinetsMap = new Map<
    string,
    { name: string; type: string; width: number; height: number; depth: number; count: number }
  >();

  realCabinets.forEach((cab, idx) => {
    const label = getCabinetLabel(cab, idx);
    const key = `${label}_${cab.width}_${cab.height}_${cab.depth}`;
    const typeLabel =
      cab.type === 'base'
        ? 'Mueble Base'
        : cab.type === 'wall'
        ? 'Mueble Aéreo'
        : cab.type === 'tall'
        ? 'Torre / Columna'
        : 'Isla Central';

    if (groupedCabinetsMap.has(key)) {
      groupedCabinetsMap.get(key)!.count += 1;
    } else {
      groupedCabinetsMap.set(key, {
        name: label,
        type: typeLabel,
        width: Math.round(cab.width),
        height: Math.round(cab.height),
        depth: Math.round(cab.depth),
        count: 1,
      });
    }
  });

  const tableRows = Array.from(groupedCabinetsMap.values()).map((item, index) => [
    String(index + 1),
    item.name,
    item.type,
    `${item.width} x ${item.height} x ${item.depth} cm`,
    `${item.count} un.`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Nombre del Módulo', 'Ubicación / Tipo', 'Dimensiones (An x Al x Prof)', 'Cantidad']],
    body: tableRows,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
    },
  });

  // Nueva posición después de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Si queda poco espacio para las especificaciones y cotización, saltar a página 2
  if (yPos > pageHeight - 75) {
    doc.addPage();
    yPos = 20;
  }

  // 6. Especificaciones de Acabados, Quincallería y Cubierta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ESPECIFICACIONES TÉCNICAS Y ACABADOS', 14, yPos);
  yPos += 4;

  const structColorName = getFriendlyColorName(state.structureColor || '#f8fafc');
  const doorColorName = getFriendlyColorName(state.doorColor || '#f8fafc');
  const drawerColorName = getFriendlyColorName(state.drawerFrontColor || state.doorColor || '#f8fafc');
  const socleColorName = state.showSocle ? (state.socleFinish === 'black' ? 'Negro Mate' : 'Aluminio Natural') : 'Sin zócalo';
  const hwBrand = state.drawerHardware === 'Hafele' ? 'Häfele German Technology' : 'Provelcar Architectural Hardware';
  const golaDesc = state.golaSystem === 'aluminum' ? 'Perfil Gola Continuo Aluminio' : state.golaSystem === 'black' ? 'Perfil Gola Continuo Negro Mate' : 'Tiradores / Manillas sobrepuestas';

  const specsRows = [
    ['Frentes y Puertas', `${doorColorName} (${state.doorMaterial === 'hpl' ? 'Laminado HPL de Alta Presión' : 'Melamina 18mm con cantos PVC termofusionados'})`],
    ['Cajoneras y Frentes', `${drawerColorName} (${state.drawerFrontMaterial === 'hpl' ? 'Laminado HPL' : 'Melamina 18mm'})`],
    ['Estructura e Interiores', `${structColorName} (Melamina 18mm de alta densidad, ensamble industrial)`],
    ['Zócalo / Base', `${socleColorName} (H = ${state.socleHeight || 10} cm con patas regulables)`],
    ['Quincallería y Correderas', `${hwBrand} (Correderas telescópicas con cierre suave amortiguado)`],
    ['Bisagras y Ensambles', 'Bisagras cazoleta 35mm con sistema Clip y amortiguador hidráulico integrado'],
    ['Sistema de Apertura', golaDesc],
    ['Cubierta de Cuarzo / Piedra', `${countertopSummary.model} - Marca ${countertopSummary.brand} (${countertopSummary.areaM2} m² netos, e=${countertopSummary.thickness}${countertopSummary.hasWaterfall ? ', incluye bajada cascada a piso' : ''})`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Elemento', 'Especificación y Marca']],
    body: specsRows,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 130 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // 7. Cuadro de Presupuesto / Cotización Comercial
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  const basePricePerLinearMeter = 420000;
  const rawCabinetPrice = Math.round(Number(totalLinearM) * basePricePerLinearMeter);
  const countertopPrice = countertopSummary.areaM2 > 0 ? Math.round(countertopSummary.areaM2 * 195000) : 0;
  const finalPriceNeto = estimatedTotalClp && estimatedTotalClp > 0 ? estimatedTotalClp : (rawCabinetPrice + countertopPrice);
  const finalPriceIva = Math.round(finalPriceNeto * 0.19);
  const finalPriceTotal = finalPriceNeto + finalPriceIva;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('COTIZACIÓN Y PRESUPUESTO COMERCIAL REFERENCIAL', 18, yPos + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Subtotal Mobiliario (${realCabinets.length} módulos): $${rawCabinetPrice.toLocaleString('es-CL')} CLP`, 18, yPos + 13);
  doc.text(`Subtotal Cubierta (${countertopSummary.areaM2} m²): $${countertopPrice.toLocaleString('es-CL')} CLP`, 18, yPos + 19);
  doc.text('Garantía: 3 años en estructura y quincallería.', 18, yPos + 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Neto: $${finalPriceNeto.toLocaleString('es-CL')} CLP`, pageWidth - 65, yPos + 13);
  doc.text(`IVA (19%): $${finalPriceIva.toLocaleString('es-CL')} CLP`, pageWidth - 65, yPos + 19);

  doc.setFontSize(11);
  doc.setTextColor(249, 115, 22);
  doc.text(`TOTAL: $${finalPriceTotal.toLocaleString('es-CL')} CLP`, pageWidth - 65, yPos + 26);

  // Pie de Página
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Ficha comercial generada por Arquify Suite 3D. Documento no vinculante hasta la ratificación formal de medidas en obra.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // Descargar archivo
  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  doc.save(`cotizacion_comercial_${safeName}.pdf`);
}
