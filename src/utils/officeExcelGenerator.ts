import * as XLSX from 'xlsx';
import { PlacedOfficeItem, OfficeProjectStats } from '../types/office';
import { MELAMINE_FINISHES, METAL_FINISHES, SCREEN_FABRICS } from '../store/officeStore';

export function exportOfficeProjectToExcel(
  items: PlacedOfficeItem[],
  stats: OfficeProjectStats,
  projectName: string = 'Proyecto Mobiliario de Oficina'
) {
  const wb = XLSX.utils.book_new();

  // --- HOJA 1: RESUMEN EJECUTIVO Y CAPACIDAD ---
  const summaryRows = [
    ['ARQUIFY BIM - REPORTE DE CUBICACIÓN Y MOBILIARIO CORPORATIVO'],
    ['Proyecto:', projectName],
    ['Fecha de Emisión:', new Date().toLocaleDateString('es-CL')],
    [''],
    ['RESUMEN DE CAPACIDAD Y ESPACIOS'],
    ['Ítem / Métrica', 'Cantidad', 'Unidad'],
    ['Puestos de Trabajo Operativos (Open Space)', stats.workstationsCount, 'Puestos'],
    ['Puestos de Gerencia y Oficinas Privadas', stats.executiveCount, 'Oficinas'],
    ['Capacidad en Salas de Reunión', stats.meetingSeatsCount, 'Personas'],
    ['Sillas de Visita / Cafetería / Lounge', stats.visitorSeatsCount, 'Asientos'],
    ['Módulos de Almacenaje (Gabinetes, Lockers, Estanterías)', stats.totalCabinetsAndLockers, 'Unidades'],
    ['Puntos de Electrificación (Pasacables / Cajas triples)', stats.totalElectrificationPasses, 'Puntos'],
    ['Total Módulos de Mobiliario en Escena', stats.totalItems, 'Piezas'],
    [''],
    ['RESUMEN ECONÓMICO (CLP)'],
    ['Monto Neto:', stats.netCostClp],
    ['IVA (19%):', stats.taxIvaClp],
    ['TOTAL PRESUPUESTO (IVA Inc.):', stats.totalCostClp],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

  // --- HOJA 2: DETALLE DE MOBILIARIO Y CUBICACIÓN ---
  // Agrupar items por tipo y acabados para cotización profesional
  const groupedMap: { [key: string]: { item: PlacedOfficeItem; count: number; subtotal: number } } = {};

  items.forEach((item) => {
    const key = `${item.type}-${item.dimensionsCm.width}-${item.melamineFinish}-${item.metalFinish}-${item.screenFinish || 'none'}`;
    if (!groupedMap[key]) {
      groupedMap[key] = { item, count: 0, subtotal: 0 };
    }
    groupedMap[key].count += 1;
    groupedMap[key].subtotal += item.priceClp;
  });

  const detailRows: any[] = [
    ['Ítem', 'Código / Tipo', 'Descripción del Módulo', 'Dimensiones (cm)', 'Acabado Cubierta', 'Estructura Metálica', 'Tela / Pantalla', 'Cant.', 'Precio Unit. (CLP)', 'Subtotal (CLP)'],
  ];

  let itemIdx = 1;
  Object.values(groupedMap).forEach(({ item, count, subtotal }) => {
    const melName = MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish)?.name || 'Estándar';
    const metName = METAL_FINISHES.find((m) => m.id === item.metalFinish)?.name || 'Negro MT';
    const scrName = SCREEN_FABRICS.find((s) => s.id === item.screenFinish)?.name || 'N/A';

    detailRows.push([
      itemIdx++,
      item.type.toUpperCase(),
      item.name,
      `${item.dimensionsCm.width} x ${item.dimensionsCm.depth} x ${item.dimensionsCm.height}`,
      melName,
      metName,
      scrName,
      count,
      item.priceClp,
      subtotal,
    ]);
  });

  detailRows.push(['', '', '', '', '', '', '', 'TOTAL NETO:', '', stats.netCostClp]);
  detailRows.push(['', '', '', '', '', '', '', 'IVA (19%):', '', stats.taxIvaClp]);
  detailRows.push(['', '', '', '', '', '', '', 'TOTAL (CLP):', '', stats.totalCostClp]);

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle Mobiliario');

  // --- HOJA 3: ESPECIFICACIONES TÉCNICAS (EETT) ---
  const eettRows = [
    ['ESPECIFICACIONES TÉCNICAS GENERALES DE FABRICACIÓN'],
    [''],
    ['1. CUBIERTAS Y ESTRUCTURAS DE MADERA'],
    ['- Aglomerado MDP de 24 mm de espesor para cubiertas principales de escritorios y mesas de reunión.'],
    ['- Tapacanto termoplástico de PVC de 2.00 mm de espesor aplicado en caliente en todo el contorno.'],
    ['- Faldones y cajoneras en aglomerado melamínico MDP de 15 mm y frentes de cajón en 18 mm con PVC 2mm.'],
    [''],
    ['2. ESTRUCTURA METÁLICA Y PINTURA'],
    ['- Perfiles tubulares de acero de sección cuadrada 50x50 mm (espesor 1.5 mm) en patas pórtico y vigas de unión.'],
    ['- Acabado superficial mediante pintura electrostática termoconvertible en polvo y horneada a 200°C.'],
    ['- Patines niveladores interiores de PVC de alta resistencia para absorción de irregularidades del radier.'],
    [''],
    ['3. HERRAJES Y ELECTRIFICACIÓN'],
    ['- Correderas telescópicas zincadas de extracción total y cerraduras de bloqueo frontal centralizado.'],
    ['- Canaletas metálicas de electrificación y pasacables abatibles de aluminio/PVC para ordenamiento de corrientes débiles.'],
  ];

  const wsEett = XLSX.utils.aoa_to_sheet(eettRows);
  XLSX.utils.book_append_sheet(wb, wsEett, 'Especificaciones Técnicas');

  // Descargar archivo
  XLSX.writeFile(wb, `${projectName.replace(/\s+/g, '_')}_Cubicacion_Arquify.xlsx`);
}
