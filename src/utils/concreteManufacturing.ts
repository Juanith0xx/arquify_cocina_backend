import {
  ConcreteHouseDimensions,
  ConcreteOpening,
  ConcreteInteriorWall,
  WallThicknessMm,
  WallMeshType,
  ConcreteGrade,
  ConcreteSlump,
  ConcreteFoundationType,
  SlabType,
  RebarSteelQuality,
  ConcreteWallSystemType,
  ConcreteMezzanineSystemType,
  ConcreteRoofStructureType,
} from '../store/concreteHouseStore';

export interface ConcreteBomItem {
  id: string;
  category:
    | 'Hormigones'
    | 'Moldajes'
    | 'Enfierradura'
    | 'Albañilería & Confinamiento'
    | 'Estructuras de Madera'
    | 'Cubierta & Techumbre'
    | 'Accesorios & Químicos';
  subCategory?: string;
  name: string;
  spec: string;
  unit: 'm³' | 'm²' | 'kg' | 'un' | 'ml' | 'lt' | 'tira (6m)' | 'plancha';
  quantity: number;
  unitPriceClp: number;
  totalPriceClp: number;
  normReference: string;
}

export interface ConcreteSummaryMetrics {
  totalBuiltAreaM2: number;
  footprintAreaM2: number;
  netWallAreaM2: number;
  grossWallAreaM2: number;
  openingsAreaM2: number;
  totalOpeningsCount: number;

  // Volúmenes Hormigón (m³)
  concreteWallM3: number;
  concreteFoundationM3: number;
  concreteSlabM3: number;
  concreteLeanM3: number; // emplantillado
  totalConcreteM3: number;
  mixerTruckLoads: number; // Camiones de 7 m³

  // Moldajes (m²)
  wallFormworkM2: number;
  slabFormworkM2: number;
  foundationFormworkM2: number;
  totalFormworkM2: number;
  releaseAgentLiters: number; // desmoldante

  // Enfierradura (kg)
  meshWeightKg: number;
  meshSheetsCount: number; // planchas 2.6x5.0m
  rebarWeightKg: number; // Barras A630-420H
  stirrupsAndTiesWeightKg: number; // Trabas y estribos
  totalSteelKg: number;
  steelRatioKgM3: number; // kg acero / m³ hormigón
  tieWireKg: number; // Alambre #18
  plasticSpacersCount: number; // Calugas / ruedas separadoras

  // Materiales de Albañilería (si aplica)
  brickCount?: number;
  mortarM3?: number;
  confinedColumnsCount?: number;

  // Materiales de Madera (si aplica)
  timberBeamsMl?: number;
  roofTrussesCount?: number;
  roofSheetingM2?: number;

  // Costo Estimado
  totalCostClp: number;
  costPerM2Clp: number;

  items: ConcreteBomItem[];
}

// Pesos nominales de acero según NCh204 y Manual ICH
export const STEEL_BAR_WEIGHT_KG_M: Record<number, number> = {
  6: 0.222,
  8: 0.395,
  10: 0.617,
  12: 0.888,
  16: 1.580,
  18: 2.000,
  22: 2.980,
  25: 3.850,
};

// Mallas AT56-50H estándar Chile (Mallas Electrosoldadas ICH pág 13-14)
export const MESH_WEIGHT_KG_M2: Record<number, { kgM2: number; name: string }> = {
  4.2: { kgM2: 1.45, name: 'Malla C-139 (Ø4.2 @15x15 cm)' },
  5.0: { kgM2: 2.05, name: 'Malla C-188 (Ø5.0 @15x15 cm)' },
  6.0: { kgM2: 2.96, name: 'Malla C-257 (Ø6.0 @15x15 cm)' },
  7.0: { kgM2: 4.02, name: 'Malla C-335 (Ø7.0 @15x15 cm)' },
  8.0: { kgM2: 5.26, name: 'Malla C-435 (Ø8.0 @15x15 cm)' },
};

// Precios de referencia industrial en Chile (CLP)
export const CONCRETE_DEFAULT_PRICES = {
  concreteG20_M3: 82000,    // H25 Hormigón bombeable cono 18cm
  concreteG25_M3: 89000,    // H30 Hormigón fluido
  concreteG30_M3: 98000,    // H35 Alta resistencia
  concreteLean_M3: 65000,   // H5/H10 Emplantillado
  formworkRental_M2: 14500, // Arriendo/faena moldaje metálico/fenólico
  rebarA630_Kg: 1350,       // Acero corrugado A630-420H dimensionado
  meshAT56_Kg: 1450,        // Malla electrosoldada AT56-50H
  spacers_Un: 180,          // Caluga / rueda separadora plástica
  tieWire_Kg: 2200,         // Alambre recocido #18
  releaseAgent_Lt: 4500,    // Desmoldante base vegetal / mineral
  vaporBarrier_M2: 850,     // Film polietileno 0.2mm
  
  // Nuevos Precios para Albañilería Confinada (NCh2123 / NCh1928)
  brickPrincesa_Un: 460,        // Ladrillo cerámico estructural Princesa / Titan 29x14x11cm
  masonryMortar_M3: 78000,      // Mortero de pega predosificado M10/M15 (1:3)
  jointReinforcement_Ml: 850,   // Escalerrilla electroforjada Ø4.2mm para tendel
  
  // Nuevos Precios para Estructuras de Madera (NCh1198)
  timberJoist_Ml: 5800,         // Viga pino estructural C24 2x8" o 3x8" impregnado
  osbFloorSheet_Un: 22500,      // Tablero OSB / Terciado estructural 20mm (1.22x2.44m)
  roofTruss_Un: 38000,          // Cercha / tijeral estructural armado con conectores
  roofCostanera_Ml: 1450,       // Costanera pino 2x2" seca
  roofZincSheet_M2: 6800,       // Plancha de zinc alum ondulada / PV4 prepintada
  roofRidgeCap_Ml: 4900,        // Caballete / Cumbrera de zinc prepintado
  roofFelt_M2: 950,             // Fieltro asfáltico 15 lbs / barrera hidrófuga
  acousticWool_M2: 3200,        // Aislación lana mineral e=80mm
};

export function calculateConcreteHouseBOM(
  dims: ConcreteHouseDimensions,
  wallThicknessMm: WallThicknessMm,
  meshType: WallMeshType,
  concreteGrade: ConcreteGrade,
  concreteSlump: ConcreteSlump,
  foundationType: ConcreteFoundationType,
  slabType: SlabType,
  rebarQuality: RebarSteelQuality,
  meshDiameterMm: number,
  openings: ConcreteOpening[],
  interiorWalls: ConcreteInteriorWall[] = [],
  wallSystemType: ConcreteWallSystemType = 'hormigon_armado_total',
  mezzanineSystemType: ConcreteMezzanineSystemType = 'losa_hormigon_armado',
  roofStructureType: ConcreteRoofStructureType = 'dos_aguas_hormigon'
): ConcreteSummaryMetrics {
  const widthM = dims.width / 100;
  const lengthM = dims.length / 100;
  const wallHeightM = dims.wallHeight / 100;
  const wallThicknessM = wallThicknessMm / 1000;
  const levels = dims.levels;

  // 1. Áreas
  const footprintAreaM2 = widthM * lengthM;
  const totalBuiltAreaM2 = footprintAreaM2 * levels;

  // Perímetro exterior
  const exteriorPerimeterM = 2 * (widthM + lengthM);
  const grossExteriorWallAreaM2 = exteriorPerimeterM * wallHeightM * levels;

  // Muros interiores
  let interiorWallAreaM2 = 0;
  interiorWalls.forEach((w) => {
    const dx = (w.endX - w.startX) / 100;
    const dz = (w.endZ - w.startZ) / 100;
    const len = Math.sqrt(dx * dx + dz * dz);
    interiorWallAreaM2 += len * wallHeightM;
  });

  const grossWallAreaM2 = grossExteriorWallAreaM2 + interiorWallAreaM2;

  // Vanos
  let openingsAreaM2 = 0;
  let openingsPerimeterM = 0;
  let windowsCount = 0;
  let doorsCount = 0;

  openings.forEach((op) => {
    const wM = op.width / 100;
    const hM = op.height / 100;
    openingsAreaM2 += wM * hM;
    openingsPerimeterM += 2 * (wM + hM);
    if (op.type === 'door') doorsCount++;
    else windowsCount++;
  });

  const netWallAreaM2 = Math.max(1, grossWallAreaM2 - openingsAreaM2);
  const totalOpeningsCount = openings.length;

  // 2. Cálculo según Sistema de Muros (Paso 1)
  let concreteWallM3 = 0;
  let wallFormworkM2 = 0;
  let meshWeightKg = 0;
  let meshSheetsCount = 0;
  let brickCount = 0;
  let mortarM3 = 0;
  let confinedColumnsCount = 0;

  if (wallSystemType === 'hormigon_armado_total') {
    // Muros completamente vaciados en hormigón armado (NCh430 / DS60)
    concreteWallM3 = netWallAreaM2 * wallThicknessM * 1.05; // 5% merma
    wallFormworkM2 = (netWallAreaM2 * 2) + (openingsPerimeterM * wallThicknessM);

    const meshInfo = MESH_WEIGHT_KG_M2[meshDiameterMm] || MESH_WEIGHT_KG_M2[5.0];
    const meshMultiplier = meshType === 'malla_doble' ? 2 : 1;
    const meshNetAreaM2 = netWallAreaM2 * meshMultiplier * 1.10; // 10% traslapes
    meshWeightKg = meshNetAreaM2 * meshInfo.kgM2;
    meshSheetsCount = Math.ceil(meshNetAreaM2 / (2.6 * 5.0)); // Planchas estándar 2.6x5.0m
  } else {
    // Albañilería Confinada (NCh2123 / NCh1928)
    // Pilares de confinamiento en esquinas (4), bordes de vanos (2 x vanos) y tramos intermedios cada <= 3.5m
    const intermediateCols = Math.ceil(exteriorPerimeterM / 3.2);
    confinedColumnsCount = 4 + (totalOpeningsCount * 2) + intermediateCols;
    const columnSectionAreaM2 = 0.20 * 0.20; // Pilar tipo 20x20cm o 20x15cm
    const columnConcreteTotalM3 = confinedColumnsCount * columnSectionAreaM2 * wallHeightM * levels;

    // Cadenas de amarre y dinteles de hormigón armado (20x20cm)
    const beamChainM3 = exteriorPerimeterM * 0.20 * 0.20 * levels;
    concreteWallM3 = (columnConcreteTotalM3 + beamChainM3) * 1.05;

    // Área neta de paños de ladrillo (descontando pilares y cadenas)
    const columnElevationAreaM2 = confinedColumnsCount * 0.20 * wallHeightM * levels;
    const beamElevationAreaM2 = exteriorPerimeterM * 0.20 * levels;
    const netBrickWallAreaM2 = Math.max(1, netWallAreaM2 - columnElevationAreaM2 - beamElevationAreaM2);

    brickCount = Math.ceil(netBrickWallAreaM2 * 38); // 38 ladrillos Princesa/m²
    mortarM3 = Number((netBrickWallAreaM2 * 0.024).toFixed(2)); // ~0.024 m³ mortero/m²

    // Moldajes para pilares (2-3 caras) y cadenas
    wallFormworkM2 = (confinedColumnsCount * (0.20 * 3) * wallHeightM * levels) + (exteriorPerimeterM * 0.20 * 2 * levels);
    meshWeightKg = 0;
    meshSheetsCount = 0;
  }

  // 3. Fundaciones
  let concreteFoundationM3 = 0;
  let concreteLeanM3 = 0; // emplantillado
  let foundationFormworkM2 = 0;

  if (foundationType === 'losa_fundacion_suples') {
    const slabThickM = 0.12;
    const beamExtraM3 = exteriorPerimeterM * 0.30 * 0.25;
    concreteFoundationM3 = (footprintAreaM2 * slabThickM + beamExtraM3) * 1.05;
    concreteLeanM3 = (footprintAreaM2 * 0.05);
    foundationFormworkM2 = exteriorPerimeterM * (slabThickM + 0.25);
  } else {
    const footingM3 = exteriorPerimeterM * 0.40 * 0.60;
    const stemWallM3 = exteriorPerimeterM * wallThicknessM * 0.30;
    const slabM3 = (footprintAreaM2 - exteriorPerimeterM * wallThicknessM) * 0.10;
    concreteFoundationM3 = (footingM3 + stemWallM3 + slabM3) * 1.05;
    concreteLeanM3 = exteriorPerimeterM * 0.50 * 0.05;
    foundationFormworkM2 = exteriorPerimeterM * (0.60 + 0.30) * 2;
  }

  // 4. Entrepiso (Paso 2) y Cubierta (Paso 3)
  let concreteSlabM3 = 0;
  let slabFormworkM2 = 0;
  let timberBeamsMl = 0;
  let roofTrussesCount = 0;
  let roofSheetingM2 = 0;

  // Paso 2: Entrepiso si levels === 2
  if (levels === 2) {
    if (mezzanineSystemType === 'losa_hormigon_armado') {
      concreteSlabM3 += footprintAreaM2 * 0.12 * 1.05;
      slabFormworkM2 += footprintAreaM2;
    } else {
      // Entrepiso liviano de madera: Vigas 3x8" @ 40cm a lo ancho
      const numJoists = Math.floor(lengthM / 0.40) + 1;
      timberBeamsMl += numJoists * widthM + (lengthM * 2); // vigas + soleras
    }
  }

  // Paso 3: Estructura de Techumbre
  if (roofStructureType === 'dos_aguas_hormigon') {
    // Losa inclinada monolítica de H.A. e=15cm + hastiales triangulares
    const halfW = widthM / 2 + 0.4;
    const ridgeH = (dims.roofRidgeHeightCm || 175) / 100;
    const slopeLen = Math.sqrt(halfW * halfW + ridgeH * ridgeH);
    const roofAreaM2 = slopeLen * (lengthM + 0.8) * 2;
    // Si la vivienda cuenta con patio central / pabellones (ej: Casa TT), se calculan 4 hastiales (2 exteriores + 2 interiores de patio)
    const numGables = (dims.width >= 450 && dims.length >= 1200) ? 4 : 2;
    const singleGableAreaM2 = 0.5 * widthM * ridgeH;
    const gableAreaM2 = singleGableAreaM2 * numGables;
    if (wallSystemType === 'hormigon_armado_total') {
      concreteSlabM3 += (roofAreaM2 * 0.15 + gableAreaM2 * wallThicknessM) * 1.05;
      slabFormworkM2 += roofAreaM2 + gableAreaM2 * 2;
    } else {
      // Albañilería confinada: hormigón de vigas inclinadas, cadenas y pilarejo central en tímpanos
      concreteSlabM3 += (roofAreaM2 * 0.15 + numGables * (slopeLen * 2 + ridgeH + widthM) * 0.15 * 0.14) * 1.05;
      slabFormworkM2 += roofAreaM2 + numGables * (slopeLen * 2 + ridgeH + widthM) * 0.15 * 2;
    }
  } else if (roofStructureType === 'losa_plana_hormigon') {
    // Losa plana de H.A. e=12cm + parapeto perimetral
    concreteSlabM3 += (footprintAreaM2 * 0.12 + exteriorPerimeterM * 0.10 * 0.25) * 1.05;
    slabFormworkM2 += footprintAreaM2;
  } else {
    // Techumbre Liviana de Madera (NCh1198): Cadena H.A. + Cerchas @ 90cm + Cubierta
    concreteSlabM3 += (exteriorPerimeterM * wallThicknessM * 0.20) * 1.05;
    roofTrussesCount = Math.floor(lengthM / 0.90) + 1;
    const halfW = widthM / 2 + 0.4;
    const ridgeH = (dims.roofRidgeHeightCm || 175) / 100;
    const slopeLen = Math.sqrt(halfW * halfW + ridgeH * ridgeH);
    roofSheetingM2 = Number((slopeLen * (lengthM + 0.8) * 2 * 1.15).toFixed(1));
  }

  const totalConcreteM3 = concreteWallM3 + concreteFoundationM3 + concreteSlabM3 + concreteLeanM3;
  const mixerTruckLoads = Math.ceil(totalConcreteM3 / 7);

  const totalFormworkM2 = wallFormworkM2 + slabFormworkM2 + foundationFormworkM2;
  const releaseAgentLiters = Math.ceil(totalFormworkM2 / 15);

  // 5. Enfierradura & Acero (kg)
  let cornerRebarKg = 0;
  let beamRebarKg = 0;
  let lintelRebarKg = 0;
  let diagonalRebarKg = 0;
  let stirrupsAndTiesWeightKg = 0;

  if (wallSystemType === 'hormigon_armado_total') {
    const cornersCount = 4;
    const cornerBarsPerCorner = 4;
    const cornerRebarLengthM = cornersCount * cornerBarsPerCorner * (wallHeightM * levels + 0.6);
    cornerRebarKg = cornerRebarLengthM * STEEL_BAR_WEIGHT_KG_M[12];

    let lintelRebarLengthM = 0;
    openings.forEach((op) => {
      const wM = op.width / 100;
      lintelRebarLengthM += (wM + 1.0) * 2;
      if (op.type === 'window') {
        lintelRebarLengthM += (wM + 0.8) * 2;
      }
    });
    lintelRebarKg = lintelRebarLengthM * STEEL_BAR_WEIGHT_KG_M[12];
    diagonalRebarKg = windowsCount * 4 * 0.80 * STEEL_BAR_WEIGHT_KG_M[10];
    beamRebarKg = exteriorPerimeterM * 4 * levels * STEEL_BAR_WEIGHT_KG_M[12];

    const stirrupCount = Math.ceil((cornersCount * wallHeightM * levels / 0.15) + (exteriorPerimeterM * levels / 0.20));
    const stirrupLengthEachM = (wallThicknessM * 2 + 0.20 * 2) + 0.15;
    stirrupsAndTiesWeightKg = stirrupCount * stirrupLengthEachM * STEEL_BAR_WEIGHT_KG_M[8];
  } else {
    // Albañilería Confinada: 4Ø10/4Ø12 en cada pilar y cadena + estribos Ø6@10-15cm (NCh2123)
    const columnRebarLengthM = confinedColumnsCount * 4 * (wallHeightM * levels + 0.6);
    cornerRebarKg = columnRebarLengthM * STEEL_BAR_WEIGHT_KG_M[10];

    const beamChainLengthM = exteriorPerimeterM * 4 * levels;
    beamRebarKg = beamChainLengthM * STEEL_BAR_WEIGHT_KG_M[10];

    // Estribos de pilares y cadenas: Ø6 cada 10cm en zonas críticas, cada 15cm en zona central
    const totalColsHeightM = confinedColumnsCount * wallHeightM * levels;
    const colStirrupsCount = Math.ceil(totalColsHeightM / 0.12);
    const beamStirrupsCount = Math.ceil(exteriorPerimeterM * levels / 0.15);
    const totalStirrups = colStirrupsCount + beamStirrupsCount;
    stirrupsAndTiesWeightKg = totalStirrups * 0.75 * STEEL_BAR_WEIGHT_KG_M[6];
  }

  // Armadura de fundación
  const foundationRebarKg = exteriorPerimeterM * 4 * STEEL_BAR_WEIGHT_KG_M[12] + (footprintAreaM2 * 2.5);
  const rebarWeightKg = cornerRebarKg + lintelRebarKg + diagonalRebarKg + beamRebarKg + foundationRebarKg;

  const totalSteelKg = meshWeightKg + rebarWeightKg + stirrupsAndTiesWeightKg;
  const steelRatioKgM3 = totalSteelKg / Math.max(1, (concreteWallM3 + concreteFoundationM3 + concreteSlabM3));

  const tieWireKg = Math.ceil(totalSteelKg * 0.015);
  const plasticSpacersCount = Math.ceil((netWallAreaM2 * (meshType === 'malla_doble' ? 2 : 1) * 4) + (footprintAreaM2 * 4));

  // 6. Generación del Listado Detallado BOM
  const items: ConcreteBomItem[] = [
    // Hormigones
    {
      id: 'conc-1',
      category: 'Hormigones',
      subCategory: wallSystemType === 'hormigon_armado_total' ? 'Muros Estructurales' : 'Pilares & Cadenas de Confinamiento',
      name: `Hormigón Estructural ${concreteGrade.replace('_', ' / ')}`,
      spec: wallSystemType === 'hormigon_armado_total' 
        ? `Muros e=${wallThicknessMm}mm, cono ${concreteSlump === 'fluido_18cm' ? '≥18 cm (Fluido)' : '10-12 cm'}, NCh170:2016`
        : `Pilares y Cadenas de amarre sección 20x20cm según NCh2123`,
      unit: 'm³',
      quantity: Number(concreteWallM3.toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.concreteG20_M3,
      totalPriceClp: Math.round(concreteWallM3 * CONCRETE_DEFAULT_PRICES.concreteG20_M3),
      normReference: wallSystemType === 'hormigon_armado_total' ? 'NCh170 / NCh430 / DS60' : 'NCh2123 / NCh170',
    },
    {
      id: 'conc-2',
      category: 'Hormigones',
      subCategory: 'Fundaciones',
      name: `Hormigón Fundación ${concreteGrade.replace('_', ' / ')}`,
      spec: `${foundationType === 'losa_fundacion_suples' ? 'Losa de Fundación + Viga perimetral' : 'Cimiento corrido + Radier interior'}, NCh170`,
      unit: 'm³',
      quantity: Number(concreteFoundationM3.toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.concreteG20_M3,
      totalPriceClp: Math.round(concreteFoundationM3 * CONCRETE_DEFAULT_PRICES.concreteG20_M3),
      normReference: 'NCh170:2016 / ICH Cap. II-III',
    },
    {
      id: 'conc-3',
      category: 'Hormigones',
      subCategory: 'Losas, Entrepisos & Cubierta',
      name: `Hormigón Losa / Coronaciones ${concreteGrade.replace('_', ' / ')}`,
      spec: `${roofStructureType === 'dos_aguas_hormigon' ? 'Losa dos aguas y hastiales monolíticos' : roofStructureType === 'losa_plana_hormigon' ? 'Losa plana de hormigón armado e=12cm' : 'Cadena de coronación perimetral'}, NCh170`,
      unit: 'm³',
      quantity: Number(concreteSlabM3.toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.concreteG20_M3,
      totalPriceClp: Math.round(concreteSlabM3 * CONCRETE_DEFAULT_PRICES.concreteG20_M3),
      normReference: 'NCh430 / ICH Cap. IV',
    },
    {
      id: 'conc-4',
      category: 'Hormigones',
      subCategory: 'Sello de Fundación',
      name: 'Emplantillado Hormigón Pobre H5 / H10',
      spec: 'Espesor 5cm bajo fundaciones para nivelación y recubrimiento limpio',
      unit: 'm³',
      quantity: Number(concreteLeanM3.toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.concreteLean_M3,
      totalPriceClp: Math.round(concreteLeanM3 * CONCRETE_DEFAULT_PRICES.concreteLean_M3),
      normReference: 'NCh170 / ICH Lám. 17, 20, 27',
    },
  ];

  // Moldajes
  items.push(
    {
      id: 'mold-1',
      category: 'Moldajes',
      subCategory: wallSystemType === 'hormigon_armado_total' ? 'Muros' : 'Pilares & Cadenas',
      name: wallSystemType === 'hormigon_armado_total' ? 'Moldaje Industrializado para Muros (2 Caras)' : 'Moldaje de Pilares y Cadenas de Confinamiento',
      spec: `Superficie de contacto neta con desmolde fácil`,
      unit: 'm²',
      quantity: Number(wallFormworkM2.toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.formworkRental_M2,
      totalPriceClp: Math.round(wallFormworkM2 * CONCRETE_DEFAULT_PRICES.formworkRental_M2),
      normReference: wallSystemType === 'hormigon_armado_total' ? 'NCh430 / Criterio ICH' : 'NCh2123',
    },
    {
      id: 'mold-2',
      category: 'Moldajes',
      subCategory: 'Losas & Fundaciones',
      name: 'Moldaje Fondos de Losa / Sobrecimientos',
      spec: 'Encofrado horizontal con alzaprimas y perfiles de borde',
      unit: 'm²',
      quantity: Number((slabFormworkM2 + foundationFormworkM2).toFixed(2)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.formworkRental_M2,
      totalPriceClp: Math.round((slabFormworkM2 + foundationFormworkM2) * CONCRETE_DEFAULT_PRICES.formworkRental_M2),
      normReference: 'NCh430:2008',
    },
    {
      id: 'mold-3',
      category: 'Moldajes',
      subCategory: 'Químicos de Desmolde',
      name: 'Desmoldante Químico Biodegradable',
      spec: 'Rendimiento 15 m²/litro para acabado de hormigón visto liso sin manchas',
      unit: 'lt',
      quantity: releaseAgentLiters,
      unitPriceClp: CONCRETE_DEFAULT_PRICES.releaseAgent_Lt,
      totalPriceClp: releaseAgentLiters * CONCRETE_DEFAULT_PRICES.releaseAgent_Lt,
      normReference: 'Manual ICH pág. 7',
    }
  );

  // Albañilería Confinada (si fue seleccionada en Paso 1)
  if (wallSystemType === 'albanileria_confinada') {
    items.push(
      {
        id: 'alb-1',
        category: 'Albañilería & Confinamiento',
        subCategory: 'Ladrillos Cerámicos',
        name: 'Ladrillo Cerámico Estructural Princesa / Titan (29x14x11 cm)',
        spec: 'Ladrillo hecho a máquina grado 1, compresión fp ≥ 15 MPa, NCh1928 / NCh2123',
        unit: 'un',
        quantity: brickCount,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.brickPrincesa_Un,
        totalPriceClp: brickCount * CONCRETE_DEFAULT_PRICES.brickPrincesa_Un,
        normReference: 'NCh2123:2003 / NCh1928',
      },
      {
        id: 'alb-2',
        category: 'Albañilería & Confinamiento',
        subCategory: 'Mortero de Pega',
        name: 'Mortero de Pega Predosificado Grado M10 / M15 (1:3)',
        spec: 'Mortero con retención de agua ≥ 70%, juntas e=10-15mm rehundidas, NCh2256/1',
        unit: 'm³',
        quantity: mortarM3,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.masonryMortar_M3,
        totalPriceClp: Math.round(mortarM3 * CONCRETE_DEFAULT_PRICES.masonryMortar_M3),
        normReference: 'NCh2256/1 / NCh2123',
      },
      {
        id: 'alb-3',
        category: 'Albañilería & Confinamiento',
        subCategory: 'Armadura de Tendel',
        name: 'Escalerrilla Electroforjada Ø4.2 mm (10cm ancho)',
        spec: 'Refuerzo horizontal en juntas de mortero cada 2 hiladas (50cm vertical)',
        unit: 'ml',
        quantity: Math.ceil(exteriorPerimeterM * (wallHeightM / 0.50) * levels),
        unitPriceClp: CONCRETE_DEFAULT_PRICES.jointReinforcement_Ml,
        totalPriceClp: Math.ceil(exteriorPerimeterM * (wallHeightM / 0.50) * levels) * CONCRETE_DEFAULT_PRICES.jointReinforcement_Ml,
        normReference: 'NCh2123 Cláusula 6.2',
      }
    );
  }

  // Enfierradura
  if (wallSystemType === 'hormigon_armado_total') {
    const meshInfo = MESH_WEIGHT_KG_M2[meshDiameterMm] || MESH_WEIGHT_KG_M2[5.0];
    items.push({
      id: 'enf-1',
      category: 'Enfierradura',
      subCategory: 'Mallas Electrosoldadas',
      name: `${meshInfo.name} (${meshType === 'malla_doble' ? 'Doble Malla' : 'Malla Central'})`,
      spec: `Acero trefilado corrugado AT56-50H, espaciamiento 15x15cm, NCh218/ASTM A497`,
      unit: 'kg',
      quantity: Number(meshWeightKg.toFixed(1)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.meshAT56_Kg,
      totalPriceClp: Math.round(meshWeightKg * CONCRETE_DEFAULT_PRICES.meshAT56_Kg),
      normReference: 'NCh204 / Manual ICH pág. 11-14',
    });
  }

  items.push(
    {
      id: 'enf-2',
      category: 'Enfierradura',
      subCategory: 'Barras Longitudinales',
      name: `Barras de Refuerzo Dúctiles ${rebarQuality.replace('_', '-')}`,
      spec: `Barras corrugadas Ø10, Ø12, Ø16 en esquinas, coronación y dinteles de vanos`,
      unit: 'kg',
      quantity: Number(rebarWeightKg.toFixed(1)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.rebarA630_Kg,
      totalPriceClp: Math.round(rebarWeightKg * CONCRETE_DEFAULT_PRICES.rebarA630_Kg),
      normReference: 'NCh204:2020 / NCh430 / NCh2123',
    },
    {
      id: 'enf-3',
      category: 'Enfierradura',
      subCategory: 'Confinamiento & Estribos',
      name: 'Trabas, Estribos y Refuerzos Sísmicos en Vanos y Pilares',
      spec: `Ganchos estándar 135° (6db ≥ 75mm) Ø8/Ø6 y horquillas de confinamiento`,
      unit: 'kg',
      quantity: Number(stirrupsAndTiesWeightKg.toFixed(1)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.rebarA630_Kg,
      totalPriceClp: Math.round(stirrupsAndTiesWeightKg * CONCRETE_DEFAULT_PRICES.rebarA630_Kg),
      normReference: 'Manual ICH pág. 9, 22 / NCh2123',
    }
  );

  // Estructuras de Madera (Paso 2: Entrepiso de madera si levels === 2)
  if (levels === 2 && mezzanineSystemType === 'entrepiso_madera_liviano') {
    const osbSheets = Math.ceil(footprintAreaM2 / (1.22 * 2.44));
    items.push(
      {
        id: 'mad-1',
        category: 'Estructuras de Madera',
        subCategory: 'Envigado de Entrepiso',
        name: 'Vigas de Madera Pino Estructural C24 (3x8" / 7.5x20cm @ 40cm)',
        spec: 'Madera tratada seca en cámara, grado estructural C24 NCh1198 con apoyos en solera',
        unit: 'ml',
        quantity: Math.ceil(timberBeamsMl),
        unitPriceClp: CONCRETE_DEFAULT_PRICES.timberJoist_Ml,
        totalPriceClp: Math.ceil(timberBeamsMl) * CONCRETE_DEFAULT_PRICES.timberJoist_Ml,
        normReference: 'NCh1198 / Manual de Construcción en Madera',
      },
      {
        id: 'mad-2',
        category: 'Estructuras de Madera',
        subCategory: 'Placa Colaborante de Piso',
        name: 'Tablero Estructural OSB / Terciado Estructural e=20mm (1.22x2.44m)',
        spec: 'Tablero machihembrado fijado con tornillos estructurales Spax/Simpson @ 15cm',
        unit: 'plancha',
        quantity: osbSheets,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.osbFloorSheet_Un,
        totalPriceClp: osbSheets * CONCRETE_DEFAULT_PRICES.osbFloorSheet_Un,
        normReference: 'NCh1198 / NCh2165',
      },
      {
        id: 'mad-3',
        category: 'Estructuras de Madera',
        subCategory: 'Aislación Acústica de Entrepiso',
        name: 'Lana Mineral Aislante Acústica e=80mm (Densidad 40 kg/m³)',
        spec: 'Colocada entre vigas para amortiguación de impacto acústico aéreo y pisadas',
        unit: 'm²',
        quantity: Math.ceil(footprintAreaM2),
        unitPriceClp: CONCRETE_DEFAULT_PRICES.acousticWool_M2,
        totalPriceClp: Math.ceil(footprintAreaM2) * CONCRETE_DEFAULT_PRICES.acousticWool_M2,
        normReference: 'OGUC Art. 4.1.6 / NCh352',
      }
    );
  }

  // Cubierta & Techumbre (Paso 3: Techumbre liviana de madera)
  if (roofStructureType === 'techumbre_madera_liviana') {
    const costaneraMl = Math.ceil((roofSheetingM2 / 0.50) * 1.10);
    const zincSheets = Math.ceil(roofSheetingM2 / (1.05 * 3.0));
    const ridgeCapMl = Math.ceil(lengthM + 1.0);

    items.push(
      {
        id: 'cub-1',
        category: 'Cubierta & Techumbre',
        subCategory: 'Cerchas Estructurales',
        name: 'Cerchas / Tijerales de Madera Pino Estructural C16 (Escuadría 2x4" @ 90cm)',
        spec: 'Uniones con placas conectoras dentadas galvanizadas / clavadas según NCh1198',
        unit: 'un',
        quantity: roofTrussesCount,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.roofTruss_Un,
        totalPriceClp: roofTrussesCount * CONCRETE_DEFAULT_PRICES.roofTruss_Un,
        normReference: 'NCh1198:2014 / NCh433',
      },
      {
        id: 'cub-2',
        category: 'Cubierta & Techumbre',
        subCategory: 'Costaneras',
        name: 'Costaneras de Pino Seco 2x2" (45x45 mm @ 50cm)',
        spec: 'Clavadas sobre cerchas para fijación de planchas de cubierta',
        unit: 'ml',
        quantity: costaneraMl,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.roofCostanera_Ml,
        totalPriceClp: costaneraMl * CONCRETE_DEFAULT_PRICES.roofCostanera_Ml,
        normReference: 'NCh1198',
      },
      {
        id: 'cub-3',
        category: 'Cubierta & Techumbre',
        subCategory: 'Planchas de Cubierta',
        name: 'Cubierta Planchas Zinc-Alum PV4 Prepintado Charcoal 0.4 mm',
        spec: 'Planchas continuas con traslape lateral y fijación autorroscante con golilla neopreno',
        unit: 'm²',
        quantity: roofSheetingM2,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.roofZincSheet_M2,
        totalPriceClp: Math.round(roofSheetingM2 * CONCRETE_DEFAULT_PRICES.roofZincSheet_M2),
        normReference: 'NCh222 / NCh223',
      },
      {
        id: 'cub-4',
        category: 'Cubierta & Techumbre',
        subCategory: 'Hojalatería & Sellos',
        name: 'Caballete Cumbrera Zinc-Alum 0.4 mm + Fieltro Asfáltico 15 lbs',
        spec: 'Cumbrera conformada con desarrollo 40cm + membrana hidrófuga bajo costaneras',
        unit: 'ml',
        quantity: ridgeCapMl,
        unitPriceClp: CONCRETE_DEFAULT_PRICES.roofRidgeCap_Ml,
        totalPriceClp: ridgeCapMl * CONCRETE_DEFAULT_PRICES.roofRidgeCap_Ml,
        normReference: 'Manual CChC / NCh222',
      }
    );
  }

  // Accesorios & Fijaciones
  items.push(
    {
      id: 'acc-1',
      category: 'Accesorios & Químicos',
      subCategory: 'Separadores',
      name: meshType === 'malla_central' ? 'Ruedas Separadoras Plásticas para Malla Central' : 'Separadores H de Malla Doble y Silletas',
      spec: `Garantiza recubrimiento normativo de ${wallThicknessMm <= 100 ? '20mm' : '25mm'}, densidad 4 un/m²`,
      unit: 'un',
      quantity: plasticSpacersCount,
      unitPriceClp: CONCRETE_DEFAULT_PRICES.spacers_Un,
      totalPriceClp: plasticSpacersCount * CONCRETE_DEFAULT_PRICES.spacers_Un,
      normReference: 'Manual ICH pág. 11-13 (Fig. 7, 8, 9)',
    },
    {
      id: 'acc-2',
      category: 'Accesorios & Químicos',
      subCategory: 'Amarras',
      name: 'Alambre Negro Recocido #18',
      spec: 'Alambre para amarre de armaduras y mallas en nudos estructurales',
      unit: 'kg',
      quantity: tieWireKg,
      unitPriceClp: CONCRETE_DEFAULT_PRICES.tieWire_Kg,
      totalPriceClp: tieWireKg * CONCRETE_DEFAULT_PRICES.tieWire_Kg,
      normReference: 'Manual ICH pág. 9 (Sec. 4.10)',
    },
    {
      id: 'acc-3',
      category: 'Accesorios & Químicos',
      subCategory: 'Aislación de Humedad',
      name: 'Barrera de Vapor Film Polietileno 0.20 mm',
      spec: 'Colocado bajo radier/losa de fundación con traslapes de 20cm',
      unit: 'm²',
      quantity: Number((footprintAreaM2 * 1.15).toFixed(1)),
      unitPriceClp: CONCRETE_DEFAULT_PRICES.vaporBarrier_M2,
      totalPriceClp: Math.round(footprintAreaM2 * 1.15 * CONCRETE_DEFAULT_PRICES.vaporBarrier_M2),
      normReference: 'NCh170 / Buenas Prácticas ICH',
    }
  );

  const totalCostClp = items.reduce((acc, it) => acc + it.totalPriceClp, 0);
  const costPerM2Clp = totalBuiltAreaM2 > 0 ? Math.round(totalCostClp / totalBuiltAreaM2) : 0;

  return {
    totalBuiltAreaM2,
    footprintAreaM2,
    netWallAreaM2,
    grossWallAreaM2,
    openingsAreaM2,
    totalOpeningsCount,

    concreteWallM3,
    concreteFoundationM3,
    concreteSlabM3,
    concreteLeanM3,
    totalConcreteM3,
    mixerTruckLoads,

    wallFormworkM2,
    slabFormworkM2,
    foundationFormworkM2,
    totalFormworkM2,
    releaseAgentLiters,

    meshWeightKg,
    meshSheetsCount,
    rebarWeightKg,
    stirrupsAndTiesWeightKg,
    totalSteelKg,
    steelRatioKgM3,
    tieWireKg,
    plasticSpacersCount,

    brickCount,
    mortarM3,
    confinedColumnsCount,
    timberBeamsMl,
    roofTrussesCount,
    roofSheetingM2,

    totalCostClp,
    costPerM2Clp,

    items,
  };
}
