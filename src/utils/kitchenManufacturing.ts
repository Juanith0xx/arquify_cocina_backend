import { CabinetType } from '../store/kitchenStore';
import { useStore } from '../store';
import { useKitchenStore } from '../store/kitchenStore';
import { Part, generateEdgeBandingList } from './manufacturing';
import { calculateSocleSystem } from './kitchenSocle';
import { calculateGolaSystem } from './kitchenGola';
import { HANDLE_CATALOG, FINISH_LABELS } from '../types/handle';
import { getFriendlyColorName } from './colorNames';

// Parámetros técnicos de herrajes según marca (igualados con el configurador de closets)
export const HARDWARE_SPECS = {
  Provelcar: {
    // Corredera Telescópica Lateral de Bolas (Acero cincado 45mm, cierre suave / ext. total)
    // SKW (Drawer Width) = LW (Inside Cabinet Width) - 26mm (13mm por lateral)
    slideClearanceTotal: 26, 
    slideName: 'Corredera Telescópica Lateral 45mm Ext. Total (Cierre Suave)',
    // SKL (Drawer Length) = NL (Largo nominal sin descuento)
    drawerLengthDeduction: 0,
    maxSideThickness: 18 // Espesor máximo admitido para el lateral del cajón
  },
  Hafele: {
    // Corredera Telescópica Heavy Duty Häfele (13mm por lado)
    slideClearanceTotal: 26, 
    slideName: 'Corredera Telescópica Häfele 45mm (Cierre Suave)',
    drawerLengthDeduction: 0,
    maxSideThickness: 18
  }
};

export function getNominalSlideLength(innerDepthMm: number): number {
  const availableNLs = [250, 300, 350, 400, 450, 500, 550];
  // Requerimiento mínimo (LT min = NL + 3). Holgura de seguridad de +10mm
  for (let i = availableNLs.length - 1; i >= 0; i--) {
    if (availableNLs[i] + 10 <= innerDepthMm) {
      return availableNLs[i];
    }
  }
  return 250; // Fallback mínimo
}

/**
 * Criterio Técnico Industrial de Bisagras de Cazoleta 35mm según altura:
 * - Hasta 900 mm: 2 bisagras por hoja
 * - 901 mm a 1500 mm: 3 bisagras por hoja
 * - 1501 mm a 2000 mm: 4 bisagras por hoja
 * - 2001 mm a 2500 mm: 5 bisagras por hoja
 */
export function getHingesCountByHeight(doorHeightMm: number): number {
  if (doorHeightMm <= 900) return 2;
  if (doorHeightMm <= 1500) return 3;
  if (doorHeightMm <= 2000) return 4;
  return 5;
}

/**
 * Determina si una textura o color corresponde a Melamina Blanca
 */
export function isWhiteMelamine(color?: string): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  return (
    c === '#ffffff' ||
    c === '#fff' ||
    c === '#f8fafc' ||
    c === '#f9fafb' ||
    c === '#f3f4f6' ||
    c === 'white' ||
    c === 'blanco' ||
    c.includes('blanco') ||
    c.includes('white') ||
    c.includes('def_mas_blanco')
  );
}

export interface DrawerBottomSpecs {
  isDurolac: boolean;
  thicknessMm: number;
  thicknessCm: number;
  materialName: string;
  notes: string;
  isRestrictedFromDurolac: boolean;
}

/**
 * Aplica las reglas técnicas de fabricación para el fondo de cajón:
 * 1. Por defecto, el fondo es de la misma melamina (color y espesor 15/18mm) que la caja interior del cajón.
 * 2. Si la melamina interior es blanca (15 o 18mm), se permite Durolac blanco de 3mm SOLO hasta ancho de 50 cm (500mm).
 *    Si el ancho es > 50 cm, se restringe Durolac 3mm y pasa a melamina blanca de 15/18mm por resistencia a la flexión.
 */
export function getDrawerBottomSpecs(
  cabinetWidthCm: number,
  drawerInnerColor?: string,
  drawerInnerMaterial?: 'melamina' | 'hpl',
  thicknessCm: number = 1.8,
  drawerBottomMaterialOverride?: 'melamina' | 'durolac'
): DrawerBottomSpecs {
  const isWhite = isWhiteMelamine(drawerInnerColor);
  const canUseDurolac3mm = drawerBottomMaterialOverride === 'durolac' || (drawerBottomMaterialOverride === undefined && isWhite && cabinetWidthCm <= 50);

  if (canUseDurolac3mm) {
    return {
      isDurolac: true,
      thicknessMm: 3,
      thicknessCm: 0.3,
      materialName: 'Durolac Blanco 3mm',
      notes: 'Fondo Durolac blanco 3mm ranurado/clavado (Gabinete <= 50cm)',
      isRestrictedFromDurolac: false
    };
  }

  const thickMm = Math.round(thicknessCm * 10);
  const isRestricted = isWhite && cabinetWidthCm > 50;

  return {
    isDurolac: false,
    thicknessMm: thickMm,
    thicknessCm: thicknessCm,
    materialName: drawerInnerColor || (isWhite ? `Melamina Blanca ${thickMm}mm` : 'Melamina Cajón'),
    isRestrictedFromDurolac: isRestricted,
    notes: isRestricted
      ? `Fondo Melamina Blanca ${thickMm}mm (Restricción técnica: Ancho > 50cm no admite Durolac 3mm por flexión)`
      : `Fondo Melamina ${thickMm}mm (Misma melamina de la caja del cajón)`
  };
}

/**
 * Determina si una pieza, textura o módulo corresponde a Laminado de Alta Presión HPL (Abet Laminati u otros)
 */
export function isHplFinish(materialUrlOrColor?: string, doorMaterial?: string, cab?: CabinetType): boolean {
  if (cab?.doorMaterial === 'hpl') return true;
  if (cab?.doorMaterial === 'melamina') return false;
  if (doorMaterial === 'hpl') return true;
  if (doorMaterial === 'melamina') return false;
  if (!materialUrlOrColor) return false;
  const s = materialUrlOrColor.toLowerCase();
  return (
    s.includes('abet') ||
    s.includes('laminati') ||
    s.includes('hpl') ||
    s.includes('fiore') ||
    s.includes('broccato')
  );
}

/**
 * Determina si un mueble de cocina tiene puertas y admite repisas interiores
 */
export function isCabinetWithDoors(cab: CabinetType): boolean {
  if (cab.type === 'decoration' || cab.variant?.startsWith('deco_')) return false;
  const v = cab.variant || (cab.width > 60 ? '2_doors' : '1_door');
  return (
    v === '1_door' ||
    v === '2_doors' ||
    v === '1_door_1_drawer' ||
    v === 'tall_1_door' ||
    v === 'tall_2_doors' ||
    v === 'tall_split_2_doors' ||
    v === 'tall_oven_vent' ||
    v === 'tall_oven_micro' ||
    v === 'tall_microwave_niche' ||
    v === 'wall_1_door' ||
    v === 'wall_2_doors' ||
    v === 'closet_2_doors' ||
    v === 'closet_inner_drawers' ||
    (cab.type === 'closet' && Boolean(cab.hasDoors)) ||
    (cab.type === 'island' && (v === '1_door' || v === '2_doors')) ||
    (cab.type === 'wall' && (v === '1_door' || v === '2_doors' || !cab.variant)) ||
    (cab.type === 'base' && (v === '1_door' || v === '2_doors' || !cab.variant))
  );
}

/**
 * Determina si un mueble tiene 2 puertas verticales superpuestas (despensas divididas y torres de hornos)
 */
export function isCabinetWithSplitDoors(cab: CabinetType): boolean {
  return (
    cab.variant === 'tall_split_2_doors' ||
    cab.variant === 'tall_oven_vent' ||
    cab.variant === 'tall_oven_micro' ||
    cab.variant === 'tall_microwave_niche'
  );
}

/**
 * Obtiene la cantidad de repisas para secciones inferior y superior de un mueble dividido
 */
export function getSplitCabinetShelvesCounts(cab: CabinetType): { lower: number; upper: number } {
  let defaultLower = 1;
  let defaultUpper = 3;
  if (cab.variant === 'tall_oven_vent' || cab.variant === 'tall_oven_micro') {
    defaultLower = 1;
    defaultUpper = 1;
  } else if (cab.variant === 'tall_microwave_niche') {
    defaultLower = 1;
    defaultUpper = 2;
  }

  const lower = cab.shelvesCountLower !== undefined
    ? cab.shelvesCountLower
    : (cab.shelvesCount !== undefined ? Math.min(cab.shelvesCount, defaultLower) : defaultLower);
  const upper = cab.shelvesCountUpper !== undefined
    ? cab.shelvesCountUpper
    : (cab.shelvesCount !== undefined ? Math.max(0, cab.shelvesCount - lower) : defaultUpper);
  return { lower, upper };
}

/**
 * Cantidad estándar de repisas por defecto según tipología
 */
export function getDefaultShelvesCount(cab: CabinetType): number {
  const v = cab.variant || (cab.width > 60 ? '2_doors' : '1_door');
  if (v === 'closet_shelves') return 5;
  if (v === 'closet_walkin') return 3;
  if (v === 'closet_mixed') return 2;
  if (v === 'closet_hanger' || v === 'closet_drawers' || v === 'closet_2_doors' || v === 'closet_inner_drawers' || cab.type === 'closet') return 1;
  if (v === 'tall_1_door' || v === 'tall_2_doors' || v === 'tall_split_2_doors') {
    return 4;
  }
  if (v === 'tall_oven_vent' || v === 'tall_oven_micro') {
    return 2;
  }
  if (v === 'tall_microwave_niche') {
    return 3;
  }
  if (v === '1_door_1_drawer') {
    const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island';
    const socleH = useKitchenStore.getState().socleHeight ?? 10;
    const legsHeight = isBaseOrTall ? socleH : 0;
    const cabH = cab.height - legsHeight;
    const doorH = cabH - 18 - 0.9;
    return doorH > 40 ? 1 : 0;
  }
  return 1;
}

/**
 * Posiciones verticales en Y (en cm) de los ejes de bisagra relativas al fondo del lateral (0 a cabH)
 */
export function getCabinetHingesPositions(cab: CabinetType): number[] {
  const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island';
  const socleH = useKitchenStore.getState().socleHeight ?? 10;
  const legsHeight = isBaseOrTall ? socleH : 0;
  const cabH = cab.height - legsHeight;
  const v = cab.variant || (cab.width > 60 ? '2_doors' : '1_door');

  if (v === 'tall_split_2_doors') {
    const isGola = useKitchenStore.getState().golaSystem !== 'none';
    const baseH = 70;
    const topDeduct = isGola ? 3.5 : 0;
    const lowerDoorH = baseH - topDeduct;
    const upperH = cabH - baseH;
    const hinges = [9, Math.max(15, lowerDoorH - 9), baseH + 9, cabH - 9];
    if (upperH > 100) {
      hinges.push(baseH + upperH * 0.5);
    }
    return hinges.sort((a, b) => a - b);
  }

  if (v === 'tall_oven_vent' || v === 'tall_oven_micro') {
    const baseH = 70;
    const ovenH = 60;
    const microH = 38;
    const topStart = baseH + ovenH + microH; // 168
    const hinges = [9, baseH - 9];
    if (cabH > topStart + 18) {
      hinges.push(topStart + 9, cabH - 9);
    }
    return hinges.sort((a, b) => a - b);
  }

  if (v === 'tall_microwave_niche') {
    const baseH = 70;
    const nicheH = 45;
    const topStart = baseH + nicheH; // 115
    const hinges = [9, baseH - 9];
    if (cabH > topStart + 18) {
      hinges.push(topStart + 9, cabH - 9);
      const topH = cabH - topStart;
      if (topH > 80) {
        hinges.push(topStart + topH * 0.5);
      }
    }
    return hinges.sort((a, b) => a - b);
  }

  if (v === 'tall_1_door' || v === 'tall_2_doors' || cab.type === 'tall') {
    return [
      9,
      cabH * 0.35,
      cabH * 0.65,
      cabH - 9
    ].sort((a, b) => a - b);
  }

  if (v === '1_door_1_drawer') {
    const doorH = cabH - 18 - 0.9;
    return [9, Math.max(15, doorH - 9)];
  }

  // Estándar 1 puerta o 2 puertas (base, isla, aéreo)
  return [9, cabH - 9];
}

/**
 * Calcula las cotas de elevación Y (en cm) de las repisas interiores,
 * distribuidas paramétricamente y con desplazamiento automático anti-colisión
 * respecto a las bisagras (zona de exclusión de +/- 4.5 cm).
 */
export function getResolvedCabinetShelfElevations(cab: CabinetType, thicknessCm = 1.8): number[] {
  const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island';
  const socleH = useKitchenStore.getState().socleHeight ?? 10;
  const legsHeight = isBaseOrTall ? socleH : 0;
  const cabH = cab.height - legsHeight;
  const v = cab.variant || (cab.width > 60 ? '2_doors' : '1_door');

  const count = cab.shelvesCount !== undefined ? cab.shelvesCount : getDefaultShelvesCount(cab);
  const hinges = getCabinetHingesPositions(cab);
  const HINGE_COLLISION_RADIUS = 4.5; // cm (45mm alrededor del eje de bisagra)

  if (isCabinetWithSplitDoors(cab)) {
    const baseH = 70;
    const elevations: number[] = [];
    const { lower: lowerCount, upper: upperCount } = getSplitCabinetShelvesCounts(cab);

    // Repisas vano inferior (0 a 70cm)
    if (lowerCount > 0) {
      const step = (baseH - 2 * thicknessCm) / (lowerCount + 1);
      for (let i = 0; i < lowerCount; i++) {
        let yLow = thicknessCm + (i + 1) * step;
        for (const h of hinges.filter(h => h < baseH)) {
          if (Math.abs(yLow - h) <= HINGE_COLLISION_RADIUS) {
            yLow += (yLow >= h ? 5.0 : -5.0);
          }
        }
        elevations.push(Math.max(thicknessCm + 4, Math.min(baseH - thicknessCm - 4, yLow)));
      }
    }

    // Repisas vano superior
    let upperStart = baseH;
    if (v === 'tall_oven_vent' || v === 'tall_oven_micro') {
      upperStart = 70 + 60 + 38; // 168
    } else if (v === 'tall_microwave_niche') {
      upperStart = 70 + 45; // 115
    }

    if (upperCount > 0 && cabH > upperStart + thicknessCm * 2 + 10) {
      const upperH = cabH - upperStart;
      const step = (upperH - 2 * thicknessCm) / (upperCount + 1);
      for (let i = 0; i < upperCount; i++) {
        let yUp = upperStart + thicknessCm + (i + 1) * step;
        for (const h of hinges.filter(h => h > upperStart)) {
          if (Math.abs(yUp - h) <= HINGE_COLLISION_RADIUS) {
            yUp += (yUp >= h ? 5.0 : -5.0);
          }
        }
        elevations.push(Math.max(upperStart + thicknessCm + 4, Math.min(cabH - thicknessCm - 4, yUp)));
      }
    }
    return elevations.sort((a, b) => a - b);
  }

  if (count <= 0) return [];

  if (v === '1_door_1_drawer') {
    const doorH = cabH - 18 - 0.9;
    const step = (doorH - 2 * thicknessCm) / (count + 1);
    const elevations: number[] = [];
    for (let i = 0; i < count; i++) {
      let yPos = thicknessCm + (i + 1) * step;
      for (const h of hinges) {
        if (Math.abs(yPos - h) <= HINGE_COLLISION_RADIUS) {
          yPos += (yPos >= h ? 5.0 : -5.0);
        }
      }
      elevations.push(Math.max(thicknessCm + 4, Math.min(doorH - thicknessCm - 4, yPos)));
    }
    return elevations.sort((a, b) => a - b);
  }

  const bottomOffset = thicknessCm;
  const topOffset = thicknessCm;
  const usableH = cabH - topOffset - bottomOffset;
  const step = usableH / (count + 1);

  const rawElevations: number[] = [];
  for (let i = 0; i < count; i++) {
    let yPos = bottomOffset + (i + 1) * step;
    for (const h of hinges) {
      if (Math.abs(yPos - h) <= HINGE_COLLISION_RADIUS) {
        const shift = yPos >= h ? 5.0 : -5.0;
        yPos += shift;
      }
    }
    yPos = Math.max(bottomOffset + 4.5, Math.min(cabH - topOffset - 4.5, yPos));
    rawElevations.push(Math.round(yPos * 10) / 10);
  }

  rawElevations.sort((a, b) => a - b);
  for (let i = 1; i < rawElevations.length; i++) {
    if (rawElevations[i] - rawElevations[i - 1] < (thicknessCm + 2.5)) {
      rawElevations[i] = rawElevations[i - 1] + thicknessCm + 3.0;
    }
  }

  return rawElevations;
}

export function generateKitchenPartsList(cabinets: CabinetType[]): Part[] {
  const parts: Part[] = [];
  const state = useStore.getState();
  const kState = useKitchenStore.getState();
  const rawThick = state.thickness || 1.8;
  const thickness = rawThick >= 1.2 ? Number(rawThick.toFixed(2)) : 1.8; // thickness en cm (mínimo 12mm, estándar 15/18mm)
  const hwSpec = HARDWARE_SPECS[state.drawerHardware || 'Provelcar'] || HARDWARE_SPECS.Provelcar;
  
  cabinets.forEach((cab, index) => {
    if (cab.type === 'decoration' || cab.variant?.startsWith('deco_')) return;
    const cabName = `(Cab ${index+1} ${cab.type})`;
    const w = cab.width;
    const h = cab.height;
    const d = cab.depth;
    
    // Base, tall and island cabinet legs/socle
    const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island';
    const socleH = kState.socleHeight ?? 10;
    const legsHeight = isBaseOrTall ? socleH : 0;
    const cabH = h - legsHeight;
    const innerW = w - thickness * 2;
    const innerH = cabH - thickness * ((cab.type === 'base' || cab.type === 'island') ? 1 : 2);
    
    // 1. Laterales (Sides)
    const isBaseGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
    const isTallSplitGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && cab.type === 'tall' && (cab.variant === 'tall_split_2_doors' || cab.variant === 'tall_oven_micro' || cab.variant === 'tall_oven_vent');
    const hasGolaC = isBaseGola && (cab.variant === '1_door_1_drawer' || cab.variant === '2_pot_drawers' || cab.variant === '4_drawers');
    const isWineRack = cab.variant?.includes('wine_rack') || cab.variant === 'base_wine_rack' || cab.variant === 'wall_wine_rack' || cab.variant === 'tall_wine_rack' || cab.variant === 'island_wine_rack';
    const isOpen = cab.variant === 'open' || cab.variant === 'tall_open' || cab.variant === 'wall_open' || (cab.type === 'closet' && !cab.hasDoors && cab.variant !== 'closet_2_doors' && cab.variant !== 'closet_inner_drawers');
    const hasFronts = !isWineRack && !isOpen;
    // Criterio técnico industrial: la profundidad total del mueble en el configurador incluye frentes.
    // El casco (laterales, piso, techo) descuenta el espesor del frente (puerta/cajón).
    const bodyDepth = hasFronts ? (d - thickness) : d;
    const effectiveDepth = isWineRack ? d : bodyDepth;
    const lateralNotes = isWineRack
      ? (isBaseGola
        ? 'Opción A: Lateral botellero continuo hasta cubierta a plomo con frentes contiguos (tope para rieles Gola contiguos, corte recto sin destaje)'
        : 'Opción A: Lateral botellero a plomo con frentes contiguos (Corte recto con disco en escuadradora/panelera/celco)')
      : (isTallSplitGola
        ? 'Mecanizado CNC: Destaje intermedio pasante Riel Gola L 56x28mm a cota 700mm (Continuidad con muebles base/isla)'
        : (isBaseGola
          ? (hasGolaC ? 'Mecanizado CNC: Destaje Gola L Superior 58x26mm + Gola C Intermedio 68x26mm (Paso continuo)' : 'Mecanizado CNC: Destaje Gola L Superior 58x26mm (Paso continuo)')
          : 'Laterales del gabinete'));

    parts.push({
      name: `Lateral ${cabName}`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 2,
      length: cabH * 10,
      width: Number((effectiveDepth * 10).toFixed(1)),
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true, edgeL2: false, edgeW1: true, edgeW2: true,
      notes: lateralNotes
    });

    // 1.1 Tapas Laterales Vistas (Costados Decorativos de Terminación)
    if (cab.leftCoverPanel?.enabled) {
      const coverThick = cab.leftCoverPanel.thickness || thickness;
      const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island' || cab.type === 'closet';
      const coverExtend = cab.leftCoverPanel.extendToFloor && isBaseOrTall;
      const coverH = coverExtend ? h : cabH;
      // La tapa lateral vista enrasa con los frentes en la profundidad total
      const coverDepth = (hasFronts || isWineRack) ? d : effectiveDepth;
      const coverMat = cab.leftCoverPanel.color || cab.doorColor || state.doorColor;

      parts.push({
        name: `Tapa Lateral Izq. Vista ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: coverH * 10,
        width: Number((coverDepth * 10).toFixed(1)),
        thickness: coverThick * 10,
        material: coverMat,
        edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
        notes: `Tapa lateral decorativa izquierda vista (${coverExtend ? 'al suelo' : 'al casco'}) enrasada con frentes`
      });
    }

    if (cab.rightCoverPanel?.enabled) {
      const coverThick = cab.rightCoverPanel.thickness || thickness;
      const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island' || cab.type === 'closet';
      const coverExtend = cab.rightCoverPanel.extendToFloor && isBaseOrTall;
      const coverH = coverExtend ? h : cabH;
      const coverDepth = (hasFronts || isWineRack) ? d : effectiveDepth;
      const coverMat = cab.rightCoverPanel.color || cab.doorColor || state.doorColor;

      parts.push({
        name: `Tapa Lateral Der. Vista ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: coverH * 10,
        width: Number((coverDepth * 10).toFixed(1)),
        thickness: coverThick * 10,
        material: coverMat,
        edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
        notes: `Tapa lateral decorativa derecha vista (${coverExtend ? 'al suelo' : 'al casco'}) enrasada con frentes`
      });
    }

    // 2. Base
    parts.push({
      name: `Piso ${cabName}`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 1,
      length: innerW * 10,
      width: Number((effectiveDepth * 10).toFixed(1)),
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
      notes: isWineRack
        ? 'Opción A: Piso botellero prolongado a plomo con frentes contiguos (Corte recto con disco en escuadradora/panelera/celco)'
        : 'Piso del gabinete'
    });

    // 3. Techo o Barras de Armado
    const ctConfig = kState.countertopConfig;
    const selectedProduct = kState.qstoneCatalog?.find(p => p.id === ctConfig?.selectedProductId);
    const requiresFullTop = ctConfig?.enabled && selectedProduct?.materialType === 'sinterizado';
    const isDurolacBack = cab.backMaterial === 'durolac' || cab.backThickness === 3 || (!cab.backMaterial && !cab.backThickness && (!cab.backColor || cab.backColor === '#FFFFFF' || cab.backColor === '#f8fafc'));

    if (cab.type === 'base' || cab.type === 'island') {
        if (requiresFullTop) {
            // Regla técnica de fabricación: para cubierta sinterizada se exige tapa/techo ciego completo de melamina
            parts.push({
                name: `Tapa Melamina Completa (Soporte Sinterizado) ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: innerW * 10,
                width: Number((effectiveDepth * 10).toFixed(1)),
                thickness: thickness * 10,
                material: cab.structureColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: 'Tapa continua completa para soporte homogéneo de cubierta sinterizada 12mm'
            });
        } else {
            // Barra superior delantera para apoyo de cubierta
            parts.push({
                name: `Barra Frontal Superior ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: innerW * 10,
                width: 10 * 10, // 10 cm width
                thickness: thickness * 10,
                material: cab.structureColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
            });
        }
    } else {
        // Wall or Tall cabinet has a full top
        parts.push({
            name: `Techo ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Techo del gabinete'
        });
    }

    // 3.1 Barras de Refuerzo Traseras (únicamente si el material de la trasera es Durolac)
    if (isDurolacBack && cab.type !== 'closet') {
      if (cab.type === 'base' || cab.type === 'island' || cab.type === 'wall') {
        parts.push({
          name: `Barra Refuerzo Trasera Superior ${cabName}`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: innerW * 10,
          width: 10 * 10,
          thickness: thickness * 10,
          material: cab.structureColor || state.structureColor,
          edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
          notes: 'Amarre posterior de refuerzo para trasera Durolac (superior)'
        });
        parts.push({
          name: `Barra Refuerzo Trasera Inferior ${cabName}`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: innerW * 10,
          width: 10 * 10,
          thickness: thickness * 10,
          material: cab.structureColor || state.structureColor,
          edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
          notes: 'Amarre posterior de refuerzo para trasera Durolac (inferior)'
        });
      } else if (cab.type === 'tall') {
        if (cab.variant === 'tall_oven_vent') {
          parts.push({
            name: `Barra Refuerzo Trasera ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 4,
            length: innerW * 10,
            width: 10 * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: '4 barras de refuerzo traseras (extremos superior/inferior + justo arriba/abajo de perforación de ventilación)'
          });
        } else if (cabH < 150) {
          parts.push({
            name: `Barra Refuerzo Trasera ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 3,
            length: innerW * 10,
            width: 10 * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: '3 barras de refuerzo traseras ubicadas de manera uniforme (Despensa < 150cm con trasera Durolac)'
          });
        } else {
          parts.push({
            name: `Barra Refuerzo Trasera ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 4,
            length: innerW * 10,
            width: 10 * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: '4 barras de refuerzo traseras ubicadas de manera uniforme (Despensa alta con trasera Durolac)'
          });
        }
      }
    }

    // 4. Fondo (Back panel)
    const backThickMm = cab.backThickness || (isDurolacBack ? 3 : (cab.backMaterial === 'melamina' || cab.backMaterial === 'hpl' ? Math.round(thickness * 10) : 3));
    const backMaterialName = isDurolacBack
      ? 'Durolac Blanco 3mm'
      : (cab.backColor || cab.structureColor || state.structureColor);

    if (cab.variant === 'tall_oven_vent') {
      parts.push({
        name: `Fondo Trasera Inferior ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: (70 - thickness) * 10,
        thickness: backThickMm,
        material: backMaterialName,
        edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
        notes: isDurolacBack ? 'Placa Durolac 3mm despensa inferior' : `Trasera Melamina ${backThickMm}mm despensa inferior`
      });
      if (cabH > 170) {
        parts.push({
          name: `Fondo Trasera Superior ${cabName}`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: innerW * 10,
          width: Math.max(50, (cabH - 168 - thickness) * 10),
          thickness: backThickMm,
          material: backMaterialName,
          edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
          notes: isDurolacBack ? 'Placa Durolac 3mm despensa superior' : `Trasera Melamina ${backThickMm}mm despensa superior`
        });
      }
    } else {
      parts.push({
        name: `Fondo Trasera ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: innerH * 10,
        thickness: backThickMm,
        material: backMaterialName,
        edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
        notes: isDurolacBack ? 'Placa Durolac 3mm ranurada/clavada' : `Trasera Melamina ${backThickMm}mm`
      });
    }

    // 5. Repisas (Shelves) y Divisores si corresponde
    const stdShelfDepthMm = cab.type === 'wall' ? Math.round((effectiveDepth - 2.2) * 10) : Math.round((effectiveDepth - 4.2) * 10);

    if (cab.variant === '2_doors' || cab.variant === '1_door' || cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || ((cab.type === 'wall' || cab.type === 'base' || cab.type === 'island') && (!cab.variant || cab.variant?.includes('door')))) {
        const shelfQty = cab.shelvesCount !== undefined ? cab.shelvesCount : getDefaultShelvesCount(cab);
        if (shelfQty > 0) {
            parts.push({
                name: `Repisa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: shelfQty,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${shelfQty} repisa(s) interior(es) regulable(s)`
            });
        }
    } else if (cab.variant === 'tall_1_door' || cab.variant === 'tall_2_doors') {
        const shelfQty = cab.shelvesCount !== undefined ? cab.shelvesCount : getDefaultShelvesCount(cab);
        if (shelfQty > 0) {
            parts.push({
                name: `Repisa Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: shelfQty,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${shelfQty} repisas interiores de despensa alta`
            });
        }
    } else if (cab.variant === 'tall_split_2_doors') {
        parts.push({
            name: `Divisor Fijo Línea Base ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Divisor estructural a cota 70cm (línea de muebles base)'
        });
        const { lower: lowerCount, upper: upperCount } = getSplitCabinetShelvesCounts(cab);
        if (lowerCount > 0) {
            parts.push({
                name: `Repisa Inferior Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: lowerCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${lowerCount} repisa(s) en puerta inferior (línea base)`
            });
        }
        if (upperCount > 0) {
            parts.push({
                name: `Repisa Superior Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: upperCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${upperCount} repisa(s) en puerta superior (línea alta)`
            });
        }
    } else if (cab.variant === 'tall_oven_micro') {
        parts.push({
            name: `Base Soporte Horno ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: (d - 2) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Base reforzada soporte horno a 70cm'
        });
        parts.push({
            name: `Divisor Horno / Microondas ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: (d - 2) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Divisor entre horno y microondas empotrado'
        });
        parts.push({
            name: `Techo Nicho Torre ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: (d - 2) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Cierre superior nicho de electrodomésticos'
        });
        const { lower: lowerCount, upper: upperCount } = getSplitCabinetShelvesCounts(cab);
        if (lowerCount > 0) {
            parts.push({
                name: `Repisa Inferior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: lowerCount,
                length: (innerW - 0.2) * 10,
                width: (d - 4) * 10,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${lowerCount} repisa(s) en puerta inferior (0-70cm)`
            });
        }
        if (upperCount > 0) {
            parts.push({
                name: `Repisa Superior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: upperCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${upperCount} repisa(s) en puerta superior (sobre hornos)`
            });
        }
    } else if (cab.variant === 'tall_microwave_niche') {
        parts.push({
            name: `Base Soporte Nicho Microondas ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Base soporte nicho microondas a 70cm'
        });
        parts.push({
            name: `Techo Nicho Abierto ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Cierre superior nicho abierto para microondas de sobremesa'
        });
        const { lower: lowerCount, upper: upperCount } = getSplitCabinetShelvesCounts(cab);
        if (lowerCount > 0) {
            parts.push({
                name: `Repisa Inferior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: lowerCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${lowerCount} repisa(s) en puerta inferior (0-70cm)`
            });
        }
        if (upperCount > 0) {
            parts.push({
                name: `Repisa Superior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: upperCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${upperCount} repisa(s) en puerta superior (sobre nicho)`
            });
        }
    } else if (cab.variant === 'tall_terminal_shelves') {
        const shelfCount = cab.shelvesCount ?? 5;
        parts.push({
            name: `Repisas Abiertas Vistas ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: shelfCount,
            length: (innerW - 0.2) * 10,
            width: (d - 1) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: `${shelfCount} repisas vistas para columna terminal de despensas`
        });
    } else if (cab.variant === 'tall_open' || (cab.type === 'tall' && cab.variant === 'open')) {
        parts.push({
            name: `Repisas a la Vista ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 5,
            length: (innerW - 0.2) * 10,
            width: (d - 2) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: '5 repisas vistas distribuidas simétricamente'
        });
    } else if (cab.variant?.includes('wine_rack')) {
        const usefulDepth = Math.min(d - 2, 32);
        const innerH = Math.max(15, cabH - thickness * 2);

        // Fondo falso estructural a 32cm útiles del frente
        parts.push({
            name: `Fondo Falso Botellero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number((innerH * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Fondo falso vertical a 320mm para tope de botellas estándar'
        });

        // Celdas paramétricas (mínimo 10.5 cm por celda, máximo 5 corridas)
        const minClearance = 10.5;
        const cols = Math.min(5, Math.max(1, Math.floor((innerW + thickness) / (minClearance + thickness))));
        const rows = Math.max(2, Math.floor(innerH / 12.5));

        if (cols > 1) {
            parts.push({
                name: `Divisor Vertical Botellero ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: cols - 1,
                length: innerH * 10,
                width: usefulDepth * 10,
                thickness: thickness * 10,
                material: cab.shelfColor || cab.structureColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `Montante vertical separador de ${cols} corridas`
            });
        }

        if (rows > 1) {
            parts.push({
                name: `Repisa Horizontal Botellero ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: rows - 1,
                length: (innerW - 0.2) * 10,
                width: usefulDepth * 10,
                thickness: thickness * 10,
                material: cab.shelfColor || cab.structureColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `Repisa horizontal separadora de ${rows} niveles`
            });
        }
    } else if (cab.variant?.startsWith('wall_corner_blind')) {
        parts.push({
            name: `Repisa Interior ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (innerW - 0.2) * 10,
            width: stdShelfDepthMm,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Repisa interior módulo aéreo esquinero'
        });
    }

    // 6. Frentes (Doors/Drawers)
    const gap = 0.3; // 3mm gap
    const frontMat = cab.doorColor || state.doorColor;
    if (cab.variant?.startsWith('wall_corner_blind')) {
        const stripW = 5.5; // 55 mm según lámina técnica PDF
        const doorW = w - stripW - gap * 3;
        parts.push({
            name: `Tapa Esquinero Frontal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: stripW * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Regleta frontal tapa esquinero 55mm según lámina 3 PDF'
        });
        parts.push({
            name: `Regleta Retorno Esquina Interior ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: stripW * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Regleta perpendicular interior escuadra unión esquinero'
        });
        parts.push({
            name: `Puerta Frontal Batiente ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: doorW * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta batiente para mueble aéreo esquinero'
        });
    } else if (cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind') {
        const blindW = cab.blindWidth && cab.blindWidth > 0 ? cab.blindWidth : (w >= 100 ? 65 : Math.max(35, w / 2));
        const stripW = 6.5; // Regleta de ajuste frontal traslapada de 65 mm (evita colisiones con tiradores a 90°)
        const doorW = Math.max(15, w - blindW - gap * 2);
        parts.push({
            name: `Panel Ciego ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: blindW * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Panel ciego frontal esquinero (mismo tono estructura/paredes)'
        });
        parts.push({
            name: `Regleta de Ajuste Frontal Traslapada ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: stripW * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Regleta de ajuste traslapada 65mm para evitar colisión de tiradores a 90°'
        });
        parts.push({
            name: `Puerta Frontal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: doorW * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta batiente esquinero'
        });
        parts.push({
            name: `Poste Amarre Ciego ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: cabH * 10,
            width: 10 * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Regleta vertical de fijación'
        });
        parts.push({
            name: `Repisa Interior ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (innerW - 0.2) * 10,
            width: (d - 4) * 10,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Repisa interior de vano ciego'
        });
    } else if (cab.variant === 'corner_l' || cab.variant === 'base_corner_l') {
        // Módulo esquinero en L articulado (900x900 mm)
        const doorW = 30 - gap * 2;
        parts.push({
            name: `Puerta Bi-Fold Hoja 1 ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: doorW * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Hoja principal anclada a lateral de mueble con bisagra 170°'
        });
        parts.push({
            name: `Puerta Bi-Fold Hoja 2 ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: doorW * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Hoja secundaria articulada solidaria con bisagra de rincón bi-fold'
        });
        parts.push({
            name: `Repisa en L - Tramo Principal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (w - 30 - 2) * 10,
            width: stdShelfDepthMm,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Tramo A de repisa continua a escuadra'
        });
        parts.push({
            name: `Repisa en L - Retorno Escuadra ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (30 - 2) * 10,
            width: Math.round((effectiveDepth - 30 - 2.2) * 10),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Tramo B de repisa continua a escuadra'
        });
    } else if (cab.variant === 'tall_oven_vent') {
        const baseH = 70;
        const ovenH = 60;
        const microH = 38;
        const topH = Math.max(10, cabH - (baseH + ovenH + microH));
        const lowerDoorH = baseH - gap * 2;
        const topDoorH = topH - gap * 2;

        parts.push({
            name: `Puerta Inferior Base ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: lowerDoorH * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta inferior despensero a cota de 700mm'
        });
        if (topDoorH > 10) {
            parts.push({
                name: `Puerta Superior Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: topDoorH * 10,
                width: (w - gap * 2) * 10,
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                notes: 'Puerta superior torre de hornos'
            });
        }
        parts.push({
            name: `Base Soporte Horno c/ Chimenea ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number(((effectiveDepth - 3.2) * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Base soporte reforzada horno (retranqueo técnico 50mm para chimenea térmica)'
        });
        parts.push({
            name: `Divisor Horno / Micro c/ Convección ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number(((effectiveDepth - 3.2) * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Divisor intermedio con paso libre de aire caliente posterior'
        });
        parts.push({
            name: `Techo Nicho Horno c/ Escape Aire ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: Number(((effectiveDepth - 3.2) * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Techo superior nicho de electrodomésticos con evacuación térmica'
        });
        const { lower: lowerCount, upper: upperCount } = getSplitCabinetShelvesCounts(cab);
        if (lowerCount > 0) {
            parts.push({
                name: `Repisa Inferior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: lowerCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${lowerCount} repisa(s) en puerta inferior (0-70cm)`
            });
        }
        if (upperCount > 0) {
            parts.push({
                name: `Repisa Superior Torre ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: upperCount,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${upperCount} repisa(s) en puerta superior (sobre hornos)`
            });
        }
    } else if (cab.variant === 'tall_inner_drawers') {
        // Puerta exterior única de gran altura
        parts.push({
            name: `Puerta Frontal Alta Continua ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta exterior despensero continuo. Requiere bisagras 165° con ángulo cero invasión'
        });

        // 4 Gavetas Interiores (Cajones ingleses)
        const innerDepthMm = (d - 5) * 10;
        const nominalLength = getNominalSlideLength(innerDepthMm);
        const drawerBoxLength = nominalLength - hwSpec.drawerLengthDeduction;
        const drawerBoxOuterWidth = innerW * 10 - hwSpec.slideClearanceTotal;
        const drawerFrontBackLength = drawerBoxOuterWidth - (2 * thickness * 10);
        const innerDrawerH = 140; // 140 mm
        const cInnerMat = cab.drawerInnerColor || state.structureColor;

        for (let i = 0; i < 4; i++) {
            // Frente interior con uñero fresado CNC
            parts.push({
                name: `Frente Cajón Interior ${i + 1} ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: drawerBoxOuterWidth,
                width: innerDrawerH,
                thickness: thickness * 10,
                material: cab.drawerFrontColor || frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                notes: 'Frente interior de melamina con uñero fresado CNC en centro superior'
            });
            // Laterales de cajón interior
            parts.push({
                name: `Lateral Cajón Interior ${i + 1} ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 2,
                length: drawerBoxLength,
                width: 120,
                thickness: thickness * 10,
                material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `P/ ${hwSpec.slideName} (NL=${nominalLength}mm)`
            });
            // Trasera de cajón interior
            parts.push({
                name: `Trasera Cajón Interior ${i + 1} ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: drawerFrontBackLength,
                width: 120,
                thickness: thickness * 10,
                material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `P/ ${hwSpec.slideName}`
            });
            // Fondo de cajón interior
            const botSpecs = getDrawerBottomSpecs(w, cInnerMat, cab.drawerInnerMaterial || state.drawerInnerMaterial, thickness);
            parts.push({
                name: `Fondo Cajón Interior ${i + 1} ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: drawerBoxLength,
                width: botSpecs.isDurolac ? drawerBoxOuterWidth : drawerFrontBackLength,
                thickness: botSpecs.thicknessMm,
                material: botSpecs.materialName,
                edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: botSpecs.notes
            });
        }

        // 3 Repisas superiores fijas/regulables
        parts.push({
            name: `Repisas Interiores Superiores ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 3,
            length: (innerW - 0.2) * 10,
            width: stdShelfDepthMm,
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Repisas despensero superior sobre gavetas interiores'
        });
    } else if (cab.variant === 'sink_u_drawer') {
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        const regruesoCm = (ctConfig?.enabled && (cab.type === 'base' || cab.type === 'island'))
            ? (cab.type === 'island' ? (ctConfig.islandRegruesoCm ?? ctConfig.regruesoCm ?? 0) : (ctConfig.baseRegruesoCm ?? ctConfig.regruesoCm ?? 0))
            : 0;
        const regruesoDeduction = isGola ? Math.max(0, regruesoCm - 3.5) : regruesoCm;
        
        let lowerH = (cabH - gap * 3) / 2;
        let upperH = (cabH - gap * 3) / 2;
        if (isGola) {
            const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 3);
            lowerH = availH / 2;
            upperH = availH / 2;
        }
        if (regruesoDeduction > 0) {
            upperH = Math.max(8, Number((upperH - regruesoDeduction).toFixed(1)));
        }

        // Frentes exteriores
        parts.push({
            name: `Frente Cajón Inferior Ollero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (w - gap * 2) * 10,
            width: lowerH * 10,
            thickness: thickness * 10,
            material: cab.drawerFrontColor || frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Frente exterior cajón ollero inferior'
        });
        parts.push({
            name: `Frente Cajón Superior en U ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (w - gap * 2) * 10,
            width: upperH * 10,
            thickness: thickness * 10,
            material: cab.drawerFrontColor || frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Frente exterior cajón superior lavaplatos (aloja cajón en U)'
        });

        const innerDepthMm = (d - 5) * 10;
        const nominalLength = getNominalSlideLength(innerDepthMm);
        const drawerBoxLength = nominalLength - hwSpec.drawerLengthDeduction;
        const drawerBoxOuterWidth = innerW * 10 - hwSpec.slideClearanceTotal;
        const drawerFrontBackLength = drawerBoxOuterWidth - (2 * thickness * 10);
        const cInnerMat = cab.drawerInnerColor || state.structureColor;

        // Cajón 1: Inferior estándar
        parts.push({
            name: `Lateral Cajón Inferior ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 2,
            length: drawerBoxLength, width: 180, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: `P/ ${hwSpec.slideName} (NL=${nominalLength}mm)`
        });
        parts.push({
            name: `Contrafrente Cajón Inferior ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 1,
            length: drawerFrontBackLength, width: 180, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: `Testero frontal interior p/ fijación de frente exterior`
        });
        parts.push({
            name: `Trasera Cajón Inferior ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 1,
            length: drawerFrontBackLength, width: 180, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: `Testero posterior p/ ${hwSpec.slideName}`
        });
        const botSpecsSink = getDrawerBottomSpecs(w, cInnerMat, cab.drawerInnerMaterial || state.drawerInnerMaterial, thickness);
        parts.push({
            name: `Fondo Cajón Inferior ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 1,
            length: drawerBoxLength, width: botSpecsSink.isDurolac ? drawerBoxOuterWidth : drawerFrontBackLength, thickness: botSpecsSink.thicknessMm, material: botSpecsSink.materialName,
            edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: botSpecsSink.notes
        });

        // Cajón 2: Superior en U para salvar sifón sanitario
        const skw = drawerBoxOuterWidth / 10; // cm
        const uCutoutW = Math.min(32, Math.max(22, w * 0.32)); // cm
        const wingW = (skw - uCutoutW) / 2; // cm
        const uCutoutLength = Math.max(16, (drawerBoxLength / 10) - 12); // cm
        const frontBandLength = (drawerBoxLength / 10) - uCutoutLength; // cm
        const sideH = 140;

        parts.push({
            name: `Costados Exteriores Cajón en U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 2,
            length: drawerBoxLength, width: sideH, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Costados laterales exteriores del cajón en U'
        });
        parts.push({
            name: `Contrafrente Frontal Cajón en U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 1,
            length: drawerFrontBackLength, width: sideH, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Testero frontal continuo para ensamble y fijación de frente exterior'
        });
        parts.push({
            name: `Traseras Alas Cajón en U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 2,
            length: wingW * 10, width: sideH, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Traseras individuales de cada ala izquierda/derecha'
        });
        parts.push({
            name: `Costados Interiores Divisorios Calado U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 2,
            length: uCutoutLength * 10, width: sideH, thickness: thickness * 10, material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Paredes interiores que conforman el calado central del sifón'
        });
        parts.push({
            name: `Fondo Alas Cajón en U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 2,
            length: drawerBoxLength, width: wingW * 10, thickness: botSpecsSink.thicknessMm, material: botSpecsSink.materialName,
            edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: botSpecsSink.notes
        });
        parts.push({
            name: `Fondo Banda Frontal Cajón en U ${cabName}`,
            moduleId: cab.id, moduleIndex: index, qty: 1,
            length: frontBandLength * 10, width: uCutoutW * 10, thickness: botSpecsSink.thicknessMm, material: botSpecsSink.materialName,
            edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: botSpecsSink.notes
        });
    } else if (cab.variant === 'spice_rack') {
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        const regruesoCm = (ctConfig?.enabled && (cab.type === 'base' || cab.type === 'island'))
            ? (cab.type === 'island' ? (ctConfig.islandRegruesoCm ?? ctConfig.regruesoCm ?? 0) : (ctConfig.baseRegruesoCm ?? ctConfig.regruesoCm ?? 0))
            : 0;
        const regruesoDeduction = isGola ? Math.max(0, regruesoCm - 3.5) : regruesoCm;
        const doorH = isGola ? (cabH - 3.5 - gap * 2) : (cabH - regruesoDeduction - gap * 2);

        // 1. Frente Exterior Especiero
        parts.push({
            name: `Frente Exterior Especiero Extraíble ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: doorH * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: cab.drawerFrontColor || frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Frente extraíble de mueble especiero con tirador vertical o gola'
        });

        // 2. Carro Interior de Melamina (misma melamina que cajones)
        const innerDepthMm = (d - 1.5) * 10;
        const nominalLength = getNominalSlideLength(innerDepthMm);
        const cartDepthMm = nominalLength - 10;
        const cartOuterWidthMm = innerW * 10 - hwSpec.slideClearanceTotal;
        const cartInnerWidthMm = cartOuterWidthMm - (2 * thickness * 10);
        const cInnerMat = cab.drawerInnerColor || state.structureColor;
        const cartHeightMm = (cabH - 12) * 10;
        const guardHeightMm = 60; // 60mm de alto para barandillas de contención

        // Base / Piso inferior del carro
        parts.push({
            name: `Piso Base Carro Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: cartDepthMm,
            width: cartOuterWidthMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: `Base de melamina para soporte y anclaje de correderas ${hwSpec.slideName}`
        });

        // Montante / Trasera vertical posterior
        parts.push({
            name: `Trasera / Montante Vertical Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: cartHeightMm,
            width: cartOuterWidthMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Estructura vertical posterior de unión entre niveles y repisas'
        });

        // Barandillas laterales inferiores
        parts.push({
            name: `Barandillas Laterales Inferiores Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 2,
            length: cartDepthMm,
            width: guardHeightMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Costados de contención nivel inferior para botellas altas'
        });

        // Contrafrentes / Amarres frontales de fijación al frente exterior
        parts.push({
            name: `Amarres Frontales Fijación Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 2,
            length: cartInnerWidthMm,
            width: guardHeightMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Amarres frontales atornillados al frente exterior de melamina'
        });

        // Repisa intermedia
        parts.push({
            name: `Repisa Intermedia Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: cartDepthMm - (thickness * 10),
            width: cartOuterWidthMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Bandeja intermedia de melamina para frascos y especias'
        });

        // Barandillas laterales intermedias
        parts.push({
            name: `Barandillas Laterales Intermedias Especiero ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 2,
            length: cartDepthMm - (thickness * 10),
            width: guardHeightMm,
            thickness: thickness * 10,
            material: cInnerMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Costados de contención nivel superior para frascos'
        });
    } else if (cab.type === 'closet' || cab.variant?.startsWith('closet_')) {
        const isClosetDoors = Boolean(cab.hasDoors || cab.variant === 'closet_2_doors' || cab.variant === 'closet_inner_drawers');
        const effDrawersCount = cab.drawersCount !== undefined 
            ? cab.drawersCount 
            : (cab.variant === 'closet_drawers' ? 4 : (cab.variant === 'closet_mixed' || cab.variant === 'closet_inner_drawers' ? 3 : (cab.variant === 'closet_2_doors' ? 2 : 0)));
        const isInnerDrw = Boolean(cab.innerDrawers || cab.variant === 'closet_inner_drawers' || (isClosetDoors && effDrawersCount > 0));
        const effShelvesCount = cab.shelvesCount !== undefined 
            ? cab.shelvesCount 
            : (cab.variant === 'closet_shelves' ? 5 : (cab.variant === 'closet_walkin' ? 3 : (cab.variant === 'closet_mixed' ? 2 : 1)));
        
        // Zócalos de Melamina del Clóset (Frontal y Posterior entre laterales al piso)
        const effSocleH = cab.closetSocleHeight ?? 7;
        const socleMat = cab.closetSocleColorMode === 'doors' 
            ? (cab.doorColor || state.doorColor) 
            : (cab.structureColor || state.structureColor);
        parts.push({
            name: `Zócalo Frontal Clóset ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: effSocleH * 10,
            thickness: thickness * 10,
            material: socleMat,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Zócalo frontal clóset entre laterales al suelo (retranqueado 2cm)'
        });
        parts.push({
            name: `Zócalo Posterior Clóset ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: innerW * 10,
            width: effSocleH * 10,
            thickness: thickness * 10,
            material: cab.structureColor || state.structureColor,
            edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Amarre inferior posterior clóset rigidizador'
        });

        // 1. Repisas / Maletero
        if (effShelvesCount > 0) {
            parts.push({
                name: `Repisa / Maletero Clóset ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: effShelvesCount,
                length: (innerW - 0.2) * 10,
                width: (d - 2) * 10,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `${effShelvesCount} repisa(s) de clóset / maletero`
            });
        }

        // Tapa sobre cajonera si hay cajones
        if (effDrawersCount > 0) {
            parts.push({
                name: `Tapa Divisoria Cajonera ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: (innerW - 0.2) * 10,
                width: (d - 2) * 10,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: 'Tapa superior estructural sobre batería de cajones'
            });

            // Cajas y frentes de cajón
            const spacerGapMm = isInnerDrw ? 35 : 0;
            const innerWallThickMm = isInnerDrw ? (thickness * 10) : 0;
            const totalSideRedMm = spacerGapMm + innerWallThickMm;
            const freeInnerWMm = isInnerDrw ? (innerW * 10 - totalSideRedMm * 2) : (innerW * 10);

            const internalClearanceZ = isInnerDrw ? (thickness * 10 + 15) : 0;
            const innerDepthMm = (d * 10) - 15 - internalClearanceZ;
            const nominalLength = getNominalSlideLength(innerDepthMm);
            const drawerBoxLength = nominalLength - hwSpec.drawerLengthDeduction;
            const drawerBoxOuterWidth = freeInnerWMm - hwSpec.slideClearanceTotal;
            const drawerFrontBackLength = drawerBoxOuterWidth - (2 * thickness * 10);
            const cInnerMat = cab.drawerInnerColor || state.structureColor;
            const drawerH = 22;
            const drawersTotalHMm = effDrawersCount * drawerH * 10;

            // Pilastras y laterales interiores si es cajón oculto tras puertas
            if (isInnerDrw) {
                parts.push({
                    name: `Lateral Int. Cajonera Clóset ${cabName}`,
                    moduleId: cab.id,
                    moduleIndex: index,
                    qty: 2,
                    length: drawersTotalHMm,
                    width: drawerBoxLength,
                    thickness: thickness * 10,
                    material: cab.structureColor || state.structureColor,
                    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: 'Lateral continuo interior cajonera clóset'
                });
                parts.push({
                    name: `Pilastra Frontal Clóset ${cabName}`,
                    moduleId: cab.id,
                    moduleIndex: index,
                    qty: 2,
                    length: drawersTotalHMm,
                    width: spacerGapMm,
                    thickness: thickness * 10,
                    material: cab.structureColor || state.structureColor,
                    edgeL1: true, edgeL2: true, edgeW1: false, edgeW2: false,
                    notes: 'Regleta separadora 35mm para librar bisagra y puerta de clóset'
                });
            }

            for (let i = 0; i < effDrawersCount; i++) {
                // Frente de cajón
                if (isInnerDrw) {
                    parts.push({
                        name: `Frente Interior Cajón ${i + 1} ${cabName}`,
                        moduleId: cab.id,
                        moduleIndex: index,
                        qty: 1,
                        length: freeInnerWMm - 4,
                        width: (drawerH - 5.0) * 10,
                        thickness: thickness * 10,
                        material: cab.drawerFrontColor || frontMat,
                        edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                        notes: 'Frente interior de clóset rebajado (Uñero sin tirador)'
                    });
                } else {
                    parts.push({
                        name: `Frente Exterior Cajón ${i + 1} ${cabName}`,
                        moduleId: cab.id,
                        moduleIndex: index,
                        qty: 1,
                        length: (w - gap * 2) * 10,
                        width: (drawerH - gap * 2) * 10,
                        thickness: thickness * 10,
                        material: cab.drawerFrontColor || frontMat,
                        edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                        notes: 'Frente exterior de cajón de clóset'
                    });
                }

                // Costados
                parts.push({
                    name: `Lateral Cajón Clóset ${cabName} (${i + 1})`,
                    moduleId: cab.id, moduleIndex: index, qty: 2,
                    length: drawerBoxLength, width: 180, thickness: thickness * 10, material: cInnerMat,
                    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: `P/ ${hwSpec.slideName} (NL=${nominalLength}mm)`
                });
                // Contrafrente
                parts.push({
                    name: `Contrafrente Cajón Clóset ${cabName} (${i + 1})`,
                    moduleId: cab.id, moduleIndex: index, qty: 1,
                    length: drawerFrontBackLength, width: 180, thickness: thickness * 10, material: cInnerMat,
                    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: 'Testero frontal interior de cajón'
                });
                // Trasera
                parts.push({
                    name: `Trasera Cajón Clóset ${cabName} (${i + 1})`,
                    moduleId: cab.id, moduleIndex: index, qty: 1,
                    length: drawerFrontBackLength, width: 180, thickness: thickness * 10, material: cInnerMat,
                    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: `Testero posterior p/ ${hwSpec.slideName}`
                });
                // Fondo
                const botSpecs = getDrawerBottomSpecs(w, cInnerMat, cab.drawerInnerMaterial || state.drawerInnerMaterial, thickness);
                parts.push({
                    name: `Fondo Cajón Clóset ${cabName} (${i + 1})`,
                    moduleId: cab.id, moduleIndex: index, qty: 1,
                    length: drawerBoxLength, width: botSpecs.isDurolac ? drawerBoxOuterWidth : drawerFrontBackLength, thickness: botSpecs.thicknessMm, material: botSpecs.materialName,
                    edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: botSpecs.notes
                });
            }
        }

        // Puertas batientes de clóset
        if (isClosetDoors) {
            const isDouble = w > 50;
            const doorQty = isDouble ? 2 : 1;
            const doorWidth = isDouble ? ((w - gap * 3) / 2) * 10 : (w - gap * 2) * 10;
            const doorH = (cabH - gap * 2) * 10;
            parts.push({
                name: `Puerta Clóset Batiente ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: doorQty,
                length: doorH,
                width: doorWidth,
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                notes: isDouble ? 'Puertas batientes dobles de clóset' : 'Puerta batiente simple de clóset'
            });
        }
    } else if (cab.variant === '1_door' || cab.variant === 'wall_1_door' || cab.variant === 'tall_1_door') {
        // Restricción técnica: Mueble base 1_door y despensa tall_1_door mantienen 1 sola puerta (máx 600mm) sin duplicar
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        const ctConfig = kState.countertopConfig;
        const regruesoCm = (ctConfig?.enabled && (cab.type === 'base' || cab.type === 'island'))
            ? (cab.type === 'island' ? (ctConfig.islandRegruesoCm ?? ctConfig.regruesoCm ?? 0) : (ctConfig.baseRegruesoCm ?? ctConfig.regruesoCm ?? 0))
            : 0;
        const regruesoDeduction = isGola ? Math.max(0, regruesoCm - 3.5) : regruesoCm;
        const rawDoorH = isGola ? (cabH - 3.5 - gap * 2) : (cabH - regruesoDeduction - gap * 2);

        const doorLeaves = (cab.variant === '1_door' || cab.variant === 'tall_1_door') ? 1 : (w > 60 ? 2 : 1);
        const doorW = doorLeaves === 2 ? ((w - gap * 3) / 2) * 10 : (w - gap * 2) * 10;
        parts.push({
            name: doorLeaves === 2 ? `Puerta Frontal (Hoja Doble) ${cabName}` : `Puerta Frontal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: doorLeaves,
            length: Number((rawDoorH * 10).toFixed(1)),
            width: Number(doorW.toFixed(1)),
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: (doorLeaves === 2 ? 'Módulo > 60cm subdividido en 2 hojas (máx 600mm)' : 'Puerta batiente') + (isGola ? ' (Descuento 35mm p/ Riel Gola L x175)' : '')
        });
    } else if (cab.variant === '2_doors' || cab.variant === 'tall_2_doors') {
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        const ctConfig = kState.countertopConfig;
        const regruesoCm = (ctConfig?.enabled && (cab.type === 'base' || cab.type === 'island'))
            ? (cab.type === 'island' ? (ctConfig.islandRegruesoCm ?? ctConfig.regruesoCm ?? 0) : (ctConfig.baseRegruesoCm ?? ctConfig.regruesoCm ?? 0))
            : 0;
        const regruesoDeduction = isGola ? Math.max(0, regruesoCm - 3.5) : regruesoCm;
        const rawDoorH = isGola ? (cabH - 3.5 - gap * 2) : (cabH - regruesoDeduction - gap * 2);

        const doorLeaves = Math.max(2, Math.ceil(w / 60));
        const totalCanteria = (doorLeaves + 1) * gap;
        const doorW = ((w - totalCanteria) / doorLeaves) * 10;
        parts.push({
            name: `Puerta Frontal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: doorLeaves,
            length: Number((rawDoorH * 10).toFixed(1)),
            width: Number(doorW.toFixed(1)),
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: `${doorLeaves} hojas batientes (ancho <= 600mm)` + (isGola ? ' (Descuento 35mm p/ Riel Gola L x175)' : '')
        });
    } else if (cab.variant === 'tall_split_2_doors') {
        const isGola = useKitchenStore.getState().golaSystem !== 'none';
        const baseH = 70;
        const topDeduct = isGola ? 3.5 : 0;
        const lowerDoorH = Math.max(10, baseH - topDeduct - gap * 2);
        const upperDoorH = Math.max(10, (cabH - baseH) - gap * 2);
        const doorLeaves = 1;
        const doorW = (w - gap * 2) * 10;
        parts.push({
            name: `Puerta Inferior Base ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: doorLeaves,
            length: Number((lowerDoorH * 10).toFixed(1)),
            width: Number(doorW.toFixed(1)),
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: isGola 
                ? 'Puerta inferior a cota de mueble base con rebaje Gola 35mm (ancho <= 600mm)' 
                : 'Puerta inferior a cota de mueble base (ancho <= 600mm)'
        });
        parts.push({
            name: `Puerta Superior Alta ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: doorLeaves,
            length: Number((upperDoorH * 10).toFixed(1)),
            width: Number(doorW.toFixed(1)),
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta superior despensa (ancho <= 600mm)'
        });
    } else if (cab.variant === 'tall_oven_micro') {
        const baseH = 70;
        const ovenH = 60;
        const microH = 38;
        const topH = Math.max(10, cabH - (baseH + ovenH + microH));
        const lowerDoorH = baseH - gap*2;
        const topDoorH = topH - gap*2;

        parts.push({
            name: `Puerta Inferior Base ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: lowerDoorH * 10,
            width: (w - gap*2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
        });
        if (topDoorH > 10) {
            parts.push({
                name: `Puerta Superior Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: topDoorH * 10,
                width: (w - gap*2) * 10,
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
            });
        }
    } else if (cab.variant === 'tall_microwave_niche') {
        const baseH = 70;
        const nicheH = 45;
        const topH = Math.max(10, cabH - (baseH + nicheH));
        const lowerDoorH = baseH - gap*2;
        const topDoorH = topH - gap*2;

        parts.push({
            name: `Puerta Inferior Base ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: lowerDoorH * 10,
            width: (w - gap*2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
        });
        if (topDoorH > 10) {
            parts.push({
                name: `Puerta Superior Despensa ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: topDoorH * 10,
                width: (w - gap*2) * 10,
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true
            });
        }
    } else if (cab.variant === 'wall_lift_up') {
        parts.push({
            name: `Puerta Elevable Aventos ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (cabH - gap * 2) * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta basculante hacia arriba con pistones a gas'
        });
        if (cabH > 50) {
            parts.push({
                name: `Repisa Interior ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
            });
        }
    } else if (cab.variant === 'wall_lift_up_double') {
        const sectionH = (cabH - gap * 3) / 2;
        parts.push({
            name: `Puerta Elevable Inferior ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: sectionH * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Módulo inferior basculante'
        });
        parts.push({
            name: `Puerta Elevable Superior ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: sectionH * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Módulo superior basculante'
        });
        parts.push({
            name: `Divisor Horizontal Fijo ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (innerW - 0.2) * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Repisa divisoria entre tramos basculantes'
        });
    } else if (cab.variant === 'wall_microwave_niche') {
        const nicheH = 38;
        const topH = Math.max(20, cabH - nicheH - gap * 2);
        const topDoorH = topH - gap * 2;
        parts.push({
            name: `Divisor Base Nicho Microondas ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: (innerW - 0.2) * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: 'Repisa reforzada sobre nicho microondas'
        });
        parts.push({
            name: `Puerta Superior Elevable ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 1,
            length: topDoorH * 10,
            width: (w - gap * 2) * 10,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: 'Puerta abatible superior de mueble microondas'
        });
        if (topH > 45) {
            parts.push({
                name: `Repisa Interior Superior ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: (innerW - 0.2) * 10,
                width: stdShelfDepthMm,
                thickness: thickness * 10,
                material: cab.shelfColor || state.structureColor,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false
            });
        }
    } else if (cab.variant === 'wall_open') {
        parts.push({
            name: `Repisas a la Vista ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: 2,
            length: (innerW - 0.2) * 10,
            width: Number((effectiveDepth * 10).toFixed(1)),
            thickness: thickness * 10,
            material: cab.shelfColor || state.structureColor,
            edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
            notes: '2 repisas vistas interiores'
        });
    } else if (cab.variant === '4_drawers' || cab.variant === '2_pot_drawers' || cab.variant === '2_drawers_1_pot' || cab.variant === '1_door_1_drawer') {
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        let drawCount = 0;
        let drawerHeights: number[] = [];
        let isPotDrawer = cab.variant === '2_pot_drawers';
        
        if (cab.variant === '4_drawers') {
            drawCount = 4;
            if (isGola) {
                const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 5);
                drawerHeights = [availH / 4, availH / 4, availH / 4, availH / 4];
            } else {
                drawerHeights = [(cabH - gap*5)/4, (cabH - gap*5)/4, (cabH - gap*5)/4, (cabH - gap*5)/4];
            }
        }
        if (cab.variant === '2_pot_drawers') {
            drawCount = 2;
            if (isGola) {
                const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 3);
                drawerHeights = [availH / 2, availH / 2];
            } else {
                drawerHeights = [(cabH - gap*3)/2, (cabH - gap*3)/2];
            }
        }
        if (cab.variant === '2_drawers_1_pot') {
            drawCount = 3;
            if (isGola) {
                const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 4);
                drawerHeights = [availH * 0.5, availH * 0.25, availH * 0.25];
            } else {
                const availH = cabH - gap * 4;
                const lowH = Math.round(availH * 0.5 * 10) / 10;
                const upH = (availH - lowH) / 2;
                drawerHeights = [lowH, upH, upH];
            }
        }
        if (cab.variant === '1_door_1_drawer') {
            drawCount = 1;
            drawerHeights = [isGola ? 14.5 : 18]; // 35mm top deduction if Gola L
        }

        // Modificación de altura de frentes de cajón según el regrueso delantero de cubierta (0 a 5 cm)
        const regruesoCm = (ctConfig?.enabled && (cab.type === 'base' || cab.type === 'island'))
            ? (cab.type === 'island' ? (ctConfig.islandRegruesoCm ?? ctConfig.regruesoCm ?? 0) : (ctConfig.baseRegruesoCm ?? ctConfig.regruesoCm ?? 0))
            : 0;
        const regruesoDeduction = isGola ? Math.max(0, regruesoCm - 3.5) : regruesoCm;
        if (regruesoDeduction > 0 && drawerHeights.length > 0) {
            const topIdx = drawerHeights.length - 1;
            drawerHeights[topIdx] = Math.max(8, Number((drawerHeights[topIdx] - regruesoDeduction).toFixed(1)));
        }
        
        drawerHeights.forEach((dh, i) => {
            const isOlleroFront = cab.variant === '2_drawers_1_pot' ? i === 0 : isPotDrawer;
            parts.push({
                name: cab.variant === '2_drawers_1_pot' 
                    ? (i === 0 ? `Frente Cajón Ollero Inferior ${cabName}` : `Frente Cajón Superior ${i} ${cabName}`)
                    : `Frente Cajón ${i+1} ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: (w - gap*2) * 10,
                width: dh * 10,
                thickness: thickness * 10,
                material: cab.drawerFrontColor || frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                notes: isGola ? 'Tapacanto perimetral (Alineado a Riel Gola Provelcar)' : (isOlleroFront ? 'Frente cajón ollero de gran capacidad' : 'Tapacanto perimetral')
            });
        });

        if (cab.variant === '1_door_1_drawer') {
            const doorH = isGola ? Math.max(15, cabH - 3.5 - 14.5 - 4.0 - gap * 4 - regruesoDeduction) : (cabH - gap * 3 - 18);
            parts.push({
                name: `Puerta Frontal ${cabName}`,
                moduleId: cab.id,
                moduleIndex: index,
                qty: 1,
                length: Number((doorH * 10).toFixed(1)),
                width: Number(((w - gap * 2) * 10).toFixed(1)),
                thickness: thickness * 10,
                material: frontMat,
                edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
                notes: isGola ? 'Puerta frontal (Descuento 40mm p/ Riel Gola C x176)' : undefined
            });
            const defaultShelves = doorH > 40 ? 1 : 0;
            const shelfQty = cab.shelvesCount !== undefined ? cab.shelvesCount : defaultShelves;
            if (shelfQty > 0) {
                parts.push({
                    name: `Repisa ${cabName}`,
                    moduleId: cab.id,
                    moduleIndex: index,
                    qty: shelfQty,
                    length: (innerW - 0.2) * 10,
                    width: stdShelfDepthMm,
                    thickness: thickness * 10,
                    material: cab.shelfColor || state.structureColor,
                    edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                    notes: `${shelfQty} repisa(s) regulable(s) bajo cajón`
                });
            }
        }
        
        // Cajas de cajones calculadas con HARDWARE_SPECS exactos
        const innerDepthMm = (effectiveDepth - 2) * 10;
        const nominalLength = getNominalSlideLength(innerDepthMm);
        const drawerBoxLength = nominalLength - hwSpec.drawerLengthDeduction;
        const drawerBoxOuterWidth = innerW * 10 - hwSpec.slideClearanceTotal;
        const drawerFrontBackLength = drawerBoxOuterWidth - (2 * thickness * 10);
        const cInnerMat = cab.drawerInnerColor || state.structureColor;

        for (let i=0; i<drawCount; i++) {
            const currentSideH = cab.variant === '2_drawers_1_pot' 
                ? (i === 0 ? 180 : 120) 
                : (isPotDrawer ? 180 : 120);
            // Laterales cajon
            parts.push({
                name: `Lateral Cajón ${cabName} (${i+1})`,
                moduleId: cab.id, moduleIndex: index, qty: 2,
                length: drawerBoxLength, width: currentSideH, thickness: thickness * 10, material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `P/ ${hwSpec.slideName} (NL=${nominalLength}mm)`
            });
            // Contrafrente (Frontal Interior) de caja
            parts.push({
                name: `Contrafrente Cajón ${cabName} (${i+1})`,
                moduleId: cab.id, moduleIndex: index, qty: 1,
                length: drawerFrontBackLength, width: currentSideH, thickness: thickness * 10, material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `Testero frontal interior p/ fijación de frente exterior`
            });
            // Trasera de caja
            parts.push({
                name: `Trasera Cajón ${cabName} (${i+1})`,
                moduleId: cab.id, moduleIndex: index, qty: 1,
                length: drawerFrontBackLength, width: currentSideH, thickness: thickness * 10, material: cInnerMat,
                edgeL1: true, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: `Testero posterior p/ ${hwSpec.slideName}`
            });
            // Fondo de cajón según reglas técnicas (Durolac 3mm si blanco y <=50cm, sino misma melamina)
            const botSpecs = getDrawerBottomSpecs(w, cInnerMat, cab.drawerInnerMaterial || state.drawerInnerMaterial, thickness);
            parts.push({
                name: `Fondo Cajón ${cabName} (${i+1})`,
                moduleId: cab.id, moduleIndex: index, qty: 1,
                length: drawerBoxLength, width: botSpecs.isDurolac ? drawerBoxOuterWidth : drawerFrontBackLength, thickness: botSpecs.thicknessMm, material: botSpecs.materialName,
                edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false,
                notes: botSpecs.notes
            });
        }
    } else if (cab.variant !== 'wall_open' && cab.variant !== 'tall_open' && cab.variant !== 'tall_terminal_shelves' && cab.variant !== 'open' && !cab.variant?.includes('wine_rack') && !cab.variant?.startsWith('wall_corner_blind')) {
        // Fallback estándar para puertas batientes en cualquier variante base, mural o torre
        const isGola = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
        const isDouble = w > 60;
        const doorQty = isDouble ? 2 : 1;
        const doorWidth = isDouble ? ((w - gap * 3) / 2) * 10 : (w - gap * 2) * 10;
        const rawDoorH = isGola ? (cabH - 3.5 - gap * 2) : (cabH - gap * 2);
        parts.push({
            name: `Puerta Frontal ${cabName}`,
            moduleId: cab.id,
            moduleIndex: index,
            qty: doorQty,
            length: rawDoorH * 10,
            width: doorWidth,
            thickness: thickness * 10,
            material: frontMat,
            edgeL1: true, edgeL2: true, edgeW1: true, edgeW2: true,
            notes: (isDouble ? 'Puertas batientes dobles' : 'Puerta batiente estándar') + (isGola ? ' (Descuento 35mm p/ Riel Gola L x175)' : '')
        });
    }
  });

  parts.forEach(p => {
    const cab = cabinets.find(c => c.id === p.moduleId);
    const isFront = (p.name.includes('Puerta') || p.name.includes('Frente') || p.name.includes('Panel Ciego')) &&
                    !p.name.toLowerCase().includes('contrafrente') &&
                    !p.name.toLowerCase().includes('amarre') &&
                    !p.name.toLowerCase().includes('caja');
    const isBack = p.thickness === 3 || p.thickness === 3.5 || p.name.includes('Fondo') || p.name.includes('Trasera');
    const isCover = p.name.includes('Tapa Lateral') || p.name.includes('Costado Decorativo');

    if (isFront) {
      p.materialCategory = 'doors';
      p.isHpl = isHplFinish(p.material, cab?.doorMaterial, cab);
    } else if (isCover) {
      p.materialCategory = 'cover';
      const coverMatType = (p.name.includes('Izq') ? cab?.leftCoverPanel?.material : cab?.rightCoverPanel?.material) || cab?.doorMaterial;
      p.isHpl = isHplFinish(p.material, coverMatType, cab);
    } else if (isBack) {
      p.materialCategory = 'backs';
      p.isHpl = false;
    } else {
      p.materialCategory = 'structure';
      p.isHpl = false;
    }
  });

  return parts;
}

export function generateKitchenHardwareList(cabinets: CabinetType[]) {
    const hardware: { Categoria: string; Item: string; Cantidad: number; Unidad: string; Detalles?: string }[] = [];

    const state = useStore.getState();
    const kState = useKitchenStore.getState();
    const hwSpec = HARDWARE_SPECS[state.drawerHardware || 'Provelcar'] || HARDWARE_SPECS.Provelcar;
    const rawThick = state.thickness || 1.8;
    const thicknessMm = Math.round((rawThick >= 1.2 ? rawThick : 1.8) * 10);

    const getColorName = (colorVal?: string) => {
      return getFriendlyColorName(colorVal, state.customTextures);
    };

    // 0. CÁLCULO DE TABLEROS Y PLANCHAS (Melaminas, MDF 3mm, Laminados HPL)
    const allParts = generateKitchenPartsList(cabinets);
    const m2PorPlacaMDF = 2.44 * 1.83; // 4.465 m²
    const m2PorPlacaHPL = 3.05 * 1.30; // 3.965 m²

    // Agrupación por material / decorativo para cálculo multidecorativo exacto
    const melDoorsByColor: Record<string, { m2: number; name: string }> = {};
    const hplDoorsByColor: Record<string, { m2Hpl: number; m2Mdf: number; name: string }> = {};
    const structByColor: Record<string, { m2: number; name: string }> = {};
    let backsM2 = 0;
    
    // Tapacantos agrupados por material / decorativo
    const cantosFrontByColor: Record<string, { meters: number; name: string }> = {};
    const cantosStructByColor: Record<string, { meters: number; name: string }> = {};

    allParts.forEach(p => {
      const pArea = (p.length * p.width * p.qty) / 1000000;
      const isFront = (p.name.includes('Puerta') || p.name.includes('Frente') || p.name.includes('Panel Ciego')) &&
                      !p.name.toLowerCase().includes('contrafrente') &&
                      !p.name.toLowerCase().includes('amarre') &&
                      !p.name.toLowerCase().includes('caja');
      const isBack = p.thickness === 3 || p.name.includes('Fondo') || p.name.includes('Trasera');
      const isHPL = p.isHpl !== undefined ? p.isHpl : (isFront && isHplFinish(p.material, undefined, cabinets.find(c => c.id === p.moduleId)));
      const colorVal = p.material || (isFront ? state.doorColor : state.structureColor);
      const colorName = getColorName(colorVal);

      if (isBack) {
        backsM2 += pArea;
      } else if (isFront) {
        if (isHPL) {
          // Norma de fabricación: el laminado HPL se corta 1 cm (10mm) más ancho y más largo para prensado y refilado
          const hplPieceArea = (((p.length + 10) * (p.width + 10)) * p.qty) / 1000000;
          if (!hplDoorsByColor[colorVal]) {
            hplDoorsByColor[colorVal] = { m2Hpl: 0, m2Mdf: 0, name: colorName };
          }
          hplDoorsByColor[colorVal].m2Hpl += hplPieceArea;
          hplDoorsByColor[colorVal].m2Mdf += pArea;
        } else {
          if (!melDoorsByColor[colorVal]) {
            melDoorsByColor[colorVal] = { m2: 0, name: colorName };
          }
          melDoorsByColor[colorVal].m2 += pArea;
        }
      } else {
        if (!structByColor[colorVal]) {
          structByColor[colorVal] = { m2: 0, name: colorName };
        }
        structByColor[colorVal].m2 += pArea;
      }

      // Tapacantos
      const cantosL = (p.edgeL1 ? 1 : 0) + (p.edgeL2 ? 1 : 0);
      const cantosW = (p.edgeW1 ? 1 : 0) + (p.edgeW2 ? 1 : 0);
      const meters = (((cantosL * p.length) + (cantosW * p.width)) * p.qty) / 1000;
      if (meters > 0) {
        if (isFront) {
          if (!cantosFrontByColor[colorVal]) {
            cantosFrontByColor[colorVal] = { meters: 0, name: colorName };
          }
          cantosFrontByColor[colorVal].meters += meters;
        } else {
          if (!cantosStructByColor[colorVal]) {
            cantosStructByColor[colorVal] = { meters: 0, name: colorName };
          }
          cantosStructByColor[colorVal].meters += meters;
        }
      }
    });

    // 0.1 Tableros de Puertas / Frentes Melamina Estándar (por decorativo)
    Object.values(melDoorsByColor).forEach(item => {
      if (item.m2 > 0) {
        const requiredDoorsBoards = Math.max(1, Math.ceil((item.m2 * 1.18) / m2PorPlacaMDF));
        const eff = ((item.m2 / (requiredDoorsBoards * m2PorPlacaMDF)) * 100).toFixed(1);
        hardware.push({
          Categoria: 'Tableros',
          Item: `Plancha Melamina Puertas y Frentes (${item.name})`,
          Cantidad: requiredDoorsBoards,
          Unidad: `Planchas (2440x1830x${thicknessMm}mm)`,
          Detalles: `Área neta: ${item.m2.toFixed(2)} m² | Aprovechamiento est.: ${eff}%`
        });
      }
    });

    // 0.2 Tableros HPL por cada decorativo independiente y Sustrato MDF Crudo 18mm consolidado
    let totalMdfSustratoM2 = 0;
    Object.values(hplDoorsByColor).forEach(item => {
      if (item.m2Hpl > 0) {
        const reqHpl = Math.max(1, Math.ceil((item.m2Hpl * 1.15) / m2PorPlacaHPL));
        const effHpl = ((item.m2Hpl / (reqHpl * m2PorPlacaHPL)) * 100).toFixed(1);
        hardware.push({
          Categoria: 'Tableros',
          Item: `Plancha Laminado HPL Puertas (${item.name})`,
          Cantidad: reqHpl,
          Unidad: 'Planchas (3050x1300x0.9mm)',
          Detalles: `Enchape HPL (+1cm sobremedida refilado). Área corte: ${item.m2Hpl.toFixed(2)} m² | Efic.: ${effHpl}%`
        });
        totalMdfSustratoM2 += item.m2Mdf;
      }
    });

    if (totalMdfSustratoM2 > 0) {
      const reqMdfSustrato = Math.max(1, Math.ceil((totalMdfSustratoM2 * 1.18) / m2PorPlacaMDF));
      const effMdf = ((totalMdfSustratoM2 / (reqMdfSustrato * m2PorPlacaMDF)) * 100).toFixed(1);
      hardware.push({
        Categoria: 'Tableros',
        Item: 'Plancha MDF Crudo / Sustrato Base p/ HPL (18mm)',
        Cantidad: reqMdfSustrato,
        Unidad: 'Planchas (2440x1830x18mm)',
        Detalles: `Alma base desnuda para prensado HPL 18mm. Área neta: ${totalMdfSustratoM2.toFixed(2)} m² | Efic.: ${effMdf}%`
      });
      const litersGlue = Math.max(1, Math.ceil(totalMdfSustratoM2 * 0.35));
      hardware.push({
        Categoria: 'Insumos',
        Item: 'Adhesivo de Contacto Alta Resistencia (Prensado HPL)',
        Cantidad: litersGlue,
        Unidad: 'Litros / Galón',
        Detalles: `Pegado de alta resistencia HPL sobre sustrato MDF 18mm (${(totalMdfSustratoM2 * 2).toFixed(1)} m² caras)`
      });
    }

    // 0.3 Tableros de Estructura y Cajas de Cajón (por decorativo)
    Object.values(structByColor).forEach(item => {
      if (item.m2 > 0) {
        const requiredStructBoards = Math.max(1, Math.ceil((item.m2 * 1.15) / m2PorPlacaMDF));
        const effStruct = ((item.m2 / (requiredStructBoards * m2PorPlacaMDF)) * 100).toFixed(1);
        hardware.push({
          Categoria: 'Tableros',
          Item: `Plancha Melamina Estructura y Cajones (${item.name})`,
          Cantidad: requiredStructBoards,
          Unidad: `Planchas (2440x1830x${thicknessMm}mm)`,
          Detalles: `Área neta: ${item.m2.toFixed(2)} m² | Aprovechamiento est.: ${effStruct}%`
        });
      }
    });

    // 0.4 Tableros MDF 3mm (Fondos y Traseras)
    if (backsM2 > 0) {
      const requiredBackBoards = Math.max(1, Math.ceil((backsM2 * 1.12) / m2PorPlacaMDF));
      const effBack = ((backsM2 / (requiredBackBoards * m2PorPlacaMDF)) * 100).toFixed(1);
      hardware.push({
        Categoria: 'Tableros',
        Item: 'Plancha MDF / Durolac Traseras y Fondos 3mm',
        Cantidad: requiredBackBoards,
        Unidad: 'Planchas (2440x1830x3mm)',
        Detalles: `Fondos ranurados y traseras de módulos. Área neta: ${backsM2.toFixed(2)} m² | Efic.: ${effBack}%`
      });
    }

    // 0.5 Tapacantos (+10% merma) desglosados por cada decorativo
    Object.values(cantosFrontByColor).forEach(item => {
      if (item.meters > 0) {
        hardware.push({
          Categoria: 'Insumos',
          Item: `Tapacanto PVC Puertas y Frentes (22x${state.edgeBandingThicknessFronts.toFixed(2)}mm)`,
          Cantidad: Math.ceil(item.meters * 1.10),
          Unidad: 'Metros Lineales',
          Detalles: `Terminación perimetral frentes (${item.name})`
        });
      }
    });

    Object.values(cantosStructByColor).forEach(item => {
      if (item.meters > 0) {
        hardware.push({
          Categoria: 'Insumos',
          Item: `Tapacanto PVC Estructura (22x${state.edgeBandingThicknessCabinets.toFixed(2)}mm)`,
          Cantidad: Math.ceil(item.meters * 1.10),
          Unidad: 'Metros Lineales',
          Detalles: `Cantos frontales e interiores de gabinetes (${item.name})`
        });
      }
    });

    let totalHinges = 0;
    let totalDrawers = 0;
    const slidesByNL: Record<number, number> = {};
    
    let totalStructureScrews = 0;
    let totalStructureMinifix = 0;
    let totalStructureDowels = 0;
    
    let totalDrawerScrews = 0;
    let totalDrawerMinifix = 0;
    let totalDrawerDowels = 0;
    
    let builtInOvensCount = 0;
    let builtInMicrowavesCount = 0;
    let portableMicrowavesCount = 0;
    let stoveFd90Count = 0;
    let fridgeSBSCount = 0;
    let hoodConic90Count = 0;
    let plantDecoCount = 0;
    let dishwasherCount = 0;
    let wallCabinetsCount = 0;
    let liftUpPistonsCount = 0;
    let zeroProtrusionHingesCount = 0;
    let biFoldInterHingesCount = 0;
    let biFoldPostHingesCount = 0;
    let extraCornerLLegsCount = 0;
    let ventGrillesCount = 0;
    let closetRodsCount = 0;
    let closetRodsLengthMm = 0;
    let closetFlangesCount = 0;
    
    const baseCabinets = cabinets.filter(c => c.type === 'base' || c.type === 'island' || c.type === 'tall' || c.type === 'closet');
    
    cabinets.forEach(cab => {
        if (cab.type === 'decoration' || cab.variant?.startsWith('deco_')) {
            if (cab.variant === 'deco_stove') stoveFd90Count += 1;
            else if (cab.variant === 'deco_fridge') fridgeSBSCount += 1;
            else if (cab.variant === 'deco_hood') hoodConic90Count += 1;
            else if (cab.variant === 'deco_plant') plantDecoCount += 1;
            else if (cab.variant === 'deco_dishwasher') dishwasherCount += 1;
            return;
        }

        if (cab.type === 'wall') {
            wallCabinetsCount += 1;
        }

        // Fijaciones estructurales por módulo
        const fixPoints = (cab.type === 'tall' || cab.type === 'closet') ? 36 : (cab.type === 'wall' ? 16 : 20);
        if (state.assemblyType === 'minifix') {
            totalStructureMinifix += fixPoints;
            totalStructureDowels += fixPoints * 2; // 2 tarugos por cada perno minifix de apoyo
        } else {
            totalStructureScrews += fixPoints;
            totalStructureDowels += 8; // Guías de tarugo para alineación
        }

        // Bisagras y Sistemas Elevadores (Criterio técnico por altura de puerta: <=900mm: 2, <=1500mm: 3, <=2000mm: 4, >2000mm: 5)
        const gap = 0.3;
        const isBaseOrIslandCab = cab.type === 'base' || cab.type === 'island';
        const cabLegsH = (isBaseOrIslandCab || cab.type === 'tall' || cab.type === 'closet') ? ((cab.type === 'closet' ? (cab.closetSocleHeight ?? 7) : (kState.socleHeight ?? 10))) : 0;
        const cabBodyH = cab.height - cabLegsH;
        const topDeductMm = (kState.golaSystem === 'aluminum' || kState.golaSystem === 'black') && isBaseOrIslandCab ? 35 : 0;
        const stdDoorHMm = Math.max(100, Math.round((cabBodyH - (gap * 2)) * 10 - topDeductMm));
        const stdHingesPerLeaf = getHingesCountByHeight(stdDoorHMm);

        if (cab.variant === '1_door' || cab.variant === '1_door_1_drawer' || cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || cab.variant?.startsWith('wall_corner_blind')) {
            const leaves = 1;
            totalHinges += leaves * stdHingesPerLeaf;
        } else if (cab.variant === '2_doors') {
            const leaves = Math.max(2, Math.ceil(cab.width / 60));
            totalHinges += leaves * stdHingesPerLeaf;
        } else if (cab.variant === 'wall_lift_up') {
            liftUpPistonsCount += 2;
        } else if (cab.variant === 'wall_lift_up_double') {
            liftUpPistonsCount += 4;
        } else if (cab.variant === 'wall_microwave_niche') {
            liftUpPistonsCount += 2;
            portableMicrowavesCount += 1;
        } else if (cab.variant === 'tall_1_door') {
            const leaves = 1;
            totalHinges += leaves * stdHingesPerLeaf;
        } else if (cab.variant === 'tall_2_doors') {
            const leaves = Math.max(2, Math.ceil(cab.width / 60));
            totalHinges += leaves * stdHingesPerLeaf;
        } else if (cab.variant === 'tall_split_2_doors') {
            const leaves = 1;
            const lowerHMm = Math.round((70 - gap * 2) * 10);
            const upperHMm = Math.round(((cabBodyH - 70) - gap * 2) * 10);
            totalHinges += leaves * (getHingesCountByHeight(lowerHMm) + getHingesCountByHeight(upperHMm));
        } else if (cab.variant === 'tall_oven_micro' || cab.variant === 'tall_oven_vent') {
            const leaves = 1;
            const baseH = 70;
            const ovenH = 60;
            const microH = 38;
            const topH = Math.max(10, cabBodyH - (baseH + ovenH + microH));
            const lowerHMm = Math.round((baseH - gap * 2) * 10);
            const topHMm = Math.round((topH - gap * 2) * 10);
            totalHinges += leaves * getHingesCountByHeight(lowerHMm);
            if (topH > 10) {
                totalHinges += leaves * getHingesCountByHeight(topHMm);
            }
            builtInOvensCount += 1;
            builtInMicrowavesCount += 1;
            if (cab.variant === 'tall_oven_vent') {
                ventGrillesCount += 1;
            }
        } else if (cab.variant === 'tall_microwave_niche') {
            const leaves = 1;
            const baseH = 70;
            const nicheH = 45;
            const topH = Math.max(10, cabBodyH - (baseH + nicheH));
            const lowerHMm = Math.round((baseH - gap * 2) * 10);
            const topHMm = Math.round((topH - gap * 2) * 10);
            totalHinges += leaves * getHingesCountByHeight(lowerHMm);
            if (topH > 10) {
                totalHinges += leaves * getHingesCountByHeight(topHMm);
            }
            portableMicrowavesCount += 1;
        } else if (cab.variant === 'tall_inner_drawers') {
            zeroProtrusionHingesCount += stdHingesPerLeaf; // Bisagras 155° codo cero según altura
        } else if (cab.variant === 'corner_l' || cab.variant === 'base_corner_l') {
            biFoldInterHingesCount += 2; // Bisagras intermedias entre hojas bi-fold
            biFoldPostHingesCount += 2;  // Bisagras gran angular 170° a lateral
            extraCornerLLegsCount += 1;  // Pata central de refuerzo en rincón
        } else if (cab.type === 'closet' || cab.variant?.startsWith('closet_')) {
            const isClosetDoors = Boolean(cab.hasDoors || cab.variant === 'closet_2_doors' || cab.variant === 'closet_inner_drawers');
            if (isClosetDoors) {
                const doorLeaves = Math.max(1, Math.ceil(cab.width / 60));
                const closetDoorHMm = Math.round((cabBodyH - gap * 2) * 10);
                totalHinges += doorLeaves * getHingesCountByHeight(closetDoorHMm);
            }
            if (cab.hasHanger !== false && cab.variant !== 'closet_shelves') {
                closetRodsCount += 1;
                closetRodsLengthMm += (cab.width - 3) * 10;
                closetFlangesCount += 2;
            }
        }
        
        // Cajones y Especieros Extraíbles
        let cabDrawers = 0;
        if (cab.variant === '4_drawers') cabDrawers = 4;
        if (cab.variant === '2_pot_drawers') cabDrawers = 2;
        if (cab.variant === '1_door_1_drawer') cabDrawers = 1;
        if (cab.variant === 'sink_u_drawer') cabDrawers = 2;
        if (cab.variant === 'tall_inner_drawers') cabDrawers = 4;
        if (cab.variant === 'spice_rack') cabDrawers = 1;
        if (cab.type === 'closet' || cab.variant?.startsWith('closet_')) {
            cabDrawers = cab.drawersCount !== undefined 
                ? cab.drawersCount 
                : (cab.variant === 'closet_drawers' ? 4 : (cab.variant === 'closet_mixed' || cab.variant === 'closet_inner_drawers' ? 3 : (cab.variant === 'closet_2_doors' ? 2 : 0)));
        }

        if (cabDrawers > 0) {
            totalDrawers += cabDrawers;
            const innerDepthMm = (cab.depth - 5) * 10;
            const nl = getNominalSlideLength(innerDepthMm);
            slidesByNL[nl] = (slidesByNL[nl] || 0) + cabDrawers;

            // Armado de cajones
            if (state.drawerAssemblyType === 'minifix') {
                totalDrawerMinifix += cabDrawers * 8;
                totalDrawerDowels += cabDrawers * 8;
            } else {
                totalDrawerScrews += cabDrawers * 8; // Tornillos 4x40mm o 4x50mm
            }
        }
    });

    // 1. HERRAJES DE ARMADO (Minifix, Tarugos, Tornillos)
    if (state.assemblyType === 'minifix' || totalDrawerMinifix > 0) {
        const isHafele = state.drawerHardware === 'Hafele';
        const totalMinifix = totalStructureMinifix + totalDrawerMinifix;
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele ? 'Pernos Häfele Minifix + Cajas Excéntricas Häfele Minifix 15' : 'Pernos Minifix + Cajas Excéntricas 15mm',
            Cantidad: totalMinifix,
            Unidad: 'Juegos',
            Detalles: `Estructura (${totalStructureMinifix}) + Cajones (${totalDrawerMinifix})`
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tarugos de Madera 8x30mm',
            Cantidad: totalStructureDowels + totalDrawerDowels,
            Unidad: 'Unidades',
            Detalles: 'Encastre y alineación estructural mecanizada'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tapas Adhesivas Embellecedoras para Minifix (Ø15mm)',
            Cantidad: totalMinifix,
            Unidad: 'Unidades',
            Detalles: 'Ocultamiento estético de cajas excéntricas'
        });
    }

    if (state.assemblyType === 'spax' || totalDrawerScrews > 0) {
        if (totalStructureScrews > 0) {
            hardware.push({
                Categoria: 'Insumos',
                Item: 'Tornillos Soberbio / Spax 4x50mm',
                Cantidad: totalStructureScrews,
                Unidad: 'Unidades',
                Detalles: 'Armado general de gabinetes y módulos'
            });
            hardware.push({
                Categoria: 'Insumos',
                Item: 'Tapas Adhesivas p/Tornillos',
                Cantidad: totalStructureScrews,
                Unidad: 'Unidades',
                Detalles: 'Tapa-tornillos al tono de la melamina'
            });
        }
        if (totalDrawerScrews > 0) {
            hardware.push({
                Categoria: 'Insumos',
                Item: 'Tornillos Spax 4x40mm (Cajas de Cajón)',
                Cantidad: totalDrawerScrews,
                Unidad: 'Unidades',
                Detalles: 'Fijación de laterales y frentes/traseras de cajón'
            });
        }
        if (totalStructureDowels > 0 && state.assemblyType === 'spax') {
            hardware.push({
                Categoria: 'Insumos',
                Item: 'Tarugos de Madera 8x30mm (Guías)',
                Cantidad: totalStructureDowels,
                Unidad: 'Unidades',
                Detalles: 'Guías de centrado previo a atornillado'
            });
        }
    }

    // Tornillos de fijación frente de cajón
    if (totalDrawers > 0) {
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Frente de Cajón 4x30mm',
            Cantidad: totalDrawers * 4,
            Unidad: 'Unidades',
            Detalles: '4 tornillos por frente exterior'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Correderas a Lateral 3.5x16mm',
            Cantidad: totalDrawers * 12,
            Unidad: 'Unidades',
            Detalles: 'Fijación técnica de guías telescópicas'
        });
    }

    // 2. CORREDERAS DE CAJÓN (Quincallería con especificación y NL)
    Object.keys(slidesByNL).forEach(nlStr => {
        const nl = Number(nlStr);
        const qty = slidesByNL[nl];
        hardware.push({
            Categoria: 'Quincallería',
            Item: `${hwSpec.slideName} ${nl}mm (NL)`,
            Cantidad: qty,
            Unidad: 'Pares',
            Detalles: `Montaje bajo fondo para profundidad ${nl + 50}mm`
        });
    });

    const isHafele = kState.drawerHardware === 'Hafele';

    // 3. BISAGRAS Y SISTEMAS ELEVADORES (Quincallería)
    if (totalHinges > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele 
                ? 'Bisagras Cazoleta Häfele Metalla 310/500 110° Rectas (Cierre Suave con Freno Integrado)'
                : 'Bisagras Cazoleta 35mm Rectas (Cierre Suave)',
            Cantidad: totalHinges,
            Unidad: 'Unidades',
            Detalles: isHafele 
                ? 'Puertas exteriores; incluye placa base en cruz Häfele con regulación 3D excéntrica'
                : 'Puertas exteriores de gabinetes y despensas'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Bisagras 3.5x16mm',
            Cantidad: totalHinges * 4,
            Unidad: 'Unidades',
            Detalles: 'Para cazoleta y base de montaje'
        });
    }

    // Soportes de Repisa Interior (Pitones Niquelados Ø5mm)
    const totalShelvesCount = allParts
        .filter(p => p.name.startsWith('Repisa'))
        .reduce((sum, p) => sum + p.qty, 0);

    if (totalShelvesCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Soportes de Repisa Niquelados Ø5mm (Pitones con Retén/Goma)',
            Cantidad: totalShelvesCount * 4,
            Unidad: 'Unidades',
            Detalles: `Montaje y fijación regulable de repisas interiores (${totalShelvesCount} repisas x 4 soportes)`
        });
    }

    if (zeroProtrusionHingesCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele
                ? 'Bisagras Häfele Metalla 155° Codo Cero con Cierre Suave (Apertura Libre Gavetero)'
                : 'Bisagras Especiales 155°/165° Codo Cero (Apertura Libre Gavetero)',
            Cantidad: zeroProtrusionHingesCount,
            Unidad: 'Unidades',
            Detalles: 'Permite apertura de puerta a 155° dejando paso libre al 100% de los cajones interiores sin rozamiento'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Bisagras 3.5x16mm',
            Cantidad: zeroProtrusionHingesCount * 4,
            Unidad: 'Unidades',
            Detalles: 'Para bases y cazoletas de bisagra 155° codo cero'
        });
    }

    if (biFoldInterHingesCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele 
                ? 'Bisagras Rincón Häfele Bi-Fold Articuladas (Puerta Plegable Esquinero)'
                : 'Bisagras Rincón Bi-Fold Articuladas (Puerta Plegable Esquinero)',
            Cantidad: biFoldInterHingesCount,
            Unidad: 'Unidades',
            Detalles: 'Unión intermedia articulada entre las 2 hojas bi-fold del mueble esquinero en L'
        });
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele 
                ? 'Bisagras Gran Ángulo Häfele 165° Cierre Suave (Anclaje a Mueble)'
                : 'Bisagras Gran Ángulo 170° Cierre Suave (Anclaje a Mueble)',
            Cantidad: biFoldPostHingesCount,
            Unidad: 'Unidades',
            Detalles: 'Fijación de la hoja principal del mueble en L al lateral de la estructura'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Bisagras Bi-Fold 3.5x16mm',
            Cantidad: (biFoldInterHingesCount + biFoldPostHingesCount) * 4,
            Unidad: 'Unidades',
            Detalles: 'Fijación de bisagras de rincón y gran ángulo'
        });
    }

    if (ventGrillesCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Rejilla de Ventilación Técnica Aluminio Anodizado (Ranurada Convección)',
            Cantidad: ventGrillesCount,
            Unidad: 'Unidades',
            Detalles: 'Ventilación técnica para torre de hornos empotrados y flujo convectivo'
        });
    }

    if (liftUpPistonsCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele 
                ? 'Sistema Elevable Häfele Free Flap / Free Fold (Amortiguación Soft-Close Multiposición)'
                : 'Pistones a Gas / Sistema Elevador Aventos (100N / Cierre Suave)',
            Cantidad: liftUpPistonsCount,
            Unidad: 'Unidades',
            Detalles: `${liftUpPistonsCount / 2} juego(s) p/ puertas abatibles superiores de muebles aéreos`
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Sistema Elevador 3.5x16mm',
            Cantidad: liftUpPistonsCount * 4,
            Unidad: 'Unidades',
            Detalles: 'Anclaje a lateral y cara interior de puerta'
        });
    }

    // 4. COLGADORES PARA MUEBLES AÉREOS (Murales)
    if (wallCabinetsCount > 0) {
        hardware.push({
            Categoria: 'Quincallería',
            Item: isHafele 
                ? 'Colgadores Regulables Ocultos Häfele p/ Mueble Aéreo (Regulación 3D / 130kg por par)'
                : 'Colgadores Regulables Ocultos p/ Mueble Aéreo (Juego Izq/Der)',
            Cantidad: wallCabinetsCount,
            Unidad: 'Juegos',
            Detalles: 'Capacidad 130kg por par con regulación 3D'
        });
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Riel de Suspensión Metálico p/ Muro (Tira de Anclaje)',
            Cantidad: wallCabinetsCount,
            Unidad: 'Unidades',
            Detalles: 'Fijación a muro estructural'
        });
    }

    // 5. PATAS REGULABLES PARA MUEBLES BASE E ISLAS
    if (baseCabinets.length > 0) {
        const totalLegs = (baseCabinets.length * 4) + extraCornerLLegsCount;
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Patas Regulables 10-15cm para Mueble Base',
            Cantidad: totalLegs,
            Unidad: 'Unidades',
            Detalles: `Soporte nivelable de gabinetes inferiores${extraCornerLLegsCount > 0 ? ` (incluye ${extraCornerLLegsCount} pata central de rincón en L)` : ''}`
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Patas Regulables 3.5x16mm',
            Cantidad: totalLegs * 4,
            Unidad: 'Unidades',
            Detalles: '4 tornillos por base de pata'
        });
    }

    // 6. ELECTRODOMÉSTICOS Y DECORACIÓN
    if (builtInOvensCount > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Horno Eléctrico Empotrable 60cm', Cantidad: builtInOvensCount, Unidad: 'Unidades', Detalles: 'Nicho torre 60cm' });
    if (builtInMicrowavesCount > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Microondas Empotrado con Marco de Acero', Cantidad: builtInMicrowavesCount, Unidad: 'Unidades', Detalles: 'Nicho torre 38cm' });
    if (portableMicrowavesCount > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Microondas Portátil / Sobremesa 25L', Cantidad: portableMicrowavesCount, Unidad: 'Unidades', Detalles: 'Nicho abierto' });
    if (stoveFd90Count > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Cocina FDV FS UNIQUE 90 (Acero Inox - 5 Quemadores + Horno 107L)', Cantidad: stoveFd90Count, Unidad: 'Unidades', Detalles: 'SAP 13297' });
    if (fridgeSBSCount > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Refrigerador FDV SBS SIGNATURE 2.0 513L (Dark Inox)', Cantidad: fridgeSBSCount, Unidad: 'Unidades', Detalles: 'SAP 16692' });
    if (dishwasherCount > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Lavavajillas FDV Active 12C Silver (12 Cubiertos - Libre Instalación / Bajo Cubierta)', Cantidad: dishwasherCount, Unidad: 'Unidades', Detalles: 'SAP 15598 (Alto 845mm / 820mm sin tapa, Ancho 598mm, Fondo 600mm)' });
    if (hoodConic90Count > 0) hardware.push({ Categoria: 'Equipamiento', Item: 'Campana FDV New Conic 90 (Acero Inox - 780 m3/h - 3 Velocidades)', Cantidad: hoodConic90Count, Unidad: 'Unidades', Detalles: 'SAP 16309 (Ancho 898mm, Fondo 500mm, Iluminación LED 2x2W)' });
    if (plantDecoCount > 0) hardware.push({ Categoria: 'Decoración', Item: 'Planta Decorativa Interior con Macetero y Soporte de Madera', Cantidad: plantDecoCount, Unidad: 'Unidades', Detalles: 'Ambientación 3D' });

    // 6.1 BARRAS DE COLGAR CLÓSET Y ACCESORIOS
    if (closetRodsCount > 0) {
        const totalTubes = Math.max(1, Math.ceil(closetRodsLengthMm / 3000));
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Barra de Colgar Ovalada Cromada 30x15mm (Tira 3000mm)',
            Cantidad: totalTubes,
            Unidad: 'Tiras (3.00 m)',
            Detalles: `${closetRodsCount} barra(s) de clóset (${(closetRodsLengthMm / 1000).toFixed(2)} m lineales totales)`
        });
        hardware.push({
            Categoria: 'Quincallería',
            Item: 'Soportes Laterales / Bridas para Tubo Ovalado Cromado',
            Cantidad: closetFlangesCount,
            Unidad: 'Unidades',
            Detalles: 'Fijación lateral a costados de clóset con tornillos 3.5x16mm'
        });
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos Fijación Bridas de Clóset 3.5x16mm',
            Cantidad: closetFlangesCount * 2,
            Unidad: 'Unidades',
            Detalles: '2 tornillos por brida lateral'
        });
    }

    // 7. ZÓCALO Y PERFILERÍA OPTIMIZADA A TIRAS DE 3000mm (3m)
    if (kState.showSocle && baseCabinets.length > 0) {
        const socleH = kState.socleHeight ?? 10;
        const socleSystem = calculateSocleSystem(baseCabinets, kState.walls, kState.roomConfig?.vertices, kState.socleFinish, socleH);
        const frontLengthMm = socleSystem.pieces.reduce((acc, p) => acc + p.length, 0) * 10;
        const lateralLengthMm = socleSystem.laterals.reduce((acc, l) => acc + l.depth, 0) * 10;
        const totalLinearLengthMm = frontLengthMm + lateralLengthMm;

        const straightJointsCount = socleSystem.straightJoints.length;
        const cornerJoints90Count = socleSystem.corners.length;
        const exposedFlanksCount = socleSystem.laterals.length;
        const socleStrips = Math.max(1, Math.ceil((totalLinearLengthMm * 1.05) / 3000));
        const socleFinishLabel = kState.socleFinish === 'black' ? 'Negro Mate' : 'Aluminio Satinado';

        hardware.push({
            Categoria: 'Zócalos',
            Item: `Zócalo de PVC/Aluminio con Sello de Agua (${socleFinishLabel} - Tira 3000mm / 3m)`,
            Cantidad: socleStrips,
            Unidad: 'Tiras',
            Detalles: `Protección hidrófuga perimetral ${socleH}cm en acabado ${socleFinishLabel}. Optimizado a tiras comerciales continuas de 3m (${(totalLinearLengthMm/1000).toFixed(2)} m lineales)`
        });
        if (straightJointsCount > 0) {
            hardware.push({
                Categoria: 'Zócalos',
                Item: 'Perfil Unión Recta 180° para Zócalo (Empalme >3m)',
                Cantidad: straightJointsCount,
                Unidad: 'Unidades',
                Detalles: 'Continuidad técnica en tramos lineales superiores a 3000mm'
            });
        }
        if (cornerJoints90Count > 0) {
            hardware.push({
                Categoria: 'Zócalos',
                Item: 'Conector Esquinero 90° para Zócalo',
                Cantidad: cornerJoints90Count,
                Unidad: 'Unidades',
                Detalles: 'Encuentros frontales y retornos en esquinas expuestas'
            });
        }
        if (exposedFlanksCount > 0) {
            hardware.push({
                Categoria: 'Zócalos',
                Item: 'Terminal / Tapa Final de Zócalo (Remate a Pared)',
                Cantidad: exposedFlanksCount,
                Unidad: 'Unidades',
                Detalles: 'Cierre lateral hermético hacia muro estructural'
            });
        }
        const totalClips = (baseCabinets.length * 2) + exposedFlanksCount;
        hardware.push({
            Categoria: 'Zócalos',
            Item: 'Pinzas / Clips de Fijación Zócalo a Pata',
            Cantidad: totalClips,
            Unidad: 'Unidades',
            Detalles: 'Enganche a presión sobre patas niveladoras'
        });
    }

    // 7. SISTEMA PERFIL GOLA (Provelcar x175 / x176) O TIRADORES CONVENCIONALES (GLOBALES Y POR MÓDULO)
    if (kState.golaSystem && kState.golaSystem !== 'none') {
        const golaRes = calculateGolaSystem(cabinets, kState.golaSystem);
        if (golaRes.hardwareItems.length > 0) {
            hardware.push(...golaRes.hardwareItems);
        }
    }

    // Desglose de tiradores por mueble (respetando configuración independiente o global heredada)
    const isGolaActive = kState.golaSystem && kState.golaSystem !== 'none';
    const handlesMap: Record<string, { item: string; details: string; count: number; screwCount: number }> = {};

    const getCabinetHandlesCount = (cab: CabinetType): number => {
        if (cab.type === 'decoration' || cab.variant?.startsWith('deco_') || cab.variant === 'open' || cab.variant === 'wall_open' || cab.variant === 'tall_open' || cab.variant === 'tall_terminal_shelves' || cab.variant?.includes('wine_rack')) {
            return 0;
        }
        const v = cab.variant || (cab.width > 60 ? '2_doors' : '1_door');
        if (v === '1_door' || v === 'spice_rack' || v === 'sink_1_door' || v === 'wall_1_door' || v === 'tall_1_door' || v === 'wall_lift_up' || v === 'wall_microwave_niche' || v === 'corner_l' || v === 'wall_corner_l' || v?.startsWith('corner_blind') || v === 'corner_blind' || v?.startsWith('wall_corner_blind')) {
            return 1;
        }
        if (v === '2_doors' || v === '1_door_1_drawer' || v === '2_drawers' || v === 'sink_2_doors' || v === 'sink_2_drawers_u' || v === 'wall_2_doors' || v === 'wall_lift_up_double' || v === 'tall_2_doors' || v === 'tall_split_2_doors' || v === 'tall_oven_micro' || v === 'tall_oven_vent' || v === 'tall_microwave_niche') {
            return 2;
        }
        if (v === '3_drawers' || v === '1_drawer_2_pot_drawers') {
            return 3;
        }
        if (v === 'tall_2_doors_4_drawers' || v === 'tall_6_drawers') {
            return 6;
        }
        return 1;
    };

    cabinets.forEach(cab => {
        if (cab.type === 'decoration' || cab.variant?.startsWith('deco_')) return;
        const isBaseOrIsland = cab.type === 'base' || cab.type === 'island';
        // En sistema Gola, los muebles base/isla no llevan tiradores frontales
        if (isGolaActive && isBaseOrIsland) return;

        const count = getCabinetHandlesCount(cab);
        if (count <= 0) return;

        const hConfig = cab.handleConfig || kState.handleConfig;
        if (!hConfig || hConfig.model === 'none') return;

        const modelItem = HANDLE_CATALOG.find(m => m.id === hConfig.model);
        const modelName = modelItem?.name || 'Tirador Estándar';
        const finishName = (hConfig.finish && FINISH_LABELS[hConfig.finish]) ? FINISH_LABELS[hConfig.finish] : 'Negro Mate';
        const lengthStr = (hConfig.lengthMm && hConfig.lengthMm > 0) ? `${hConfig.lengthMm}mm` : 'Punto Único';
        const key = `${hConfig.model}_${hConfig.finish || 'negro'}_${hConfig.lengthMm || 0}`;

        const itemName = `Tirador / Manilla ${modelName} (${lengthStr} - ${finishName})`;
        const holeMultiplier = modelItem?.holeCount ?? 2;

        if (!handlesMap[key]) {
            handlesMap[key] = {
                item: itemName,
                details: `Fijación frontal/posterior ${modelItem?.isRearMount ? 'pestaña' : 'estándar'} para frentes y puertas`,
                count: 0,
                screwCount: 0
            };
        }
        handlesMap[key].count += count;
        handlesMap[key].screwCount += count * (holeMultiplier || 2);
    });

    let totalHandleScrews = 0;
    Object.values(handlesMap).forEach(h => {
        if (h.count > 0) {
            hardware.push({
                Categoria: 'Tiradores',
                Item: h.item,
                Cantidad: h.count,
                Unidad: 'Unidades',
                Detalles: h.details
            });
            totalHandleScrews += h.screwCount;
        }
    });

    if (totalHandleScrews > 0) {
        hardware.push({
            Categoria: 'Insumos',
            Item: 'Tornillos M4 x 22mm para Tiradores',
            Cantidad: totalHandleScrews,
            Unidad: 'Unidades',
            Detalles: 'Fijación posterior para frentes de 15/18mm'
        });
    }

    return hardware;
}

