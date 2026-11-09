import * as XLSX from 'xlsx-js-style';
import { HplBathroomState, JNF_FINISHES } from '../store/hplBathroomStore';
import { calculateHplManufacturingBOM } from './hplManufacturing';

export function exportHplBathroomExcel(state: HplBathroomState) {
  const bom = calculateHplManufacturingBOM(state);
  const finishInfo = JNF_FINISHES[state.hardwareFinish];
  const dateStr = new Date().toLocaleDateString('es-CL');

  const wb = XLSX.utils.book_new();

  // Estilos reutilizables para celdas
  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { vertical: 'center' },
  };

  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  };

  // ==========================================
  // HOJA 1: RESUMEN Y PRESUPUESTO
  // ==========================================
  const summaryAoa: any[][] = [
    ['MEMORIA TÉCNICA Y PRESUPUESTO - CABINAS SANITARIAS HPL (ABET LAMINATI & JNF)'],
    [],
    ['DATOS GENERALES DEL PROYECTO'],
    ['Fecha de Emisión:', dateStr],
    ['Proveedor Paneles HPL:', 'Abet Laminati (Termolaminado Fenólico de Alta Presión)'],
    ['Proveedor Quincallería:', 'JNF Architectural Hardware (Distribuidor Oficial Abstracta Chile)'],
    ['Acabado de Quincallería:', `${finishInfo.name} (${finishInfo.code})`],
    ['Sistema Estabilizador Superior:', state.stabilizerSystem === 'round_19' ? 'Tubo Redondo Ø19 mm Inox AISI 304' : state.stabilizerSystem === 'square_20' ? 'Tubo Cuadrado 20x20 mm Inox AISI 304' : 'Perfil U Aluminio Continuo'],
    ['Altura Total Sistema:', `${state.panelHeight + state.footHeight} mm (Panel ${state.panelHeight} mm + Despeje Suelo ${state.footHeight} mm)`],
    [],
    ['ESPESORES INDEPENDIENTES ESPECIFICADOS'],
    ['Espesor Puertas:', `${state.thicknessDoor} mm`],
    ['Espesor Pilastras Frontales:', `${state.thicknessPilaster} mm`],
    ['Espesor Separadores Intermedios/Laterales:', `${state.thicknessDivider} mm`],
    ['Espesor Separadores de Urinarios:', `${state.thicknessUrinal} mm`],
    [],
    ['MÉTRICAS DEL PROYECTO'],
    ['Total Cubículos WC:', bom.metrics.totalCubicles],
    ['  - Cubículos Estándar:', bom.metrics.standardCubicles],
    ['  - Cubículos PMR (Accesibilidad Universal):', bom.metrics.pmrCubicles],
    ['Separadores de Urinarios Murales:', bom.metrics.urinalScreensCount],
    ['Metros Lineales de Frente:', `${bom.metrics.totalLinearMeters} m`],
    ['Superficie Neta Paneles HPL:', `${bom.metrics.totalHplAreaM2} m²`],
    ['Placas Abet Requeridas:', `${bom.metrics.totalSheetsCount} placas (Formato ${bom.nesting.selectedFormat.name})`],
    ['Aprovechamiento Global de Placa (Nesting):', `${bom.metrics.globalEfficiencyPct}% (Merma: ${bom.nesting.globalWastePct}%)`],
    [],
    ['DESGLOSE DE COSTOS Y PRESUPUESTO ESTIMADO (CLP)'],
    ['Item / Partida', 'Descripción', 'Monto Neto (CLP)'],
    ['1. Paneles HPL Abet Laminati', `Suministro de ${bom.metrics.totalSheetsCount} placas según cubicación optimizada`, bom.costs.hplMaterialClp],
    ['2. Quincallería JNF Inox/PVD', `Suministro de ${bom.metrics.hardwarePiecesCount} piezas de herrajes JNF según catálogo`, bom.costs.hardwareClp],
    ['3. Mecanizado y Corte CNC', 'Corte de precisión, canteado y perforaciones pasantes antivandálicas', bom.costs.machiningAndCncClp],
    ['4. Instalación y Montaje', 'Mano de obra especializada en obra con fijaciones y nivelación', bom.costs.assemblyLaborClp],
    [],
    ['SUBTOTAL NETO:', '', bom.costs.subtotalNetoClp],
    ['IVA (19%):', '', bom.costs.iva19Clp],
    ['TOTAL GENERAL (IVA INCLUIDO):', '', bom.costs.totalBrutoClp],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 55 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen & Presupuesto');

  // ==========================================
  // HOJA 2: LISTADO DE CORTE / DESPIECE HPL
  // ==========================================
  const partsAoa: any[][] = [
    ['LISTADO DETALLADO DE PIEZAS DE CORTE HPL (CUTTING LIST)'],
    ['Paneles Fenólicos Marca Abet Laminati - Espesores independientes por tipo de elemento'],
    [],
    ['N°', 'Tipo Elemento', 'Nombre Pieza', 'Ubicación / Módulo', 'Ancho (mm)', 'Alto (mm)', 'Espesor (mm)', 'Cant.', 'Área Unit. (m²)', 'Área Total (m²)', 'Color / Decorativo Abet'],
  ];

  bom.parts.forEach((p, idx) => {
    const areaUnit = Math.round((p.width * p.height) / 10000) / 100;
    const areaTot = Math.round(areaUnit * p.qty * 100) / 100;
    const typeLabel =
      p.pieceType === 'door'
        ? 'Puerta'
        : p.pieceType === 'pilaster'
        ? 'Pilastra Frontal'
        : p.pieceType === 'divider'
        ? 'Separador Lateral'
        : p.pieceType === 'urinal'
        ? 'Separador Urinario'
        : 'Elemento HPL';

    partsAoa.push([
      idx + 1,
      typeLabel,
      p.name,
      p.cubicleName || 'General',
      Math.round(p.width),
      Math.round(p.height),
      p.thickness,
      p.qty,
      areaUnit,
      areaTot,
      p.colorName,
    ]);
  });

  const wsParts = XLSX.utils.aoa_to_sheet(partsAoa);
  wsParts['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 35 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsParts, 'Despiece Paneles HPL');

  // ==========================================
  // HOJA 3: OPTIMIZACIÓN Y PLANCHAS ABET
  // ==========================================
  const nestingAoa: any[][] = [
    ['OPTIMIZACIÓN DE CORTE Y ASIGNACIÓN DE PLANCHAS (NESTING 2D)'],
    [`Formato de Placa Seleccionado: ${bom.nesting.selectedFormat.name}`],
    [`Aprovechamiento Global: ${bom.nesting.globalEfficiencyPct}% | Merma: ${bom.nesting.globalWastePct}%`],
    [],
    ['RESUMEN POR ESPESOR DE PLACA'],
    ['Espesor (mm)', 'Placas Requeridas', 'Piezas Asignadas', 'Área Útil Cortada (m²)', 'Área Total Placas (m²)'],
  ];

  bom.nesting.byThickness.forEach((item) => {
    nestingAoa.push([
      `${item.thickness} mm`,
      item.sheetCount,
      item.partsCount,
      item.usedAreaM2,
      item.sheetsAreaM2,
    ]);
  });

  nestingAoa.push([], ['DETALLE DE DISTRIBUCIÓN POR PLACA INDIVIDUAL']);
  nestingAoa.push(['Placa #', 'Espesor (mm)', 'Dimensiones Placa (mm)', 'Piezas Contenidas', 'Área Ocupada (m²)', 'Área Placa (m²)', '% Eficiencia', '% Merma']);

  bom.nesting.sheets.forEach((sheet) => {
    const partsNames = sheet.placedParts.map((p) => p.name).join('; ');
    nestingAoa.push([
      sheet.sheetId,
      `${sheet.thickness} mm`,
      `${sheet.format.length} x ${sheet.format.width}`,
      partsNames,
      Math.round(sheet.usedAreaM2 * 100) / 100,
      Math.round(sheet.totalAreaM2 * 100) / 100,
      `${sheet.efficiencyPercentage}%`,
      `${sheet.wastePercentage}%`,
    ]);
  });

  const wsNesting = XLSX.utils.aoa_to_sheet(nestingAoa);
  wsNesting['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 26 },
    { wch: 50 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNesting, 'Optimización Planchas');

  // ==========================================
  // HOJA 4: QUINCALLERÍA JNF (ABSTRACTA)
  // ==========================================
  const hwAoa: any[][] = [
    ['LISTADO DE QUINCALLERÍA Y HERRAJES JNF - CABINAS SANITARIAS'],
    ['Catálogo Oficial JNF Portugal / Distribuidor Abstracta Soluciones Chile'],
    [],
    ['N°', 'Código JNF', 'Categoría', 'Nombre del Herraje', 'Cant.', 'Acabado PVD/Inox', 'Material Base', 'P. Unitario (CLP)', 'Total (CLP)', 'Referencia Catálogo', 'Descripción Técnica'],
  ];

  bom.hardware.forEach((item, idx) => {
    hwAoa.push([
      idx + 1,
      item.code,
      item.category.toUpperCase(),
      item.name,
      item.qty,
      item.finish,
      item.material,
      item.unitPriceClp,
      item.totalPriceClp,
      item.pageRef,
      item.description,
    ]);
  });

  const wsHw = XLSX.utils.aoa_to_sheet(hwAoa);
  wsHw['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 18 },
    { wch: 38 },
    { wch: 8 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHw, 'Quincallería JNF');

  // ==========================================
  // HOJA 5: TORNILLERÍA Y FIJACIONES DE SEGURIDAD
  // ==========================================
  const screwAoa: any[][] = [
    ['ESPECIFICACIÓN DE FIJACIONES Y TORNILLERÍA DE SEGURIDAD PARA FENÓLICO HPL'],
    ['Sistemas pasantes de acero inoxidable para evitar fractura del núcleo y corrosión galvánica'],
    [],
    ['Código JNF', 'Tipo de Fijación', 'Aplicación', 'Material', 'Recomendación de Instalación'],
    ['SM.042.A', 'Tornillo pasante con cabeza avellanada de seguridad', 'Bisagras y cerrojos a panel fenólico HPL', 'Acero Inox AISI 304', 'No usar tornillos autorroscantes comunes para evitar delaminación'],
    ['SM.040', 'Tornillo pasante con buje hembra roscado', 'Unión de pinzas y soportes superiores a panel', 'Acero Inox AISI 304', 'Perforación pasante Ø5.5mm con broca para fenólico'],
    ['SM.041', 'Tornillo de conexión pasante para accesorios', 'Fijación de perchas y tiradores dobles antivandálicos', 'Acero Inox AISI 304', 'Apretar con par controlado de 4 Nm'],
    ['SM.042.E / SM.042.F', 'Tornillo y taco de nylon especial de alta expansión', 'Anclaje de soportes y pinzas a paramentos de hormigón/cerámica', 'AISI 304 + Poliamida Nylon', 'Perforación de Ø8mm en muro con broca widia'],
  ];

  const wsScrews = XLSX.utils.aoa_to_sheet(screwAoa);
  wsScrews['!cols'] = [{ wch: 24 }, { wch: 36 }, { wch: 45 }, { wch: 24 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsScrews, 'Tornillería & Anclajes');

  // Guardar archivo Excel
  XLSX.writeFile(wb, `Cubiculos_HPL_Abet_JNF_${state.cubicles.length}Cabinas_${dateStr.replace(/\//g, '-')}.xlsx`);
}
