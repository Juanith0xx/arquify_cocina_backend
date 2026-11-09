import { create } from 'zustand';
import {
  OfficeFurnitureCategory,
  OfficeFurnitureType,
  CatalogFurnitureItem,
  PlacedOfficeItem,
  UnderlayFloorPlan,
  MelamineFinishId,
  MetalFinishId,
  ScreenFabricId,
  HandleModelId,
  MelamineFinish,
  MetalFinish,
  ScreenFabricFinish,
  HandleModel,
  OfficeProjectStats,
} from '../types/office';

export const MELAMINE_FINISHES: MelamineFinish[] = [
  {
    id: 'blanco-2109',
    name: 'Blanco 2109',
    code: 'BL-2109',
    hex: '#F4F5F7',
    texturePattern: 'solid',
    roughness: 0.35,
  },
  {
    id: 'white-ashwood-10159',
    name: 'White Ashwood 10159',
    code: 'WA-10159',
    hex: '#E2DAD0',
    texturePattern: 'wood-vertical',
    roughness: 0.5,
  },
  {
    id: 'brown-legno-oak-10881',
    name: 'Brown Legno Oak 10881',
    code: 'BLO-10881',
    hex: '#7A5B40',
    texturePattern: 'wood-vertical',
    roughness: 0.55,
  },
  {
    id: 'dawn-wuda-elm-10453',
    name: 'Dawn Wuda Elm 10453',
    code: 'DWE-10453',
    hex: '#CBB297',
    texturePattern: 'wood-vertical',
    roughness: 0.45,
  },
];

export const METAL_FINISHES: MetalFinish[] = [
  {
    id: 'negro-mt',
    name: 'Negro Mate',
    hex: '#18181B',
    metalness: 0.25,
    roughness: 0.6,
  },
  {
    id: 'blanco-mt',
    name: 'Blanco Mate',
    hex: '#F3F4F6',
    metalness: 0.2,
    roughness: 0.5,
  },
  {
    id: 'gris-mt',
    name: 'Gris Grafito MT',
    hex: '#4B5563',
    metalness: 0.3,
    roughness: 0.6,
  },
  {
    id: 'aluminio-mt',
    name: 'Aluminio Anodizado MT',
    hex: '#CBD5E1',
    metalness: 0.6,
    roughness: 0.35,
  },
];

export const SCREEN_FABRICS: ScreenFabricFinish[] = [
  {
    id: 'negro-onix',
    name: 'Negro Ónix (Malla / Tapiz)',
    code: 'NO-900',
    hex: '#18181B',
  },
  {
    id: 'gris-grafito-2174',
    name: 'Gris Grafito 2174',
    code: 'GG-2174',
    hex: '#374151',
  },
  {
    id: 'gris-humo-2108',
    name: 'Gris Humo 2108',
    code: 'GH-2108',
    hex: '#9CA3AF',
  },
  {
    id: 'azul-petroleo',
    name: 'Azul Petróleo Acústico',
    code: 'AP-440',
    hex: '#1E3A5F',
  },
  {
    id: 'verde-oliva',
    name: 'Verde Oliva Soft',
    code: 'VO-320',
    hex: '#3D5A45',
  },
  {
    id: 'terracota-warm',
    name: 'Terracota Cálido',
    code: 'TC-510',
    hex: '#B45309',
  },
  {
    id: 'blanco-2109',
    name: 'Blanco Texturado',
    code: 'BT-2109',
    hex: '#E5E7EB',
  },
];

export const HANDLE_MODELS: HandleModel[] = [
  { id: 'balin', name: 'Tirador Balín', material: 'Zamak Cromo' },
  { id: 'venecia', name: 'Tirador Venecia', material: 'Aluminio Anodizado' },
  { id: 'malaga', name: 'Tirador Málaga', material: 'Inox Satinado' },
  { id: 'rodon-aluminio', name: 'Rodón Aluminio', material: 'Perfil Embutido' },
  { id: 'forza', name: 'Tirador Forza', material: 'Acero Negro Mate' },
];

export const OFFICE_CATALOG: CatalogFurnitureItem[] = [
  // --- OFICINAS PRIVADAS ---
  {
    type: 'desk-executive-l',
    category: 'executive',
    name: 'Escritorio Gerencial en L + Pedestal',
    code: 'OF-GER-180',
    description: 'Cubierta MDP 24mm con tapacanto PVC 2mm, perfil 50x50mm electroestático, retorno lateral 100x48 cm, cajonera pedestal 2C1K con cerradura y pasacable metálico.',
    dimensionsCm: {
      width: 180,
      depth: 80,
      height: 75,
      returnWidth: 100,
      returnDepth: 48,
    },
    capacityPeople: 1,
    defaultPriceClp: 385000,
    allowLengthResize: true,
    minWidthCm: 160,
    maxWidthCm: 220,
    allowReturnToggle: true,
    hasPedestal: true,
    hasElectrification: true,
  },
  // --- OFICINAS ABIERTAS (OPEN PLAN) ---
  {
    type: 'desk-open-l',
    category: 'open-plan',
    name: 'Puesto Operativo en L Tipo 1',
    code: 'OF-OPL-150',
    description: 'Puesto de trabajo con lateral 70x45 cm y cajonera pedestal 2C1K integrada. MDP 24mm y marco de acero 50x50mm.',
    dimensionsCm: {
      width: 150,
      depth: 60,
      height: 75,
      returnWidth: 70,
      returnDepth: 45,
    },
    capacityPeople: 1,
    defaultPriceClp: 295000,
    allowLengthResize: true,
    minWidthCm: 120,
    maxWidthCm: 180,
    allowReturnToggle: true,
    hasPedestal: true,
    hasElectrification: true,
  },
  {
    type: 'desk-single',
    category: 'open-plan',
    name: 'Puesto Lineal Simple Tipo 2 + Cajonera',
    code: 'OF-OPS-150',
    description: 'Puesto lineal individual 150x60 cm con cajonera móvil 2C1K bajo cubierta y pasacable superior.',
    dimensionsCm: {
      width: 150,
      depth: 60,
      height: 75,
    },
    capacityPeople: 1,
    defaultPriceClp: 245000,
    allowLengthResize: true,
    minWidthCm: 120,
    maxWidthCm: 180,
    hasPedestal: true,
    hasElectrification: true,
  },
  {
    type: 'bench-2p',
    category: 'open-plan',
    name: 'Bench Enfrentado 2 Puestos',
    code: 'OF-BN2-150',
    description: 'Conjunto modular de 2 puestos enfrentados (150x120 cm) con pantalla acústica divisoria central, canaleta de electrificación y pasacables dobles.',
    dimensionsCm: {
      width: 150,
      depth: 120,
      height: 75,
    },
    capacityPeople: 2,
    defaultPriceClp: 485000,
    allowLengthResize: true,
    minWidthCm: 120,
    maxWidthCm: 180,
    hasScreen: true,
    hasElectrification: true,
  },
  {
    type: 'bench-4p',
    category: 'open-plan',
    name: 'Bench Enfrentado 4 Puestos',
    code: 'OF-BN4-300',
    description: 'Isla de trabajo para 4 operadores (300x120 cm) en estructura compartida de pórticos de acero 50x50mm, 2 pantallas divisorias y columna vertebra bajada de cables.',
    dimensionsCm: {
      width: 300,
      depth: 120,
      height: 75,
    },
    capacityPeople: 4,
    defaultPriceClp: 890000,
    hasScreen: true,
    hasElectrification: true,
  },
  {
    type: 'bench-6p',
    category: 'open-plan',
    name: 'Bench Enfrentado 6 Puestos',
    code: 'OF-BN6-450',
    description: 'Isla corporativa para 6 operadores (450x120 cm) con 3 pantallas divisorias y electrificación troncal integral.',
    dimensionsCm: {
      width: 450,
      depth: 120,
      height: 75,
    },
    capacityPeople: 6,
    defaultPriceClp: 1290000,
    hasScreen: true,
    hasElectrification: true,
  },
  // --- SALAS DE REUNIÓN ---
  {
    type: 'meeting-10p',
    category: 'meeting',
    name: 'Mesa Reunión Ejecutiva 10 Personas',
    code: 'OF-MT10-300',
    description: 'Mesa de directorio 300x120 cm con cubierta seccionada MDP 24mm, estructura de patas pórtico 50x50 y 2 cajas de conectividad integradas con tapa abatible.',
    dimensionsCm: {
      width: 300,
      depth: 120,
      height: 75,
    },
    capacityPeople: 10,
    defaultPriceClp: 620000,
    allowLengthResize: true,
    minWidthCm: 240,
    maxWidthCm: 380,
    hasElectrification: true,
  },
  {
    type: 'meeting-4p-round',
    category: 'meeting',
    name: 'Mesa Reunión Redonda 4 Personas Ø120',
    code: 'OF-MTR4-120',
    description: 'Mesa circular de diálogo Ø120 cm con base de plato metálico Ø60 cm de 2mm y tubo central de 5" electroestático.',
    dimensionsCm: {
      width: 120,
      depth: 120,
      height: 75,
    },
    capacityPeople: 4,
    defaultPriceClp: 280000,
  },
  // --- ALMACENAMIENTO ---
  {
    type: 'cabinet-mid-2p',
    category: 'storage',
    name: 'Gabinete Medio 2 Puertas',
    code: 'OF-GAB-100',
    description: 'Mueble de guardado medio 100x48x90 cm con cubierta MDP 24mm, 2 puertas con cerradura de seguridad y bisagras de cierre suave.',
    dimensionsCm: {
      width: 100,
      depth: 48,
      height: 90,
    },
    capacityPeople: 0,
    defaultPriceClp: 210000,
    hasPedestal: false,
  },
  {
    type: 'locker-2p',
    category: 'storage',
    name: 'Locker Metálico 1 Cuerpo 2 Puertas',
    code: 'OF-LCK-30',
    description: 'Locker de acero electroesmaltado al horno 30x50x165 cm con celosías de ventilación, tarjetero y aldaba portacandado.',
    dimensionsCm: {
      width: 30,
      depth: 50,
      height: 165,
    },
    capacityPeople: 0,
    defaultPriceClp: 125000,
  },
  {
    type: 'shelving-metal',
    category: 'storage',
    name: 'Estantería Metálica 4 Repisas',
    code: 'OF-EST-120',
    description: 'Estantería modular en acero laminado en frío SAE 1010 con perfiles ranurados y 4 bandejas (capacidad 200 kg/bandeja).',
    dimensionsCm: {
      width: 120,
      depth: 60,
      height: 200,
    },
    capacityPeople: 0,
    defaultPriceClp: 145000,
    allowLengthResize: true,
    minWidthCm: 90,
    maxWidthCm: 240,
  },
  // --- PANELERÍA Y DIVISIONES ---
  {
    type: 'panel-divider',
    category: 'screens',
    name: 'Panel Separador con Zócalo & Vidrio',
    code: 'OF-PAN-100',
    description: 'Módulo de biombo divisorio 100x5x165 cm con zócalo inferior de canalización eléctrica, palmetas laminadas intermedias y kit de vidrio templado superior.',
    dimensionsCm: {
      width: 100,
      depth: 5,
      height: 165,
    },
    capacityPeople: 0,
    defaultPriceClp: 185000,
    hasElectrification: true,
  },
  // --- CAFETERÍA Y LOUNGE ---
  {
    type: 'table-cafe',
    category: 'cafeteria',
    name: 'Mesa Cafetería Cuadrada 60x60',
    code: 'OF-CAF-60',
    description: 'Mesa de casino/café 60x60x75 cm, cubierta MDP 24mm con bastidor de acero 40x20mm y regatones interiores.',
    dimensionsCm: {
      width: 60,
      depth: 60,
      height: 75,
    },
    capacityPeople: 2,
    defaultPriceClp: 110000,
  },
  {
    type: 'table-side',
    category: 'cafeteria',
    name: 'Mesa Lateral Lounge 40x40',
    code: 'OF-LAT-40',
    description: 'Mesa auxiliar baja de descanso 40x40x45 cm en perfil 25x25mm y cubierta laminada de alta presión.',
    dimensionsCm: {
      width: 40,
      depth: 40,
      height: 45,
    },
    capacityPeople: 0,
    defaultPriceClp: 75000,
  },
  // --- SILLERÍA ---
  {
    type: 'chair-task-high',
    category: 'chairs',
    name: 'Silla Ergonómica Respaldo Alto (Malla)',
    code: 'OF-CH-HIGH',
    description: 'Silla operativa sincrónica con soporte lumbar 3D graduable, asiento inyectado, apoyabrazos 3D y base de aluminio con ruedas PU.',
    dimensionsCm: {
      width: 63,
      depth: 50,
      height: 100,
    },
    capacityPeople: 1,
    defaultPriceClp: 185000,
  },
  {
    type: 'chair-task-mid',
    category: 'chairs',
    name: 'Silla Operativa Respaldo Medio',
    code: 'OF-CH-MID',
    description: 'Silla de oficina con respaldo de malla transpirable, mecanismo basculante de tensión y base de nylon.',
    dimensionsCm: {
      width: 64,
      depth: 48,
      height: 95,
    },
    capacityPeople: 1,
    defaultPriceClp: 125000,
  },
  {
    type: 'chair-visitor',
    category: 'chairs',
    name: 'Silla Visita 4 Patas Cromadas',
    code: 'OF-CH-VIS',
    description: 'Silla confidente con respaldo perforado de polipropileno + malla, asiento tapizado y 4 patas cromadas.',
    dimensionsCm: {
      width: 64,
      depth: 48,
      height: 92,
    },
    capacityPeople: 1,
    defaultPriceClp: 85000,
  },
  {
    type: 'chair-cafe',
    category: 'chairs',
    name: 'Silla Cafetería Polipropileno',
    code: 'OF-CH-CAF',
    description: 'Silla monocasco inyectada en polipropileno de alto impacto, apilable y lavable.',
    dimensionsCm: {
      width: 48,
      depth: 45,
      height: 78,
    },
    capacityPeople: 1,
    defaultPriceClp: 45000,
  },
  {
    type: 'chair-lounge',
    category: 'chairs',
    name: 'Poltrona Estar Tapizada',
    code: 'OF-CH-LNG',
    description: 'Sillón lounge tapizado en tela gris acústica con base de 4 patas de madera de haya natural.',
    dimensionsCm: {
      width: 57,
      depth: 57,
      height: 87,
    },
    capacityPeople: 1,
    defaultPriceClp: 165000,
  },
];

interface CalibrationState {
  isCalibrating: boolean;
  step: 'point1' | 'point2' | 'input-distance' | 'idle';
  point1: { x: number; y: number } | null;
  point2: { x: number; y: number } | null;
}

interface OfficeState {
  // Plan de arquitectura base
  floorPlan: UnderlayFloorPlan;
  calibration: CalibrationState;
  
  // Mobiliario en escena
  placedItems: PlacedOfficeItem[];
  selectedItemId: string | null;
  activeCategory: OfficeFurnitureCategory;
  
  // Preferencias globales predeterminadas
  defaultMelamine: MelamineFinishId;
  defaultMetal: MetalFinishId;
  defaultScreenFabric: ScreenFabricId;
  defaultHandle: HandleModelId;
  
  // Estado de vista y UI
  viewMode: '3d' | '2d-plan' | 'bom';
  cameraAngle: 'iso-ne' | 'iso-nw' | 'top' | 'perspective';
  gridSnapMeters: number; // 0.05, 0.1, 0.25, 0.5
  showGrid: boolean;
  showDimensions2D: boolean;
  showClearanceZones: boolean;
  
  // Dimensiones del espacio del proyecto (en metros)
  roomDimensions: {
    widthMeters: number;
    lengthMeters: number;
    heightMeters: number;
  };
  
  // Acciones de Floor Plan y Calibración
  setFloorPlanFile: (fileUrl: string, fileName: string, fileType: 'pdf' | 'image', widthPx: number, heightPx: number) => void;
  setFloorPlanOpacity: (opacity: number) => void;
  setFloorPlanOffset: (dx: number, dy: number) => void;
  setFloorPlanRotation: (deg: number) => void;
  clearFloorPlan: () => void;
  startCalibration: () => void;
  setCalibrationPoint1: (pt: { x: number; y: number }) => void;
  setCalibrationPoint2: (pt: { x: number; y: number }) => void;
  applyCalibration: (realDistanceMeters: number) => void;
  cancelCalibration: () => void;
  
  // Acciones de Mobiliario
  addItem: (type: OfficeFurnitureType, position?: [number, number, number]) => string;
  duplicateItem: (id: string) => string | null;
  removeItem: (id: string) => void;
  updateItemPosition: (id: string, position: [number, number, number]) => void;
  rotateItem: (id: string, deltaRad?: number) => void;
  setItemRotation: (id: string, rotationRad: number) => void;
  updateItemDimensions: (id: string, dimensionsCm: Partial<PlacedOfficeItem['dimensionsCm']>) => void;
  toggleItemReturnSide: (id: string) => void;
  toggleItemLock: (id: string) => void;
  moveItemDelta: (id: string, deltaX: number, deltaZ: number) => void;
  updateItemFinishes: (id: string, finishes: { melamine?: MelamineFinishId; metal?: MetalFinishId; screen?: ScreenFabricId; handle?: HandleModelId; chairFabricColor?: string }) => void;
  selectItem: (id: string | null) => void;
  clearAllItems: () => void;
  
  // Acciones Globales
  setDefaultMelamine: (id: MelamineFinishId) => void;
  setDefaultMetal: (id: MetalFinishId) => void;
  setDefaultScreenFabric: (id: ScreenFabricId) => void;
  setDefaultHandle: (id: HandleModelId) => void;
  applyGlobalFinishesToAll: () => void;
  
  // Configuración de visualización
  setViewMode: (mode: '3d' | '2d-plan' | 'bom') => void;
  setCameraAngle: (angle: 'iso-ne' | 'iso-nw' | 'top' | 'perspective') => void;
  setGridSnapMeters: (snap: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowDimensions2D: (show: boolean) => void;
  setShowClearanceZones: (show: boolean) => void;
  setRoomDimensions: (dim: Partial<OfficeState['roomDimensions']>) => void;
  
  // Plantilla de ejemplo
  loadDemoLayout: () => void;
  
  // Métricas calculadas
  getProjectStats: () => OfficeProjectStats;
}

// Preset de ejemplo inicial con distribución tipo AMUV
const INITIAL_DEMO_ITEMS: PlacedOfficeItem[] = [
  // Gerencia / Privada Izquierda
  {
    id: 'demo-ger-1',
    type: 'desk-executive-l',
    name: 'Escritorio Gerencial en L',
    category: 'executive',
    position: [-8, 0, -3],
    rotation: 0,
    dimensionsCm: { width: 180, depth: 80, height: 75, returnWidth: 100, returnDepth: 48 },
    returnSide: 'right',
    melamineFinish: 'brown-legno-oak-10881',
    metalFinish: 'negro-mt',
    handleModel: 'forza',
    priceClp: 385000,
    zoneTag: 'Gerencia General',
  },
  {
    id: 'demo-chair-ger-1',
    type: 'chair-task-high',
    name: 'Silla Ergonómica Alta Malla',
    category: 'chairs',
    position: [-8, 0, -2.4],
    rotation: Math.PI,
    dimensionsCm: { width: 63, depth: 50, height: 100 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    screenFinish: 'negro-onix',
    chairFabricColor: '#18181B',
    priceClp: 185000,
    zoneTag: 'Gerencia General',
  },
  {
    id: 'demo-gab-1',
    type: 'cabinet-mid-2p',
    name: 'Gabinete Medio 2 Puertas',
    category: 'storage',
    position: [-8, 0, -4.2],
    rotation: 0,
    dimensionsCm: { width: 100, depth: 48, height: 90 },
    melamineFinish: 'brown-legno-oak-10881',
    metalFinish: 'negro-mt',
    handleModel: 'forza',
    priceClp: 210000,
    zoneTag: 'Gerencia General',
  },

  // Open Space: Bench Central de 4 puestos
  {
    id: 'demo-bench-4p-1',
    type: 'bench-4p',
    name: 'Bench Enfrentado 4 Puestos',
    category: 'open-plan',
    position: [0, 0, 0],
    rotation: 0,
    dimensionsCm: { width: 300, depth: 120, height: 75 },
    melamineFinish: 'dawn-wuda-elm-10453',
    metalFinish: 'blanco-mt',
    screenFinish: 'gris-grafito-2174',
    priceClp: 890000,
    zoneTag: 'Open Space Operaciones',
  },
  // Sillas para Bench 4P
  {
    id: 'demo-ch-b1',
    type: 'chair-task-mid',
    name: 'Silla Operativa Malla',
    category: 'chairs',
    position: [-0.75, 0, -0.85],
    rotation: 0,
    dimensionsCm: { width: 64, depth: 48, height: 95 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    screenFinish: 'gris-grafito-2174',
    chairFabricColor: '#374151',
    priceClp: 125000,
    zoneTag: 'Open Space Operaciones',
  },
  {
    id: 'demo-ch-b2',
    type: 'chair-task-mid',
    name: 'Silla Operativa Malla',
    category: 'chairs',
    position: [0.75, 0, -0.85],
    rotation: 0,
    dimensionsCm: { width: 64, depth: 48, height: 95 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    screenFinish: 'gris-grafito-2174',
    chairFabricColor: '#374151',
    priceClp: 125000,
    zoneTag: 'Open Space Operaciones',
  },
  {
    id: 'demo-ch-b3',
    type: 'chair-task-mid',
    name: 'Silla Operativa Malla',
    category: 'chairs',
    position: [-0.75, 0, 0.85],
    rotation: Math.PI,
    dimensionsCm: { width: 64, depth: 48, height: 95 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    screenFinish: 'gris-grafito-2174',
    chairFabricColor: '#374151',
    priceClp: 125000,
    zoneTag: 'Open Space Operaciones',
  },
  {
    id: 'demo-ch-b4',
    type: 'chair-task-mid',
    name: 'Silla Operativa Malla',
    category: 'chairs',
    position: [0.75, 0, 0.85],
    rotation: Math.PI,
    dimensionsCm: { width: 64, depth: 48, height: 95 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    screenFinish: 'gris-grafito-2174',
    chairFabricColor: '#374151',
    priceClp: 125000,
    zoneTag: 'Open Space Operaciones',
  },

  // Sala de Reuniones 10 personas a la derecha
  {
    id: 'demo-meet-10p',
    type: 'meeting-10p',
    name: 'Mesa Reunión 10 Personas',
    category: 'meeting',
    position: [7.5, 0, -0.5],
    rotation: Math.PI / 2,
    dimensionsCm: { width: 300, depth: 120, height: 75 },
    melamineFinish: 'white-ashwood-10159',
    metalFinish: 'aluminio-mt',
    priceClp: 620000,
    zoneTag: 'Directorio Principal',
  },

  // Sala Diálogo Mesa Redonda
  {
    id: 'demo-meet-round',
    type: 'meeting-4p-round',
    name: 'Mesa Diálogo Redonda Ø120',
    category: 'meeting',
    position: [7.5, 0, 4],
    rotation: 0,
    dimensionsCm: { width: 120, depth: 120, height: 75 },
    melamineFinish: 'white-ashwood-10159',
    metalFinish: 'aluminio-mt',
    priceClp: 280000,
    zoneTag: 'Sala Innovación',
  },

  // Lockers de personal al fondo
  {
    id: 'demo-lck-1',
    type: 'locker-2p',
    name: 'Locker 2 Puertas',
    category: 'storage',
    position: [-2, 0, -4.5],
    rotation: 0,
    dimensionsCm: { width: 30, depth: 50, height: 165 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'gris-mt',
    priceClp: 125000,
    zoneTag: 'Zona Servicios',
  },
  {
    id: 'demo-lck-2',
    type: 'locker-2p',
    name: 'Locker 2 Puertas',
    category: 'storage',
    position: [-1.65, 0, -4.5],
    rotation: 0,
    dimensionsCm: { width: 30, depth: 50, height: 165 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'gris-mt',
    priceClp: 125000,
    zoneTag: 'Zona Servicios',
  },
  {
    id: 'demo-lck-3',
    type: 'locker-2p',
    name: 'Locker 2 Puertas',
    category: 'storage',
    position: [-1.3, 0, -4.5],
    rotation: 0,
    dimensionsCm: { width: 30, depth: 50, height: 165 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'gris-mt',
    priceClp: 125000,
    zoneTag: 'Zona Servicios',
  },

  // Área de Cafetería / Breakout
  {
    id: 'demo-cafe-tbl',
    type: 'table-cafe',
    name: 'Mesa Cafetería 60x60',
    category: 'cafeteria',
    position: [-6, 0, 4],
    rotation: 0,
    dimensionsCm: { width: 60, depth: 60, height: 75 },
    melamineFinish: 'dawn-wuda-elm-10453',
    metalFinish: 'negro-mt',
    priceClp: 110000,
    zoneTag: 'Coffee Break',
  },
  {
    id: 'demo-cafe-ch1',
    type: 'chair-cafe',
    name: 'Silla Cafetería',
    category: 'chairs',
    position: [-6, 0, 3.4],
    rotation: 0,
    dimensionsCm: { width: 48, depth: 45, height: 78 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    priceClp: 45000,
    zoneTag: 'Coffee Break',
  },
  {
    id: 'demo-cafe-ch2',
    type: 'chair-cafe',
    name: 'Silla Cafetería',
    category: 'chairs',
    position: [-6, 0, 4.6],
    rotation: Math.PI,
    dimensionsCm: { width: 48, depth: 45, height: 78 },
    melamineFinish: 'blanco-2109',
    metalFinish: 'negro-mt',
    priceClp: 45000,
    zoneTag: 'Coffee Break',
  },
];

export const useOfficeStore = create<OfficeState>((set, get) => ({
  floorPlan: {
    fileUrl: null,
    fileName: '',
    fileType: 'image',
    pdfPage: 1,
    scalePxPerMeter: 60,
    realWidthMeters: 24,
    realHeightMeters: 14,
    opacity: 0.65,
    offsetX: 0,
    offsetY: 0,
    rotationDeg: 0,
    isCalibrated: false,
  },
  
  calibration: {
    isCalibrating: false,
    step: 'idle',
    point1: null,
    point2: null,
  },
  
  // Mobiliario en escena (inicia vacío sin muebles precargados)
  placedItems: [],
  selectedItemId: null,
  activeCategory: 'open-plan',
  
  defaultMelamine: 'dawn-wuda-elm-10453',
  defaultMetal: 'negro-mt',
  defaultScreenFabric: 'gris-grafito-2174',
  defaultHandle: 'forza',
  
  viewMode: '3d',
  cameraAngle: 'iso-ne',
  gridSnapMeters: 0.1,
  showGrid: true,
  showDimensions2D: true,
  showClearanceZones: true,
  
  roomDimensions: {
    widthMeters: 24,
    lengthMeters: 14,
    heightMeters: 2.8,
  },
  
  setFloorPlanFile: (fileUrl, fileName, fileType, widthPx, heightPx) => {
    // Estimación preliminar: 60 px por metro
    const estimatedScale = 60;
    const realW = Math.max(10, Math.round((widthPx / estimatedScale) * 100) / 100);
    const realH = Math.max(8, Math.round((heightPx / estimatedScale) * 100) / 100);
    
    set((state) => ({
      placedItems: [], // Siempre inicia sin muebles al cargar un plano nuevo
      selectedItemId: null,
      floorPlan: {
        ...state.floorPlan,
        fileUrl,
        fileName,
        fileType,
        rawImageWidthPx: widthPx,
        rawImageHeightPx: heightPx,
        scalePxPerMeter: estimatedScale,
        realWidthMeters: realW,
        realHeightMeters: realH,
        isCalibrated: false,
      },
      roomDimensions: {
        ...state.roomDimensions,
        widthMeters: realW,
        lengthMeters: realH,
      },
    }));
  },
  
  setFloorPlanOpacity: (opacity) => {
    set((state) => ({
      floorPlan: { ...state.floorPlan, opacity: Math.max(0.05, Math.min(1, opacity)) },
    }));
  },
  
  setFloorPlanOffset: (dx, dy) => {
    set((state) => ({
      floorPlan: { ...state.floorPlan, offsetX: dx, offsetY: dy },
    }));
  },
  
  setFloorPlanRotation: (deg) => {
    set((state) => ({
      floorPlan: { ...state.floorPlan, rotationDeg: deg },
    }));
  },
  
  clearFloorPlan: () => {
    set((state) => ({
      floorPlan: {
        fileUrl: null,
        fileName: '',
        fileType: 'image',
        scalePxPerMeter: 60,
        realWidthMeters: 24,
        realHeightMeters: 14,
        opacity: 0.65,
        offsetX: 0,
        offsetY: 0,
        rotationDeg: 0,
        isCalibrated: false,
      },
    }));
  },
  
  startCalibration: () => {
    set({
      calibration: {
        isCalibrating: true,
        step: 'point1',
        point1: null,
        point2: null,
      },
    });
  },
  
  setCalibrationPoint1: (pt) => {
    set((state) => ({
      calibration: {
        ...state.calibration,
        step: 'point2',
        point1: pt,
      },
    }));
  },
  
  setCalibrationPoint2: (pt) => {
    set((state) => ({
      calibration: {
        ...state.calibration,
        step: 'input-distance',
        point2: pt,
      },
    }));
  },
  
  applyCalibration: (realDistanceMeters) => {
    const { calibration, floorPlan } = get();
    if (!calibration.point1 || !calibration.point2 || realDistanceMeters <= 0) return;
    
    // Distancia medida en metros según la escala previa
    const dx = calibration.point2.x - calibration.point1.x;
    const dy = calibration.point2.y - calibration.point1.y;
    const measuredMeters = Math.hypot(dx, dy);
    
    // Si la distancia medida es prácticamente cero, ignorar
    if (measuredMeters < 0.01) return;
    
    // Factor de corrección de escala
    const scaleFactor = realDistanceMeters / measuredMeters;
    
    // Nuevas dimensiones reales del plano en metros
    const newRealWidthMeters = Math.max(1, Math.round(floorPlan.realWidthMeters * scaleFactor * 100) / 100);
    const newRealHeightMeters = Math.max(1, Math.round(floorPlan.realHeightMeters * scaleFactor * 100) / 100);
    
    // Nueva densidad de píxeles por metro
    const rawW = floorPlan.rawImageWidthPx || (floorPlan.realWidthMeters * floorPlan.scalePxPerMeter);
    const newScalePxPerMeter = Math.max(5, Math.round((rawW / newRealWidthMeters) * 100) / 100);
    
    set({
      floorPlan: {
        ...floorPlan,
        scalePxPerMeter: newScalePxPerMeter,
        realWidthMeters: newRealWidthMeters,
        realHeightMeters: newRealHeightMeters,
        isCalibrated: true,
      },
      roomDimensions: {
        widthMeters: newRealWidthMeters,
        lengthMeters: newRealHeightMeters,
        heightMeters: 2.8,
      },
      calibration: {
        isCalibrating: false,
        step: 'idle',
        point1: null,
        point2: null,
      },
    });
  },
  
  cancelCalibration: () => {
    set({
      calibration: {
        isCalibrating: false,
        step: 'idle',
        point1: null,
        point2: null,
      },
    });
  },
  
  addItem: (type, customPos) => {
    const catalogItem = OFFICE_CATALOG.find((c) => c.type === type);
    if (!catalogItem) return '';
    
    const { defaultMelamine, defaultMetal, defaultScreenFabric, defaultHandle } = get();
    const newId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const position: [number, number, number] = customPos || [
      (Math.random() - 0.5) * 4,
      0,
      (Math.random() - 0.5) * 4,
    ];
    
    const defaultFabricHex = SCREEN_FABRICS.find((s) => s.id === defaultScreenFabric)?.hex;

    const newItem: PlacedOfficeItem = {
      id: newId,
      type,
      name: catalogItem.name,
      category: catalogItem.category,
      position,
      rotation: 0,
      dimensionsCm: { ...catalogItem.dimensionsCm },
      returnSide: 'right',
      melamineFinish: defaultMelamine,
      metalFinish: defaultMetal,
      screenFinish: defaultScreenFabric,
      chairFabricColor: defaultFabricHex,
      handleModel: defaultHandle,
      priceClp: catalogItem.defaultPriceClp,
      zoneTag: 'Área Abierta',
    };
    
    set((state) => ({
      placedItems: [...state.placedItems, newItem],
      selectedItemId: newId,
    }));
    
    return newId;
  },
  
  duplicateItem: (id) => {
    const item = get().placedItems.find((i) => i.id === id);
    if (!item) return null;
    
    const newId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: PlacedOfficeItem = {
      ...item,
      id: newId,
      position: [item.position[0] + 0.6, item.position[1], item.position[2] + 0.6],
    };
    
    set((state) => ({
      placedItems: [...state.placedItems, newItem],
      selectedItemId: newId,
    }));
    
    return newId;
  },
  
  removeItem: (id) => {
    set((state) => ({
      placedItems: state.placedItems.filter((i) => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
  },
  
  updateItemPosition: (id, position) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    }));
  },
  
  rotateItem: (id, deltaRad = Math.PI / 4) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id) return item;
        const newRot = (item.rotation + deltaRad) % (Math.PI * 2);
        return { ...item, rotation: newRot };
      }),
    }));
  },
  
  setItemRotation: (id, rotationRad) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) =>
        item.id === id ? { ...item, rotation: rotationRad } : item
      ),
    }));
  },
  
  updateItemDimensions: (id, dimensionsCm) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          dimensionsCm: {
            ...item.dimensionsCm,
            ...dimensionsCm,
          },
        };
      }),
    }));
  },
  
  toggleItemReturnSide: (id) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id) return item;
        const newSide = item.returnSide === 'left' ? 'right' : 'left';
        return { ...item, returnSide: newSide };
      }),
    }));
  },

  toggleItemLock: (id) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id) return item;
        return { ...item, isLocked: !item.isLocked };
      }),
    }));
  },

  moveItemDelta: (id, deltaX, deltaZ) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id || item.isLocked) return item;
        const newX = Math.round((item.position[0] + deltaX) * 100) / 100;
        const newZ = Math.round((item.position[2] + deltaZ) * 100) / 100;
        return { ...item, position: [newX, item.position[1], newZ] };
      }),
    }));
  },
  
  updateItemFinishes: (id, finishes) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) => {
        if (item.id !== id) return item;
        const screenId = finishes.screen || item.screenFinish;
        const fabricColor = finishes.chairFabricColor || (finishes.screen ? SCREEN_FABRICS.find((s) => s.id === finishes.screen)?.hex : item.chairFabricColor);
        return {
          ...item,
          melamineFinish: finishes.melamine || item.melamineFinish,
          metalFinish: finishes.metal || item.metalFinish,
          screenFinish: screenId,
          chairFabricColor: fabricColor || item.chairFabricColor,
          handleModel: finishes.handle || item.handleModel,
        };
      }),
    }));
  },
  
  selectItem: (id) => {
    set({ selectedItemId: id });
  },
  
  clearAllItems: () => {
    set({ placedItems: [], selectedItemId: null });
  },
  
  setDefaultMelamine: (id) => set({ defaultMelamine: id }),
  setDefaultMetal: (id) => set({ defaultMetal: id }),
  setDefaultScreenFabric: (id) => set({ defaultScreenFabric: id }),
  setDefaultHandle: (id) => set({ defaultHandle: id }),
  
  applyGlobalFinishesToAll: () => {
    const { defaultMelamine, defaultMetal, defaultScreenFabric, defaultHandle } = get();
    const fabricHex = SCREEN_FABRICS.find((s) => s.id === defaultScreenFabric)?.hex;
    set((state) => ({
      placedItems: state.placedItems.map((item) => ({
        ...item,
        melamineFinish: defaultMelamine,
        metalFinish: defaultMetal,
        screenFinish: defaultScreenFabric,
        chairFabricColor: fabricHex || item.chairFabricColor,
        handleModel: defaultHandle,
      })),
    }));
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setCameraAngle: (angle) => set({ cameraAngle: angle }),
  setGridSnapMeters: (snap) => set({ gridSnapMeters: snap }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowDimensions2D: (show) => set({ showDimensions2D: show }),
  setShowClearanceZones: (show) => set({ showClearanceZones: show }),
  
  setRoomDimensions: (dim) => {
    set((state) => ({
      roomDimensions: {
        ...state.roomDimensions,
        ...dim,
      },
    }));
  },
  
  loadDemoLayout: () => {
    set({ placedItems: INITIAL_DEMO_ITEMS, selectedItemId: null });
  },
  
  getProjectStats: () => {
    const { placedItems } = get();
    let workstationsCount = 0;
    let executiveCount = 0;
    let meetingSeatsCount = 0;
    let visitorSeatsCount = 0;
    let totalElectrificationPasses = 0;
    let totalCabinetsAndLockers = 0;
    let totalCostClp = 0;
    
    placedItems.forEach((item) => {
      totalCostClp += item.priceClp;
      
      switch (item.type) {
        case 'desk-executive-l':
          executiveCount += 1;
          totalElectrificationPasses += 1;
          break;
        case 'desk-open-l':
        case 'desk-single':
          workstationsCount += 1;
          totalElectrificationPasses += 1;
          break;
        case 'bench-2p':
          workstationsCount += 2;
          totalElectrificationPasses += 2;
          break;
        case 'bench-4p':
          workstationsCount += 4;
          totalElectrificationPasses += 4;
          break;
        case 'bench-6p':
          workstationsCount += 6;
          totalElectrificationPasses += 6;
          break;
        case 'meeting-10p':
          meetingSeatsCount += 10;
          totalElectrificationPasses += 2;
          break;
        case 'meeting-4p-round':
          meetingSeatsCount += 4;
          break;
        case 'cabinet-mid-2p':
        case 'locker-2p':
        case 'shelving-metal':
          totalCabinetsAndLockers += 1;
          break;
        case 'panel-divider':
          totalElectrificationPasses += 1;
          break;
        case 'chair-task-high':
        case 'chair-task-mid':
          // Ya contabilizados en puestos o sillas libres
          break;
        case 'chair-visitor':
        case 'chair-cafe':
        case 'chair-lounge':
          visitorSeatsCount += 1;
          break;
      }
    });
    
    const netCostClp = Math.round(totalCostClp / 1.19);
    const taxIvaClp = totalCostClp - netCostClp;
    
    return {
      totalItems: placedItems.length,
      workstationsCount,
      executiveCount,
      meetingSeatsCount,
      visitorSeatsCount,
      totalElectrificationPasses,
      totalCabinetsAndLockers,
      totalCostClp,
      netCostClp,
      taxIvaClp,
    };
  },
}));
