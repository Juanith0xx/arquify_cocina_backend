import { CabinetType } from '../store/kitchenStore';

export type GolaSystem = 'none' | 'aluminum' | 'black';

export interface GolaBOMItem {
  Categoria: string;
  Item: string;
  Cantidad: number;
  Unidad: string;
  Detalles: string;
}

export interface GolaCalculationResult {
  active: boolean;
  system: GolaSystem;
  finishName: string;
  finishCode: string;
  totalGolaLLengthMm: number;
  totalGolaCLengthMm: number;
  stripsGolaL: number;
  stripsGolaC: number;
  bracketsCount: number;
  cornerJoints90Count: number;
  hardwareItems: GolaBOMItem[];
}

/**
 * Technical calculation of the Provelcar Gola Profile System (x175 Gola L & x176 Gola C).
 * Strips are 3000mm (3m) commercial standard.
 * Includes mounting brackets and 90° corner joints.
 * Strictly excludes terminal end caps per manufacturer specs.
 */
export function calculateGolaSystem(
  cabinets: CabinetType[],
  system: GolaSystem
): GolaCalculationResult {
  if (system === 'none') {
    return {
      active: false,
      system: 'none',
      finishName: 'Sin Gola',
      finishCode: '',
      totalGolaLLengthMm: 0,
      totalGolaCLengthMm: 0,
      stripsGolaL: 0,
      stripsGolaC: 0,
      bracketsCount: 0,
      cornerJoints90Count: 0,
      hardwareItems: []
    };
  }

  const finishName = system === 'aluminum' ? 'Aluminio Anodizado Natural' : 'Negro Mate Anodizado';
  const finishCode = system === 'aluminum' ? 'ALU' : 'BLK';

  // Base, island and floor cabinets that support horizontal counter/drawer Gola (excluding wine racks where Gola rails butt into its side panels)
  const baseCabinets = cabinets.filter(
    (c) => (c.type === 'base' || c.type === 'island') && !c.variant?.startsWith('deco_') && !c.variant?.includes('wine_rack')
  );

  // Tall split cabinets that continue the horizontal base Gola line
  const tallSplitCabinets = cabinets.filter(
    (c) => c.type === 'tall' && c.variant === 'tall_split_2_doors'
  );

  let totalGolaLLengthMm = 0;
  let totalGolaCLengthMm = 0;
  let golaCModulesCount = 0;

  baseCabinets.forEach((cab) => {
    // Each base/island module receives Gola L profile under the countertop
    const isCornerBlind = cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind';
    const effectiveWidth = isCornerBlind 
      ? Math.max(15, cab.width - (cab.blindWidth && cab.blindWidth > 0 ? cab.blindWidth : (cab.width >= 100 ? 65 : Math.round(cab.width / 2))))
      : cab.width;
    const widthMm = effectiveWidth * 10;
    totalGolaLLengthMm += widthMm;

    // Check intermediate Gola C profile requirement for drawers
    if (cab.variant === '2_pot_drawers' || cab.variant === '1_door_1_drawer') {
      totalGolaCLengthMm += widthMm;
      golaCModulesCount += 1;
    } else if (cab.variant === '4_drawers') {
      // 4-drawer cabinet uses 2 intermediate Gola C profiles
      totalGolaCLengthMm += widthMm * 2;
      golaCModulesCount += 2;
    }
  });

  tallSplitCabinets.forEach((cab) => {
    // Tall split 2 doors cabinet receives Gola L profile at base counter level
    const widthMm = cab.width * 10;
    totalGolaLLengthMm += widthMm;
  });

  // Calculate 90° interior corner joints
  // 1. Check for dedicated corner blind cabinets
  let cornerJoints90Count = baseCabinets.filter(
    (c) => c.variant?.startsWith('corner_blind') || c.variant === 'corner_blind'
  ).length;

  // 2. Check for perpendicular adjacent base cabinets forming an interior 90° corner
  for (let i = 0; i < baseCabinets.length; i++) {
    for (let j = i + 1; j < baseCabinets.length; j++) {
      const c1 = baseCabinets[i];
      const c2 = baseCabinets[j];
      const rot1 = c1.rotation || 0;
      const rot2 = c2.rotation || 0;
      const rotDiff = Math.abs(rot1 - rot2) % Math.PI;
      const isPerp = Math.abs(rotDiff - Math.PI / 2) < 0.15;
      if (isPerp) {
        const dist = Math.hypot(c1.position[0] - c2.position[0], c1.position[2] - c2.position[2]);
        const maxSpan = Math.max(c1.width, c1.depth) / 2 + Math.max(c2.width, c2.depth) / 2 + 15;
        if (dist < maxSpan) {
          // Found adjacent perpendicular encounter; if not already counted via corner_blind
          if (!c1.variant?.startsWith('corner_blind') && !c2.variant?.startsWith('corner_blind')) {
            cornerJoints90Count++;
          }
        }
      }
    }
  }

  // Commercial strip calculation: 3000mm (3m) with 5% cutting waste allowance
  const stripsGolaL = totalGolaLLengthMm > 0 ? Math.max(1, Math.ceil((totalGolaLLengthMm * 1.05) / 3000)) : 0;
  const stripsGolaC = totalGolaCLengthMm > 0 ? Math.max(1, Math.ceil((totalGolaCLengthMm * 1.05) / 3000)) : 0;

  // Mounting brackets: 2 brackets per module for Gola L + 2 brackets per module for each Gola C
  const bracketsCount = ((baseCabinets.length + tallSplitCabinets.length) * 2) + (golaCModulesCount * 2);

  const hardwareItems: GolaBOMItem[] = [];

  if (stripsGolaL > 0) {
    hardwareItems.push({
      Categoria: 'Perfilería Gola',
      Item: `Perfil Gola Superior "L" Provelcar x175 (${finishName})`,
      Cantidad: stripsGolaL,
      Unidad: 'Tiras (3000mm / 3m)',
      Detalles: `Bajo cubierta muebles base y despensa dividida. Longitud neta: ${(totalGolaLLengthMm / 1000).toFixed(2)}m lineales (+5% merma corte)`
    });
  }

  if (stripsGolaC > 0) {
    hardwareItems.push({
      Categoria: 'Perfilería Gola',
      Item: `Perfil Gola Intermedio "C" Provelcar x176 (${finishName})`,
      Cantidad: stripsGolaC,
      Unidad: 'Tiras (3000mm / 3m)',
      Detalles: `Paso intermedio entre frentes de cajón. Longitud neta: ${(totalGolaCLengthMm / 1000).toFixed(2)}m lineales`
    });
  }

  if (bracketsCount > 0) {
    hardwareItems.push({
      Categoria: 'Perfilería Gola',
      Item: 'Escuadras de Fijación Trasera para Perfil Gola',
      Cantidad: bracketsCount,
      Unidad: 'Unidades',
      Detalles: 'Anclaje y regulación técnica de perfiles L y C al casco del gabinete'
    });
  }

  if (cornerJoints90Count > 0) {
    hardwareItems.push({
      Categoria: 'Perfilería Gola',
      Item: `Conector Esquinero Interior 90° para Gola (${finishName})`,
      Cantidad: cornerJoints90Count,
      Unidad: 'Unidades',
      Detalles: 'Encuentro a inglete 90° en esquinas interiores continuas'
    });
  }

  return {
    active: true,
    system,
    finishName,
    finishCode,
    totalGolaLLengthMm,
    totalGolaCLengthMm,
    stripsGolaL,
    stripsGolaC,
    bracketsCount,
    cornerJoints90Count,
    hardwareItems
  };
}
