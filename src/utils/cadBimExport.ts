import JSZip from 'jszip';
import { CabinetType, useKitchenStore } from '../store/kitchenStore';
import { generateCountertopPieces } from './countertopNesting';
import { getResolvedCabinetShelfElevations, isCabinetWithDoors } from './kitchenManufacturing';
import { calculateSocleSystem } from './kitchenSocle';

export type KitchenStoreType = ReturnType<typeof useKitchenStore.getState>;

export interface BimExportOptions {
  projectName?: string;
  clientName?: string;
  includeWalls?: boolean;
  includeCountertop?: boolean;
  includeSocle?: boolean;
  includeHandles?: boolean;
  unit?: 'mm' | 'm'; // Millimeters (standard CAD/OBJ) or Meters (standard BIM/IFC)
}

export type BimCategory =
  | 'carcass'      // Laterales, piso, techo, trasera
  | 'door'         // Puertas batientes y frentes ciegos
  | 'drawer'       // Frentes de cajón
  | 'drawer_box'   // Interiores de cajón (costados, contrafrente, trasera, fondo)
  | 'shelf'        // Repisas interiores
  | 'appliance'    // Horno empotrado, microondas
  | 'handle'       // Tiradores metálicos
  | 'hardware'     // Bisagras de cazoleta, correderas telescópicas, tornillos de ensamble spax
  | 'countertop'   // Cubiertas de cuarzo / faldones / cascadas
  | 'socle'        // Zócalo de piso
  | 'wall_arch'    // Muros perimetrales
  | 'gola';        // Rieles Gola Provelcar (Superior J / Intermedio C)

interface BoxMesh3D {
  name: string;
  category: BimCategory;
  materialName: string;
  colorHex: string;
  // Center position in world space (cm)
  x: number;
  y: number;
  z: number;
  // Dimensions in cm (width along local X, height along Y, depth along local Z)
  w: number;
  h: number;
  d: number;
  // Rotation in radians around Y axis
  rotation: number;
  // Extra metadata
  moduleId?: string;
  identTag?: string;
}

/**
 * Genera la lista de prismas/cajas 3D detalladas (LOD 350)
 * Incluye casco real (laterales, piso, techo, trasera), frentes despiezados (puertas, cajones, nichos),
 * repisas interiores, tiradores, electrodomésticos, cubiertas continuas y zócalos.
 * Con cota de piso normalizada (Z=0 para muebles base y torres).
 */
export function extractKitchen3dElements(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  globalThickness: number = 1.8,
  options: BimExportOptions = {}
): BoxMesh3D[] {
  const elements: BoxMesh3D[] = [];
  const realCabinets = cabinets.filter(c => c.type !== 'decoration' && !c.variant?.startsWith('deco_'));
  const th = globalThickness || 1.8; // Espesor de tableros (cm)
  const socleH = kState?.showSocle ? (kState?.socleHeight ?? 10) : 10;

  realCabinets.forEach((cab, index) => {
    const isWall = cab.type === 'wall';
    const isCloset = cab.type === 'closet' || cab.variant?.startsWith('closet_');
    const tagPrefix = cab.type === 'wall' ? 'A' : cab.type === 'tall' ? 'T' : cab.type === 'island' ? 'I' : isCloset ? 'CL' : 'B';
    const identTag = `${tagPrefix}-${index + 1}`;
    const cabPos = cab.position || [0, 0, 0];
    const cabRot = Number(cab.rotation) || 0;

    const width = Number(cab.width) || 60;
    const height = Number(cab.height) || 85;
    const depth = Number(cab.depth) || 58;

    const isBaseOrTall = cab.type === 'base' || cab.type === 'tall' || cab.type === 'island' || isCloset;
    const legsH = isBaseOrTall ? socleH : 0;
    const cabH = height - legsH;
    const gap = 0.3; // Cantería estándar de 3mm

    // Cota base de suelo normalizada:
    // Muebles de piso (base, torre, isla) nacen en Y = 0 (el suelo).
    // Muebles aéreos (wall) nacen en su cota de elevación de muro.
    const baseY = isWall ? Math.max(120, cabPos[1] - height / 2) : 0;

    const colorStructure = cab.structureColor || '#e2d9c8';
    const colorDoors = cab.doorColor || '#f8fafc';
    const colorDrawers = cab.drawerFrontColor || colorDoors;
    const colorShelves = cab.shelfColor || colorStructure;

    const cosR = Math.cos(cabRot);
    const sinR = Math.sin(cabRot);

    // Función auxiliar para transformar un punto local del mueble a coordenadas globales
    const addLocalBox = (
      name: string,
      category: BimCategory,
      materialName: string,
      colorHex: string,
      lx: number,
      ly: number,
      lz: number,
      boxW: number,
      boxH: number,
      boxD: number
    ) => {
      // Rotar [lx, lz] alrededor de Y
      const wx = cabPos[0] + (lx * cosR + lz * sinR);
      const wz = cabPos[2] + (-lx * sinR + lz * cosR);
      const wy = baseY + ly;

      elements.push({
        name: `${identTag}_${name}`,
        category,
        materialName,
        colorHex,
        x: wx,
        y: wy,
        z: wz,
        w: boxW,
        h: boxH,
        d: boxD,
        rotation: cabRot,
        moduleId: cab.id,
        identTag
      });
    };

    // ----------------------------------------------------
    // 1. SISTEMA DE PERFILES GOLA PROVELCAR (Si aplica a base o isla)
    // ----------------------------------------------------
    const isGolaActive = (kState?.golaSystem === 'aluminum' || kState?.golaSystem === 'black') && (cab.type === 'base' || cab.type === 'island');
    const golaColor = kState?.golaSystem === 'black' ? '#18181b' : '#e2e8f0';

    if (isGolaActive) {
      // Perfil Gola Superior Tipo J Provelcar x175 continuo bajo cubierta
      addLocalBox(
        'Riel_Gola_Superior_J',
        'gola',
        'Aluminio_Gola',
        golaColor,
        0,
        legsH + cabH - 5.7 / 2,
        depth / 2 - 2.6 / 2,
        width,
        5.7,
        2.6
      );

      // Perfil Gola Intermedio Tipo C Provelcar x176 (entre cajones)
      if (cab.variant === '2_drawers' || cab.variant === '2_pot_drawers') {
        const drH = (cabH - gap * 3) / 2;
        addLocalBox(
          'Riel_Gola_Intermedio_C',
          'gola',
          'Aluminio_Gola',
          golaColor,
          0,
          legsH + drH + gap,
          depth / 2 - 2.6 / 2,
          width,
          6.8,
          2.6
        );
      } else if (cab.variant === '2_drawers_1_pot' || cab.variant === '3_drawers') {
        const potH = Math.round(cabH * 0.44);
        addLocalBox(
          'Riel_Gola_Intermedio_C',
          'gola',
          'Aluminio_Gola',
          golaColor,
          0,
          legsH + potH + gap,
          depth / 2 - 2.6 / 2,
          width,
          6.8,
          2.6
        );
      }
    }

    // ----------------------------------------------------
    // 2. CASCO / ESTRUCTURA DE TABLEROS (Laterales, Piso, Techo, Trasera)
    // ----------------------------------------------------
    // Lateral Izquierdo
    addLocalBox(
      'Lateral_Izquierdo',
      'carcass',
      'Melamina_Estructura',
      colorStructure,
      -width / 2 + th / 2,
      legsH + cabH / 2,
      0,
      th,
      cabH,
      depth
    );

    // Lateral Derecho
    addLocalBox(
      'Lateral_Derecho',
      'carcass',
      'Melamina_Estructura',
      colorStructure,
      width / 2 - th / 2,
      legsH + cabH / 2,
      0,
      th,
      cabH,
      depth
    );

    // Piso (Base interior)
    addLocalBox(
      'Piso_Gabinete',
      'carcass',
      'Melamina_Estructura',
      colorStructure,
      0,
      legsH + th / 2,
      0,
      width - 2 * th,
      th,
      depth
    );

    // Techo / Amarres
    if (isWall || cab.type === 'tall' || isCloset) {
      // Techo completo para aéreos, torres y clósets
      addLocalBox(
        'Techo_Gabinete',
        'carcass',
        'Melamina_Estructura',
        colorStructure,
        0,
        legsH + cabH - th / 2,
        0,
        width - 2 * th,
        th,
        depth
      );
    } else {
      // Amarre frontal y trasero para muebles base
      addLocalBox(
        'Amarre_Trasero',
        'carcass',
        'Melamina_Estructura',
        colorStructure,
        0,
        legsH + cabH - th / 2,
        -depth / 2 + 5,
        width - 2 * th,
        th,
        10
      );
      addLocalBox(
        'Amarre_Frontal',
        'carcass',
        'Melamina_Estructura',
        colorStructure,
        0,
        legsH + cabH - th / 2,
        depth / 2 - 5,
        width - 2 * th,
        th,
        10
      );
    }

    // Fondo / Trasera de Durolac
    addLocalBox(
      'Fondo_Trasera_Durolac',
      'carcass',
      'Durolac_Blanco_3mm',
      '#ffffff',
      0,
      legsH + cabH / 2,
      -depth / 2 + 0.3 / 2 + 1.2,
      width - 2 * th,
      cabH - th,
      0.3
    );

    // ----------------------------------------------------
    // 3. QUINCALLERÍA BASE: TORNILLOS SPAX / CONFIRMAT DE ENSAMBLE DE CASCO
    // ----------------------------------------------------
    const addCabinetAssemblyScrews = () => {
      const colorScrew = '#64748b';
      // Pernos / tornillos Spax fijando piso a laterales
      [-depth / 2 + 6, depth / 2 - 6].forEach((sz, sIdx) => {
        addLocalBox(`Tornillo_Piso_Izq_${sIdx + 1}`, 'hardware', 'Herraje_Tornillo_Spax', colorScrew, -width / 2 + 0.1, legsH + th / 2, sz, 0.4, 0.4, 3.5);
        addLocalBox(`Tornillo_Piso_Der_${sIdx + 1}`, 'hardware', 'Herraje_Tornillo_Spax', colorScrew, width / 2 - 0.1, legsH + th / 2, sz, 0.4, 0.4, 3.5);
      });
      // Tornillos fijando amarres o techo
      if (!isWall && cab.type !== 'tall' && !isCloset) {
        addLocalBox('Tornillo_Amarre_Tras_Izq', 'hardware', 'Herraje_Tornillo_Spax', colorScrew, -width / 2 + 0.1, legsH + cabH - th / 2, -depth / 2 + 5, 0.4, 0.4, 3.5);
        addLocalBox('Tornillo_Amarre_Tras_Der', 'hardware', 'Herraje_Tornillo_Spax', colorScrew, width / 2 - 0.1, legsH + cabH - th / 2, -depth / 2 + 5, 0.4, 0.4, 3.5);
        addLocalBox('Tornillo_Amarre_Front_Izq', 'hardware', 'Herraje_Tornillo_Spax', colorScrew, -width / 2 + 0.1, legsH + cabH - th / 2, depth / 2 - 5, 0.4, 0.4, 3.5);
        addLocalBox('Tornillo_Amarre_Front_Der', 'hardware', 'Herraje_Tornillo_Spax', colorScrew, width / 2 - 0.1, legsH + cabH - th / 2, depth / 2 - 5, 0.4, 0.4, 3.5);
      }
    };
    addCabinetAssemblyScrews();

    // ----------------------------------------------------
    // 4. FUNCIONES AUXILIARES: QUINCALLERÍA Y DETALLE INTERIOR
    // ----------------------------------------------------
    const frontZ = depth / 2 + th / 2;

    // A. Tirador paramétrico 3D según el modelo real seleccionado en el configurador
    const addDetailedHandle3D = (
      hName: string,
      hx: number,
      hy: number,
      hz: number,
      isVertical: boolean = true
    ) => {
      if (options.includeHandles === false) return;
      if (isGolaActive) return; // Si usa sistema Gola no lleva tiradores

      const hCfg = cab.handleConfig || kState?.handleConfig || { model: 'madrid', finish: 'negro', lengthMm: 128 };
      const model = hCfg.model || 'madrid';
      if (model === 'none') return;

      const finish = hCfg.finish || 'negro';
      let matColor = '#1c1917';
      if (finish === 'satinado') matColor = '#cbd5e1';
      else if (finish === 'dorado') matColor = '#eab308';
      else if (finish === 'envejecido') matColor = '#78350f';
      else if (finish === 'gris_perla') matColor = '#94a3b8';

      const lenMm = hCfg.lengthMm ?? 128;
      const lenCm = lenMm / 10;
      const matName = `Metal_Tirador_${finish}`;

      if (model === 'forza') {
        if (isVertical) {
          addLocalBox(`Tirador_${hName}_Barra`, 'handle', matName, matColor, hx, hy, hz + 2.4, 1.2, lenCm + 1.6, 0.8);
          addLocalBox(`Tirador_${hName}_PataInf`, 'handle', matName, matColor, hx, hy - lenCm / 2, hz + 1.2, 1.2, 1.6, 1.6);
          addLocalBox(`Tirador_${hName}_PataSup`, 'handle', matName, matColor, hx, hy + lenCm / 2, hz + 1.2, 1.2, 1.6, 1.6);
        } else {
          addLocalBox(`Tirador_${hName}_Barra`, 'handle', matName, matColor, hx, hy, hz + 2.4, lenCm + 1.6, 1.2, 0.8);
          addLocalBox(`Tirador_${hName}_PataIzq`, 'handle', matName, matColor, hx - lenCm / 2, hy, hz + 1.2, 1.6, 1.2, 1.6);
          addLocalBox(`Tirador_${hName}_PataDer`, 'handle', matName, matColor, hx + lenCm / 2, hy, hz + 1.2, 1.6, 1.2, 1.6);
        }
      } else if (model === 'madrid') {
        if (isVertical) {
          addLocalBox(`Tirador_${hName}_Tubo`, 'handle', matName, matColor, hx, hy, hz + 2.6, 1.2, lenCm + 4.0, 1.2);
          addLocalBox(`Tirador_${hName}_PosteInf`, 'handle', matName, matColor, hx, hy - lenCm / 2, hz + 1.3, 1.0, 1.0, 2.6);
          addLocalBox(`Tirador_${hName}_PosteSup`, 'handle', matName, matColor, hx, hy + lenCm / 2, hz + 1.3, 1.0, 1.0, 2.6);
        } else {
          addLocalBox(`Tirador_${hName}_Tubo`, 'handle', matName, matColor, hx, hy, hz + 2.6, lenCm + 4.0, 1.2, 1.2);
          addLocalBox(`Tirador_${hName}_PosteIzq`, 'handle', matName, matColor, hx - lenCm / 2, hy, hz + 1.3, 1.0, 1.0, 2.6);
          addLocalBox(`Tirador_${hName}_PosteDer`, 'handle', matName, matColor, hx + lenCm / 2, hy, hz + 1.3, 1.0, 1.0, 2.6);
        }
      } else if (model === 'denver') {
        if (isVertical) {
          addLocalBox(`Tirador_${hName}_Barra`, 'handle', matName, matColor, hx, hy, hz + 2.4, 0.9, lenCm + 1.2, 0.7);
          addLocalBox(`Tirador_${hName}_PataInf`, 'handle', matName, matColor, hx, hy - lenCm / 2, hz + 1.2, 0.9, 0.9, 1.7);
          addLocalBox(`Tirador_${hName}_PataSup`, 'handle', matName, matColor, hx, hy + lenCm / 2, hz + 1.2, 0.9, 0.9, 1.7);
        } else {
          addLocalBox(`Tirador_${hName}_Barra`, 'handle', matName, matColor, hx, hy, hz + 2.4, lenCm + 1.2, 0.9, 0.7);
          addLocalBox(`Tirador_${hName}_PataIzq`, 'handle', matName, matColor, hx - lenCm / 2, hy, hz + 1.2, 0.9, 0.9, 1.7);
          addLocalBox(`Tirador_${hName}_PataDer`, 'handle', matName, matColor, hx + lenCm / 2, hy, hz + 1.2, 0.9, 0.9, 1.7);
        }
      } else if (model === 'ce' || model === 'oslo') {
        if (isVertical) {
          addLocalBox(`Tirador_${hName}_Canto`, 'handle', matName, matColor, hx, hy, hz, 0.2, lenCm, th + 0.2);
          addLocalBox(`Tirador_${hName}_Lip`, 'handle', matName, matColor, hx + 0.4, hy, hz + 0.7, 0.8, lenCm, 0.3);
        } else {
          addLocalBox(`Tirador_${hName}_Canto`, 'handle', matName, matColor, hx, hy, hz, lenCm, 0.2, th + 0.2);
          addLocalBox(`Tirador_${hName}_Lip`, 'handle', matName, matColor, hx, hy + 0.3, hz + 0.7, lenCm, 0.6, 0.3);
        }
      } else if (model === 'balin' || model === 'berlin') {
        addLocalBox(`Tirador_${hName}_Cuello`, 'handle', matName, matColor, hx, hy, hz + 0.6, 1.0, 1.0, 1.2);
        addLocalBox(`Tirador_${hName}_Cabeza`, 'handle', matName, matColor, hx, hy, hz + 1.8, 2.2, 2.2, 1.2);
      } else {
        addLocalBox(
          `Tirador_${hName}`,
          'handle',
          matName,
          matColor,
          hx,
          hy,
          hz + 1.2,
          isVertical ? 1.6 : lenCm,
          isVertical ? lenCm : 1.6,
          2.4
        );
      }
    };

    // B. Bisagras de cazoleta Euro Ø35mm con base, brazo y cazoleta
    const addDoorHinges = (
      prefix: string,
      doorY: number,
      doorH: number,
      isRightHinge: boolean = false
    ) => {
      const hingeYs = doorH > 180
        ? [-doorH / 2 + 10, -doorH / 6, doorH / 6, doorH / 2 - 10]
        : (doorH > 140
          ? [-doorH / 2 + 12, 0, doorH / 2 - 12]
          : [-doorH / 2 + 10, doorH / 2 - 10]);

      const hingeDir = isRightHinge ? 1 : -1;
      const sideX = isRightHinge ? (width / 2 - th - 0.8) : (-width / 2 + th + 0.8);
      const colorHinge = '#94a3b8';

      hingeYs.forEach((hy, hIdx) => {
        const yHinge = doorY + hy;
        addLocalBox(`${prefix}_Bisagra_Base_${hIdx + 1}`, 'hardware', 'Herraje_Bisagra_Cazoleta', colorHinge, sideX, yHinge, frontZ - 1.2, 1.5, 2.5, 0.6);
        addLocalBox(`${prefix}_Bisagra_Brazo_${hIdx + 1}`, 'hardware', 'Herraje_Bisagra_Cazoleta', colorHinge, sideX + hingeDir * 0.8, yHinge, frontZ - 0.4, 1.8, 1.2, 0.4);
        addLocalBox(`${prefix}_Bisagra_Cazoleta35mm_${hIdx + 1}`, 'hardware', 'Herraje_Bisagra_Cazoleta', colorHinge, sideX + hingeDir * 1.5, yHinge, frontZ - th / 2 + 0.15, 3.5, 3.5, 0.3);
      });
    };

    // C. Interior de cajón despiezado: costados, contrafrente, trasera, fondo de durolac y correderas telescópicas
    const addDrawerInteriorBox = (
      prefix: string,
      yCenter: number,
      drawerH: number
    ) => {
      const innerW = width - 2 * th;
      const innerDepthMm = (depth - 1.5) * 10;
      let nominalLengthMm = 500;
      if (innerDepthMm >= 550) nominalLengthMm = 500;
      else if (innerDepthMm >= 500) nominalLengthMm = 450;
      else if (innerDepthMm >= 450) nominalLengthMm = 400;
      else if (innerDepthMm >= 400) nominalLengthMm = 350;
      else nominalLengthMm = 300;
      const nominalLength = nominalLengthMm / 10;
      const drawerBoxLength = nominalLength;
      const drawerBoxZCenter = depth / 2 - drawerBoxLength / 2;
      const slideZCenter = depth / 2 - nominalLength / 2;

      const skw = innerW - 2.6; // 13mm de holgura por lado
      const sideHeight = Math.max(8, drawerH - 3.5);
      const botPanelThickness = 0.3; // Fondo Durolac 3mm
      const botPanelY = yCenter - sideHeight / 2 + 1.2 + botPanelThickness / 2;

      const colorDrawerBox = '#e2d9c8';
      const colorBottom = '#ffffff';
      const colorSlide = '#94a3b8';

      // Costado Izquierdo
      addLocalBox(`${prefix}_Costado_Izq`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, -skw / 2 + th / 2, yCenter, drawerBoxZCenter, th, sideHeight, drawerBoxLength);
      // Costado Derecho
      addLocalBox(`${prefix}_Costado_Der`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, skw / 2 - th / 2, yCenter, drawerBoxZCenter, th, sideHeight, drawerBoxLength);
      // Trasera
      addLocalBox(`${prefix}_Trasera`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, 0, yCenter + 0.6, drawerBoxZCenter - drawerBoxLength / 2 + th / 2, skw - th * 2, sideHeight - 1.2, th);
      // Contrafrente Interior
      addLocalBox(`${prefix}_Contrafrente`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, 0, yCenter + 0.6, drawerBoxZCenter + drawerBoxLength / 2 - th / 2, skw - th * 2, sideHeight - 1.2, th);
      // Fondo
      addLocalBox(`${prefix}_Fondo_Durolac`, 'drawer_box', 'Durolac_Fondo_Cajon', colorBottom, 0, botPanelY, drawerBoxZCenter, skw - th * 2, botPanelThickness, drawerBoxLength - th * 2);

      // Correderas telescópicas fijadas al lateral del gabinete
      addLocalBox(`${prefix}_Corredera_Gabinete_Izq`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, -innerW / 2 + 0.35, yCenter, slideZCenter, 0.4, 4.5, nominalLength);
      addLocalBox(`${prefix}_Corredera_Gabinete_Der`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, innerW / 2 - 0.35, yCenter, slideZCenter, 0.4, 4.5, nominalLength);
      // Correderas móviles unidas al lateral del cajón
      addLocalBox(`${prefix}_Corredera_Movil_Izq`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, -skw / 2 - 0.35, yCenter, drawerBoxZCenter, 0.35, 3.5, drawerBoxLength);
      addLocalBox(`${prefix}_Corredera_Movil_Der`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, skw / 2 + 0.35, yCenter, drawerBoxZCenter, 0.35, 3.5, drawerBoxLength);
    };

    // ----------------------------------------------------
    // 5. FRENTES REALES: RETÍCULA HOMOLOGADA CON CABINET.TSX
    // ----------------------------------------------------
    const v = cab.variant || (width > 60 ? '2_doors' : '1_door');
    const isBaseOrIsland = cab.type === 'base' || cab.type === 'island';
    const rawRegruesoCm = isBaseOrIsland
      ? (cab.type === 'island'
          ? (kState?.countertopConfig?.islandRegruesoCm ?? kState?.countertopConfig?.regruesoCm ?? 0)
          : (kState?.countertopConfig?.baseRegruesoCm ?? kState?.countertopConfig?.regruesoCm ?? 0))
      : 0;
    const regruesoDeduct = Math.max(0, rawRegruesoCm - 2.0);
    const golaRegruesoDeduct = Math.max(0, rawRegruesoCm - 3.5);

    const activeHandleConfig = cab.handleConfig || kState?.handleConfig;
    const isPestana = activeHandleConfig?.model === 'ce' || activeHandleConfig?.model === 'oslo';

    if (v === '1_door' || v === 'wall_1_door' || (isWall && !cab.variant && width <= 60)) {
      const topDeduct = isGolaActive ? 3.5 : (isBaseOrIsland ? regruesoDeduct : 0);
      const doorW = width - gap * 2;
      const doorH = Math.max(10, cabH - topDeduct - gap * 2);
      const doorY = isGolaActive ? (legsH + (cabH - topDeduct) / 2) : (legsH + gap + doorH / 2);
      addLocalBox('Puerta_Principal', 'door', 'Melamina_Frente', colorDoors, 0, doorY, frontZ, doorW, doorH, th);
      addDoorHinges('Pta1', doorY, doorH, false);

      const handleX = isPestana ? (doorW / 2 - 1.2) : (width / 2 - 4.5);
      const handleY = isPestana ? (isWall ? doorY - doorH / 2 : doorY + doorH / 2) : (isWall ? legsH + 8 : legsH + doorH - 8);
      addDetailedHandle3D('Pta1', handleX, handleY, frontZ + th / 2, !isPestana);

    } else if (v === '2_doors' || v === 'wall_2_doors' || v === 'tall_2_doors' || (!cab.variant && width > 60)) {
      const topDeduct = isGolaActive ? 3.5 : (isBaseOrIsland ? regruesoDeduct : 0);
      const doorW = (width - gap * 3) / 2;
      const doorH = Math.max(10, cabH - topDeduct - gap * 2);
      const doorY = isGolaActive ? (legsH + (cabH - topDeduct) / 2) : (legsH + gap + doorH / 2);
      const leftDoorX = -width / 4;
      const rightDoorX = width / 4;

      addLocalBox('Puerta_Izquierda', 'door', 'Melamina_Frente', colorDoors, leftDoorX, doorY, frontZ, doorW, doorH, th);
      addLocalBox('Puerta_Derecha', 'door', 'Melamina_Frente', colorDoors, rightDoorX, doorY, frontZ, doorW, doorH, th);
      addDoorHinges('PtaIzq', doorY, doorH, false);
      addDoorHinges('PtaDer', doorY, doorH, true);

      const handleY = isPestana ? (isWall ? doorY - doorH / 2 : doorY + doorH / 2) : (isWall ? legsH + 8 : legsH + doorH - 8);
      const hxLeft = isPestana ? (-doorW / 2 + 1.2) : -2.5;
      const hxRight = isPestana ? (doorW / 2 - 1.2) : 2.5;
      addDetailedHandle3D('PtaIzq', hxLeft, handleY, frontZ + th / 2, !isPestana);
      addDetailedHandle3D('PtaDer', hxRight, handleY, frontZ + th / 2, !isPestana);

    } else if (v === '2_drawers' || v === '2_pot_drawers') {
      const drW = width - gap * 2;
      if (isGolaActive) {
        const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 3 - golaRegruesoDeduct);
        const drawerH = availH / 2;
        const yLower = legsH + gap + drawerH / 2;
        const yUpper = legsH + gap + drawerH + 4.0 + gap + drawerH / 2;
        addLocalBox('Cajon_Inferior_Ollero', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yLower, frontZ, drW, drawerH, th);
        addDrawerInteriorBox('Cajon_Inferior_Ollero', yLower, drawerH);
        addLocalBox('Cajon_Superior_Cubiertero', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yUpper, frontZ, drW, drawerH, th);
        addDrawerInteriorBox('Cajon_Superior_Cubiertero', yUpper, drawerH);
      } else {
        const deduct = isBaseOrIsland ? regruesoDeduct : 0;
        const baseH = (cabH - gap * 3) / 2;
        const lowerH = baseH;
        const upperH = Math.max(10, baseH - deduct);
        const yLower = legsH + gap + lowerH / 2;
        const yUpper = legsH + gap + lowerH + gap + upperH / 2;

        addLocalBox('Cajon_Inferior_Ollero', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yLower, frontZ, drW, lowerH, th);
        addDetailedHandle3D('Caj1', 0, yLower, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_Inferior_Ollero', yLower, lowerH);

        addLocalBox('Cajon_Superior_Cubiertero', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yUpper, frontZ, drW, upperH, th);
        addDetailedHandle3D('Caj2', 0, yUpper, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_Superior_Cubiertero', yUpper, upperH);
      }

    } else if (v === '2_drawers_1_pot' || v === '3_drawers') {
      // HOMOLOGADO EXACTO CON CABINET.TSX:
      // El ollero inferior toma el 50% de la altura útil (equivalente a 2 cajones estándar).
      // Los dos cajones superiores toman el 25% cada uno.
      // Así se alinean perfectamente con el módulo contiguo de 4 cajones (25% cada uno).
      const drW = width - gap * 2;
      if (isGolaActive) {
        const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 4 - golaRegruesoDeduct);
        const lowerH = availH * 0.5;
        const upperH = availH * 0.25;
        const yLower = legsH + gap + lowerH / 2;
        const yMid = legsH + gap + lowerH + 4.0 + gap + upperH / 2;
        const yTop = legsH + gap + lowerH + 4.0 + gap + upperH + gap + upperH / 2;

        addLocalBox('Cajon_1_Ollero_Inferior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yLower, frontZ, drW, lowerH, th);
        addDrawerInteriorBox('Cajon_1_Ollero', yLower, lowerH);

        addLocalBox('Cajon_2_Intermedio', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yMid, frontZ, drW, upperH, th);
        addDrawerInteriorBox('Cajon_2_Intermedio', yMid, upperH);

        addLocalBox('Cajon_3_Superior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yTop, frontZ, drW, upperH, th);
        addDrawerInteriorBox('Cajon_3_Superior', yTop, upperH);
      } else {
        const deduct = isBaseOrIsland ? regruesoDeduct : 0;
        const availableH = cabH - gap * 4;
        const lowerH = Math.round(availableH * 0.5 * 10) / 10;
        const upperBaseH = (availableH - lowerH) / 2;
        const topDrawerH = Math.max(8, upperBaseH - deduct);
        const midDrawerH = upperBaseH;
        const yLower = legsH + gap + lowerH / 2;
        const yMid = legsH + gap + lowerH + gap + midDrawerH / 2;
        const yTop = legsH + gap + lowerH + gap + midDrawerH + gap + topDrawerH / 2;

        addLocalBox('Cajon_1_Ollero_Inferior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yLower, frontZ, drW, lowerH, th);
        addDetailedHandle3D('Caj1', 0, yLower, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_1_Ollero', yLower, lowerH);

        addLocalBox('Cajon_2_Intermedio', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yMid, frontZ, drW, midDrawerH, th);
        addDetailedHandle3D('Caj2', 0, yMid, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_2_Intermedio', yMid, midDrawerH);

        addLocalBox('Cajon_3_Superior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yTop, frontZ, drW, topDrawerH, th);
        addDetailedHandle3D('Caj3', 0, yTop, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_3_Superior', yTop, topDrawerH);
      }

    } else if (v === '4_drawers') {
      // HOMOLOGADO EXACTO CON CABINET.TSX: 4 cajones iguales de 25% cada uno
      const drW = width - gap * 2;
      if (isGolaActive) {
        const availH = Math.max(20, cabH - 3.5 - 4.0 - gap * 5 - golaRegruesoDeduct);
        const drawerH = availH / 4;
        for (let i = 0; i < 4; i++) {
          const y = legsH + gap + drawerH / 2 + i * (drawerH + gap) + (i >= 2 ? 4.0 : 0);
          addLocalBox(`Cajon_${i + 1}`, 'drawer', 'Melamina_Cajon', colorDrawers, 0, y, frontZ, drW, drawerH, th);
          addDrawerInteriorBox(`Cajon_${i + 1}`, y, drawerH);
        }
      } else {
        const deduct = isBaseOrIsland ? regruesoDeduct : 0;
        const baseDrawerH = (cabH - gap * 5) / 4;
        const topDrawerH = Math.max(8, baseDrawerH - deduct);
        for (let i = 0; i < 4; i++) {
          const currentH = i === 3 ? topDrawerH : baseDrawerH;
          const y = i === 3
            ? legsH + gap + 3 * (baseDrawerH + gap) + topDrawerH / 2
            : legsH + gap + baseDrawerH / 2 + i * (baseDrawerH + gap);
          addLocalBox(`Cajon_${i + 1}`, 'drawer', 'Melamina_Cajon', colorDrawers, 0, y, frontZ, drW, currentH, th);
          addDetailedHandle3D(`Caj${i + 1}`, 0, y, frontZ + th / 2, false);
          addDrawerInteriorBox(`Cajon_${i + 1}`, y, currentH);
        }
      }

    } else if (v === '1_door_1_drawer') {
      const drW = width - gap * 2;
      if (isGolaActive) {
        const drawerH = Math.max(8, 14.5 - golaRegruesoDeduct);
        const yTopFront = legsH + cabH - 3.5 - gap - golaRegruesoDeduct;
        const yBoxCenter = yTopFront - drawerH / 2;
        const doorH = Math.max(15, cabH - 3.5 - drawerH - 4.0 - gap * 4 - golaRegruesoDeduct);
        const yDoorCenter = legsH + gap + doorH / 2;

        addLocalBox('Puerta_Inferior', 'door', 'Melamina_Frente', colorDoors, 0, yDoorCenter, frontZ, drW, doorH, th);
        addDoorHinges('PtaInf', yDoorCenter, doorH, false);

        addLocalBox('Cajon_Superior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yBoxCenter, frontZ, drW, drawerH, th);
        addDrawerInteriorBox('Cajon_Superior', yBoxCenter, drawerH);
      } else {
        const deduct = isBaseOrIsland ? regruesoDeduct : 0;
        const drawerH = Math.max(8, 15 - deduct);
        const doorH = cabH - 15 - gap * 3;
        const yBoxCenter = legsH + gap * 2 + doorH + drawerH / 2;
        const yDoorCenter = legsH + gap + doorH / 2;

        addLocalBox('Puerta_Inferior', 'door', 'Melamina_Frente', colorDoors, 0, yDoorCenter, frontZ, drW, doorH, th);
        addDetailedHandle3D('PtaInf', width / 2 - 4.5, legsH + doorH - 8, frontZ + th / 2, true);
        addDoorHinges('PtaInf', yDoorCenter, doorH, false);

        addLocalBox('Divisor_Cajon', 'shelf', 'Melamina_Estructura', colorStructure, 0, legsH + gap + doorH + gap, 0, width - 2 * th, th, depth - 2);

        addLocalBox('Cajon_Superior', 'drawer', 'Melamina_Cajon', colorDrawers, 0, yBoxCenter, frontZ, drW, drawerH, th);
        addDetailedHandle3D('CajSup', 0, yBoxCenter, frontZ + th / 2, false);
        addDrawerInteriorBox('Cajon_Superior', yBoxCenter, drawerH);
      }

    } else if (v === 'tall_oven_micro' || v === 'tall_oven_vent' || v === 'tall_oven' || v.includes('oven')) {
      const baseSectionH = 70;
      const ovenNicheH = 60;
      const microNicheH = 38;
      const drW = width - gap * 2;

      // 1. Base: Puerta inferior batiente
      const lowerDoorH = baseSectionH - gap * 2;
      const yLowerDoor = legsH + gap + lowerDoorH / 2;
      addLocalBox('Torre_Puerta_Inferior', 'door', 'Melamina_Frente', colorDoors, 0, yLowerDoor, frontZ, drW, lowerDoorH, th);
      addDetailedHandle3D('TPtaInf', width / 2 - 4.5, legsH + lowerDoorH - 8, frontZ + th / 2, true);
      addDoorHinges('TPtaInf', yLowerDoor, lowerDoorH, false);

      // 2. Repisa soporte de Horno
      const yOvenShelf = legsH + baseSectionH;
      addLocalBox('Repisa_Soporte_Horno', 'shelf', 'Melamina_Estructura', colorStructure, 0, yOvenShelf + th / 2, 0, width - 2 * th, th, depth);

      // 3. HORNO EMPOTRADO 3D
      const ovenCenterY = yOvenShelf + th + ovenNicheH / 2;
      const ovenDepth = Math.min(52, depth - 4);
      const ovenZ = depth / 2 - ovenDepth / 2;
      addLocalBox('Horno_Empotrado_FDV', 'appliance', 'Electrodomestico_Horno', '#111827', 0, ovenCenterY, ovenZ, width - 4, ovenNicheH - 1, ovenDepth);
      addLocalBox('Horno_Cristal_Frontal', 'appliance', 'Electrodomestico_Vidrio', '#030712', 0, ovenCenterY, depth / 2 + 0.6, width - 3, ovenNicheH - 2, 1.2);

      // 4. Repisa divisoria de Microondas
      const yMicroShelf = yOvenShelf + th + ovenNicheH;
      addLocalBox('Repisa_Soporte_Microondas', 'shelf', 'Melamina_Estructura', colorStructure, 0, yMicroShelf + th / 2, 0, width - 2 * th, th, depth);

      // 5. HORNO MICROONDAS EMPOTRADO 3D
      const microCenterY = yMicroShelf + th + microNicheH / 2;
      const microDepth = Math.min(38, depth - 8);
      const microZ = depth / 2 - microDepth / 2;
      addLocalBox('Microondas_Empotrado_FDV', 'appliance', 'Electrodomestico_Horno', '#18181b', 0, microCenterY, microZ, width - 4, microNicheH - 2, microDepth);
      addLocalBox('Microondas_Cristal_Frontal', 'appliance', 'Electrodomestico_Vidrio', '#030712', 0, microCenterY, depth / 2 + 0.6, width - 3, microNicheH - 2, 1.2);

      // 6. Puerta Superior de la Torre
      const topStart = yMicroShelf + th + microNicheH;
      const topDoorH = Math.max(20, legsH + cabH - topStart - gap * 2);
      const topDoorY = topStart + gap + topDoorH / 2;
      addLocalBox('Torre_Puerta_Superior', 'door', 'Melamina_Frente', colorDoors, 0, topDoorY, frontZ, drW, topDoorH, th);
      addDetailedHandle3D('TPtaSup', width / 2 - 4.5, topDoorY - topDoorH / 2 + 10, frontZ + th / 2, true);
      addDoorHinges('TPtaSup', topDoorY, topDoorH, false);

    } else if (v === 'tall_1_door' || v.includes('1_door') || v.includes('larga')) {
      const doorW = width - gap * 2;
      const doorH = cabH - gap * 2;
      const doorY = legsH + gap + doorH / 2;
      addLocalBox('Despensa_Puerta_Larga', 'door', 'Melamina_Frente', colorDoors, 0, doorY, frontZ, doorW, doorH, th);
      addDetailedHandle3D('Desp1Pta', width / 2 - 4.5, legsH + cabH / 2, frontZ + th / 2, true);
      addDoorHinges('Desp1Pta', doorY, doorH, false);

    } else if (v === 'tall_inner_drawers') {
      const doorW = width - gap * 2;
      const doorH = cabH - gap * 2;
      const doorY = legsH + gap + doorH / 2;
      addLocalBox('Despensa_Puerta_Larga', 'door', 'Melamina_Frente', colorDoors, 0, doorY, frontZ, doorW, doorH, th);
      addDetailedHandle3D('Desp1Pta', width / 2 - 4.5, legsH + cabH / 2, frontZ + th / 2, true);
      addDoorHinges('Desp1Pta', doorY, doorH, false);

      // 4 gavetas interiores
      const innerW = width - 2 * th;
      const drawerInnerH = 14;
      for (let idx = 0; idx < 4; idx++) {
        const yCenter = legsH + 86 - idx * 24;
        addLocalBox(`Gaveta_Interior_Frente_${idx + 1}`, 'drawer', 'Melamina_Cajon', colorDrawers, 0, yCenter, frontZ - 3.5, innerW - 2.6, drawerInnerH, th);
        addDrawerInteriorBox(`Gaveta_Interior_${idx + 1}`, yCenter, drawerInnerH);
      }

    } else if (isCloset) {
      const isClosetDoors = Boolean(cab.hasDoors || v === 'closet_2_doors' || v === 'closet_inner_drawers');
      const effDrawersCount = cab.drawersCount !== undefined
        ? cab.drawersCount
        : (v === 'closet_drawers' ? 4 : (v === 'closet_mixed' || v === 'closet_inner_drawers' ? 3 : (v === 'closet_2_doors' ? 2 : 0)));
      const isInnerDrw = Boolean(cab.innerDrawers || v === 'closet_inner_drawers' || (isClosetDoors && effDrawersCount > 0));
      const effShelvesCount = cab.shelvesCount !== undefined
        ? cab.shelvesCount
        : (v === 'closet_shelves' ? 5 : (v === 'closet_walkin' ? 3 : (v === 'closet_mixed' ? 2 : 1)));
      const hasHangerActive = cab.hasHanger !== undefined ? cab.hasHanger : (v !== 'closet_shelves');

      const hasMaletero = effShelvesCount >= 1;
      const maleteroY = legsH + cabH - 35;
      const drawerH = 22;
      const drawersTotalH = effDrawersCount > 0 ? effDrawersCount * drawerH : 0;
      const drawerTopY = legsH + drawersTotalH;

      // Barra de colgar
      const rodY = hasMaletero ? maleteroY - 6 : (legsH + cabH - 15);
      const rodZ = 0;

      const innerW = width - 2 * th;
      const innerDepthMm = (depth - 1.5) * 10;
      let nominalLengthMm = 500;
      if (innerDepthMm >= 550) nominalLengthMm = 500;
      else if (innerDepthMm >= 500) nominalLengthMm = 450;
      else if (innerDepthMm >= 450) nominalLengthMm = 400;
      else if (innerDepthMm >= 400) nominalLengthMm = 350;
      else nominalLengthMm = 300;
      const nominalLength = nominalLengthMm / 10;
      const drawerBoxLength = nominalLength;

      // Pilastras y laterales interiores para cajones ocultos tras puertas
      const spacerGap = isInnerDrw ? 3.5 : 0;
      const innerWallThickness = isInnerDrw ? th : 0;
      const totalSideReduction = spacerGap + innerWallThickness;
      const freeInnerW = isInnerDrw ? (innerW - totalSideReduction * 2) : innerW;
      const skw = freeInnerW - 2.6;
      const frontWidth = isInnerDrw ? (freeInnerW - 0.4) : (width - gap * 2);
      const frontHeight = isInnerDrw ? (drawerH - 5.0) : (drawerH - gap * 2);

      const internalClearanceZ = isInnerDrw ? (th + 1.5) : 0;
      const drawerBoxZCenter = isInnerDrw ? (depth / 2 - internalClearanceZ - th - drawerBoxLength / 2) : (depth / 2 - drawerBoxLength / 2);

      // 1. PUERTAS BATIENTES EXTERIORES
      if (isClosetDoors) {
        const doorH = cabH - gap * 2;
        const doorY = legsH + gap + doorH / 2;

        if (width > 50) {
          // 2 puertas batientes
          const doorW = (width - gap * 3) / 2;
          const leftDoorX = -width / 4;
          const rightDoorX = width / 4;

          addLocalBox('Closet_Puerta_Izquierda', 'door', 'Melamina_Frente', colorDoors, leftDoorX, doorY, frontZ, doorW, doorH, th);
          addLocalBox('Closet_Puerta_Derecha', 'door', 'Melamina_Frente', colorDoors, rightDoorX, doorY, frontZ, doorW, doorH, th);

          // Bisagras de cazoleta a ambos laterales
          addDoorHinges('ClosetPtaIzq', doorY, doorH, false);
          addDoorHinges('ClosetPtaDer', doorY, doorH, true);

          // Tiradores ergonómicos verticales centrados a la altura de trabajo
          const handleY = doorY;
          const hxLeft = leftDoorX + doorW / 2 - 4.5;
          const hxRight = rightDoorX - doorW / 2 + 4.5;

          addDetailedHandle3D('ClosetPtaIzq', hxLeft, handleY, frontZ + th / 2, true);
          addDetailedHandle3D('ClosetPtaDer', hxRight, handleY, frontZ + th / 2, true);
        } else {
          // 1 puerta batiente
          const doorW = width - gap * 2;
          addLocalBox('Closet_Puerta_Principal', 'door', 'Melamina_Frente', colorDoors, 0, doorY, frontZ, doorW, doorH, th);
          addDoorHinges('ClosetPta', doorY, doorH, false);
          const handleY = doorY;
          addDetailedHandle3D('ClosetPta', width / 2 - 4.5, handleY, frontZ + th / 2, true);
        }
      }

      // 2. MALETERO SUPERIOR
      if (hasMaletero) {
        addLocalBox('Maletero_Superior', 'shelf', 'Melamina_Repisas', colorShelves, 0, maleteroY + th / 2, 0, innerW, th, depth - 2);
      }

      // 3. BARRA OVALADA DE COLGAR (CROMADA) + BRIDAS LATERALES
      if (hasHangerActive) {
        // Brida soporte lateral izquierda
        addLocalBox('Brida_Soporte_Barra_Izq', 'hardware', 'Herraje_Barra_Closet', '#cbd5e1', -innerW / 2 + 0.35, rodY, rodZ, 0.7, 3.2, 1.6);
        // Brida soporte lateral derecha
        addLocalBox('Brida_Soporte_Barra_Der', 'hardware', 'Herraje_Barra_Closet', '#cbd5e1', innerW / 2 - 0.35, rodY, rodZ, 0.7, 3.2, 1.6);
        // Tubo de barra ovalada cromada (3DFACE solid)
        addLocalBox('Barra_Colgar_Ovalada_Cromada', 'hardware', 'Herraje_Barra_Closet', '#f1f5f9', 0, rodY, rodZ, innerW - 1.4, 3.0, 1.5);
      }

      // 4. CAJONERA Y GAVETAS
      if (effDrawersCount > 0) {
        // Tapa divisoria estructural sobre la cajonera
        addLocalBox('Tapa_Divisoria_Cajonera', 'shelf', 'Melamina_Repisas', colorShelves, 0, drawerTopY + th / 2, 0, innerW, th, depth - 2);

        // Estructura interior de separación si los cajones van tras puertas (regletas y laterales)
        if (isInnerDrw) {
          // Lateral interior izquierdo
          addLocalBox('Cajonera_Lateral_Interior_Izq', 'carcass', 'Melamina_Estructura', colorStructure, -innerW / 2 + spacerGap + th / 2, legsH + drawersTotalH / 2, drawerBoxZCenter, th, drawersTotalH, drawerBoxLength);
          // Lateral interior derecho
          addLocalBox('Cajonera_Lateral_Interior_Der', 'carcass', 'Melamina_Estructura', colorStructure, innerW / 2 - spacerGap - th / 2, legsH + drawersTotalH / 2, drawerBoxZCenter, th, drawersTotalH, drawerBoxLength);
          // Pilastra frontal izquierda
          addLocalBox('Cajonera_Pilastra_Frontal_Izq', 'carcass', 'Melamina_Estructura', colorStructure, -innerW / 2 + spacerGap / 2, legsH + drawersTotalH / 2, depth / 2 - internalClearanceZ - th / 2, spacerGap, drawersTotalH, th);
          // Pilastra frontal derecha
          addLocalBox('Cajonera_Pilastra_Frontal_Der', 'carcass', 'Melamina_Estructura', colorStructure, innerW / 2 - spacerGap / 2, legsH + drawersTotalH / 2, depth / 2 - internalClearanceZ - th / 2, spacerGap, drawersTotalH, th);
        }

        // Cada cajón
        for (let dIdx = 0; dIdx < effDrawersCount; dIdx++) {
          const yCenter = legsH + gap + (effDrawersCount - 1 - dIdx) * drawerH + drawerH / 2;
          const drawerBaseY = legsH + (effDrawersCount - 1 - dIdx) * drawerH;
          const yPosFront = isInnerDrw ? (drawerBaseY + 0.3 + frontHeight / 2) : yCenter;
          const drawerFrontZ = isInnerDrw ? (depth / 2 - internalClearanceZ - th / 2) : frontZ;

          // Frente de cajón
          addLocalBox(`Closet_Cajon_Frente_${dIdx + 1}`, 'drawer', 'Melamina_Cajon', colorDrawers, 0, yPosFront, drawerFrontZ, frontWidth, frontHeight, th);

          // Si es cajón exterior (sin puertas en frente) y lleva tirador
          if (!isInnerDrw && !isClosetDoors) {
            addDetailedHandle3D(`ClosetCaj_${dIdx + 1}`, 0, yPosFront, drawerFrontZ + th / 2, false);
          }

          // Interior despiezado del cajón (costados, contrafrente, trasera, fondo)
          const boxH = isInnerDrw ? 13 : (drawerH - 5);
          const yBoxBase = drawerBaseY + (isInnerDrw ? 0.8 : (th + 0.5));
          const yBoxCenter = isInnerDrw ? (yBoxBase + boxH / 2) : yCenter;

          const sideXLeft = isInnerDrw ? (-freeInnerW / 2 + 0.35) : (-innerW / 2 + 0.35);
          const sideXRight = isInnerDrw ? (freeInnerW / 2 - 0.35) : (innerW / 2 - 0.35);
          const slideZCenter = drawerBoxZCenter;

          const colorDrawerBox = '#e2d9c8';
          const colorBottom = '#ffffff';
          const colorSlide = '#94a3b8';

          // Costado Izquierdo cajón
          addLocalBox(`Closet_Caj_${dIdx + 1}_Costado_Izq`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, -skw / 2 + th / 2, yBoxCenter, drawerBoxZCenter, th, boxH, drawerBoxLength);
          // Costado Derecho cajón
          addLocalBox(`Closet_Caj_${dIdx + 1}_Costado_Der`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, skw / 2 - th / 2, yBoxCenter, drawerBoxZCenter, th, boxH, drawerBoxLength);
          // Trasera cajón
          addLocalBox(`Closet_Caj_${dIdx + 1}_Trasera`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, 0, yBoxCenter + 0.6, drawerBoxZCenter - drawerBoxLength / 2 + th / 2, skw - th * 2, boxH - 1.2, th);
          // Contrafrente cajón
          addLocalBox(`Closet_Caj_${dIdx + 1}_Contrafrente`, 'drawer_box', 'Melamina_Cajon_Interior', colorDrawerBox, 0, yBoxCenter + 0.6, drawerBoxZCenter + drawerBoxLength / 2 - th / 2, skw - th * 2, boxH - 1.2, th);
          // Fondo Durolac
          addLocalBox(`Closet_Caj_${dIdx + 1}_Fondo`, 'drawer_box', 'Durolac_Fondo_Cajon', colorBottom, 0, yBoxBase + 0.15, drawerBoxZCenter, skw - th * 2, 0.3, drawerBoxLength - th * 2);

          // Correderas telescópicas
          addLocalBox(`Closet_Caj_${dIdx + 1}_Corredera_Izq`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, sideXLeft, yBoxCenter, slideZCenter, 0.4, 4.5, nominalLength);
          addLocalBox(`Closet_Caj_${dIdx + 1}_Corredera_Der`, 'hardware', 'Herraje_Corredera_Telescopica', colorSlide, sideXRight, yBoxCenter, slideZCenter, 0.4, 4.5, nominalLength);
        }
      }

      // 5. REPISAS INTERMEDIAS ADICIONALES
      if (effShelvesCount > (hasMaletero ? 1 : 0)) {
        const extraShelves = effShelvesCount - (hasMaletero ? 1 : 0);
        const yStart = effDrawersCount > 0 ? drawerTopY : legsH;
        const yEnd = hasMaletero ? maleteroY : (legsH + cabH);
        const step = (yEnd - yStart) / (extraShelves + 1);
        for (let sIdx = 0; sIdx < extraShelves; sIdx++) {
          const shelfY = yStart + (sIdx + 1) * step;
          addLocalBox(`Closet_Repisa_Intermedia_${sIdx + 1}`, 'shelf', 'Melamina_Repisas', colorShelves, 0, shelfY + th / 2, 0, innerW, th, depth - 2);
        }
      }

    } else if (v === 'tall_split_2_doors' || v === 'tall_2_doors' || cab.type === 'tall') {
      const splitH = 70;
      const lowerDoorH = splitH - gap * 2;
      const upperDoorH = cabH - splitH - gap * 2;
      const drW = width - gap * 2;

      const yLower = legsH + gap + lowerDoorH / 2;
      addLocalBox('Despensa_Puerta_Inferior', 'door', 'Melamina_Frente', colorDoors, 0, yLower, frontZ, drW, lowerDoorH, th);
      addDetailedHandle3D('DespInf', width / 2 - 4.5, legsH + lowerDoorH - 8, frontZ + th / 2, true);
      addDoorHinges('DespInf', yLower, lowerDoorH, false);

      addLocalBox('Repisa_Divisoria_Fija', 'shelf', 'Melamina_Estructura', colorStructure, 0, legsH + splitH + th / 2, 0, width - 2 * th, th, depth);

      const yUpper = legsH + splitH + gap + upperDoorH / 2;
      addLocalBox('Despensa_Puerta_Superior', 'door', 'Melamina_Frente', colorDoors, 0, yUpper, frontZ, drW, upperDoorH, th);
      addDetailedHandle3D('DespSup', width / 2 - 4.5, legsH + splitH + 12, frontZ + th / 2, true);
      addDoorHinges('DespSup', yUpper, upperDoorH, false);

    } else if (v === 'tall_terminal_shelves' || v === 'tall_open' || v === 'open' || v === 'wall_open') {
      const shelfCount = cab.shelvesCount ?? 5;
      const availableH = cabH - th * 2;
      const shelfStep = availableH / (shelfCount + 1);
      for (let s = 1; s <= shelfCount; s++) {
        const yShelf = legsH + th + s * shelfStep;
        addLocalBox(
          `Repisa_Abierta_${s}`,
          'shelf',
          'Melamina_Repisas',
          colorShelves,
          0,
          yShelf,
          0,
          width - 2 * th,
          th,
          depth - 2
        );
      }

    } else {
      const doorW = width - gap * 2;
      const doorH = cabH - gap * 2;
      const doorY = legsH + doorH / 2;
      addLocalBox('Puerta_Modulo', 'door', 'Melamina_Frente', colorDoors, 0, doorY, frontZ, doorW, doorH, th);
      addDetailedHandle3D('Pta', width / 2 - 4.5, legsH + doorH - 8, frontZ + th / 2, true);
      addDoorHinges('Pta', doorY, doorH, false);
    }

    // ----------------------------------------------------
    // 4. REPISAS INTERIORES
    // ----------------------------------------------------
    if (isCabinetWithDoors(cab) && !isCloset) {
      const shelfElevs = getResolvedCabinetShelfElevations(cab, th);
      shelfElevs.forEach((elev, sIdx) => {
        addLocalBox(
          `Repisa_Interior_${sIdx + 1}`,
          'shelf',
          'Melamina_Repisas',
          colorShelves,
          0,
          legsH + elev,
          0,
          width - 2 * th,
          th,
          depth - 2
        );
      });
    }
  });

  // ----------------------------------------------------
  // 4. ZÓCALO CONTINUO Y RETORNOS LATERALES AL MURO
  // ----------------------------------------------------
  if (options.includeSocle !== false && (kState?.showSocle !== false)) {
    const validFloorCabinets = realCabinets.filter(c => c.type === 'base' || c.type === 'tall' || c.type === 'island' || c.type === 'closet' || c.variant?.startsWith('closet_'));
    if (validFloorCabinets.length > 0 && socleH > 0) {
      const socleSys = calculateSocleSystem(
        validFloorCabinets,
        kState?.walls || [],
        kState?.roomConfig?.vertices || [],
        kState?.socleFinish || 'aluminum',
        socleH
      );

      // Tiras Frontales Continuas
      socleSys.pieces.forEach((piece, pIdx) => {
        elements.push({
          name: `Zocalo_Frontal_${pIdx + 1}`,
          category: 'socle',
          materialName: 'Zocalo_Aluminio',
          colorHex: socleSys.socleColor,
          x: piece.center[0],
          y: piece.center[1],
          z: piece.center[2],
          w: piece.length,
          h: socleH,
          d: 1.5,
          rotation: piece.rotation,
        });
      });

      // Zócalos Laterales de Retorno (cierran el zócalo llegando al muro en extremos libres)
      socleSys.laterals.forEach((lat, lIdx) => {
        elements.push({
          name: `Zocalo_Lateral_Muro_${lIdx + 1}`,
          category: 'socle',
          materialName: 'Zocalo_Aluminio',
          colorHex: socleSys.socleColor,
          x: lat.position[0],
          y: lat.position[1],
          z: lat.position[2],
          w: 1.5,
          h: socleH,
          d: lat.depth,
          rotation: lat.rotation,
        });
      });
    }
  }

  // ----------------------------------------------------
  // 5. CUBIERTAS DE CUARZO / PIEDRA QSTONE (Continuas sobre bases e islas)
  // ----------------------------------------------------
  if (options.includeCountertop !== false && kState?.countertopConfig?.enabled) {
    const ctBOM = generateCountertopPieces(
      cabinets,
      kState.countertopConfig,
      kState.qstoneCatalog || [],
      kState.islandBackConfig,
      kState.walls || [],
      kState.architecturalElements || [],
      kState.roomConfig
    );

    if (ctBOM && ctBOM.runs && ctBOM.runs.length > 0) {
      ctBOM.runs.forEach((run, rIdx) => {
        const isIsland = run.type === 'island';
        const override = kState?.countertopConfig?.runOverrides?.[run.id];
        const pLenCm = run.totalLengthMm / 10;
        const pWidCm = (run.depthMm || 620) / 10;
        const pThickCm = (kState?.countertopConfig?.thicknessMm || 20) / 10;
        const cabTopY = run.heightMm ? run.heightMm / 10 : 85;
        const center = run.centerWorld || [0, cabTopY, 0];
        const rot = run.rotation || 0;
        const sinR = Math.sin(rot);
        const cosR = Math.cos(rot);

        // Vuelo frontal y posterior para asentar la cubierta perfectamente alineada
        const frontOverhang = (run.overhangFrontMm ?? (kState?.countertopConfig?.overhangFrontCm ? kState.countertopConfig.overhangFrontCm * 10 : 20)) / 10;
        const rearOverhang = (run.overhangRearMm ?? (run.type === 'island' ? (kState?.countertopConfig?.overhangBackCm ?? 30) * 10 : 0)) / 10;
        const localZShift = (frontOverhang - rearOverhang) / 2;

        const ctCenterX = center[0] + localZShift * sinR;
        const ctCenterZ = center[2] + localZShift * cosR;

        // Cubierta principal (Descansa a cota cabTopY exactos apoyada sobre cascos)
        elements.push({
          name: `Cubierta_Qstone_${run.type}_${rIdx + 1}`,
          category: 'countertop',
          materialName: 'Qstone_Cuarzo',
          colorHex: '#e5e7eb',
          x: ctCenterX,
          y: cabTopY + pThickCm / 2,
          z: ctCenterZ,
          w: pLenCm,
          h: pThickCm,
          d: pWidCm,
          rotation: rot
        });

        // Respaldo de muro de cuarzo si aplica
        const backsplashMode = kState?.countertopConfig?.backsplashMode || 'standard_5cm';
        if (run.type !== 'island' && backsplashMode !== 'none') {
          // Altura paramétrica: Si es completo llega a 55cm (base aéreo), si es estándar usa la altura configurada
          const bsHeight = backsplashMode === 'standard_5cm'
            ? (kState?.countertopConfig?.backsplashHeightCm || 5)
            : 55;

          const rearOffset = -pWidCm / 2 + pThickCm / 2;
          const bsCenterX = center[0] + rearOffset * sinR;
          const bsCenterZ = center[2] + rearOffset * cosR;

          elements.push({
            name: `Respaldo_Muro_Qstone_${rIdx + 1}`,
            category: 'countertop',
            materialName: 'Qstone_Cuarzo',
            colorHex: '#e5e7eb',
            x: bsCenterX,
            y: cabTopY + pThickCm + bsHeight / 2,
            z: bsCenterZ,
            w: pLenCm,
            h: bsHeight,
            d: pThickCm,
            rotation: rot
          });
        }

        // CASCADAS LATERALES (WATERFALLS)
        const isWaterLeft = override?.waterfallLeft !== undefined
          ? override.waterfallLeft
          : (isIsland
              ? (kState?.countertopConfig?.islandWaterfallLeft ?? kState?.countertopConfig?.waterfallLeft)
              : (kState?.countertopConfig?.baseWaterfallLeft ?? kState?.countertopConfig?.waterfallLeft));

        const isWaterRight = override?.waterfallRight !== undefined
          ? override.waterfallRight
          : (isIsland
              ? (kState?.countertopConfig?.islandWaterfallRight ?? kState?.countertopConfig?.waterfallRight)
              : (kState?.countertopConfig?.baseWaterfallRight ?? kState?.countertopConfig?.waterfallRight));

        const waterfallH = cabTopY + pThickCm;
        const waterfallCenterY = waterfallH / 2;

        // Cascada Izquierda
        if (isWaterLeft && run.canWaterfallLeft !== false) {
          const localX_L = -pLenCm / 2 - pThickCm / 2;
          const localZ_L = localZShift;
          const wx_L = center[0] + (localX_L * cosR + localZ_L * sinR);
          const wz_L = center[2] + (-localX_L * sinR + localZ_L * cosR);

          elements.push({
            name: `Cascada_Qstone_Izquierda_${rIdx + 1}`,
            category: 'countertop',
            materialName: 'Qstone_Cuarzo',
            colorHex: '#e5e7eb',
            x: wx_L,
            y: waterfallCenterY,
            z: wz_L,
            w: pThickCm,
            h: waterfallH,
            d: pWidCm,
            rotation: rot
          });
        }

        // Cascada Derecha
        if (isWaterRight && run.canWaterfallRight !== false) {
          const localX_R = pLenCm / 2 + pThickCm / 2;
          const localZ_R = localZShift;
          const wx_R = center[0] + (localX_R * cosR + localZ_R * sinR);
          const wz_R = center[2] + (-localX_R * sinR + localZ_R * cosR);

          elements.push({
            name: `Cascada_Qstone_Derecha_${rIdx + 1}`,
            category: 'countertop',
            materialName: 'Qstone_Cuarzo',
            colorHex: '#e5e7eb',
            x: wx_R,
            y: waterfallCenterY,
            z: wz_R,
            w: pThickCm,
            h: waterfallH,
            d: pWidCm,
            rotation: rot
          });
        }

        // FALDONES / REGRUESO CONTINUO
        const regruesoCm = override?.regruesoCm !== undefined
          ? override.regruesoCm
          : (isIsland
              ? (kState?.countertopConfig?.islandRegruesoCm ?? kState?.countertopConfig?.regruesoCm ?? 0)
              : (kState?.countertopConfig?.baseRegruesoCm ?? kState?.countertopConfig?.regruesoCm ?? 0));

        if (regruesoCm > 0) {
          // Faldón frontal
          const frontOffset = localZShift + pWidCm / 2 - pThickCm / 2;
          const faldonFrontX = center[0] + frontOffset * sinR;
          const faldonFrontZ = center[2] + frontOffset * cosR;
          elements.push({
            name: `Faldon_Frontal_Qstone_${rIdx + 1}`,
            category: 'countertop',
            materialName: 'Qstone_Cuarzo',
            colorHex: '#e5e7eb',
            x: faldonFrontX,
            y: cabTopY + pThickCm - regruesoCm / 2,
            z: faldonFrontZ,
            w: pLenCm,
            h: regruesoCm,
            d: pThickCm,
            rotation: rot
          });

          // Faldón posterior en isla si hay barra volada
          if (isIsland && rearOverhang > 0) {
            const rearOffset = localZShift - pWidCm / 2 + pThickCm / 2;
            const faldonRearX = center[0] + rearOffset * sinR;
            const faldonRearZ = center[2] + rearOffset * cosR;
            elements.push({
              name: `Faldon_Posterior_Qstone_${rIdx + 1}`,
              category: 'countertop',
              materialName: 'Qstone_Cuarzo',
              colorHex: '#e5e7eb',
              x: faldonRearX,
              y: cabTopY + pThickCm - regruesoCm / 2,
              z: faldonRearZ,
              w: pLenCm,
              h: regruesoCm,
              d: pThickCm,
              rotation: rot
            });
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // 6. MUROS ARQUITECTÓNICOS (Si están habilitados)
  // ----------------------------------------------------
  if (options.includeWalls !== false && kState?.walls && kState.walls.length > 0) {
    kState.walls.forEach((w, wIdx) => {
      const dx = w.end[0] - w.start[0];
      const dz = w.end[1] - w.start[1];
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const midX = (w.start[0] + w.end[0]) / 2;
      const midZ = (w.start[1] + w.end[1]) / 2;
      const wallH = w.height || 240;
      const wallThick = w.thickness || 20;

      elements.push({
        name: `Muro_Arquitectonico_${wIdx + 1}`,
        category: 'wall_arch',
        materialName: 'Muro_Hormigon_Tabique',
        colorHex: '#cbd5e1',
        x: midX,
        y: wallH / 2,
        z: midZ,
        w: wallThick,
        h: wallH,
        d: len,
        rotation: angle
      });
    });
  }

  return elements;
}

/**
 * Genera la geometría de 8 vértices rotados y trasladados para una caja 3D en milímetros o metros
 */
function getBoxVertices(box: BoxMesh3D, scaleFactor: number): [number, number, number][] {
  const hw = (box.w / 2) * scaleFactor;
  const hh = (box.h / 2) * scaleFactor;
  const hd = (box.d / 2) * scaleFactor;

  const cx = box.x * scaleFactor;
  const cy = box.y * scaleFactor;
  const cz = box.z * scaleFactor;

  const cos = Math.cos(box.rotation);
  const sin = Math.sin(box.rotation);

  // 8 vértices locales [-hw, -hh, -hd] a [hw, hh, hd]
  const localOffsets = [
    [-hw, -hh, -hd],
    [ hw, -hh, -hd],
    [ hw,  hh, -hd],
    [-hw,  hh, -hd],
    [-hw, -hh,  hd],
    [ hw, -hh,  hd],
    [ hw,  hh,  hd],
    [-hw,  hh,  hd],
  ];

  return localOffsets.map(([lx, ly, lz]) => {
    // Rotar alrededor de Y
    const rx = lx * cos + lz * sin;
    const rz = -lx * sin + lz * cos;
    return [cx + rx, cy + ly, cz + rz];
  });
}

/**
 * 1. Generador de Modelo 3D Wavefront (.OBJ y .MTL) Detallado
 * Compatible con 3ds Max, Blender, SketchUp, Cinema 4D, Rhino y Revit.
 */
export function generateKitchenObj(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): { obj: string; mtl: string } {
  const scale = options.unit === 'm' ? 0.01 : 10; // cm a mm (x10) o cm a metros (x0.01)
  const unitComment = options.unit === 'm' ? 'Meters' : 'Millimeters';
  const elements = extractKitchen3dElements(cabinets, kState, 1.8, options);

  let obj = `# Arquify BIM & CAD Export Engine - LOD 350 Detailed Assembly\n`;
  obj += `# Project: ${options.projectName || 'Proyecto Cocina Arquify'}\n`;
  obj += `# Client: ${options.clientName || 'Cliente Particular'}\n`;
  obj += `# Units: ${unitComment}\n`;
  obj += `mtllib Cocina_Completa_3D.mtl\n\n`;

  // Material definitions (.MTL)
  const materialsMap = new Map<string, string>();
  elements.forEach(el => {
    if (!materialsMap.has(el.materialName)) {
      materialsMap.set(el.materialName, el.colorHex);
    }
  });

  let mtl = `# Arquify Material Library (LOD 350)\n# Generated automatically\n\n`;
  materialsMap.forEach((hex, matName) => {
    const r = parseInt(hex.slice(1, 3) || 'ff', 16) / 255;
    const g = parseInt(hex.slice(3, 5) || 'ff', 16) / 255;
    const b = parseInt(hex.slice(5, 7) || 'ff', 16) / 255;

    mtl += `newmtl ${matName}\n`;
    mtl += `Ka ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}\n`;
    mtl += `Kd ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}\n`;
    mtl += `Ks 0.250 0.250 0.250\n`;
    mtl += `Ns 35.0\n`;
    mtl += `d 1.0\n`;
    mtl += `illum 2\n\n`;
  });

  let vertexOffset = 1;

  elements.forEach(box => {
    const verts = getBoxVertices(box, scale);

    obj += `o ${box.name}\n`;
    obj += `usemtl ${box.materialName}\n`;
    obj += `s 1\n`;

    // 8 vértices
    verts.forEach(([vx, vy, vz]) => {
      obj += `v ${vx.toFixed(2)} ${vy.toFixed(2)} ${vz.toFixed(2)}\n`;
    });

    // 6 caras (12 triángulos estándar OBJ)
    obj += `f ${vertexOffset + 4} ${vertexOffset + 5} ${vertexOffset + 6}\n`;
    obj += `f ${vertexOffset + 4} ${vertexOffset + 6} ${vertexOffset + 7}\n`;
    obj += `f ${vertexOffset + 1} ${vertexOffset + 0} ${vertexOffset + 3}\n`;
    obj += `f ${vertexOffset + 1} ${vertexOffset + 3} ${vertexOffset + 2}\n`;
    obj += `f ${vertexOffset + 3} ${vertexOffset + 2} ${vertexOffset + 6}\n`;
    obj += `f ${vertexOffset + 3} ${vertexOffset + 6} ${vertexOffset + 7}\n`;
    obj += `f ${vertexOffset + 0} ${vertexOffset + 1} ${vertexOffset + 5}\n`;
    obj += `f ${vertexOffset + 0} ${vertexOffset + 5} ${vertexOffset + 4}\n`;
    obj += `f ${vertexOffset + 1} ${vertexOffset + 2} ${vertexOffset + 6}\n`;
    obj += `f ${vertexOffset + 1} ${vertexOffset + 6} ${vertexOffset + 5}\n`;
    obj += `f ${vertexOffset + 0} ${vertexOffset + 4} ${vertexOffset + 7}\n`;
    obj += `f ${vertexOffset + 0} ${vertexOffset + 7} ${vertexOffset + 3}\n\n`;

    vertexOffset += 8;
  });

  return { obj, mtl };
}

/**
 * 2. Generador de Modelo OpenBIM Industry Foundation Classes (.IFC - IFC2X3 / IFC4)
 * Compatible con Revit, Archicad, Allplan, Vectorworks y Solibri.
 */
export function generateKitchenIfc(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): string {
  const elements = extractKitchen3dElements(cabinets, kState, 1.8, options);
  const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const projName = options.projectName || 'PROYECTO COCINA ARQUIFY';

  let ifc = `ISO-10303-21;\nHEADER;\n`;
  ifc += `FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]'),'2;1');\n`;
  ifc += `FILE_NAME('Cocina_Completa_OpenBIM.ifc','${now}',('Arquify CAD/BIM Architect'),('Arquify Engine'),'Arquify BIM Generator 2.0','Arquify Web Platform','Arquify');\n`;
  ifc += `FILE_SCHEMA(('IFC2X3'));\n`;
  ifc += `ENDSEC;\n\nDATA;\n`;

  // Entidades base del proyecto IFC
  ifc += `#1= IFCPROJECT('0X1a2b3c4d5e6f7g8h9i0j1k',#2,'${projName}','Proyecto Parametrico de Cocina Integral LOD 350',*,*,*,$,#3);\n`;
  ifc += `#2= IFCOWNERHISTORY(#4,#5,$,.NOCHANGE.,$,$,$,${Math.floor(Date.now() / 1000)});\n`;
  ifc += `#3= IFCUNITASSIGNMENT((#6,#7,#8,#9));\n`;
  ifc += `#4= IFCPERSONANDORGANIZATION(#10,#11,$);\n`;
  ifc += `#5= IFCAPPLICATION(#11,'2.0','Arquify','Arquify BIM');\n`;
  ifc += `#6= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);\n`;
  ifc += `#7= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);\n`;
  ifc += `#8= IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);\n`;
  ifc += `#9= IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);\n`;
  ifc += `#10= IFCPERSON('ARQ-01','Arquify','Proyectista',$,$,$,$,$);\n`;
  ifc += `#11= IFCORGANIZATION('ORG-01','Arquify Studio','Mobiliario & Arquitectura Parametrica',$,$);\n`;

  // Jerarquía Espacial
  ifc += `#20= IFCSITE('1S1a2b3c4d5e6f7g8h9i0j',#2,'Sitio del Proyecto',$,$,#21,$,$,.ELEMENT.,$,$,$,$,$);\n`;
  ifc += `#21= IFCLOCALPLACEMENT($,#22);\n`;
  ifc += `#22= IFCAXIS2PLACEMENT3D(#23,$,$);\n`;
  ifc += `#23= IFCCARTESIANPOINT((0.,0.,0.));\n`;

  ifc += `#30= IFCBUILDING('1B1a2b3c4d5e6f7g8h9i0j',#2,'Edificio',$,$,#31,$,$,.ELEMENT.,$,$,$);\n`;
  ifc += `#31= IFCLOCALPLACEMENT(#21,#22);\n`;

  ifc += `#40= IFCBUILDINGSTOREY('1F1a2b3c4d5e6f7g8h9i0j',#2,'Nivel 1 - Cocina (Z=0.00)',$,$,#41,$,$,.ELEMENT.,0.);\n`;
  ifc += `#41= IFCLOCALPLACEMENT(#31,#22);\n`;

  ifc += `#50= IFCRELAGGREGATES('0A1a2b3c4d5e6f7g8h9i0j',#2,$,$,#1,(#20));\n`;
  ifc += `#51= IFCRELAGGREGATES('0B1a2b3c4d5e6f7g8h9i0j',#2,$,$,#20,(#30));\n`;
  ifc += `#52= IFCRELAGGREGATES('0C1a2b3c4d5e6f7g8h9i0j',#2,$,$,#30,(#40));\n`;

  ifc += `#60= IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#22,$);\n`;

  let nextId = 100;
  const productIds: number[] = [];

  elements.forEach((box, bIdx) => {
    const scale = 0.01; // cm a metros
    const posX = (box.x * scale).toFixed(4);
    const posY = (box.y * scale).toFixed(4);
    const posZ = (box.z * scale).toFixed(4);

    const lenX = (box.w * scale).toFixed(4);
    const lenY = (box.h * scale).toFixed(4);
    const lenZ = (box.d * scale).toFixed(4);

    const guid = `2F${String(bIdx).padStart(4, '0')}a2b3c4d5e6f7g8h9i0`;

    const ptId = nextId++;
    const plId = nextId++;
    const repId = nextId++;
    const shapeId = nextId++;
    const solidId = nextId++;
    const profileId = nextId++;
    const elemId = nextId++;

    ifc += `#${ptId}= IFCCARTESIANPOINT((${posX},${(-Number(posZ)).toFixed(4)},${posY}));\n`;
    ifc += `#${plId}= IFCLOCALPLACEMENT(#41,#${ptId});\n`;

    ifc += `#${profileId}= IFCRECTANGLEPROFILEDEF(.AREA.,'Perfil ${box.name}',$,${lenX},${lenZ});\n`;
    ifc += `#${solidId}= IFCEXTRUDEDAREASOLID(#${profileId},#22,#22,${lenY});\n`;
    ifc += `#${repId}= IFCSHAPEREPRESENTATION(#60,'Body','SweptSolid',(#${solidId}));\n`;
    ifc += `#${shapeId}= IFCPRODUCTDEFINITIONSHAPE($,$,(#${repId}));\n`;

    const ifcClass = box.category === 'wall_arch' ? 'IFCWALL' : 'IFCFURNISHINGELEMENT';
    ifc += `#${elemId}= ${ifcClass}('${guid}',#2,'${box.name}','${box.materialName}','Mueble Cocina',#${plId},#${shapeId},'${box.identTag || box.category}');\n`;

    productIds.push(elemId);
  });

  const relContId = nextId++;
  const prodListStr = productIds.map(id => `#${id}`).join(',');
  ifc += `#${relContId}= IFCRELCONTAINEDINSPATIALSTRUCTURE('3C1a2b3c4d5e6f7g8h9i0j',#2,'Contenido Cocina',$,(${prodListStr}),#40);\n`;

  ifc += `ENDSEC;\nEND-ISO-10303-21;\n`;
  return ifc;
}

/**
 * 3. Generador de Modelo CAD 3D (.DXF 3D Detallado con Capas Estructuradas)
 * Compatible con AutoCAD, BricsCAD, ZWCAD, SketchUp y SolidWorks.
 * Al cambiar el estilo visual a "Conceptual", "Sombreado" o "Realista",
 * se aprecia el mueble completamente sólido con puertas, cajones, cubiertas y nichos.
 */
export function generateKitchen3dDxf(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): string {
  const elements = extractKitchen3dElements(cabinets, kState, 1.8, options);
  const scale = 10; // cm a milímetros estándar CAD

  let dxf = '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1009\n';
  dxf += '9\n$INSUNITS\n70\n4\n'; // 4 = Millimeters
  dxf += '0\nENDSEC\n';

  // TABLES & LAYERS CON COLORES NORMALIZADOS AUTOCAD
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n12\n';
  dxf += '0\nLAYER\n2\nMUEBLE_CASCOS\n70\n0\n62\n7\n6\nCONTINUOUS\n';    // Color 7: Blanco
  dxf += '0\nLAYER\n2\nMUEBLE_PUERTAS\n70\n0\n62\n5\n6\nCONTINUOUS\n';   // Color 5: Azul
  dxf += '0\nLAYER\n2\nMUEBLE_CAJONES\n70\n0\n62\n4\n6\nCONTINUOUS\n';   // Color 4: Cian
  dxf += '0\nLAYER\n2\nMUEBLE_CAJON_INTERIOR\n70\n0\n62\n40\n6\nCONTINUOUS\n'; // Color 40: Naranja/madera interior
  dxf += '0\nLAYER\n2\nMUEBLE_REPISAS\n70\n0\n62\n3\n6\nCONTINUOUS\n';   // Color 3: Verde
  dxf += '0\nLAYER\n2\nMUEBLE_ELECTRO\n70\n0\n62\n1\n6\nCONTINUOUS\n';   // Color 1: Rojo
  dxf += '0\nLAYER\n2\nMUEBLE_TIRADORES\n70\n0\n62\n2\n6\nCONTINUOUS\n'; // Color 2: Amarillo
  dxf += '0\nLAYER\n2\nMUEBLE_HERRAJES\n70\n0\n62\n8\n6\nCONTINUOUS\n';  // Color 8: Gris oscuro (bisagras, correderas, tornillos)
  dxf += '0\nLAYER\n2\nCUBIERTA_PIEDRA\n70\n0\n62\n6\n6\nCONTINUOUS\n';  // Color 6: Magenta
  dxf += '0\nLAYER\n2\nZOCALOS_PISO\n70\n0\n62\n8\n6\nCONTINUOUS\n';     // Color 8: Gris oscuro
  dxf += '0\nLAYER\n2\nMUEBLE_RIEL_GOLA\n70\n0\n62\n8\n6\nCONTINUOUS\n'; // Color 8: Perfiles Gola
  dxf += '0\nLAYER\n2\nMUROS_ESTANCIA\n70\n0\n62\n9\n6\nCONTINUOUS\n';   // Color 9: Gris claro
  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';

  // ENTITIES (3DFACE solids)
  dxf += '0\nSECTION\n2\nENTITIES\n';

  const getLayerForCategory = (cat: BimCategory) => {
    switch (cat) {
      case 'carcass': return 'MUEBLE_CASCOS';
      case 'door': return 'MUEBLE_PUERTAS';
      case 'drawer': return 'MUEBLE_CAJONES';
      case 'drawer_box': return 'MUEBLE_CAJON_INTERIOR';
      case 'shelf': return 'MUEBLE_REPISAS';
      case 'appliance': return 'MUEBLE_ELECTRO';
      case 'handle': return 'MUEBLE_TIRADORES';
      case 'hardware': return 'MUEBLE_HERRAJES';
      case 'countertop': return 'CUBIERTA_PIEDRA';
      case 'socle': return 'ZOCALOS_PISO';
      case 'gola': return 'MUEBLE_RIEL_GOLA';
      case 'wall_arch': return 'MUROS_ESTANCIA';
      default: return 'MUEBLE_CASCOS';
    }
  };

  // En AutoCAD 3D: el plano horizontal de piso es XY (+X = derecha, +Y = fondo hacia el muro) y la altura es Z (+Z = elevación).
  // En Three.js: X = horizontal (+X = derecha), Y = altura (+Y = arriba), Z = profundidad (+Z = hacia el usuario/frente).
  // Mapeo ortogonal exacto para mantener quiralidad diestra pura (+1) sin inversión en espejo:
  // X_acad = x, Y_acad = -z, Z_acad = y
  const add3dFace = (p1: [number,number,number], p2: [number,number,number], p3: [number,number,number], p4: [number,number,number], layer: string) => {
    let face = '0\n3DFACE\n';
    face += `8\n${layer}\n`;
    face += `10\n${p1[0].toFixed(2)}\n20\n${(-p1[2]).toFixed(2)}\n30\n${p1[1].toFixed(2)}\n`;
    face += `11\n${p2[0].toFixed(2)}\n21\n${(-p2[2]).toFixed(2)}\n31\n${p2[1].toFixed(2)}\n`;
    face += `12\n${p3[0].toFixed(2)}\n22\n${(-p3[2]).toFixed(2)}\n32\n${p3[1].toFixed(2)}\n`;
    face += `13\n${p4[0].toFixed(2)}\n23\n${(-p4[2]).toFixed(2)}\n33\n${p4[1].toFixed(2)}\n`;
    return face;
  };

  elements.forEach(box => {
    const v = getBoxVertices(box, scale);
    const layer = getLayerForCategory(box.category);

    // 6 caras 3DFACE sólidas con normales orientadas hacia afuera
    dxf += add3dFace(v[4], v[5], v[6], v[7], layer); // Frontal (-Y en acad)
    dxf += add3dFace(v[1], v[0], v[3], v[2], layer); // Trasera (+Y en acad)
    dxf += add3dFace(v[2], v[3], v[7], v[6], layer); // Superior (+Z en acad)
    dxf += add3dFace(v[0], v[1], v[5], v[4], layer); // Inferior (-Z en acad)
    dxf += add3dFace(v[1], v[2], v[6], v[5], layer); // Derecha (+X en acad)
    dxf += add3dFace(v[0], v[4], v[7], v[3], layer); // Izquierda (-X en acad)
  });

  dxf += '0\nENDSEC\n0\nEOF\n';
  return dxf;
}

/**
 * 4. Genera Memoria Técnica BIM de Texto Explicativa para el Cliente
 */
export function generateBimTechnicalSummary(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): string {
  const realCabinets = cabinets.filter(c => c.type !== 'decoration' && !c.variant?.startsWith('deco_'));
  const proj = options.projectName || 'PROYECTO COCINA ARQUIFY';
  const client = options.clientName || 'CLIENTE PARTICULAR';

  let txt = `=================================================================\n`;
  txt += `       PAQUETE DE MODELADO 3D & OPENBIM - ARQUIFY CAD/BIM        \n`;
  txt += `                      NIVEL DE DETALLE: LOD 350                 \n`;
  txt += `=================================================================\n\n`;
  txt += `PROYECTO: ${proj}\n`;
  txt += `CLIENTE:  ${client}\n`;
  txt += `FECHA:    ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}\n\n`;
  txt += `CONTENIDO DEL PAQUETE DIGITAL:\n`;
  txt += `-----------------------------------------------------------------\n`;
  txt += `1. Cocina_Completa_OpenBIM.ifc:\n`;
  txt += `   - Formato estándar OpenBIM (IFC2X3 / IFC4).\n`;
  txt += `   - Compatible con Autodesk Revit, Graphisoft Archicad, Allplan, Vectorworks y Solibri.\n`;
  txt += `   - Módulos ensamblados a cota de suelo Z=0.00 con metadatos y entidades reales.\n\n`;
  txt += `2. Cocina_Completa_3D.obj + Cocina_Completa_3D.mtl:\n`;
  txt += `   - Malla 3D completa despiezada con paneles, puertas, cajones, tiradores y cubiertas.\n`;
  txt += `   - Compatible con SketchUp, Blender, 3ds Max, Rhino, Lumion, Unreal Engine y Enscape.\n\n`;
  txt += `3. Cocina_Completa_3D.dxf:\n`;
  txt += `   - Malla 3D sólida AutoCAD con caras 3DFACE organizadas en capas técnicas:\n`;
  txt += `     * MUEBLE_CASCOS:          Laterales, pisos, techos y traseras de durolac.\n`;
  txt += `     * MUEBLE_PUERTAS:         Puertas batientes con holguras.\n`;
  txt += `     * MUEBLE_CAJONES:         Frentes de cajones individuales alineados a retícula continua.\n`;
  txt += `     * MUEBLE_CAJON_INTERIOR:  Cajas interiores de cajón (costados, contrafrente, trasera y fondo).\n`;
  txt += `     * MUEBLE_REPISAS:         Repisas interiores vistas.\n`;
  txt += `     * MUEBLE_ELECTRO:         Horno empotrado y microondas.\n`;
  txt += `     * MUEBLE_TIRADORES:       Tiradores con diseño geométrico exacto (Madrid, Forza, Denver, CE, etc.).\n`;
  txt += `     * MUEBLE_HERRAJES:        Bisagras de cazoleta Ø35mm, correderas telescópicas y tornillos Spax.\n`;
  txt += `     * MUEBLE_RIEL_GOLA:       Perfiles de gola continua Provelcar (aluminio / negro).\n`;
  txt += `     * CUBIERTA_PIEDRA:        Cubiertas de cuarzo Qstone con faldones, respaldos y cascadas laterales.\n`;
  txt += `     * ZOCALOS_PISO:           Zócalo continuo frontal y retornos laterales a muro.\n\n`;
  txt += `RESUMEN DE ELEMENTOS FABRICADOS:\n`;
  txt += `-----------------------------------------------------------------\n`;
  txt += `Total de Módulos: ${realCabinets.length}\n`;
  realCabinets.forEach((cab, i) => {
    const tagPrefix = cab.type === 'wall' ? 'A' : cab.type === 'tall' ? 'T' : cab.type === 'island' ? 'I' : 'B';
    const tag = `${tagPrefix}-${i + 1}`;
    txt += `• [${tag}] ${cab.type.toUpperCase()}: ${Math.round(cab.width)}cm Ancho x ${Math.round(cab.height)}cm Alto x ${Math.round(cab.depth)}cm Prof. (Variante: ${cab.variant || 'Estándar'})\n`;
  });
  txt += `\nCUBIERTA: ${kState?.countertopConfig?.enabled ? 'Cuarzo Qstone / Sinterizado Activo' : 'No incluida'}\n`;
  txt += `ZÓCALO:   ${kState?.showSocle ? `Activo (${kState.socleHeight ?? 10}cm)` : 'Oculto / Sin Zócalo'}\n`;
  txt += `SISTEMA:  ${kState?.golaSystem !== 'none' ? `Perfil Gola (${kState?.golaSystem})` : 'Tirador Convencional'}\n\n`;
  txt += `INSTRUCCIONES DE IMPORTACIÓN:\n`;
  txt += `• AutoCAD:   Para ver los muebles sólidos, cambia el estilo visual de '2D Wireframe' a 'Conceptual' o 'Shaded'.\n`;
  txt += `• Revit:     Pestaña 'Insertar' -> 'Vincular IFC' o 'Importar CAD (.dxf/.obj)'.\n`;
  txt += `• Archicad:  Archivo -> Interoperabilidad -> Abrir o Combinar IFC.\n`;
  txt += `• SketchUp:  Archivo -> Importar -> Seleccionar .obj o .dxf (unidades: milímetros).\n`;
  txt += `• Blender:   File -> Import -> Wavefront (.obj) o IFC.\n\n`;
  txt += `Generado por Arquify Parametric CAD/BIM System.\n`;
  return txt;
}

/**
 * 5. Descarga el Paquete Completo ZIP (.OBJ + .MTL + .IFC + .DXF 3D + MEMORIA)
 */
export async function downloadKitchenBimZip(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): Promise<void> {
  const zip = new JSZip();
  const baseName = (options.projectName || 'Proyecto_Cocina_Arquify').replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. OBJ & MTL
  const { obj, mtl } = generateKitchenObj(cabinets, kState, options);
  zip.file('Cocina_Completa_3D.obj', obj);
  zip.file('Cocina_Completa_3D.mtl', mtl);

  // 2. IFC
  const ifc = generateKitchenIfc(cabinets, kState, options);
  zip.file('Cocina_Completa_OpenBIM.ifc', ifc);

  // 3. DXF 3D
  const dxf = generateKitchen3dDxf(cabinets, kState, options);
  zip.file('Cocina_Completa_3D.dxf', dxf);

  // 4. Memoria Técnica
  const readme = generateBimTechnicalSummary(cabinets, kState, options);
  zip.file('README_ESPECIFICACIONES_BIM.txt', readme);

  // Compilar y descargar
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_3D_BIM_Package.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 6. Descarga individual de cada formato
 */
export function downloadKitchenObjFile(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): void {
  const { obj, mtl } = generateKitchenObj(cabinets, kState, options);
  const baseName = (options.projectName || 'Proyecto_Cocina').replace(/[^a-zA-Z0-9_-]/g, '_');

  const blobObj = new Blob([obj], { type: 'text/plain;charset=utf-8' });
  const urlObj = URL.createObjectURL(blobObj);
  const aObj = document.createElement('a');
  aObj.href = urlObj;
  aObj.download = `${baseName}_3D.obj`;
  document.body.appendChild(aObj);
  aObj.click();
  document.body.removeChild(aObj);
  URL.revokeObjectURL(urlObj);

  const blobMtl = new Blob([mtl], { type: 'text/plain;charset=utf-8' });
  const urlMtl = URL.createObjectURL(blobMtl);
  const aMtl = document.createElement('a');
  aMtl.href = urlMtl;
  aMtl.download = `Cocina_Completa_3D.mtl`;
  document.body.appendChild(aMtl);
  aMtl.click();
  document.body.removeChild(aMtl);
  URL.revokeObjectURL(urlMtl);
}

export function downloadKitchenIfcFile(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): void {
  const ifc = generateKitchenIfc(cabinets, kState, options);
  const baseName = (options.projectName || 'Proyecto_Cocina').replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([ifc], { type: 'application/x-step;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_OpenBIM.ifc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadKitchen3dDxfFile(
  cabinets: CabinetType[],
  kState?: Partial<KitchenStoreType>,
  options: BimExportOptions = {}
): void {
  const dxf = generateKitchen3dDxf(cabinets, kState, options);
  const baseName = (options.projectName || 'Proyecto_Cocina').replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_3D.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
