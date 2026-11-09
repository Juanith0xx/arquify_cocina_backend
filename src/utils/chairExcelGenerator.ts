import * as XLSX from 'xlsx';
import {
  ChairState,
  CHAIR_LEGS_COLORS,
  ABET_LAMINATI_CATALOG,
  CHAIR_FIXED_DIMENSIONS,
} from '../store/chairStore';

export function exportChairExcel(state: ChairState) {
  const legsConfig = CHAIR_LEGS_COLORS[state.legsColor];
  const seatLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.seatLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backFrontLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.backrestFrontLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backRearLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === state.backrestRearLaminateId) || ABET_LAMINATI_CATALOG[0];

  const qty = state.chairQuantity;

  // Calculo de consumo de materiales
  const seatAreaM2 = (0.44 * 0.43) * qty; // m2
  const backrestAreaM2 = (0.42 * 0.28) * qty; // m2
  const sheetAreaM2 = (1.30 * 3.05); // 3.965 m2 por plancha Abet 130x305 cm

  // Total HPL
  const totalHplM2 = seatAreaM2 + backrestAreaM2 * 2; // frente + dorso
  const sheetsNeeded = Math.ceil(totalHplM2 / (sheetAreaM2 * 0.85)); // 85% aprovechamiento

  // Tubo de acero (metros lineales)
  const steelTubeMetersPerChair = 4.2; // 4 patas + travesaños + soportes
  const totalSteelMeters = steelTubeMetersPerChair * qty;

  // 1. Resumen General
  const generalData = [
    ['REPORTE TÉCNICO DE FABRICACIÓN Y CUBICACIÓN - SILLAS PARAMÉTRICAS'],
    ['Software', 'Arquify CAD/BIM Suite'],
    ['Fecha de Emisión', new Date().toLocaleDateString('es-CL')],
    ['Cantidad de Sillas', `${qty} unidades`],
    [''],
    ['ESPECIFICACIONES DE DISEÑO Y MATERIALES'],
    ['Elemento', 'Especificación', 'Detalle Técnico'],
    ['Estructura Metálica', legsConfig.name, `${legsConfig.ral} - Esmalte Electrostático al Horno`],
    ['Tubo de Acero', 'Tubo Redondo Ø 22.2 mm (7/8")', 'Espesor 1.5 mm, curvado en frío CNC'],
    ['Asiento (Superior)', `${seatLaminate.name} (${seatLaminate.code})`, `Abet Laminati HPL 0.9mm (Plancha 130x305 cm)`],
    ['Asiento (Inferior)', 'Madera Terciada Natural', 'Barniz protector al agua incoloro'],
    ['Respaldo (Frente)', `${backFrontLaminate.name} (${backFrontLaminate.code})`, `Abet Laminati HPL 0.9mm`],
    ['Respaldo (Dorso)', state.backrestSameBothSides ? 'Idéntico al Frente' : `${backRearLaminate.name} (${backRearLaminate.code})`, 'Abet Laminati HPL 0.9mm'],
    ['Alma Estructural', 'Terciado Curvo 12 mm', 'Prensado fenólico multicapa en molde'],
    ['Borde Perimetral', 'Canto Terciado Multilaminar', 'Lijado grano 180 + sellador poliuretano'],
    ['Regatones', '4 por silla', 'Polipropileno / Nylon negro inyectado de alto impacto'],
    ['Fijaciones', 'Pernos / Remaches carrocero inox', '4 por respaldo, 4 por asiento'],
    [''],
    ['DIMENSIONES NOMINALES FIJAS (PLANO MATRICERÍA)'],
    ['Cota', 'Valor (mm)', 'Tolerancia'],
    ['Altura Total', CHAIR_FIXED_DIMENSIONS.totalHeight, '± 2.0 mm'],
    ['Altura Asiento', CHAIR_FIXED_DIMENSIONS.seatHeight, '± 2.0 mm'],
    ['Ancho Asiento', CHAIR_FIXED_DIMENSIONS.seatWidth, '± 2.0 mm'],
    ['Profundidad Asiento', CHAIR_FIXED_DIMENSIONS.seatDepth, '± 2.0 mm'],
    ['Ancho Respaldo', CHAIR_FIXED_DIMENSIONS.backrestWidth, '± 2.0 mm'],
    ['Altura Respaldo', CHAIR_FIXED_DIMENSIONS.backrestHeight, '± 2.0 mm'],
    ['Ancho Exterior Patas', CHAIR_FIXED_DIMENSIONS.overallWidth, '± 3.0 mm'],
    ['Profundidad Exterior', CHAIR_FIXED_DIMENSIONS.overallDepth, '± 3.0 mm'],
  ];

  // 2. Lista de Materiales (BOM)
  const bomData = [
    ['LISTA DE MATERIALES (BOM INDUSTRIAL)'],
    ['Ítem', 'Descripción', 'Unidad', 'Cantidad Total', 'Observaciones'],
    [1, 'Plancha Abet Laminati 1300 × 3050 × 0.9 mm', 'Plancha (3.965 m²)', sheetsNeeded, 'Formato estándar 130x305 cm'],
    [2, 'Terciado Plywood Curvo Prensado 12 mm', 'm²', (seatAreaM2 + backrestAreaM2).toFixed(2), 'Estructural curvado'],
    [3, 'Tubo Acero Tubular Ø 22.2 × 1.5 mm', 'Metros lineales', totalSteelMeters.toFixed(1), 'Curvado y soldado'],
    [4, 'Pintura Electrostática en Polvo', 'kg', (0.35 * qty).toFixed(2), `${legsConfig.name} (${legsConfig.ral})`],
    [5, 'Regatones Plásticos Ø 22.2 mm', 'Unidades', qty * 4, 'Nylon alto impacto'],
    [6, 'Remaches / Pernos Carrocero M6 Inox', 'Unidades', qty * 8, 'Fijación de conchas a estructura'],
    [7, 'Adhesivo de Contacto / Pur HPL', 'Litros', (0.15 * qty).toFixed(2), 'Prensado en frío/caliente'],
  ];

  const wb = XLSX.utils.book_new();

  const wsGeneral = XLSX.utils.aoa_to_sheet(generalData);
  const wsBom = XLSX.utils.aoa_to_sheet(bomData);

  // Column widths
  wsGeneral['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 45 }];
  wsBom['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 20 }, { wch: 18 }, { wch: 35 }];

  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Ficha Tecnica');
  XLSX.utils.book_append_sheet(wb, wsBom, 'Cubicacion BOM');

  XLSX.writeFile(wb, `Cubicacion_Sillas_AbetLaminati_${qty}unidades.xlsx`);
}
