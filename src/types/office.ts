export type OfficeFurnitureCategory =
  | 'executive'
  | 'open-plan'
  | 'meeting'
  | 'storage'
  | 'screens'
  | 'cafeteria'
  | 'chairs';

export type MelamineFinishId =
  | 'blanco-2109'
  | 'white-ashwood-10159'
  | 'brown-legno-oak-10881'
  | 'dawn-wuda-elm-10453';

export type MetalFinishId =
  | 'negro-mt'
  | 'blanco-mt'
  | 'gris-mt'
  | 'aluminio-mt';

export type ScreenFabricId =
  | 'negro-onix'
  | 'gris-grafito-2174'
  | 'gris-humo-2108'
  | 'blanco-2109'
  | 'azul-petroleo'
  | 'verde-oliva'
  | 'terracota-warm';

export type HandleModelId =
  | 'balin'
  | 'venecia'
  | 'malaga'
  | 'rodon-aluminio'
  | 'forza';

export interface MelamineFinish {
  id: MelamineFinishId;
  name: string;
  code: string;
  hex: string;
  texturePattern?: 'solid' | 'wood-vertical' | 'wood-horizontal';
  roughness: number;
}

export interface MetalFinish {
  id: MetalFinishId;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
}

export interface ScreenFabricFinish {
  id: ScreenFabricId;
  name: string;
  code: string;
  hex: string;
}

export interface HandleModel {
  id: HandleModelId;
  name: string;
  material: string;
}

// Catálogo base de mobiliario de oficina normalizado
export type OfficeFurnitureType =
  | 'desk-executive-l'     // Escritorio Gerencial L 180x80 + 100x48 + Cajonera Pedestal
  | 'desk-open-l'          // Escritorio Tipo 1 L 150x60 + 70x45 + Cajonera
  | 'desk-single'          // Escritorio Tipo 2 L 150x60 + Cajonera
  | 'bench-2p'             // Puesto Doble Enfrentado 150x120 con pantalla central
  | 'bench-4p'             // Puesto Cuádruple Enfrentado 300x120 con pantallas
  | 'bench-6p'             // Puesto Séxtuple Enfrentado 450x120 con pantallas
  | 'meeting-10p'          // Mesa Reunión 10 personas 300x120 con 2 pasacables
  | 'meeting-4p-round'     // Mesa Reunión Redonda 4 personas Ø120 base plato
  | 'cabinet-mid-2p'       // Gabinete Medio 2 Puertas 100x48x90
  | 'locker-2p'            // Locker 1 Cuerpo 2 Puertas 30x50x165
  | 'shelving-metal'       // Estantería Metálica 4 Repisas 120x60x200
  | 'panel-divider'        // Panel Separador con zócalo electrificable y vidrio 100x5x165
  | 'table-cafe'           // Mesa Cafetería 60x60x75
  | 'table-side'           // Mesa Lateral Lounge 40x40x45
  | 'chair-task-high'      // Silla Ergonómica Alta Malla
  | 'chair-task-mid'       // Silla Ergonómica Media Malla
  | 'chair-visitor'        // Silla Visita 4 Patas
  | 'chair-cafe'           // Silla Cafetería Polipropileno
  | 'chair-lounge';        // Poltrona Lounge Tapizada

export interface CatalogFurnitureItem {
  type: OfficeFurnitureType;
  category: OfficeFurnitureCategory;
  name: string;
  code: string;
  description: string;
  dimensionsCm: {
    width: number;
    depth: number;
    height: number;
    returnWidth?: number;
    returnDepth?: number;
  };
  capacityPeople: number;
  defaultPriceClp: number;
  allowLengthResize?: boolean;
  minWidthCm?: number;
  maxWidthCm?: number;
  allowReturnToggle?: boolean;
  hasScreen?: boolean;
  hasPedestal?: boolean;
  hasElectrification?: boolean;
}

export interface PlacedOfficeItem {
  id: string;
  type: OfficeFurnitureType;
  name: string;
  category: OfficeFurnitureCategory;
  // Posición en el plano 2D/3D (en metros)
  position: [number, number, number]; // [x, y, z] (y es altura en Three.js, o x, y en plano 2D)
  rotation: number; // Ángulo en radianes (alrededor del eje Y)
  dimensionsCm: {
    width: number;
    depth: number;
    height: number;
    returnWidth?: number;
    returnDepth?: number;
  };
  returnSide?: 'left' | 'right';
  melamineFinish: MelamineFinishId;
  metalFinish: MetalFinishId;
  screenFinish?: ScreenFabricId;
  handleModel?: HandleModelId;
  chairFabricColor?: string;
  priceClp: number;
  zoneTag?: string; // Ej. "Open Space A", "Gerencia", "Sala Reuniones 1"
  isLocked?: boolean; // Bloqueado para fijar en plano
}

export interface UnderlayFloorPlan {
  fileUrl: string | null;
  fileName: string;
  fileType: 'pdf' | 'image';
  pdfPage?: number;
  rawImageWidthPx?: number;
  rawImageHeightPx?: number;
  scalePxPerMeter: number; // Píxeles en pantalla equivalentes a 1 metro real
  realWidthMeters: number;
  realHeightMeters: number;
  opacity: number;
  offsetX: number; // En metros
  offsetY: number; // En metros
  rotationDeg: number;
  isCalibrated: boolean;
}

export interface OfficeProjectStats {
  totalItems: number;
  workstationsCount: number; // Puestos operativos
  executiveCount: number;    // Puestos gerenciales
  meetingSeatsCount: number; // Asientos en salas de reunión
  visitorSeatsCount: number; // Sillas de visita / cafeteria / lounge
  totalElectrificationPasses: number; // Pasacables y cajas eléctricas
  totalCabinetsAndLockers: number;
  totalCostClp: number;
  netCostClp: number;
  taxIvaClp: number;
}
