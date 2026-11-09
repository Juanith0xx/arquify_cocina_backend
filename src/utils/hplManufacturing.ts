import {
  HplBathroomState,
  JNF_FINISHES,
  HPL_STANDARD_COLORS,
  HplThickness,
  CubicleConfig,
  UrinalScreenConfig,
} from '../store/hplBathroomStore';
import { HplPartToCut, getOptimizedHplNesting, HplNestingResult } from './hplNesting';

export interface JnfHardwareBOMItem {
  code: string;
  category: 'foot' | 'hinge' | 'lock' | 'handle' | 'hook' | 'stabilizer' | 'wall_bracket' | 'fasteners';
  name: string;
  description: string;
  qty: number;
  unitPriceClp: number;
  totalPriceClp: number;
  finish: string;
  material: string;
  pageRef: string;
}

export interface HplManufacturingBOM {
  parts: HplPartToCut[];
  nesting: HplNestingResult;
  hardware: JnfHardwareBOMItem[];
  costs: {
    hplMaterialClp: number;
    hardwareClp: number;
    machiningAndCncClp: number;
    assemblyLaborClp: number;
    subtotalNetoClp: number;
    iva19Clp: number;
    totalBrutoClp: number;
  };
  metrics: {
    totalCubicles: number;
    standardCubicles: number;
    pmrCubicles: number;
    urinalScreensCount: number;
    totalLinearMeters: number;
    totalHplAreaM2: number;
    totalSheetsCount: number;
    globalEfficiencyPct: number;
    hardwarePiecesCount: number;
  };
}

// Precios base referenciales en CLP para planchas HPL Abet Laminati por m² según espesor
const HPL_M2_PRICES_CLP: Record<HplThickness, number> = {
  10: 48000,
  12: 56000,
  15: 68000,
  19: 84000,
};

// Recargo por acabado PVD Titanio en Quincallería JNF (Gold, Black, Copper) vs Satin Inox
const PVD_FINISH_MULTIPLIER = 1.35;

/**
 * Genera el listado completo de piezas HPL a cortar
 */
export function generateHplPartsList(state: HplBathroomState): HplPartToCut[] {
  const parts: HplPartToCut[] = [];
  const colorObj = HPL_STANDARD_COLORS.find((c) => c.id === state.selectedColorId);
  const colorName = state.customTextureName || colorObj?.name || 'Abet HPL';

  const {
    cubicles,
    urinalScreens,
    thicknessDoor,
    thicknessPilaster,
    thicknessDivider,
    thicknessUrinal,
    panelHeight,
    dividerHeight,
    leftEndPilasterWidth,
    rightEndPilasterWidth,
    intermediatePilasterWidth,
    batteryLayout,
  } = state;

  if (cubicles.length === 0 && urinalScreens.length === 0) {
    return [];
  }

  // 1. PUERTAS
  cubicles.forEach((cab, idx) => {
    // La puerta tiene holguras de 3mm en los laterales y altura igual a panelHeight - 10mm
    const doorH = panelHeight - 20;
    const doorW = cab.doorWidth;

    parts.push({
      id: `door_${cab.id}`,
      pieceType: 'door',
      name: `Puerta ${cab.name}`,
      cubicleName: cab.name,
      width: doorW,
      height: doorH,
      thickness: thicknessDoor,
      qty: 1,
      colorName,
      allowRotation: false, // Las puertas se prefieren con veta vertical
    });
  });

  // 2. PILASTRAS FRONTALES (Cada frente tiene puerta y pilastra)
  cubicles.forEach((cab, idx) => {
    const cubicleFrontW = cab.cubicleWidth;
    const doorW = cab.doorWidth;
    const pilasterW = Math.max(80, cubicleFrontW - doorW);

    parts.push({
      id: `pilaster_front_${cab.id}`,
      pieceType: 'pilaster',
      name: `Pilastra Frontal ${cab.name}`,
      cubicleName: cab.name,
      width: Math.round(pilasterW),
      height: panelHeight,
      thickness: thicknessPilaster,
      qty: 1,
      colorName,
      allowRotation: false,
    });
  });

  // Pilastras de remate extremo si aplican
  if (batteryLayout !== 'between_walls' && leftEndPilasterWidth > 0) {
    parts.push({
      id: 'pilaster_end_left',
      pieceType: 'pilaster',
      name: 'Pilastra Remate Izquierdo',
      width: leftEndPilasterWidth,
      height: panelHeight,
      thickness: thicknessPilaster,
      qty: 1,
      colorName,
      allowRotation: false,
    });
  }
  if (batteryLayout !== 'between_walls' && rightEndPilasterWidth > 0) {
    parts.push({
      id: 'pilaster_end_right',
      pieceType: 'pilaster',
      name: 'Pilastra Remate Derecho',
      width: rightEndPilasterWidth,
      height: panelHeight,
      thickness: thicknessPilaster,
      qty: 1,
      colorName,
      allowRotation: false,
    });
  }

  // 3. SEPARADORES LATERALES / DIVISIONES
  // Entre cubículos (N-1 separadores intermedios) + 1 o 2 separadores extremos según distribución
  const divH = dividerHeight || panelHeight;

  cubicles.forEach((cab, idx) => {
    // Separador entre cabina actual y siguiente
    if (idx < cubicles.length - 1) {
      const sepDepth = Math.max(cab.cubicleDepth, cubicles[idx + 1].cubicleDepth);
      parts.push({
        id: `divider_inter_${idx + 1}`,
        pieceType: 'divider',
        name: `Separador Divisorio C${idx + 1} / C${idx + 2}`,
        width: sepDepth,
        height: divH,
        thickness: thicknessDivider,
        qty: 1,
        colorName,
        allowRotation: true,
      });
    }
  });

  // Separador lateral extremo izquierdo si es isla o abierto
  if (batteryLayout === 'island' || batteryLayout === 'inline_wall_right') {
    parts.push({
      id: 'divider_end_left',
      pieceType: 'divider',
      name: 'Separador Lateral Extremo Izquierdo',
      width: cubicles[0].cubicleDepth,
      height: divH,
      thickness: thicknessDivider,
      qty: 1,
      colorName,
      allowRotation: true,
    });
  }

  // Separador lateral extremo derecho si es isla o abierto a la izquierda
  if (batteryLayout === 'island' || batteryLayout === 'inline_wall_left') {
    const lastCab = cubicles[cubicles.length - 1];
    parts.push({
      id: 'divider_end_right',
      pieceType: 'divider',
      name: 'Separador Lateral Extremo Derecho',
      width: lastCab.cubicleDepth,
      height: divH,
      thickness: thicknessDivider,
      qty: 1,
      colorName,
      allowRotation: true,
    });
  }

  // 4. SEPARADORES DE URINARIOS (Pantallas murales)
  urinalScreens.forEach((u, idx) => {
    parts.push({
      id: `urinal_screen_${u.id}`,
      pieceType: 'urinal',
      name: `Pantalla Urinario #${idx + 1}`,
      width: u.width,
      height: u.height,
      thickness: thicknessUrinal,
      qty: 1,
      colorName,
      allowRotation: true,
    });
  });

  return parts;
}

/**
 * Genera la lista técnica de Quincallería y Herrajes JNF (Abstracta) según el PDF adjunto
 */
export function generateJnfHardwareBOM(state: HplBathroomState): JnfHardwareBOMItem[] {
  const bom: JnfHardwareBOMItem[] = [];
  const finishInfo = JNF_FINISHES[state.hardwareFinish];
  const isPvd = state.hardwareFinish !== 'satin';
  const finishMultiplier = isPvd ? PVD_FINISH_MULTIPLIER : 1.0;
  const finishLabel = `${finishInfo.name} (${finishInfo.code})`;

  const numCubicles = state.cubicles.length;
  const numDividers = Math.max(0, numCubicles - 1) + (state.batteryLayout === 'island' ? 2 : 1);
  const numUrinals = state.urinalScreens.length;

  // 1. PATAS REGULABLES (JNF SM.017 / SM.017.XL / SM.070)
  // 2 patas por separador + 1 por pilastra extrema
  const feetQty = numDividers * 2 + 2;
  const footCode = state.footModel === 'sm_017_xl' ? 'SM.017.XL' : state.footModel === 'sm_070' ? 'SM.070' : 'SM.017';
  const footName = state.footModel === 'sm_017_xl' ? 'Pie Regulable H120-180mm' : state.footModel === 'sm_070' ? 'Pie Regulable Cuadrado 20x20mm' : 'Pie Regulable H120-150mm';
  const baseFootPrice = state.footModel === 'sm_017_xl' ? 18500 : state.footModel === 'sm_070' ? 21000 : 16500;
  const footPrice = Math.round(baseFootPrice * finishMultiplier);

  bom.push({
    code: `${footCode}${finishInfo.code}`,
    category: 'foot',
    name: footName,
    description: 'Base regulable para panel HPL al suelo en acero inoxidable AISI 304/316, gran resistencia química a limpieza',
    qty: feetQty,
    unitPriceClp: footPrice,
    totalPriceClp: feetQty * footPrice,
    finish: finishLabel,
    material: 'AISI 304 / 316',
    pageRef: 'L/276-L/277 (Catálogo JNF)',
  });

  // 2. BISAGRAS (JNF SM.006.B / SM.005.C / SM.005.E / SM.005.B)
  // 3 bisagras por puerta (o 2 en puertas livianas, 3 recomendado por norma pesada)
  const hingesPerDoor = 3;
  const hingesQty = numCubicles * hingesPerDoor;
  let hingeCode = 'SM.005.C';
  let hingeName = 'Bisagra con Muelle Autocierre Ajustable';
  let baseHingePrice = 14500;

  if (state.hingeModel === 'sm_006_b') {
    hingeCode = 'SM.006.B';
    hingeName = 'Bisagra Plana Heavy Duty Inox';
    baseHingePrice = 11500;
  } else if (state.hingeModel === 'sm_005_e_spring_cover') {
    hingeCode = 'SM.005.E';
    hingeName = 'Bisagra con Muelle y Fijaciones Ocultas con Tapas';
    baseHingePrice = 17900;
  } else if (state.hingeModel === 'sm_005_b_free') {
    hingeCode = 'SM.005.B';
    hingeName = 'Bisagra Plana de Sobreponer Libre';
    baseHingePrice = 9800;
  }

  const hingePrice = Math.round(baseHingePrice * finishMultiplier);

  bom.push({
    code: `${hingeCode}${finishInfo.code}`,
    category: 'hinge',
    name: hingeName,
    description: 'Bisagra de alta capacidad de carga para panel fenólico HPL, autocierre ajustable y rodamientos de alta resistencia',
    qty: hingesQty,
    unitPriceClp: hingePrice,
    totalPriceClp: hingesQty * hingePrice,
    finish: finishLabel,
    material: 'AISI 304',
    pageRef: 'L/280-L/285 (Catálogo JNF)',
  });

  // 3. CERROJOS CON INDICADOR LIBRE / OCUPADO
  // 1 por cubículo
  let lockCode = 'SM.031';
  let lockName = 'Cierre de Baño con Indicador "Easy Fix"';
  let baseLockPrice = 22500;

  if (state.lockModel === 'sm_060_two_in_one') {
    lockCode = 'SM.060';
    lockName = 'Cierre / Pomo Two-in-One con Desbloqueo Emergencia';
    baseLockPrice = 25000;
  } else if (state.lockModel === 'sm_030_indicator') {
    lockCode = 'SM.030';
    lockName = 'Cierre Simple con Ranura Moneda / Llave Triangular';
    baseLockPrice = 19800;
  } else if (state.lockModel === 'sm_035_slide') {
    lockCode = 'SM.035';
    lockName = 'Pasador Corredero Slide to Lock / Unlock';
    baseLockPrice = 18000;
  }

  const lockPrice = Math.round(baseLockPrice * finishMultiplier);

  bom.push({
    code: `${lockCode}${finishInfo.code}`,
    category: 'lock',
    name: lockName,
    description: 'Cierre con indicador snib verde/rojo y sistema de desbloqueo rápido de emergencia desde el exterior',
    qty: numCubicles,
    unitPriceClp: lockPrice,
    totalPriceClp: numCubicles * lockPrice,
    finish: finishLabel,
    material: 'AISI 304',
    pageRef: 'L/286-L/293 (Catálogo JNF)',
  });

  // 4. TIRADORES / POMOS DOBLES ANTIVANDÁLICOS (JNF IN.75)
  // 1 juego por puerta
  let handleCode = 'IN.75.050.D';
  let handleName = 'Tirador Doble Antivandálico 150mm';
  let baseHandlePrice = 16800;

  if (state.handleModel === 'in_75_051_d') {
    handleCode = 'IN.75.051.D';
    handleName = 'Tirador Doble Antivandálico 157mm';
    baseHandlePrice = 17500;
  } else if (state.handleModel === 'in_75_040') {
    handleCode = 'IN.75.040';
    handleName = 'Pomo Doble Cuadrado 30x30mm';
    baseHandlePrice = 14200;
  } else if (state.handleModel === 'in_75_041') {
    handleCode = 'IN.75.041';
    handleName = 'Pomo Doble Cilíndrico Ø34mm';
    baseHandlePrice = 14500;
  }

  const handlePrice = Math.round(baseHandlePrice * finishMultiplier);

  bom.push({
    code: `${handleCode}${finishInfo.code}`,
    category: 'handle',
    name: handleName,
    description: 'Pomo / Tirador doble pasante con sistema de fijación de seguridad antivandálica para HPL',
    qty: numCubicles,
    unitPriceClp: handlePrice,
    totalPriceClp: numCubicles * handlePrice,
    finish: finishLabel,
    material: 'AISI 304',
    pageRef: 'L/298-L/300 (Catálogo JNF)',
  });

  // 5. PERCHAS Y COLGADORES CON TOPE (JNF SM.008 / IN.14)
  // 1 por cubículo
  let hookCode = 'SM.008';
  let hookName = 'Percha con Tope de Puerta Integrado (Two in One)';
  let baseHookPrice = 11200;

  if (state.hookModel === 'in_14_010') {
    hookCode = 'IN.14.010';
    hookName = 'Percha Individual Diseño Pedro Queirós';
    baseHookPrice = 8500;
  } else if (state.hookModel === 'in_14_020') {
    hookCode = 'IN.14.020';
    hookName = 'Percha Cuadrada Pedro Queirós';
    baseHookPrice = 9200;
  } else if (state.hookModel === 'in_14_546') {
    hookCode = 'IN.14.546';
    hookName = 'Percha Curva en Inox AISI 316';
    baseHookPrice = 9600;
  }

  const hookPrice = Math.round(baseHookPrice * finishMultiplier);

  bom.push({
    code: `${hookCode}${finishInfo.code}`,
    category: 'hook',
    name: hookName,
    description: 'Percha colgador para panel HPL con tope de amortiguación integrado para proteger puertas',
    qty: numCubicles,
    unitPriceClp: hookPrice,
    totalPriceClp: numCubicles * hookPrice,
    finish: finishLabel,
    material: 'AISI 304 / 316',
    pageRef: 'L/302-L/303 (Catálogo JNF)',
  });

  // 6. ESTRUCTURA AÉREA DE ESTABILIZACIÓN SUPERIOR
  // Tubo Ø19mm o Cuadrado 20x20mm o Perfil U
  const totalFrontLengthM = state.cubicles.reduce((acc, c) => acc + c.cubicleWidth, 0) / 1000;
  const tubeBarsNeeded = Math.max(1, Math.ceil(totalFrontLengthM / 2.0));

  if (state.stabilizerSystem === 'round_19') {
    const tubeCode = 'SM.010.A.19.2000';
    const tubePrice = Math.round(28000 * finishMultiplier);
    bom.push({
      code: `${tubeCode}${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Tubo Estabilizador Aéreo Ø19mm x 2000mm',
      description: 'Tubo de sección redonda Ø19 x 1.2mm para rigidización superior continua en acero inoxidable',
      qty: tubeBarsNeeded,
      unitPriceClp: tubePrice,
      totalPriceClp: tubeBarsNeeded * tubePrice,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/304-L/307 (Catálogo JNF)',
    });

    // Soportes superiores de tubo a panel (SM.002.19)
    const upperClampsQty = numCubicles + 1;
    const clampPrice = Math.round(13500 * finishMultiplier);
    bom.push({
      code: `SM.002.19${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Soporte Superior de Panel para Tubo Ø19mm',
      description: 'Soporte de anclaje entre panel pilastra HPL y barra estabilizadora aérea Ø19mm',
      qty: upperClampsQty,
      unitPriceClp: clampPrice,
      totalPriceClp: upperClampsQty * clampPrice,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/305 (Catálogo JNF)',
    });

    // Soportes de tubo a muro (SM.011.19)
    const wallMountQty = 2;
    const wallMountPrice = Math.round(9800 * finishMultiplier);
    bom.push({
      code: `SM.011.19${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Soporte de Tubo con Fijación a Pared Ø19mm',
      description: 'Soporte terminal de rigidización de tubo aéreo fijado sólidamente a paramento vertical',
      qty: wallMountQty,
      unitPriceClp: wallMountPrice,
      totalPriceClp: wallMountQty * wallMountPrice,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/307 (Catálogo JNF)',
    });
  } else if (state.stabilizerSystem === 'square_20') {
    const tubeCode = 'SM.010.Q.20.2000';
    const tubePrice = Math.round(31000 * finishMultiplier);
    bom.push({
      code: `${tubeCode}${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Tubo Cuadrado Aéreo 20x20mm x 2000mm',
      description: 'Tubo de sección cuadrada 20x20 x 1.5mm para sistema clean con herrajes ocultos al exterior',
      qty: tubeBarsNeeded,
      unitPriceClp: tubePrice,
      totalPriceClp: tubeBarsNeeded * tubePrice,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/308-L/311 (Catálogo JNF)',
    });

    // Soportes superiores 20x20mm (SM.062 / SM.063)
    const upperClampsQty = numCubicles + 1;
    const clampPrice = Math.round(14800 * finishMultiplier);
    bom.push({
      code: `SM.063${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Soporte Superior de Panel para Tubo 20x20mm',
      description: 'Soporte superior para panel de cabina fenólica con fijación oculta exterior',
      qty: upperClampsQty,
      unitPriceClp: clampPrice,
      totalPriceClp: upperClampsQty * clampPrice,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/310 (Catálogo JNF)',
    });
  } else {
    // Perfil U continuo (SM.101/SM.103)
    const uProfileCode = 'SM.101';
    const uPrice = Math.round(26000 * finishMultiplier);
    bom.push({
      code: `${uProfileCode}${finishInfo.code}`,
      category: 'stabilizer',
      name: 'Perfil "U" Superior / Guía 3050mm',
      description: 'Perfil en U pré-perforado para coronación y anclaje continuo de paneles fenólicos HPL',
      qty: tubeBarsNeeded,
      unitPriceClp: uPrice,
      totalPriceClp: tubeBarsNeeded * uPrice,
      finish: finishLabel,
      material: 'Aluminio / Inox AISI 304',
      pageRef: 'L/315 (Catálogo JNF)',
    });
  }

  // 7. ESCUADRAS DE UNIÓN SEPARADOR A CENTRO DE PILASTRA (JNF SM.004)
  // Cada separador lateral se fija al centro de la pilastra frontal con 6 escuadras (3 a la izq + 3 a la der)
  const centerPilasterBracketsQty = numDividers * 6;
  const sm004Price = Math.round(5800 * finishMultiplier);

  if (centerPilasterBracketsQty > 0) {
    bom.push({
      code: `SM.004${finishInfo.code}`,
      category: 'wall_bracket',
      name: 'Escuadra 90° Inox para Fijación al Centro de Pilastra',
      description: 'Escuadra angular reforzada para anclaje a 90° entre el separador lateral y el centro de la pilastra frontal',
      qty: centerPilasterBracketsQty,
      unitPriceClp: sm004Price,
      totalPriceClp: centerPilasterBracketsQty * sm004Price,
      finish: finishLabel,
      material: 'AISI 304',
      pageRef: 'L/312 (Catálogo JNF)',
    });
  }

  // 8. PINZAS / ESCUADRAS DE FIJACIÓN A MURO (JNF SM.024 / SM.065)
  // 3 fijaciones por cada unión de separador a muro trasero + 3 por cada pantalla de urinario a pared
  const wallBracketsForDividers = numDividers * 3;
  const wallBracketsForUrinals = numUrinals * 3;
  const totalWallBrackets = wallBracketsForDividers + wallBracketsForUrinals + (state.batteryLayout === 'between_walls' ? 6 : 3);

  let bracketCode = 'SM.024';
  let bracketName = 'Pinza Soporte para Fijación a Muro HPL';
  let baseBracketPrice = 6800;

  if (state.wallFixingModel === 'sm_004_bracket') {
    bracketCode = 'SM.004.Wall';
    bracketName = 'Escuadra Inox Reforzada a Muro';
    baseBracketPrice = 6200;
  } else if (state.wallFixingModel === 'sm_065_clamp') {
    bracketCode = 'SM.065';
    bracketName = 'Soporte Pinza Compacta Inox';
    baseBracketPrice = 7100;
  } else if (state.wallFixingModel === 'u_profile_continuous') {
    bracketCode = 'SM.101.Wall';
    bracketName = 'Perfil U Continuo Muro 3050mm';
    baseBracketPrice = 19500;
  }

  const bracketPrice = Math.round(baseBracketPrice * finishMultiplier);

  bom.push({
    code: `${bracketCode}${finishInfo.code}`,
    category: 'wall_bracket',
    name: bracketName,
    description: 'Soporte de anclaje de panel a paramentos de cerámica/muros de baño',
    qty: state.wallFixingModel === 'u_profile_continuous' ? Math.ceil(totalWallBrackets / 4) : totalWallBrackets,
    unitPriceClp: bracketPrice,
    totalPriceClp: (state.wallFixingModel === 'u_profile_continuous' ? Math.ceil(totalWallBrackets / 4) : totalWallBrackets) * bracketPrice,
    finish: finishLabel,
    material: 'AISI 304',
    pageRef: 'L/312-L/315 (Catálogo JNF)',
  });

  // 9. TORNILLERÍA Y ACCESORIOS DE CONEXIÓN PASANTE (JNF SM.040 / SM.041 / SM.042.A/B/E)
  // Tornillo pasante de conexión especial para fenólico HPL
  const fastenersQty = hingesQty * 4 + (centerPilasterBracketsQty + totalWallBrackets) * 2 + numCubicles * 6;
  const screwPrice = 850;

  bom.push({
    code: `SM.042.A / SM.040`,
    category: 'fasteners',
    name: 'Tornillo Pasante de Seguridad para Fenólico HPL',
    description: 'Tornillo pasante y taco de nylon especial antivandálico para no dañar el núcleo fenólico ni oxidar bisagras',
    qty: fastenersQty,
    unitPriceClp: screwPrice,
    totalPriceClp: fastenersQty * screwPrice,
    finish: 'Inox AISI 304',
    material: 'AISI 304 + Nylon',
    pageRef: 'L/251 (Catálogo JNF)',
  });

  return bom;
}

/**
 * Calcula el resumen integral de fabricación, nesting, costos y métricas
 */
export function calculateHplManufacturingBOM(state: HplBathroomState): HplManufacturingBOM {
  const parts = generateHplPartsList(state);
  const nesting = getOptimizedHplNesting(parts, state.selectedFormatId, state.autoOptimizeFormat);
  const hardware = generateJnfHardwareBOM(state);

  // 1. Costo de Planchas HPL
  let hplMaterialClp = 0;
  nesting.byThickness.forEach((group) => {
    const pricePerM2 = HPL_M2_PRICES_CLP[group.thickness] || 56000;
    hplMaterialClp += Math.round(group.sheetsAreaM2 * pricePerM2);
  });

  // 2. Costo Quincallería JNF
  const hardwareClp = hardware.reduce((acc, item) => acc + item.totalPriceClp, 0);

  // 3. Mecanizado CNC, canteado y perforación de pasantes para HPL
  const totalParts = parts.reduce((acc, p) => acc + p.qty, 0);
  const machiningAndCncClp = totalParts * 12500;

  // 4. Mano de obra de instalación y montaje
  const numCubicles = state.cubicles.length;
  const numUrinals = state.urinalScreens.length;
  const assemblyLaborClp = numCubicles * 45000 + numUrinals * 18000;

  const subtotalNetoClp = hplMaterialClp + hardwareClp + machiningAndCncClp + assemblyLaborClp;
  const iva19Clp = Math.round(subtotalNetoClp * 0.19);
  const totalBrutoClp = subtotalNetoClp + iva19Clp;

  const totalLinearMeters = Math.round((state.cubicles.reduce((acc, c) => acc + c.cubicleWidth, 0) / 1000) * 10) / 10;
  const hardwarePiecesCount = hardware.reduce((acc, h) => acc + h.qty, 0);

  return {
    parts,
    nesting,
    hardware,
    costs: {
      hplMaterialClp,
      hardwareClp,
      machiningAndCncClp,
      assemblyLaborClp,
      subtotalNetoClp,
      iva19Clp,
      totalBrutoClp,
    },
    metrics: {
      totalCubicles: numCubicles,
      standardCubicles: state.cubicles.filter((c) => !c.isPmr).length,
      pmrCubicles: state.cubicles.filter((c) => c.isPmr).length,
      urinalScreensCount: numUrinals,
      totalLinearMeters,
      totalHplAreaM2: nesting.totalHplAreaUsedM2,
      totalSheetsCount: nesting.totalSheets,
      globalEfficiencyPct: nesting.globalEfficiencyPct,
      hardwarePiecesCount,
    },
  };
}
