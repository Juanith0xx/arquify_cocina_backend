export type CountertopMaterialType = 'quarzo' | 'sinterizado' | 'hpl_abet';

export interface QstoneProductItem {
  id: string;
  code: string;
  name: string;
  materialType: CountertopMaterialType;
  thicknessMm: 8 | 12 | 18 | 20;
  priceM2Clp: number;
  sheetWidthMm: number; // 3200 o 3050 (Abet)
  sheetHeightMm: number; // 1600 o 1300 (Abet)
  colorHex: string;
  textureUrl?: string;
  finish: string;
  description: string;
  active: boolean;
}

export type BacksplashMode = 'none' | 'standard_5cm' | 'full_height';
export type BuildingType = 'casa' | 'edificio'; // 250 cm vs 200 cm máx por tramo

export type SinkModelId = 'none' | 'alfa_onec_3018' | 'alfa_twoc_f5858a';
export type CooktopModelId = 'none' | 'fdv_design_60' | 'fdv_design_90';

export interface SinkSpec {
  id: SinkModelId;
  name: string;
  brand: string;
  code: string;
  bowls: number;
  material: string;
  overallWidthMm: number;
  overallDepthMm: number;
  overallHeightMm: number;
  cutoutWidthMm: number;
  cutoutDepthMm: number;
  cutoutRadiusMm: number;
  minCabinetWidthCm: number;
  valveDiameterMm: number;
  installation: 'bajocubierta';
  pdfRef: string;
}

export interface CooktopSpec {
  id: CooktopModelId;
  name: string;
  brand: string;
  code: string;
  burners: number;
  material: string;
  productWidthMm: number;
  productDepthMm: number;
  productHeightMm: number;
  cutoutWidthMm: number;
  cutoutDepthMm: number;
  minCabinetWidthCm: number;
  gasType: string;
  pdfRef: string;
}

export const QSTONE_SINKS: Record<SinkModelId, SinkSpec | null> = {
  none: null,
  alfa_onec_3018: {
    id: 'alfa_onec_3018',
    name: 'Lavaplatos ALFA ONEC 3018',
    brand: 'Sysprotec / Qstone',
    code: 'ALFA-ONEC-3018',
    bowls: 1,
    material: 'Acero Inoxidable 304 (1.2mm)',
    overallWidthMm: 775,
    overallDepthMm: 480,
    overallHeightMm: 230,
    cutoutWidthMm: 695,
    cutoutDepthMm: 400,
    cutoutRadiusMm: 15,
    minCabinetWidthCm: 80,
    valveDiameterMm: 90,
    installation: 'bajocubierta',
    pdfRef: 'ALFA ONEC 3018.pdf'
  },
  alfa_twoc_f5858a: {
    id: 'alfa_twoc_f5858a',
    name: 'Lavaplatos ALFA TWOC F5858A',
    brand: 'Sysprotec / Qstone',
    code: 'ALFA-TWOC-F5858A',
    bowls: 2,
    material: 'Acero Inoxidable 304 (1.2mm)',
    overallWidthMm: 810,
    overallDepthMm: 480,
    overallHeightMm: 210,
    cutoutWidthMm: 730,
    cutoutDepthMm: 400,
    cutoutRadiusMm: 15,
    minCabinetWidthCm: 90,
    valveDiameterMm: 90,
    installation: 'bajocubierta',
    pdfRef: 'ALFA TWOC F5858A.pdf'
  }
};

export const FDV_COOKTOPS: Record<CooktopModelId, CooktopSpec | null> = {
  none: null,
  fdv_design_60: {
    id: 'fdv_design_60',
    name: 'Encimera FDV DESIGN 60 2.0',
    brand: 'FDV / Kitchen Center',
    code: '11732-NAT',
    burners: 4,
    material: 'Acero Inox + Fierro Fundido',
    productWidthMm: 580,
    productDepthMm: 500,
    productHeightMm: 85,
    cutoutWidthMm: 550,
    cutoutDepthMm: 470,
    minCabinetWidthCm: 60,
    gasType: 'Gas Licuado / Natural (Triple Corona)',
    pdfRef: 'ENCIMERA DESIGN 60 2.0.pdf'
  },
  fdv_design_90: {
    id: 'fdv_design_90',
    name: 'Encimera FDV DESIGN 90',
    brand: 'FDV / Kitchen Center',
    code: '10042-NAT',
    burners: 5,
    material: 'Acero Inox + Fierro Fundido',
    productWidthMm: 860,
    productDepthMm: 500,
    productHeightMm: 104,
    cutoutWidthMm: 840,
    cutoutDepthMm: 470,
    minCabinetWidthCm: 90,
    gasType: 'Gas Licuado / Natural (5 focos con wok)',
    pdfRef: 'ENCIMERA DESIGN 90.pdf'
  }
};

export const DEFAULT_QSTONE_CATALOG: QstoneProductItem[] = [
  // 1. Cuarzos Oficiales (18 mm y 20 mm)
  {
    id: 'qs-pure-white-18',
    code: 'QP_PW21320160',
    name: 'Qstone Cuarzo Pure White 18mm',
    materialType: 'quarzo',
    thicknessMm: 18,
    priceM2Clp: 339818,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#FFFFFF',
    finish: 'Pulido Seda',
    description: 'Cuarzo blanco puro de grano extra fino 18mm. Proveedor SYSPROTEC.',
    active: true
  },
  {
    id: 'qs-black-mamba-18',
    code: 'QP_BM22320160',
    name: 'Qstone Cuarzo Black Mamba 18mm',
    materialType: 'quarzo',
    thicknessMm: 18,
    priceM2Clp: 338859,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#1C1C1E',
    finish: 'Pulido Seda',
    description: 'Cuarzo de alta densidad fondo negro profundo 18mm. Proveedor SYSPROTEC.',
    active: true
  },
  {
    id: 'qs-calacatta-gold-20',
    code: 'QP_CO31320160',
    name: 'Qstone Cuarzo Calacatta Gold 20mm',
    materialType: 'quarzo',
    thicknessMm: 20,
    priceM2Clp: 612315,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#F7F6F2',
    finish: 'Pulido Seda',
    description: 'Fondo blanco cálido con vetas doradas y gris perla 20mm. Proveedor SYSPROTEC.',
    active: true
  },
  {
    id: 'qs-sand-20',
    code: 'QP_SA31320160',
    name: 'Qstone Cuarzo Sand 20mm',
    materialType: 'quarzo',
    thicknessMm: 20,
    priceM2Clp: 353264,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#DDD5C7',
    finish: 'Suede / Mate',
    description: 'Tono arena cálido natural 20mm textura suave. Proveedor SYSPROTEC.',
    active: true
  },

  // 2. Piedras Sinterizadas Oficiales (12 mm)
  {
    id: 'qs-sint-ana-white-12',
    code: 'QP_AN51320160',
    name: 'Qstone Sinterizado Ana White 12mm',
    materialType: 'sinterizado',
    thicknessMm: 12,
    priceM2Clp: 331282,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#FDFEFE',
    finish: 'Satinado Ultra-compacto',
    description: 'Piedra sinterizada blanco satinado ultra homogéneo 12mm. Proveedor SYSPROTEC.',
    active: true
  },
  {
    id: 'qs-sint-aurota-black-12',
    code: 'QP_AB52320160',
    name: 'Qstone Sinterizado Aurota Black 12mm',
    materialType: 'sinterizado',
    thicknessMm: 12,
    priceM2Clp: 331282,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#18191A',
    finish: 'Satinado Anti-huellas',
    description: 'Negro espacial ultra mate resistente al calor 12mm. Proveedor SYSPROTEC.',
    active: true
  },
  {
    id: 'qs-sint-lime-stone-grey-12',
    code: 'QP_LS52320160',
    name: 'Qstone Sinterizado Lime Stone Grey 12mm',
    materialType: 'sinterizado',
    thicknessMm: 12,
    priceM2Clp: 331282,
    sheetWidthMm: 3200,
    sheetHeightMm: 1600,
    colorHex: '#90A4AE',
    finish: 'Texturado Piedra Caliza',
    description: 'Piedra caliza gris texturada antibacteriana 12mm. Proveedor SYSPROTEC.',
    active: true
  },

  // 3. Cubiertas HPL Compacto Abet Laminati (8 mm - Formato Placa 130 x 305 cm)
  {
    id: 'abet-broccato-8',
    code: 'ABET-BR-2831-8MM',
    name: 'Abet Laminati HPL Broccato 2831 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 185000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#3A3F47',
    textureUrl: '/textures/abet-broccato-2831.svg',
    finish: 'Longline Mate / Compacto 8mm',
    description: 'HPL Compacto 8mm de autor Broccato. Formato 130x305 cm. Canto simple sin regrueso frontal.',
    active: true
  },
  {
    id: 'abet-fiore-pop-8',
    code: 'ABET-FP-2824-8MM',
    name: 'Abet Laminati HPL Fiore Pop 2824 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 185000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#F0EBE1',
    textureUrl: '/textures/abet-fiore-pop-2824.svg',
    finish: 'Longline Satin / Compacto 8mm',
    description: 'HPL Compacto 8mm de autor Fiore Pop. Formato 130x305 cm. Canto simple sin regrueso frontal.',
    active: true
  },
  {
    id: 'abet-bacterio-8',
    code: 'ABET-BAC-8MM',
    name: 'Abet Laminati HPL Bacterio 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 185000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#FFFFFF',
    textureUrl: '/textures/abet-bacterio.svg',
    finish: 'Memphis Design / Compacto 8mm',
    description: 'HPL Compacto 8mm diseño Memphis Bacterio Ettore Sottsass. Formato 130x305 cm. Sin regrueso frontal.',
    active: true
  },
  {
    id: 'abet-terrazzo-8',
    code: 'ABET-TER-8MM',
    name: 'Abet Laminati HPL Terrazzo 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 185000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#E5DFD7',
    textureUrl: '/textures/abet-terrazzo.svg',
    finish: 'Climb Piedra / Compacto 8mm',
    description: 'HPL Compacto 8mm diseño pétreo Terrazzo. Formato 130x305 cm. Sin regrueso frontal.',
    active: true
  },
  {
    id: 'abet-bianco-polare-8',
    code: 'ABET-BP-410-8MM',
    name: 'Abet Laminati HPL Bianco Polare 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 165000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#FFFFFF',
    finish: 'Sei Satinado / Compacto 8mm',
    description: 'HPL Compacto 8mm monocapa núcleo sólido blanco polar. Formato 130x305 cm. Sin regrueso frontal.',
    active: true
  },
  {
    id: 'abet-nero-assoluto-8',
    code: 'ABET-NA-421-8MM',
    name: 'Abet Laminati HPL Nero Assoluto 8mm',
    materialType: 'hpl_abet',
    thicknessMm: 8,
    priceM2Clp: 165000,
    sheetWidthMm: 3050,
    sheetHeightMm: 1300,
    colorHex: '#1A1A1A',
    finish: 'Sei-Due Mate / Compacto 8mm',
    description: 'HPL Compacto 8mm núcleo sólido negro absoluto anti-huellas. Formato 130x305 cm. Sin regrueso frontal.',
    active: true
  }
];

export interface CountertopRunOverride {
  overhangFrontCm?: number;
  overhangBackCm?: number;
  overhangLeftCm?: number;
  overhangRightCm?: number;
  waterfallLeft?: boolean;
  waterfallRight?: boolean;
  regruesoCm?: number;
  backsplashMode?: BacksplashMode;
  backsplashHeightCm?: number;
}

export interface CountertopConfig {
  enabled: boolean;
  provider: 'qstone';
  selectedProductId: string;
  regruesoCm: number; // 0 a 5 cm (0, 1, 2, 3, 4, 5 cm)
  regruesoOnOverhangSides?: boolean; // Aplicar faldón perimetral en los laterales con voladizo (default: true)
  baseRegruesoCm?: number; // Regrueso para muebles base (hereda de regruesoCm si no está definido)
  islandRegruesoCm?: number; // Regrueso para islas (hereda de regruesoCm si no está definido)
  backsplashMode: BacksplashMode;
  backsplashHeightCm: number; // 5 cm por defecto o automático a aéreos

  // --- SOBREESCRITURAS INDEPENDIENTES POR CUBIERTA/TRAMO DETECTADO ---
  runOverrides?: Record<string, CountertopRunOverride>;
  selectedRunId?: string | null;

  // --- PARÁMETROS MUEBLES BASE CONTRA MURO ---
  baseOverhangFrontCm?: number; // 0 a 5 cm (frente sobre puertas/cajones, default: 2)
  baseOverhangLeftCm?: number; // 0 a 30 cm (lateral izquierdo libre en muebles base)
  baseOverhangRightCm?: number; // 0 a 30 cm (lateral derecho libre en muebles base)
  baseWaterfallLeft?: boolean; // Remate cascada lateral izquierdo exclusivo para muebles base
  baseWaterfallRight?: boolean; // Remate cascada lateral derecho exclusivo para muebles base

  // --- PARÁMETROS MUEBLES ISLA ---
  islandOverhangFrontCm?: number; // 0 a 10 cm (frente isla, default: 2)
  islandOverhangBackCm?: number; // 0 a 50 cm (barra desayunadora trasera en isla, default: 30)
  islandOverhangLeftCm?: number; // 0 a 40 cm (lateral izquierdo isla libre)
  islandOverhangRightCm?: number; // 0 a 40 cm (lateral derecho isla libre)
  islandWaterfallLeft?: boolean; // Remate cascada lateral izquierdo exclusivo para isla
  islandWaterfallRight?: boolean; // Remate cascada lateral derecho exclusivo para isla

  // --- CAMPOS DE RETROCOMPATIBILIDAD Y GENERALES ---
  waterfallLeft: boolean; // Remate lateral cascada al suelo (global/fallback)
  waterfallRight: boolean; // Remate lateral cascada al suelo (global/fallback)
  islandOverhangCm: number; // 0 a 40 cm (barra desayunadora para pisos - retrocompatibilidad)
  overhangFrontCm?: number; // 2 a 10 cm (frente sobre puertas/cajones, fallback)
  overhangBackCm?: number; // 0 a 40 cm (fondo/trasera en isla, fallback)
  overhangLeftCm?: number; // 0 a 40 cm (lateral izquierdo libre, fallback)
  overhangRightCm?: number; // 0 a 40 cm (lateral derecho libre, fallback)

  buildingType: BuildingType; // 'casa' (250 cm max) | 'edificio' (200 cm max)
  sinkModel: SinkModelId;
  sinkCabinetId: string | null;
  cooktopModel: CooktopModelId;
  cooktopCabinetId: string | null;
  extendToWallLeft?: boolean; // Extender cubierta rematando hasta muro/pilar izquierdo
  extendToWallRight?: boolean; // Extender cubierta rematando hasta muro/pilar derecho
  extendToWallMaxGapCm?: number; // Distancia máxima de holgura permitida para llegar al muro/pilar (por defecto 50 cm)
  extendBaseOnly?: boolean; // Solo para muebles adosados a muro (no islas libres por defecto)
}

export const DEFAULT_COUNTERTOP_CONFIG: CountertopConfig = {
  enabled: false,
  provider: 'qstone',
  selectedProductId: 'qs-pure-white-18',
  regruesoCm: 0, // 0 cm = canto simple
  regruesoOnOverhangSides: true,
  backsplashMode: 'standard_5cm',
  backsplashHeightCm: 5,
  waterfallLeft: false,
  waterfallRight: false,
  baseWaterfallLeft: false,
  baseWaterfallRight: false,
  islandWaterfallLeft: false,
  islandWaterfallRight: false,
  baseOverhangFrontCm: 2,
  baseOverhangLeftCm: 0,
  baseOverhangRightCm: 0,
  islandOverhangFrontCm: 2,
  islandOverhangBackCm: 30,
  islandOverhangLeftCm: 0,
  islandOverhangRightCm: 0,
  islandOverhangCm: 30, // 30 cm para barra isla
  overhangFrontCm: 2,
  overhangBackCm: 30,
  overhangLeftCm: 0,
  overhangRightCm: 0,
  buildingType: 'casa',
  sinkModel: 'none',
  sinkCabinetId: null,
  cooktopModel: 'none',
  cooktopCabinetId: null,
  extendToWallLeft: false, // Las cubiertas terminan donde termina el mueble por defecto
  extendToWallRight: false,
  extendToWallMaxGapCm: 50,
  extendBaseOnly: true,
};

export interface IslandBackConfig {
  enabled: boolean;
  materialType: 'decorative' | 'countertop';
  decorativeColor: string;
  decorativeMaterial: 'melamina' | 'hpl';
  heightMode: 'to_floor' | 'with_socle'; // estrictamente 'to_floor' cuando materialType === 'countertop'
  thicknessCm: number;
  grainDirection?: 'vertical' | 'horizontal'; // Sentido de la veta del panel decorativo
  sidesEnabled?: boolean; // Activar costados/laterales decorativos en isla
  sideLeftEnabled?: boolean; // Lateral izquierdo habilitado
  sideRightEnabled?: boolean; // Lateral derecho habilitado
  sideDepthCm?: number; // Profundidad ajustable con scroll/slider (mínimo profundidad mueble ~60cm, máx ~90cm cubierta)
  sideHeightMode?: 'to_floor' | 'with_socle'; // Encuentro inferior de los laterales
}

export const DEFAULT_ISLAND_BACK_CONFIG: IslandBackConfig = {
  enabled: false,
  materialType: 'decorative',
  decorativeColor: '#FFFFFF',
  decorativeMaterial: 'melamina',
  heightMode: 'to_floor',
  thicknessCm: 1.8,
  grainDirection: 'vertical',
  sidesEnabled: false,
  sideLeftEnabled: true,
  sideRightEnabled: true,
  sideDepthCm: 60,
  sideHeightMode: 'to_floor',
};

