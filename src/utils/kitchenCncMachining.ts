import { Part } from './manufacturing';
import { CabinetType } from '../store/kitchenStore';
import { KitchenHandleConfig } from '../types/handle';

export interface CncDrill {
  id: string;
  type: 'hinge_cup_35' | 'hinge_plate_5' | 'slide_hole_5' | 'shelf_pin_5' | 'minifix_15' | 'minifix_bolt_8' | 'dowel_8' | 'screw_confirmat_5' | 'handle_hole';
  face: 'face_A' | 'face_B' | 'edge_L1' | 'edge_L2' | 'edge_W1' | 'edge_W2';
  x: number; // mm from bottom-left corner of piece (0 to width)
  y: number; // mm from bottom-left corner (0 to length)
  diameter: number; // mm
  depth: number; // mm
  label: string;
}

export interface CncGroove {
  id: string;
  name: string;
  face: 'face_A' | 'face_B';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number; // e.g. 4mm
  depth: number; // e.g. 8mm
}

export interface CncPocket {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface CncMachinedPart {
  partCode: string;
  partName: string;
  moduleTag: string;
  moduleName: string;
  width: number; // mm
  length: number; // mm
  thickness: number; // mm
  material: string;
  grainDirection: 'vertical' | 'horizontal';
  edgeL1: boolean; // Left long edge
  edgeL2: boolean; // Right long edge
  edgeW1: boolean; // Top short edge
  edgeW2: boolean; // Bottom short edge
  edgeThicknessL1: number;
  edgeThicknessL2: number;
  edgeThicknessW1: number;
  edgeThicknessW2: number;
  notes: string;
  drills: CncDrill[];
  grooves: CncGroove[];
  pockets: CncPocket[];
}

/**
 * Calcula el despiece con mapeo paramétrico exhaustivo de perforaciones Sistema 32
 * para máquinas CNC (Router / Punto a Punto) y centros de mecanizado.
 */
export function calculateCncMachiningForPart(
  part: Part,
  cab: CabinetType | undefined,
  hardwareBrand: 'Hafele' | 'Provelcar' = 'Hafele',
  assemblyType: 'spax' | 'minifix' = 'minifix',
  golaSystem: 'none' | 'aluminum' | 'black' = 'none',
  handleConfig?: KitchenHandleConfig
): CncMachinedPart {
  const isDrawerFront = part.name.toLowerCase().includes('frente cajón') || part.name.toLowerCase().includes('frente');
  const isDrawerSide = part.name.toLowerCase().includes('lateral cajón');

  // En despiece industrial, los frentes de cajón tienen su longitud en part.length y altura en part.width.
  // Para CNC y orientación horizontal de mecanizado: pw = ancho frontal (X), pl = alto frontal (Y)
  const isFrenteHoriz = isDrawerFront && part.length > part.width;
  const pw = Math.round(isFrenteHoriz ? part.length : part.width);   // mm
  const pl = Math.round(isFrenteHoriz ? part.width : part.length);   // mm
  const th = Math.round(part.thickness);

  const drills: CncDrill[] = [];
  const grooves: CncGroove[] = [];
  const pockets: CncPocket[] = [];

  const isLateral = part.name.toLowerCase().includes('lateral');
  const isPiso = part.name.toLowerCase().includes('piso') || part.name.toLowerCase().includes('base');
  const isTecho = part.name.toLowerCase().includes('techo') || part.name.toLowerCase().includes('barra amarre');
  const isDoor = part.name.toLowerCase().includes('puerta');
  const isRepisa = part.name.toLowerCase().includes('repisa') || part.name.toLowerCase().includes('estante');
  const isBack = th <= 4 || part.name.toLowerCase().includes('trasera') || part.name.toLowerCase().includes('fondo');

  const isBaseOrIsland = cab ? (cab.type === 'base' || cab.type === 'island') : false;
  const isWall = cab ? cab.type === 'wall' : false;
  const isTall = cab ? cab.type === 'tall' : false;

  // 1. LATERALES DE GABINETES
  if (isLateral && !isDrawerSide) {
    // 1.1 Ranura posterior para fondo Durolac 4mm (Groove)
    // Ubicación estándar: a 18 mm del canto posterior (x = pw - 18 o x = 18 según orientación)
    // Profundidad de 8 mm, ancho 4 mm
    grooves.push({
      id: 'grv-back',
      name: 'Ranura Fondo Durolac 4mm',
      face: 'face_A',
      x1: 18,
      y1: 0,
      x2: 18,
      y2: pl,
      width: 4,
      depth: 8
    });

    // 1.2 Ensamble con Piso y Techo (Sistema Minifix o Spax)
    if (assemblyType === 'minifix') {
      // Perforaciones en cara para pernos de Minifix (Ø8mm x 11mm) y tarugos guía (Ø8mm x 11mm)
      // En la base inferior (y = th / 2) y techo (y = pl - th / 2)
      [Math.round(th / 2), Math.round(pl - th / 2)].forEach((yRef, idx) => {
        // Minifix a 34 mm del borde posterior y frontal
        const xOffsets = [34, pw - 34];
        xOffsets.forEach((xPos, xIdx) => {
          drills.push({
            id: `dr-minifix-lat-${idx}-${xIdx}`,
            type: 'minifix_bolt_8',
            face: 'face_A',
            x: xPos,
            y: yRef,
            diameter: 8,
            depth: 11,
            label: hardwareBrand === 'Hafele' ? 'Perno Häfele Minifix Ø8' : 'Perno Minifix Ø8'
          });
          // Tarugo guía adyacente a paso 32mm
          const dowelX = xIdx === 0 ? xPos + 32 : xPos - 32;
          if (dowelX > 0 && dowelX < pw) {
            drills.push({
              id: `dr-dowel-lat-${idx}-${xIdx}`,
              type: 'dowel_8',
              face: 'face_A',
              x: dowelX,
              y: yRef,
              diameter: 8,
              depth: 11,
              label: 'Tarugo Guía Ø8x30'
            });
          }
        });
      });
    } else {
      // Spax pasante Ø5 mm
      [Math.round(th / 2), Math.round(pl - th / 2)].forEach((yRef, idx) => {
        [50, pw - 50].forEach((xPos, xIdx) => {
          drills.push({
            id: `dr-spax-lat-${idx}-${xIdx}`,
            type: 'screw_confirmat_5',
            face: 'face_A',
            x: xPos,
            y: yRef,
            diameter: 5,
            depth: th,
            label: 'Perforación Pasante Spax Ø5'
          });
        });
      });
    }

    // 1.3 Contraplacas de Bisagras (para muebles con puertas)
    const hasDoors = cab ? (!cab.variant?.includes('drawers') && !cab.variant?.includes('pot') && !cab.variant?.includes('open') && !cab.variant?.includes('wine')) : true;
    if (hasDoors) {
      // Contraplaca Häfele / Estándar: a 37 mm del canto frontal
      const hingeX = pw - 37;
      const hingeYs: number[] = [100, pl - 100];
      if (pl >= 950) hingeYs.push(Math.round(pl / 2));
      if (pl >= 1600) hingeYs.push(Math.round(pl * 0.25), Math.round(pl * 0.75));

      hingeYs.forEach((yHinge, hIdx) => {
        // Cada contraplaca lleva 2 agujeros distanciados 32 mm en vertical (Sistema 32)
        drills.push({
          id: `dr-hinge-plate-${hIdx}-1`,
          type: 'hinge_plate_5',
          face: 'face_A',
          x: hingeX,
          y: yHinge - 16,
          diameter: 5,
          depth: 11,
          label: hardwareBrand === 'Hafele' ? 'Base Bisagra Häfele Metalla Ø5' : 'Base Bisagra Ø5'
        });
        drills.push({
          id: `dr-hinge-plate-${hIdx}-2`,
          type: 'hinge_plate_5',
          face: 'face_A',
          x: hingeX,
          y: yHinge + 16,
          diameter: 5,
          depth: 11,
          label: hardwareBrand === 'Hafele' ? 'Base Bisagra Häfele Metalla Ø5' : 'Base Bisagra Ø5'
        });
      });
    }

    // 1.4 Perforaciones para Correderas Ocultas (Häfele Matrix Runner / Provelcar)
    const isDrawerCab = cab && (cab.variant === '4_drawers' || cab.variant === '2_pot_drawers' || cab.variant === '1_door_1_drawer' || cab.variant === 'tall_inner_drawers');
    if (isDrawerCab) {
      const drawerCount = cab.variant === '4_drawers' ? 4 : cab.variant === '2_pot_drawers' ? 2 : cab.variant === 'tall_inner_drawers' ? 4 : 1;
      const drawerPitch = Math.round((pl - 40) / drawerCount);
      const slideX1 = pw - 37; // Primera fijación a 37 mm del frente
      const slideX2 = pw - 229; // Segunda fijación a 37 + 192 mm (múltiplo 32)
      const slideX3 = pw - 325; // Tercera fijación a 37 + 288 mm

      for (let d = 0; d < drawerCount; d++) {
        const slideY = Math.round(25 + d * drawerPitch);
        [slideX1, slideX2, slideX3].forEach((sx, sIdx) => {
          if (sx > 40) {
            drills.push({
              id: `dr-slide-${d}-${sIdx}`,
              type: 'slide_hole_5',
              face: 'face_A',
              x: sx,
              y: slideY,
              diameter: 5,
              depth: 12,
              label: hardwareBrand === 'Hafele' ? 'Guía Häfele Matrix Runner Ø5' : 'Guía Corredera Oculta Ø5'
            });
          }
        });
      }
    }

    // 1.5 Destajes Paramétricos Perfil Gola
    if ((golaSystem === 'aluminum' || golaSystem === 'black') && isBaseOrIsland) {
      // Destaje Gola L Superior: 58mm x 26mm en la esquina superior frontal
      pockets.push({
        id: 'pkt-gola-l',
        name: 'Destaje CNC Riel Gola L (58x26mm)',
        x: pw - 26,
        y: pl - 58,
        width: 26,
        height: 58,
        depth: th
      });

      // Destaje Gola C Intermedio para cajones (68mm x 26mm)
      const hasGolaC = cab && (cab.variant === '1_door_1_drawer' || cab.variant === '2_pot_drawers' || cab.variant === '4_drawers');
      if (hasGolaC) {
        const golaCY = Math.round(pl * 0.65);
        pockets.push({
          id: 'pkt-gola-c',
          name: 'Destaje CNC Riel Gola C (68x26mm)',
          x: pw - 26,
          y: golaCY - 34,
          width: 26,
          height: 68,
          depth: th
        });
      }
    }
  }

  // 2. PUERTAS BATIENTES
  if (isDoor) {
    // Cazoletas de bisagra Ø35 mm x 12.5 mm a 21.5 mm del borde
    // Häfele Metalla 310 / 500 estándar
    const hingeX = 21.5;
    const hingeYs: number[] = [100, pl - 100];
    if (pl >= 950) hingeYs.push(Math.round(pl / 2));
    if (pl >= 1600) hingeYs.push(Math.round(pl * 0.25), Math.round(pl * 0.75));

    hingeYs.forEach((yHinge, hIdx) => {
      drills.push({
        id: `dr-hinge-cup-${hIdx}`,
        type: 'hinge_cup_35',
        face: 'face_A',
        x: hingeX,
        y: yHinge,
        diameter: 35,
        depth: 12.5,
        label: hardwareBrand === 'Hafele' ? 'Cazoleta Häfele Metalla Ø35mm' : 'Cazoleta Bisagra Ø35mm'
      });
      // Perforaciones para tornillos de fijación de cazoleta (paso 45mm o 48mm entre centros, a 9.5mm de distancia)
      drills.push({
        id: `dr-hinge-screw-${hIdx}-1`,
        type: 'slide_hole_5',
        face: 'face_A',
        x: hingeX + 9.5,
        y: yHinge - 22.5,
        diameter: 2.5,
        depth: 10,
        label: 'Tornillo Cazoleta Ø2.5'
      });
      drills.push({
        id: `dr-hinge-screw-${hIdx}-2`,
        type: 'slide_hole_5',
        face: 'face_A',
        x: hingeX + 9.5,
        y: yHinge + 22.5,
        diameter: 2.5,
        depth: 10,
        label: 'Tornillo Cazoleta Ø2.5'
      });
    });

    // Perforaciones para Tirador (lado opuesto a bisagras si no hay gola y requiere taladros pasantes)
    if (golaSystem === 'none' && handleConfig && handleConfig.model !== 'none') {
      const isSingleHole = handleConfig.model === 'balin' || handleConfig.model === 'berlin';
      const isRearPestana = handleConfig.model === 'ce' || handleConfig.model === 'oslo';
      const handleX = pw - 45;
      const handleCenterY = 70;

      if (!isRearPestana) {
        if (isSingleHole) {
          drills.push({
            id: 'dr-handle-0',
            type: 'handle_hole',
            face: 'face_A',
            x: handleX,
            y: handleCenterY,
            diameter: 4.5,
            depth: th,
            label: `Tirador Ø4.5mm Pasante (${handleConfig.model.toUpperCase()})`
          });
        } else {
          const hLen = handleConfig.lengthMm || 128;
          [handleCenterY, handleCenterY + hLen].forEach((yPos, hIdx) => {
            drills.push({
              id: `dr-handle-${hIdx}`,
              type: 'handle_hole',
              face: 'face_A',
              x: handleX,
              y: yPos,
              diameter: 4.5,
              depth: th,
              label: `Tirador 2x Ø4.5mm Pasante (${handleConfig.model.toUpperCase()} ${hLen}mm)`
            });
          });
        }
      }
    }
  }

  // 3. PISOS, TECHOS Y BASES HORIZONTALES
  if (isPiso || isTecho || isRepisa) {
    // Ranura posterior coincidente para el fondo
    if (!isRepisa) {
      grooves.push({
        id: 'grv-back-horiz',
        name: 'Ranura Fondo Durolac 4mm',
        face: 'face_A',
        x1: 18,
        y1: 0,
        x2: 18,
        y2: pl,
        width: 4,
        depth: 8
      });
    }

    if (assemblyType === 'minifix' && !isRepisa) {
      // Cajas de excéntrica Minifix Ø15 mm x 12.5 mm a 34 mm de las cabezas (en los extremos de largo pl)
      [34, pl - 34].forEach((yPos, yIdx) => {
        [Math.round(pw * 0.2), Math.round(pw * 0.8)].forEach((xPos, xIdx) => {
          drills.push({
            id: `dr-minifix-box-${yIdx}-${xIdx}`,
            type: 'minifix_15',
            face: 'face_A',
            x: xPos,
            y: yPos,
            diameter: 15,
            depth: 12.5,
            label: hardwareBrand === 'Hafele' ? 'Caja Excéntrica Häfele Minifix 15' : 'Caja Excéntrica Minifix Ø15'
          });
        });
      });
    }
  }

  // 4. FRENTES DE CAJÓN
  if (isDrawerFront) {
    // Enganche frontal para corredera oculta Häfele Matrix / Provelcar
    // 2 agujeros Ø2.5 / Ø4 para clip de enganche a 25 mm de los bordes laterales y a 15 mm de la base
    [25, pw - 25].forEach((xPos, xIdx) => {
      drills.push({
        id: `dr-drawer-clip-${xIdx}`,
        type: 'slide_hole_5',
        face: 'face_A',
        x: xPos,
        y: 15,
        diameter: 3.5,
        depth: 10,
        label: hardwareBrand === 'Hafele' ? 'Clip de Enganche Häfele Matrix' : 'Clip de Regulación Cajón'
      });
    });

    // Perforaciones para Tirador en Frente de Cajón
    if (golaSystem === 'none' && handleConfig && handleConfig.model !== 'none') {
      const isSingleHole = handleConfig.model === 'balin' || handleConfig.model === 'berlin';
      const isRearPestana = handleConfig.model === 'ce' || handleConfig.model === 'oslo';
      const cy = pl / 2;

      if (!isRearPestana) {
        if (isSingleHole) {
          drills.push({
            id: 'dr-drawer-handle-0',
            type: 'handle_hole',
            face: 'face_A',
            x: pw / 2,
            y: cy,
            diameter: 4.5,
            depth: th,
            label: `Tirador Cajón Ø4.5mm Pasante (${handleConfig.model.toUpperCase()})`
          });
        } else {
          const hLen = handleConfig.lengthMm || 128;
          if (pw >= hLen + 40) {
            [pw / 2 - hLen / 2, pw / 2 + hLen / 2].forEach((xPos, hIdx) => {
              drills.push({
                id: `dr-drawer-handle-${hIdx}`,
                type: 'handle_hole',
                face: 'face_A',
                x: xPos,
                y: cy,
                diameter: 4.5,
                depth: th,
                label: `Tirador Cajón 2x Ø4.5mm Pasante (${handleConfig.model.toUpperCase()} ${hLen}mm)`
              });
            });
          }
        }
      }
    }
  }

  // Identificador de pieza estandarizado
  const moduleTag = cab ? (cab.type === 'wall' ? 'A' : cab.type === 'tall' ? 'T' : cab.type === 'island' ? 'I' : 'B') : 'M';
  const partCode = `${moduleTag}-${(part.moduleIndex || 0) + 1}.${part.name.substring(0, 3).toUpperCase()}`;

  return {
    partCode,
    partName: part.name,
    moduleTag: `${moduleTag}-${(part.moduleIndex || 0) + 1}`,
    moduleName: cab ? `${cab.type.toUpperCase()} ${cab.width * 10}x${cab.height * 10}mm` : 'Módulo Cocina',
    width: pw,
    length: pl,
    thickness: th,
    material: part.material || 'Melamina 15mm',
    grainDirection: part.grainDirection || 'vertical',
    edgeL1: !!part.edgeL1,
    edgeL2: !!part.edgeL2,
    edgeW1: !!part.edgeW1,
    edgeW2: !!part.edgeW2,
    edgeThicknessL1: part.edgeL1 ? (isDoor || isDrawerFront ? 2.0 : 0.45) : 0,
    edgeThicknessL2: part.edgeL2 ? (isDoor || isDrawerFront ? 2.0 : 0.45) : 0,
    edgeThicknessW1: part.edgeW1 ? (isDoor || isDrawerFront ? 2.0 : 0.45) : 0,
    edgeThicknessW2: part.edgeW2 ? (isDoor || isDrawerFront ? 2.0 : 0.45) : 0,
    notes: part.notes || '',
    drills,
    grooves,
    pockets
  };
}
