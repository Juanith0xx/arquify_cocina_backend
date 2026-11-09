import { create } from 'zustand';
import { clampOpeningOffset } from '../utils/concreteConfinement';

// --- ENUMS Y TIPOS DE LA NORMA CHILENA & MANUAL ICH ---
export type ConcreteGrade = 'G20_H25' | 'G25_H30' | 'G30_H35';
export type ConcreteSlump = 'fluido_18cm' | 'normal_10cm' | 'autocompactante';
export type WallMeshType = 'malla_central' | 'malla_doble';
export type WallThicknessMm = 100 | 120 | 150 | 200;
export type ConcreteFoundationType = 'losa_fundacion_suples' | 'cimiento_corrido_radier';
export type SlabType = 'losa_hormigon_12cm' | 'losa_hormigon_15cm' | 'cadena_coronacion_techo_liviano' | 'dos_aguas_hormigon';
export type RoofType = 'dos_aguas_hormigon' | 'losa_plana' | 'cadena_coronacion_techo_liviano';
export type RebarSteelQuality = 'A630_420H' | 'A440_280H';
export type MeshSteelQuality = 'AT56_50H';

// --- NUEVOS 3 PASOS ESTRUCTURALES ---
export type WallSystemType = 'hormigon_armado_total' | 'albanileria_confinada';
export type MezzanineSystemType = 'losa_hormigon_armado' | 'entrepiso_madera_liviano';
export type RoofStructureType = 'techumbre_madera_liviana' | 'losa_plana_hormigon' | 'dos_aguas_hormigon';

export type ConcreteWallSystemType = WallSystemType;
export type ConcreteMezzanineSystemType = MezzanineSystemType;
export type ConcreteRoofStructureType = RoofStructureType;

export type ConcreteRenderMode = 'solid' | 'xray' | 'rebar_only' | 'formwork';
export type ConcreteWallTarget = 'front' | 'back' | 'left' | 'right';

export type FrameMaterialType = 'pvc_negro' | 'pvc_blanco' | 'madera_roble' | 'aluminio_mate' | 'pvc_folio_madera' | 'aluminio_rtt' | 'madera_lenga';
export type GlazingType = 'termopanel_dvp' | 'laminado_seguridad' | 'triple_panel' | 'vidrio_laminado_seguridad' | 'termopanel_control_solar' | 'vidrio_simple_templado';

export interface ConcreteOpening {
  id: string;
  type: 'door' | 'window';
  name: string;
  code?: string;
  wall: ConcreteWallTarget;
  width: number;        // cm
  height: number;       // cm
  sillHeight: number;   // cm (antepecho, 0 para puertas)
  offsetAlongWall: number; // cm desde el extremo izquierdo de la cara exterior
  hasDiagonalRebar?: boolean; // Refuerzos a 45° en esquinas (ICH)
  lintelRebarDiameter?: 10 | 12 | 16; // mm
  frameMaterial?: FrameMaterialType;
  glazingType?: GlazingType;
}

export interface ConcreteInteriorWall {
  id: string;
  name: string;
  startX: number; // cm
  startZ: number; // cm
  endX: number;   // cm
  endZ: number;   // cm
  thicknessMm: WallThicknessMm;
  meshType: WallMeshType;
  openings: {
    id: string;
    type: 'door' | 'opening';
    width: number;
    height: number;
    offset: number;
  }[];
}

export type RoomBlockCategory = 'bedroom' | 'bathroom' | 'living' | 'kitchen' | 'terrace' | 'quincho' | 'patio' | 'corridor';

export interface RoomBlock {
  id: string;
  name: string;
  category: RoomBlockCategory;
  x: number; // cm
  z: number; // cm
  width: number; // cm (eje X)
  length: number; // cm (eje Z)
  wallType: 'concrete_150' | 'concrete_200' | 'masonry_140' | 'drywall_90';
  hasSlabCover: boolean;
  color?: string;
}

export interface ConcreteHouseDimensions {
  width: number;        // cm (eje X, ej: 596 cm en Casa TT)
  length: number;       // cm (eje Z, ej: 2645 cm en Casa TT)
  wallHeight: number;   // cm (eje Y, ej: 285 cm)
  levels: 1 | 2;        // 1 o 2 pisos
  overhangCm: number;   // cm alero de losa/cubierta
  roofRidgeHeightCm?: number; // cm altura adicional de cumbrera en dos aguas (ej: 175 cm)
  roofType?: RoofType;  // Tipo de cubierta
}

export interface ConcretePresetTemplate {
  id: string;
  name: string;
  tag: string;
  areaM2: number;
  levels: 1 | 2;
  dimensions: ConcreteHouseDimensions;
  wallThicknessMm: WallThicknessMm;
  meshType: WallMeshType;
  foundationType: ConcreteFoundationType;
  slabType?: SlabType;
  wallSystemType?: WallSystemType;
  mezzanineSystemType?: MezzanineSystemType;
  roofStructureType?: RoofStructureType;
  openings: ConcreteOpening[];
  interiorWalls?: ConcreteInteriorWall[];
  showPergola?: boolean;
  pergolaWidthCm?: number;
  pergolaLengthCm?: number;
  pergolaHeightCm?: number;
  showBarbecueCounter?: boolean;
  hasCentralPatio?: boolean;
  centralPatioOffsetCm?: number;
  centralPatioLengthCm?: number;
  description: string;
}

export const CONCRETE_PRESETS: ConcretePresetTemplate[] = [
  {
    id: 'casa_tt_158',
    name: 'Casa TT - Hormigón Visto & Pérgola (158 m²)',
    tag: 'GRUPO studio • Dos Aguas & Patio',
    areaM2: 157.6,
    levels: 1,
    dimensions: {
      width: 596,
      length: 2645,
      wallHeight: 285,
      levels: 1,
      overhangCm: 15,
      roofRidgeHeightCm: 175,
      roofType: 'dos_aguas_hormigon',
    },
    wallThicknessMm: 150,
    meshType: 'malla_doble',
    foundationType: 'losa_fundacion_suples',
    slabType: 'dos_aguas_hormigon',
    showPergola: true,
    pergolaWidthCm: 400,
    pergolaLengthCm: 770,
    pergolaHeightCm: 280,
    showBarbecueCounter: true,
    hasCentralPatio: true,
    centralPatioOffsetCm: 1346,
    centralPatioLengthCm: 248,
    openings: [
      // Frente / Cabecera Sur (Acceso principal)
      { id: 'tt-op-1', type: 'door', name: 'Acceso Principal con Marquesina', wall: 'front', width: 120, height: 240, sillHeight: 0, offsetAlongWall: 80, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      
      // Lateral Derecho / Este (Hacia galería y pérgola)
      { id: 'tt-op-2', type: 'window', name: 'Gran Ventanal Estar-Comedor', wall: 'right', width: 680, height: 240, sillHeight: 0, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 16 },
      { id: 'tt-op-3', type: 'window', name: 'Ventana Cocina', wall: 'right', width: 180, height: 120, sillHeight: 110, offsetAlongWall: 860, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'tt-op-4', type: 'door', name: 'Salida a Patio Tender', wall: 'right', width: 90, height: 220, sillHeight: 0, offsetAlongWall: 1360, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'tt-op-5', type: 'window', name: 'Ventana Dormitorio 1', wall: 'right', width: 180, height: 140, sillHeight: 85, offsetAlongWall: 1680, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'tt-op-6', type: 'window', name: 'Ventana Suite Principal', wall: 'right', width: 220, height: 160, sillHeight: 70, offsetAlongWall: 2120, hasDiagonalRebar: true, lintelRebarDiameter: 12 },

      // Lateral Izquierdo / Oeste
      { id: 'tt-op-7', type: 'window', name: 'Ventana Longitudinal Estar', wall: 'left', width: 240, height: 80, sillHeight: 180, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'tt-op-8', type: 'window', name: 'Ventana Baño Visitas', wall: 'left', width: 70, height: 80, sillHeight: 160, offsetAlongWall: 1120, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'tt-op-9', type: 'door', name: 'Salida Oeste Patio Tender', wall: 'left', width: 90, height: 220, sillHeight: 0, offsetAlongWall: 1360, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'tt-op-10', type: 'window', name: 'Ventana Dormitorio 1 Oeste', wall: 'left', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 1720, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'tt-op-11', type: 'window', name: 'Ventana Antebaño Suite', wall: 'left', width: 90, height: 80, sillHeight: 160, offsetAlongWall: 2450, hasDiagonalRebar: true, lintelRebarDiameter: 10 },

      // Fondo / Cabecera Norte
      { id: 'tt-op-12', type: 'window', name: 'Ventana Baño Principal Norte', wall: 'back', width: 120, height: 80, sillHeight: 160, offsetAlongWall: 240, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    ],
    interiorWalls: [
      { id: 'iw-1', name: 'Divisorio Cocina / Baño Social', startX: 0, startZ: 1100, endX: 596, endZ: 1100, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
      { id: 'iw-2', name: 'Muro Límite Patio Tender', startX: 0, startZ: 1346, endX: 596, endZ: 1346, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
      { id: 'iw-3', name: 'Muro Acceso Pabellón Dormitorios', startX: 0, startZ: 1594, endX: 596, endZ: 1594, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
      { id: 'iw-4', name: 'Divisorio Dormitorio 1 / 2', startX: 0, startZ: 1980, endX: 596, endZ: 1980, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
      { id: 'iw-5', name: 'Divisorio Dormitorio 2 / Baño Suite', startX: 0, startZ: 2400, endX: 596, endZ: 2400, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
    ],
    description: 'Recreación fidedigna de Casa TT (GRUPO studio, Córdoba). Dos pabellones lineales de hormigón visto vinculados por patio/tender central, cubierta monolítica a dos aguas y pérgola exterior con asador.',
  },
  {
    id: 'social_compact_36',
    name: 'Vivienda Social D.S.49 (36 m²)',
    tag: 'Malla Central 100mm Fluido',
    areaM2: 36,
    levels: 1,
    dimensions: { width: 600, length: 600, wallHeight: 245, levels: 1, overhangCm: 20, roofRidgeHeightCm: 0, roofType: 'losa_plana' },
    wallThicknessMm: 100,
    meshType: 'malla_central',
    foundationType: 'cimiento_corrido_radier',
    slabType: 'losa_hormigon_12cm',
    openings: [
      { id: 'op-1', type: 'door', name: 'Puerta Principal', wall: 'front', width: 90, height: 210, sillHeight: 0, offsetAlongWall: 80, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-2', type: 'window', name: 'Ventana Estar', wall: 'front', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 280, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-3', type: 'window', name: 'Ventana Cocina', wall: 'back', width: 120, height: 100, sillHeight: 110, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-4', type: 'window', name: 'Ventana Dormitorio 1', wall: 'back', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 340, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-5', type: 'window', name: 'Ventana Baño', wall: 'right', width: 60, height: 60, sillHeight: 150, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-6', type: 'window', name: 'Ventana Dormitorio 2', wall: 'left', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 220, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    ],
    description: 'Solución optimizada según NCh430 / DS60 con hormigón fluido G20 y malla central electrosoldada C-139.',
  },
  {
    id: 'familiar_64',
    name: 'Casa Familiar 1 Piso (64 m²)',
    tag: 'Doble Malla 120mm',
    areaM2: 64,
    levels: 1,
    dimensions: { width: 800, length: 800, wallHeight: 250, levels: 1, overhangCm: 25 },
    wallThicknessMm: 120,
    meshType: 'malla_doble',
    foundationType: 'losa_fundacion_suples',
    openings: [
      { id: 'op-1', type: 'door', name: 'Acceso Principal', wall: 'front', width: 95, height: 215, sillHeight: 0, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-2', type: 'window', name: 'Ventanal Living', wall: 'front', width: 220, height: 200, sillHeight: 15, offsetAlongWall: 320, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-3', type: 'window', name: 'Ventana Comedor', wall: 'front', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 600, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-4', type: 'door', name: 'Puerta Cocina Patio', wall: 'back', width: 85, height: 210, sillHeight: 0, offsetAlongWall: 120, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-5', type: 'window', name: 'Ventana Suite Principal', wall: 'back', width: 180, height: 130, sillHeight: 85, offsetAlongWall: 450, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-6', type: 'window', name: 'Ventana Dormitorio 2', wall: 'left', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-7', type: 'window', name: 'Ventana Dormitorio 3', wall: 'left', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 500, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-8', type: 'window', name: 'Ventana Baño Suite', wall: 'right', width: 70, height: 80, sillHeight: 130, offsetAlongWall: 250, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    ],
    description: 'Muros de 120mm con doble malla AT56-50H, suples en losa de fundación y trabas de borde según Manual ICH.',
  },
  {
    id: 'residencia_84',
    name: 'Residencia Estructural (84 m²)',
    tag: 'Doble Malla 150mm Estándar',
    areaM2: 84,
    levels: 1,
    dimensions: { width: 700, length: 1200, wallHeight: 260, levels: 1, overhangCm: 30 },
    wallThicknessMm: 150,
    meshType: 'malla_doble',
    foundationType: 'losa_fundacion_suples',
    openings: [
      { id: 'op-1', type: 'door', name: 'Acceso Hall', wall: 'front', width: 100, height: 220, sillHeight: 0, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-2', type: 'window', name: 'Ventana Frontal Gran Salón', wall: 'front', width: 300, height: 180, sillHeight: 40, offsetAlongWall: 280, hasDiagonalRebar: true, lintelRebarDiameter: 16 },
      { id: 'op-3', type: 'door', name: 'Salida Terraza', wall: 'back', width: 240, height: 220, sillHeight: 0, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 16 },
      { id: 'op-4', type: 'window', name: 'Ventana Dormitorio Principal', wall: 'back', width: 200, height: 140, sillHeight: 80, offsetAlongWall: 700, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-5', type: 'window', name: 'Ventana Baño 1', wall: 'left', width: 80, height: 80, sillHeight: 140, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-6', type: 'window', name: 'Ventana Baño 2', wall: 'left', width: 80, height: 80, sillHeight: 140, offsetAlongWall: 500, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-7', type: 'window', name: 'Ventana Cocina Isla', wall: 'right', width: 180, height: 120, sillHeight: 90, offsetAlongWall: 300, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
    ],
    description: 'Muros de 150mm con doble malla, confinamiento en L y T, hormigón G25 H30 y losa armada superior.',
  },
  {
    id: 'duplex_120',
    name: 'Casa 2 Pisos Hormigón (120 m²)',
    tag: '2 Niveles + Losa Entrepiso',
    areaM2: 120,
    levels: 2,
    dimensions: { width: 750, length: 800, wallHeight: 250, levels: 2, overhangCm: 25 },
    wallThicknessMm: 150,
    meshType: 'malla_doble',
    foundationType: 'losa_fundacion_suples',
    openings: [
      { id: 'op-1', type: 'door', name: 'Acceso Doble Altura', wall: 'front', width: 100, height: 220, sillHeight: 0, offsetAlongWall: 80, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-2', type: 'window', name: 'Ventana Sala', wall: 'front', width: 220, height: 160, sillHeight: 60, offsetAlongWall: 300, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-3', type: 'window', name: 'Ventana Cocina', wall: 'back', width: 160, height: 120, sillHeight: 90, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-4', type: 'door', name: 'Puerta Comedor Terraza', wall: 'back', width: 200, height: 215, sillHeight: 0, offsetAlongWall: 400, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
      { id: 'op-5', type: 'window', name: 'Ventana Lateral Izquierda', wall: 'left', width: 150, height: 120, sillHeight: 90, offsetAlongWall: 300, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
      { id: 'op-6', type: 'window', name: 'Ventana Lateral Derecha', wall: 'right', width: 150, height: 120, sillHeight: 90, offsetAlongWall: 300, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    ],
    description: 'Vivienda de 2 niveles con continuidad de armaduras según láminas 24 y 35 del manual ICH y losa de entrepiso e=12cm.',
  }
];

export interface ConcreteHouseState {
  // Geometría y Sistema Estructural (3 Pasos)
  wallSystemType: WallSystemType;         // Paso 1: Muros (Hormigón Armado Total vs Albañilería Confinada)
  mezzanineSystemType: MezzanineSystemType; // Paso 2: Entrepiso (Losa H.A. vs Entrepiso Liviano de Madera)
  roofStructureType: RoofStructureType;   // Paso 3: Techumbre (Techumbre Liviana Madera vs Losa Plana H.A. vs Dos Aguas)

  // Geometría
  dimensions: ConcreteHouseDimensions;
  wallThicknessMm: WallThicknessMm;
  meshType: WallMeshType;
  concreteGrade: ConcreteGrade;
  concreteSlump: ConcreteSlump;
  foundationType: ConcreteFoundationType;
  slabType: SlabType;
  rebarSteelQuality: RebarSteelQuality;
  meshDiameterMm: number; // 4.2, 5.0, 6.0, 7.0, 8.0 mm
  meshSpacingCm: number;  // 10, 15, 20 cm
  foundationSlabThicknessCm: number; // 12, 15, 20 cm
  footingWidthCm: number;  // 40 cm
  footingDepthCm: number;  // 60 cm
  leanConcreteThicknessCm: number; // 5 cm (emplantillado)

  // Pérgola & Exteriores (Casa TT)
  showPergola: boolean;
  pergolaWidthCm: number;
  pergolaLengthCm: number;
  pergolaHeightCm: number;
  showBarbecueCounter: boolean;

  // Patio Central / Tender
  hasCentralPatio: boolean;
  centralPatioOffsetCm: number;
  centralPatioLengthCm: number;

  // Vanos & Muros Interiores
  openings: ConcreteOpening[];
  interiorWalls: ConcreteInteriorWall[];

  // Diseñador de Planta 2D (Floor Planner & Drag & Drop Recintos)
  isFloorPlannerOpen: boolean;
  roomBlocks: RoomBlock[];

  // Visualización & Modos 3D
  renderMode: ConcreteRenderMode;
  showDimensions: boolean;
  showRebarMesh: boolean;
  showEdgeReinforcement: boolean;
  showOpeningReinforcement: boolean;
  showSpacers: boolean;
  showRoof: boolean;
  showFoundation: boolean;
  showFormworkTieHoles: boolean;
  selectedOpeningId: string | null;
  selectedWall: ConcreteWallTarget | null;
  isDraggingOpening: boolean;

  // Acciones de los 3 Pasos
  setWallSystemType: (t: WallSystemType) => void;
  setMezzanineSystemType: (m: MezzanineSystemType) => void;
  setRoofStructureType: (r: RoofStructureType) => void;

  // Acciones
  setDimensions: (dims: Partial<ConcreteHouseDimensions>) => void;
  setWallThicknessMm: (t: WallThicknessMm) => void;
  setMeshType: (m: WallMeshType) => void;
  setConcreteGrade: (g: ConcreteGrade) => void;
  setConcreteSlump: (s: ConcreteSlump) => void;
  setFoundationType: (f: ConcreteFoundationType) => void;
  setSlabType: (s: SlabType) => void;
  setRebarQuality: (q: RebarSteelQuality) => void;
  setMeshDiameter: (d: number) => void;
  setMeshSpacing: (s: number) => void;
  setFoundationSlabThickness: (t: number) => void;
  setShowPergola: (show: boolean) => void;
  setPergolaDimensions: (dims: { width?: number; length?: number; height?: number }) => void;
  setShowBarbecueCounter: (show: boolean) => void;
  setHasCentralPatio: (has: boolean) => void;
  setCentralPatioDimensions: (dims: { offset?: number; length?: number }) => void;

  // Manejo de Vanos
  addOpening: (op: Omit<ConcreteOpening, 'id'>) => void;
  updateOpening: (id: string, op: Partial<ConcreteOpening>) => void;
  removeOpening: (id: string) => void;
  setSelectedOpeningId: (id: string | null) => void;
  setSelectedWall: (wall: ConcreteWallTarget | null) => void;
  setIsDraggingOpening: (isDragging: boolean) => void;

  // Muros Interiores
  setInteriorWalls: (walls: ConcreteInteriorWall[]) => void;
  addInteriorWall: (wall: Omit<ConcreteInteriorWall, 'id'>) => void;
  removeInteriorWall: (id: string) => void;

  // Diseñador 2D / Floor Planner
  setFloorPlannerOpen: (open: boolean) => void;
  setRoomBlocks: (blocks: RoomBlock[]) => void;
  addRoomBlock: (block: Omit<RoomBlock, 'id'>) => void;
  updateRoomBlock: (id: string, block: Partial<RoomBlock>) => void;
  removeRoomBlock: (id: string) => void;
  applyFloorPlanLayout: (params: {
    width: number;
    length: number;
    wallHeight?: number;
    blocks: RoomBlock[];
    wallThicknessMm?: WallThicknessMm;
    roofType?: RoofType;
    showPergola?: boolean;
    pergolaWidth?: number;
    pergolaLength?: number;
    hasCentralPatio?: boolean;
    centralPatioOffset?: number;
    centralPatioLength?: number;
  }) => void;

  // Toggles de Capas
  setRenderMode: (mode: ConcreteRenderMode) => void;
  toggleDimensions: () => void;
  toggleRebarMesh: () => void;
  toggleEdgeReinforcement: () => void;
  toggleOpeningReinforcement: () => void;
  toggleSpacers: () => void;
  toggleRoof: () => void;
  toggleFoundation: () => void;
  toggleFormworkTieHoles: () => void;

  // Presets & Reset
  loadPreset: (presetId: string) => void;
  resetToDefault: () => void;
}

export const useConcreteHouseStore = create<ConcreteHouseState>((set, get) => ({
  // Sistema Estructural (3 Pasos)
  wallSystemType: 'hormigon_armado_total',
  mezzanineSystemType: 'losa_hormigon_armado',
  roofStructureType: 'dos_aguas_hormigon',

  dimensions: {
    width: 596,
    length: 2645,
    wallHeight: 285,
    levels: 1,
    overhangCm: 15,
    roofRidgeHeightCm: 175,
    roofType: 'dos_aguas_hormigon',
  },
  wallThicknessMm: 150,
  meshType: 'malla_doble',
  concreteGrade: 'G25_H30',
  concreteSlump: 'fluido_18cm',
  foundationType: 'losa_fundacion_suples',
  slabType: 'dos_aguas_hormigon',
  rebarSteelQuality: 'A630_420H',
  meshDiameterMm: 6.0,
  meshSpacingCm: 15,
  foundationSlabThicknessCm: 15,
  footingWidthCm: 40,
  footingDepthCm: 60,
  leanConcreteThicknessCm: 5,

  // Pérgola & Patio Casa TT
  showPergola: true,
  pergolaWidthCm: 400,
  pergolaLengthCm: 770,
  pergolaHeightCm: 280,
  showBarbecueCounter: true,
  hasCentralPatio: true,
  centralPatioOffsetCm: 1346,
  centralPatioLengthCm: 248,

  openings: [
    // Frente / Cabecera Sur (Acceso principal)
    { id: 'tt-op-1', type: 'door', name: 'Acceso Principal con Marquesina', wall: 'front', width: 120, height: 240, sillHeight: 0, offsetAlongWall: 80, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
    
    // Lateral Derecho / Este (Hacia galería y pérgola)
    { id: 'tt-op-2', type: 'window', name: 'Gran Ventanal Estar-Comedor', wall: 'right', width: 680, height: 240, sillHeight: 0, offsetAlongWall: 100, hasDiagonalRebar: true, lintelRebarDiameter: 16 },
    { id: 'tt-op-3', type: 'window', name: 'Ventana Cocina', wall: 'right', width: 180, height: 120, sillHeight: 110, offsetAlongWall: 860, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
    { id: 'tt-op-4', type: 'door', name: 'Salida a Patio Tender', wall: 'right', width: 90, height: 220, sillHeight: 0, offsetAlongWall: 1360, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    { id: 'tt-op-5', type: 'window', name: 'Ventana Dormitorio 1', wall: 'right', width: 180, height: 140, sillHeight: 85, offsetAlongWall: 1680, hasDiagonalRebar: true, lintelRebarDiameter: 12 },
    { id: 'tt-op-6', type: 'window', name: 'Ventana Suite Principal', wall: 'right', width: 220, height: 160, sillHeight: 70, offsetAlongWall: 2120, hasDiagonalRebar: true, lintelRebarDiameter: 12 },

    // Lateral Izquierdo / Oeste
    { id: 'tt-op-7', type: 'window', name: 'Ventana Longitudinal Estar', wall: 'left', width: 240, height: 80, sillHeight: 180, offsetAlongWall: 200, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    { id: 'tt-op-8', type: 'window', name: 'Ventana Baño Visitas', wall: 'left', width: 70, height: 80, sillHeight: 160, offsetAlongWall: 1120, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    { id: 'tt-op-9', type: 'door', name: 'Salida Oeste Patio Tender', wall: 'left', width: 90, height: 220, sillHeight: 0, offsetAlongWall: 1360, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    { id: 'tt-op-10', type: 'window', name: 'Ventana Dormitorio 1 Oeste', wall: 'left', width: 140, height: 120, sillHeight: 90, offsetAlongWall: 1720, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
    { id: 'tt-op-11', type: 'window', name: 'Ventana Antebaño Suite', wall: 'left', width: 90, height: 80, sillHeight: 160, offsetAlongWall: 2450, hasDiagonalRebar: true, lintelRebarDiameter: 10 },

    // Fondo / Cabecera Norte
    { id: 'tt-op-12', type: 'window', name: 'Ventana Baño Principal Norte', wall: 'back', width: 120, height: 80, sillHeight: 160, offsetAlongWall: 240, hasDiagonalRebar: true, lintelRebarDiameter: 10 },
  ],
  interiorWalls: [
    { id: 'iw-1', name: 'Divisorio Cocina / Baño Social', startX: 0, startZ: 1100, endX: 596, endZ: 1100, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
    { id: 'iw-2', name: 'Muro Límite Patio Tender', startX: 0, startZ: 1346, endX: 596, endZ: 1346, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
    { id: 'iw-3', name: 'Muro Acceso Pabellón Dormitorios', startX: 0, startZ: 1594, endX: 596, endZ: 1594, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
    { id: 'iw-4', name: 'Divisorio Dormitorio 1 / 2', startX: 0, startZ: 1980, endX: 596, endZ: 1980, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
    { id: 'iw-5', name: 'Divisorio Dormitorio 2 / Baño Suite', startX: 0, startZ: 2400, endX: 596, endZ: 2400, thicknessMm: 150, meshType: 'malla_doble', openings: [] },
  ],

  isFloorPlannerOpen: false,
  roomBlocks: [],

  renderMode: 'solid',
  showDimensions: true,
  showRebarMesh: true,
  showEdgeReinforcement: true,
  showOpeningReinforcement: true,
  showSpacers: true,
  showRoof: true,
  showFoundation: true,
  showFormworkTieHoles: true,
  selectedOpeningId: null,
  selectedWall: null,
  isDraggingOpening: false,

  setWallSystemType: (t) => {
    set((state) => ({
      wallSystemType: t,
      roomBlocks: state.roomBlocks.map((b) => ({
        ...b,
        wallType: t === 'albanileria_confinada' ? 'masonry_140' : 'concrete_150',
      })),
    }));
  },
  setMezzanineSystemType: (m) => set({ mezzanineSystemType: m }),
  setRoofStructureType: (r) => {
    set((state) => {
      const ridgeHeight = (r === 'dos_aguas_hormigon' || r === 'techumbre_madera_liviana')
        ? (state.dimensions.roofRidgeHeightCm && state.dimensions.roofRidgeHeightCm > 0 ? state.dimensions.roofRidgeHeightCm : 175)
        : 0;

      return {
        roofStructureType: r,
        slabType: r === 'dos_aguas_hormigon' ? 'dos_aguas_hormigon' : r === 'losa_plana_hormigon' ? 'losa_hormigon_12cm' : 'cadena_coronacion_techo_liviano',
        dimensions: {
          ...state.dimensions,
          roofRidgeHeightCm: ridgeHeight,
          roofType: r === 'dos_aguas_hormigon' ? 'dos_aguas_hormigon' : r === 'losa_plana_hormigon' ? 'losa_plana' : 'cadena_coronacion_techo_liviano',
        }
      };
    });
  },

  setDimensions: (dims) =>
    set((state) => {
      const oldWidth = state.dimensions.width;
      const oldLength = state.dimensions.length;
      const oldHeight = state.dimensions.wallHeight;

      const newDims = { ...state.dimensions, ...dims };
      const newWidth = newDims.width;
      const newLength = newDims.length;
      const newHeight = newDims.wallHeight;

      const ratioX = oldWidth > 0 ? newWidth / oldWidth : 1;
      const ratioZ = oldLength > 0 ? newLength / oldLength : 1;
      const ratioY = oldHeight > 0 ? newHeight / oldHeight : 1;

      const wallThickCm = (state.wallThicknessMm || 150) / 10;

      // 1. Re-escalar y ajustar muros interiores proporcionalmente
      const scaledInteriorWalls = (state.interiorWalls || []).map((iw) => {
        const wThick = (iw.thicknessMm || 150) / 10;
        let newStartZ = Math.round(iw.startZ * ratioZ);
        let newEndZ = Math.round((iw.endZ ?? iw.startZ) * ratioZ);
        let newStartX = Math.round((iw.startX ?? 0) * ratioX);
        let newEndX = Math.round((iw.endX ?? oldWidth) * ratioX);

        // Clamping para asegurar que permanezcan dentro del perímetro interior
        const minZ = wallThickCm + wThick / 2 + 10;
        const maxZ = Math.max(minZ, newLength - wallThickCm - wThick / 2 - 10);
        newStartZ = Math.max(minZ, Math.min(maxZ, newStartZ));
        newEndZ = Math.max(minZ, Math.min(maxZ, newEndZ));

        const minX = 0;
        const maxX = newWidth;
        newStartX = Math.max(minX, Math.min(maxX, newStartX));
        newEndX = Math.max(minX, Math.min(maxX, newEndX));

        return {
          ...iw,
          startX: newStartX,
          endX: newEndX,
          startZ: newStartZ,
          endZ: newEndZ,
        };
      });

      // 2. Re-escalar y clamplear Vanos (Puertas y Ventanas) para que no queden fuera de los muros
      const scaledOpenings = (state.openings || []).map((op) => {
        const isXWall = op.wall === 'front' || op.wall === 'back';
        const wallLen = isXWall ? newWidth : Math.max(50, newLength - wallThickCm * 2);
        const ratio = isXWall ? ratioX : ratioZ;

        let newOffset = Math.round(op.offsetAlongWall * ratio);
        const maxOffset = Math.max(10, wallLen - op.width - 10);
        newOffset = Math.max(10, Math.min(maxOffset, newOffset));

        let newHeight = op.height;
        if (newHeight + (op.sillHeight || 0) > newHeight - 10) {
          newHeight = Math.max(50, newHeight - (op.sillHeight || 0) - 10);
        }

        return {
          ...op,
          offsetAlongWall: newOffset,
        };
      });

      // 3. Patio Central y Pérgola
      const allowsPatio = newLength >= 1200 && newWidth >= 450;
      let newPatioOffset = Math.round(state.centralPatioOffsetCm * ratioZ);
      let newPatioLength = Math.round(state.centralPatioLengthCm * ratioZ);
      const maxPatioOffset = Math.max(150, newLength - newPatioLength - 150);
      newPatioOffset = Math.max(150, Math.min(maxPatioOffset, newPatioOffset));
      newPatioLength = Math.min(newLength * 0.35, newPatioLength);

      const newPergolaLen = Math.min(newLength * 0.8, Math.round(state.pergolaLengthCm * ratioZ));
      const newPergolaWidth = Math.min(newWidth * 0.9, Math.round(state.pergolaWidthCm * ratioX));

      // 4. Room Blocks (si existen en el diseñador 2D)
      const scaledRoomBlocks = (state.roomBlocks || []).map((b) => ({
        ...b,
        x: Math.round(b.x * ratioX),
        z: Math.round(b.z * ratioZ),
        width: Math.min(newWidth, Math.round(b.width * ratioX)),
        length: Math.min(newLength, Math.round(b.length * ratioZ)),
      }));

      return {
        dimensions: newDims,
        hasCentralPatio: allowsPatio ? state.hasCentralPatio : false,
        centralPatioOffsetCm: newPatioOffset,
        centralPatioLengthCm: newPatioLength,
        pergolaLengthCm: newPergolaLen,
        pergolaWidthCm: newPergolaWidth,
        interiorWalls: scaledInteriorWalls,
        openings: scaledOpenings,
        roomBlocks: scaledRoomBlocks,
      };
    }),
  setWallThicknessMm: (t) => {
    set({
      wallThicknessMm: t,
      meshType: t <= 100 ? 'malla_central' : 'malla_doble',
    });
  },
  setMeshType: (m) => set({ meshType: m }),
  setConcreteGrade: (g) => set({ concreteGrade: g }),
  setConcreteSlump: (s) => set({ concreteSlump: s }),
  setFoundationType: (f) => set({ foundationType: f }),
  setSlabType: (s) => set({ slabType: s }),
  setRebarQuality: (q) => set({ rebarSteelQuality: q }),
  setMeshDiameter: (d) => set({ meshDiameterMm: d }),
  setMeshSpacing: (s) => set({ meshSpacingCm: s }),
  setFoundationSlabThickness: (t) => set({ foundationSlabThicknessCm: t }),
  setShowPergola: (show) => set({ showPergola: show }),
  setPergolaDimensions: (dims) =>
    set((state) => ({
      pergolaWidthCm: dims.width ?? state.pergolaWidthCm,
      pergolaLengthCm: dims.length ?? state.pergolaLengthCm,
      pergolaHeightCm: dims.height ?? state.pergolaHeightCm,
    })),
  setShowBarbecueCounter: (show) => set({ showBarbecueCounter: show }),
  setHasCentralPatio: (has) => set({ hasCentralPatio: has }),
  setCentralPatioDimensions: (dims) =>
    set((state) => ({
      centralPatioOffsetCm: dims.offset ?? state.centralPatioOffsetCm,
      centralPatioLengthCm: dims.length ?? state.centralPatioLengthCm,
    })),

  addOpening: (op) =>
    set((state) => {
      const targetWall = op.wall;
      const wallThicknessCm = (state.wallThicknessMm || 150) / 10;
      const wallLengthCm =
        targetWall === 'front' || targetWall === 'back'
          ? state.dimensions.width
          : state.dimensions.length - wallThicknessCm * 2;
      const sameWallOpenings = state.openings.filter((o) => o.wall === targetWall);
      const initialOffset = op.offsetAlongWall ?? 60;
      const safeOffset = clampOpeningOffset(initialOffset, wallLengthCm, 'new-op', op.width, sameWallOpenings, 20, 20);

      return {
        openings: [
          ...state.openings,
          {
            ...op,
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            offsetAlongWall: safeOffset,
            frameMaterial: op.frameMaterial ?? 'pvc_negro',
            glazingType: op.glazingType ?? 'termopanel_dvp',
            hasDiagonalRebar: op.hasDiagonalRebar ?? true,
            lintelRebarDiameter: op.lintelRebarDiameter ?? 10,
          },
        ],
      };
    }),

  updateOpening: (id, op) =>
    set((state) => ({
      openings: state.openings.map((item) => {
        if (item.id !== id) return item;
        const targetWall = op.wall ?? item.wall;
        const wallThicknessCm = (state.wallThicknessMm || 150) / 10;
        const wallLengthCm =
          targetWall === 'front' || targetWall === 'back'
            ? state.dimensions.width
            : state.dimensions.length - wallThicknessCm * 2;
        const sameWallOpenings = state.openings.filter((o) => o.wall === targetWall);
        const newWidth = op.width ?? item.width;
        const candidateOffset = op.offsetAlongWall !== undefined ? op.offsetAlongWall : item.offsetAlongWall;
        const safeOffset = clampOpeningOffset(candidateOffset, wallLengthCm, id, newWidth, sameWallOpenings, 20, 20);

        return {
          ...item,
          ...op,
          offsetAlongWall: safeOffset,
        };
      }),
    })),

  removeOpening: (id) =>
    set((state) => ({
      openings: state.openings.filter((item) => item.id !== id),
      selectedOpeningId: state.selectedOpeningId === id ? null : state.selectedOpeningId,
    })),

  setSelectedOpeningId: (id) => set({ selectedOpeningId: id }),
  setSelectedWall: (wall) => set({ selectedWall: wall }),
  setIsDraggingOpening: (isDragging) => set({ isDraggingOpening: isDragging }),

  setInteriorWalls: (walls) => set({ interiorWalls: walls }),
  addInteriorWall: (wall) =>
    set((state) => ({
      interiorWalls: [
        ...state.interiorWalls,
        {
          ...wall,
          id: `iw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        },
      ],
    })),
  removeInteriorWall: (id) =>
    set((state) => ({
      interiorWalls: state.interiorWalls.filter((item) => item.id !== id),
    })),

  // Diseñador 2D / Floor Planner
  setFloorPlannerOpen: (open) => set({ isFloorPlannerOpen: open }),
  setRoomBlocks: (blocks) => set({ roomBlocks: blocks }),
  addRoomBlock: (block) =>
    set((state) => ({
      roomBlocks: [
        ...state.roomBlocks,
        {
          ...block,
          id: `rb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        },
      ],
    })),
  updateRoomBlock: (id, block) =>
    set((state) => ({
      roomBlocks: state.roomBlocks.map((b) => (b.id === id ? { ...b, ...block } : b)),
    })),
  removeRoomBlock: (id) =>
    set((state) => ({
      roomBlocks: state.roomBlocks.filter((b) => b.id !== id),
    })),

  applyFloorPlanLayout: (params) => {
    set((state) => {
      const {
        width,
        length,
        wallHeight = state.dimensions.wallHeight,
        blocks,
        wallThicknessMm = state.wallThicknessMm,
        roofType = state.dimensions.roofType,
        showPergola = state.showPergola,
        pergolaWidth = state.pergolaWidthCm,
        pergolaLength = state.pergolaLengthCm,
        hasCentralPatio = state.hasCentralPatio,
        centralPatioOffset = state.centralPatioOffsetCm,
        centralPatioLength = state.centralPatioLengthCm,
      } = params;

      return {
        dimensions: {
          ...state.dimensions,
          width,
          length,
          wallHeight,
          roofType,
        },
        wallThicknessMm,
        wallSystemType: state.wallSystemType,
        roomBlocks: blocks,
        interiorWalls: [],
        showPergola,
        pergolaWidthCm: pergolaWidth,
        pergolaLengthCm: pergolaLength,
        hasCentralPatio,
        centralPatioOffsetCm: centralPatioOffset,
        centralPatioLengthCm: centralPatioLength,
        isFloorPlannerOpen: false,
      };
    });
  },

  setRenderMode: (mode) => set({ renderMode: mode }),
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  toggleRebarMesh: () => set((state) => ({ showRebarMesh: !state.showRebarMesh })),
  toggleEdgeReinforcement: () => set((state) => ({ showEdgeReinforcement: !state.showEdgeReinforcement })),
  toggleOpeningReinforcement: () => set((state) => ({ showOpeningReinforcement: !state.showOpeningReinforcement })),
  toggleSpacers: () => set((state) => ({ showSpacers: !state.showSpacers })),
  toggleRoof: () => set((state) => ({ showRoof: !state.showRoof })),
  toggleFoundation: () => set((state) => ({ showFoundation: !state.showFoundation })),
  toggleFormworkTieHoles: () => set((state) => ({ showFormworkTieHoles: !state.showFormworkTieHoles })),

  loadPreset: (presetId) => {
    const p = CONCRETE_PRESETS.find((item) => item.id === presetId);
    if (p) {
      const roofStruct = p.roofStructureType ?? (p.dimensions.roofType === 'dos_aguas_hormigon' ? 'dos_aguas_hormigon' : p.dimensions.roofType === 'losa_plana' ? 'losa_plana_hormigon' : 'dos_aguas_hormigon');
      set({
        wallSystemType: p.wallSystemType ?? 'hormigon_armado_total',
        mezzanineSystemType: p.mezzanineSystemType ?? 'losa_hormigon_armado',
        roofStructureType: roofStruct,
        dimensions: { ...p.dimensions },
        wallThicknessMm: p.wallThicknessMm,
        meshType: p.meshType,
        foundationType: p.foundationType,
        slabType: p.slabType ?? (roofStruct === 'dos_aguas_hormigon' ? 'dos_aguas_hormigon' : 'losa_hormigon_12cm'),
        openings: [...p.openings],
        interiorWalls: p.interiorWalls ? [...p.interiorWalls] : [],
        showPergola: p.showPergola ?? false,
        pergolaWidthCm: p.pergolaWidthCm ?? 400,
        pergolaLengthCm: p.pergolaLengthCm ?? 770,
        pergolaHeightCm: p.pergolaHeightCm ?? 280,
        showBarbecueCounter: p.showBarbecueCounter ?? false,
        hasCentralPatio: p.hasCentralPatio ?? false,
        centralPatioOffsetCm: p.centralPatioOffsetCm ?? 1346,
        centralPatioLengthCm: p.centralPatioLengthCm ?? 248,
        selectedOpeningId: null,
      });
    }
  },

  resetToDefault: () => {
    get().loadPreset('casa_tt_158');
  },
}));
