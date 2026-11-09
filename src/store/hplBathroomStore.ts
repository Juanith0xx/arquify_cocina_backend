import { create } from 'zustand';

export type HplThickness = 10 | 12 | 15 | 19;

export interface HplSheetFormat {
  id: string;
  name: string;
  width: number;  // mm (ej. 1300, 1610, 1860)
  length: number; // mm (ej. 3050, 3660, 4200)
  areaM2: number;
}

export const ABET_SHEET_FORMATS: HplSheetFormat[] = [
  { id: 'format_1300_3050', name: '1300 x 3050 mm (3.96 m²)', width: 1300, length: 3050, areaM2: 3.965 },
  { id: 'format_1610_3660', name: '1610 x 3660 mm (5.89 m²)', width: 1610, length: 3660, areaM2: 5.892 },
  { id: 'format_1610_4200', name: '1610 x 4200 mm (6.76 m²)', width: 1610, length: 4200, areaM2: 6.762 },
  { id: 'format_1860_4200', name: '1860 x 4200 mm (7.81 m²)', width: 1860, length: 4200, areaM2: 7.812 },
];

export interface HplColorOption {
  id: string;
  name: string;
  code: string;
  hex: string;
  isTexture?: boolean;
  textureUrl?: string;
}

export const HPL_STANDARD_COLORS: HplColorOption[] = [
  { id: 'abet_410', name: 'Blanco Polar (Abet 410)', code: 'ABET 410', hex: '#F3F4F6' },
  { id: 'abet_478', name: 'Gris Claro (Abet 478)', code: 'ABET 478', hex: '#D1D5DB' },
  { id: 'abet_859', name: 'Azul Claro / Azzurro (Abet 859)', code: 'ABET 859', hex: '#93C5FD' },
  { id: 'abet_broccato', name: 'Abet Broccato 2831', code: 'ABET 2831', hex: '#E5E7EB', isTexture: true, textureUrl: '/textures/abet-broccato-2831.svg' },
  { id: 'abet_fiore', name: 'Abet Fiore Pop 2824', code: 'ABET 2824', hex: '#E5E7EB', isTexture: true, textureUrl: '/textures/abet-fiore-pop-2824.svg' },
  { id: 'abet_wood', name: 'Madera Roble Nórdico', code: 'ABET WOOD', hex: '#D4B996', isTexture: true, textureUrl: '/textures/light-wood-grain.svg' },
];

export type JnfHardwareFinish = 'satin' | 'tb' | 'tg' | 'tco' | 'tn';

export interface JnfHardwareFinishInfo {
  id: JnfHardwareFinish;
  name: string;
  code: string;
  colorHex: string;
  roughness: number;
  metalness: number;
}

export const JNF_FINISHES: Record<JnfHardwareFinish, JnfHardwareFinishInfo> = {
  satin: { id: 'satin', name: 'Inox Satinado AISI 304/316', code: '.SATIN', colorHex: '#D1D5DB', roughness: 0.35, metalness: 0.9 },
  tb: { id: 'tb', name: 'PVD Titanium Black', code: '.TB', colorHex: '#262626', roughness: 0.3, metalness: 0.85 },
  tg: { id: 'tg', name: 'PVD Titanium Gold', code: '.TG', colorHex: '#D4AF37', roughness: 0.25, metalness: 0.95 },
  tco: { id: 'tco', name: 'PVD Titanium Copper', code: '.TCO', colorHex: '#B87333', roughness: 0.25, metalness: 0.95 },
  tn: { id: 'tn', name: 'PVD Titanium Natural', code: '.TN', colorHex: '#9CA3AF', roughness: 0.3, metalness: 0.9 },
};

export type UpperStabilizerSystem = 'round_19' | 'square_20' | 'u_profile';

export type FootModel = 'sm_017' | 'sm_017_xl' | 'sm_070';
export type HingeModel = 'sm_006_b' | 'sm_005_c_spring' | 'sm_005_e_spring_cover' | 'sm_005_b_free';
export type LockModel = 'sm_031_easyfix' | 'sm_060_two_in_one' | 'sm_030_indicator' | 'sm_035_slide';
export type HandleModel = 'in_75_050_d' | 'in_75_051_d' | 'in_75_040' | 'in_75_041';
export type HookModel = 'sm_008_stopper' | 'in_14_010' | 'in_14_020' | 'in_14_546';
export type WallFixingModel = 'sm_004_bracket' | 'sm_024_clamp' | 'sm_065_clamp' | 'u_profile_continuous';

export interface CubicleConfig {
  id: string;
  name: string;
  isPmr: boolean; // Movilidad Reducida / DDA
  doorWidth: number; // mm (600 - 950)
  cubicleWidth: number; // mm (800 - 1800)
  cubicleDepth: number; // mm (1100 - 2000)
  doorOpening: 'left_in' | 'right_in' | 'left_out' | 'right_out' | 'sliding';
  doorState: 'closed' | 'open_45' | 'open_90';
}

export interface UrinalScreenConfig {
  id: string;
  name: string;
  width: number; // mm (350 - 600)
  height: number; // mm (800 - 1400)
  clearanceFloor: number; // mm (350 - 600)
  positionX?: number; // mm (legacy compat)
  posX: number; // mm en sala (e.g. 1000 a 4000)
  posZ: number; // mm en sala (e.g. 300 a 4000)
  wallAttachment: 'back_wall' | 'right_wall' | 'front_wall' | 'left_wall' | 'free';
  rotationY?: number; // radianes o grados
}

export interface BathroomRoomConfig {
  roomWidth: number; // mm (2000 - 10000)
  roomLength: number; // mm (2000 - 10000)
  roomHeight: number; // mm (2400 - 3500)
  wallTileColor: string;
  floorTileColor: string;
  tileFormat: 600; // 60x60 cm
  showFixtures: boolean; // Tazas WC y Urinarios
}

export interface HplBathroomState {
  // Espesores independientes por pieza (Requisito 2)
  thicknessDoor: HplThickness;
  thicknessPilaster: HplThickness;
  thicknessDivider: HplThickness;
  thicknessUrinal: HplThickness;

  // Formato de plancha preferido Abet Laminati (Requisito 1)
  selectedFormatId: string;
  autoOptimizeFormat: boolean;

  // Acabado HPL y Decorativos (Requisito 5)
  selectedColorId: string;
  customTextureUrl: string | null;
  customTextureName: string | null;

  // Quincallería JNF (Requisito 3)
  hardwareFinish: JnfHardwareFinish;
  stabilizerSystem: UpperStabilizerSystem;
  footModel: FootModel;
  hingeModel: HingeModel;
  lockModel: LockModel;
  handleModel: HandleModel;
  hookModel: HookModel;
  wallFixingModel: WallFixingModel;
  footHeight: number; // mm (120 - 180)
  panelHeight: number; // mm (1600 - 2000)
  dividerHeight: number; // mm (1500 - 2100)

  // Configuración de cubículos y urinarios (Requisito 6)
  cubicles: CubicleConfig[];
  urinalScreens: UrinalScreenConfig[];
  leftEndPilasterWidth: number; // mm
  rightEndPilasterWidth: number; // mm
  intermediatePilasterWidth: number; // mm
  batteryLayout: 'inline_wall_left' | 'inline_wall_right' | 'between_walls' | 'island';

  // Configuración de la sala de baño (Requisito 6 y 7)
  room: BathroomRoomConfig;

  // Acciones
  setThicknessDoor: (t: HplThickness) => void;
  setThicknessPilaster: (t: HplThickness) => void;
  setThicknessDivider: (t: HplThickness) => void;
  setThicknessUrinal: (t: HplThickness) => void;
  setSelectedFormatId: (id: string) => void;
  setAutoOptimizeFormat: (auto: boolean) => void;

  setSelectedColorId: (id: string) => void;
  setCustomTexture: (url: string | null, name?: string | null) => void;

  setHardwareFinish: (f: JnfHardwareFinish) => void;
  setStabilizerSystem: (sys: UpperStabilizerSystem) => void;
  setFootModel: (m: FootModel) => void;
  setHingeModel: (m: HingeModel) => void;
  setLockModel: (m: LockModel) => void;
  setHandleModel: (m: HandleModel) => void;
  setHookModel: (m: HookModel) => void;
  setWallFixingModel: (m: WallFixingModel) => void;
  setFootHeight: (h: number) => void;
  setPanelHeight: (h: number) => void;
  setDividerHeight: (h: number) => void;

  // Modificación de cubículos
  setCubicles: (c: CubicleConfig[]) => void;
  addCubicle: (isPmr?: boolean) => void;
  removeCubicle: (id: string) => void;
  updateCubicle: (id: string, updates: Partial<CubicleConfig>) => void;
  toggleAllDoors: () => void;

  // Modificación de urinarios
  setUrinalScreens: (u: UrinalScreenConfig[]) => void;
  addUrinalScreen: (wall?: 'back_wall' | 'right_wall' | 'front_wall' | 'left_wall' | 'free') => void;
  removeUrinalScreen: (id: string) => void;
  updateUrinalScreen: (id: string, updates: Partial<UrinalScreenConfig>) => void;
  moveUrinalScreen: (id: string, posX: number, posZ: number) => void;

  // Parámetros de sala y pilastras
  setPilasterWidths: (left: number, intermediate: number, right: number) => void;
  setBatteryLayout: (l: 'inline_wall_left' | 'inline_wall_right' | 'between_walls' | 'island') => void;
  updateRoom: (updates: Partial<BathroomRoomConfig>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_CUBICLES: CubicleConfig[] = [
  {
    id: 'cab_1',
    name: 'Cabina 1 (Estándar)',
    isPmr: false,
    doorWidth: 620,
    cubicleWidth: 1000,
    cubicleDepth: 1400,
    doorOpening: 'left_in',
    doorState: 'closed',
  },
  {
    id: 'cab_2',
    name: 'Cabina 2 (Estándar)',
    isPmr: false,
    doorWidth: 620,
    cubicleWidth: 1000,
    cubicleDepth: 1400,
    doorOpening: 'left_in',
    doorState: 'closed',
  },
  {
    id: 'cab_3_pmr',
    name: 'Cabina 3 (PMR / Universal)',
    isPmr: true,
    doorWidth: 850,
    cubicleWidth: 1500,
    cubicleDepth: 1600,
    doorOpening: 'left_out',
    doorState: 'closed',
  },
];

const DEFAULT_URINALS: UrinalScreenConfig[] = [
  {
    id: 'urin_1',
    name: 'Separador Urinario 1',
    width: 450,
    height: 1000,
    clearanceFloor: 450,
    posX: 3800,
    posZ: 1400,
    wallAttachment: 'right_wall',
    rotationY: Math.PI / 2,
    positionX: 3800,
  },
  {
    id: 'urin_2',
    name: 'Separador Urinario 2',
    width: 450,
    height: 1000,
    clearanceFloor: 450,
    posX: 3800,
    posZ: 2300,
    wallAttachment: 'right_wall',
    rotationY: Math.PI / 2,
    positionX: 3800,
  },
];

export const useHplBathroomStore = create<HplBathroomState>((set) => ({
  thicknessDoor: 12,
  thicknessPilaster: 12,
  thicknessDivider: 12,
  thicknessUrinal: 12,

  selectedFormatId: 'format_1610_3660',
  autoOptimizeFormat: true,

  selectedColorId: 'abet_410',
  customTextureUrl: null,
  customTextureName: null,

  hardwareFinish: 'satin',
  stabilizerSystem: 'round_19',
  footModel: 'sm_017',
  hingeModel: 'sm_005_c_spring',
  lockModel: 'sm_031_easyfix',
  handleModel: 'in_75_050_d',
  hookModel: 'sm_008_stopper',
  wallFixingModel: 'sm_024_clamp',
  footHeight: 150,
  panelHeight: 1800,
  dividerHeight: 1800,

  cubicles: DEFAULT_CUBICLES,
  urinalScreens: DEFAULT_URINALS,
  leftEndPilasterWidth: 150,
  rightEndPilasterWidth: 150,
  intermediatePilasterWidth: 120,
  batteryLayout: 'inline_wall_left',

  room: {
    roomWidth: 4200,
    roomLength: 4500,
    roomHeight: 2800,
    wallTileColor: '#FFFFFF',
    floorTileColor: '#F8FAFC',
    tileFormat: 600,
    showFixtures: true,
  },

  setThicknessDoor: (t) => set({ thicknessDoor: t }),
  setThicknessPilaster: (t) => set({ thicknessPilaster: t }),
  setThicknessDivider: (t) => set({ thicknessDivider: t }),
  setThicknessUrinal: (t) => set({ thicknessUrinal: t }),
  setSelectedFormatId: (id) => set({ selectedFormatId: id }),
  setAutoOptimizeFormat: (auto) => set({ autoOptimizeFormat: auto }),

  setSelectedColorId: (id) => set({ selectedColorId: id, customTextureUrl: null, customTextureName: null }),
  setCustomTexture: (url, name) => set({ customTextureUrl: url, customTextureName: name || 'Textura Personalizada', selectedColorId: 'custom' }),

  setHardwareFinish: (f) => set({ hardwareFinish: f }),
  setStabilizerSystem: (sys) => set({ stabilizerSystem: sys }),
  setFootModel: (m) => set({ footModel: m }),
  setHingeModel: (m) => set({ hingeModel: m }),
  setLockModel: (m) => set({ lockModel: m }),
  setHandleModel: (m) => set({ handleModel: m }),
  setHookModel: (m) => set({ hookModel: m }),
  setWallFixingModel: (m) => set({ wallFixingModel: m }),
  setFootHeight: (h) => set({ footHeight: Math.max(100, Math.min(200, h)) }),
  setPanelHeight: (h) => set({ panelHeight: Math.max(1600, Math.min(2100, h)) }),
  setDividerHeight: (h) => set({ dividerHeight: Math.max(1500, Math.min(2200, h)) }),

  setCubicles: (c) => set({ cubicles: c }),
  addCubicle: (isPmr = false) => set((state) => {
    const nextIdx = state.cubicles.length + 1;
    const neededWidth = isPmr ? 1500 : 1000;
    const currentTotalW = state.cubicles.reduce((sum, c) => sum + c.cubicleWidth, 0);

    // Regla: Siempre los cubículos deben estar dentro del área del baño (dejando margen mínimo)
    if (currentTotalW + neededWidth > state.room.roomWidth - 100) {
      return state; // No cabe en la sala, no permitir cargarlo
    }

    const defaultDepth = isPmr ? 1600 : 1400;
    const maxAllowedDepth = Math.min(1800, Math.max(1000, state.room.roomLength - 200));

    const newCab: CubicleConfig = {
      id: `cab_${Date.now()}`,
      name: isPmr ? `Cabina ${nextIdx} (PMR / Universal)` : `Cabina ${nextIdx} (Estándar)`,
      isPmr,
      doorWidth: isPmr ? 850 : 620,
      cubicleWidth: neededWidth,
      cubicleDepth: Math.min(defaultDepth, maxAllowedDepth),
      doorOpening: isPmr ? 'left_out' : 'left_in',
      doorState: 'closed',
    };
    return { cubicles: [...state.cubicles, newCab] };
  }),
  removeCubicle: (id) => set((state) => ({
    cubicles: state.cubicles.filter((c) => c.id !== id),
  })),
  updateCubicle: (id, updates) => set((state) => {
    const cab = state.cubicles.find((c) => c.id === id);
    if (!cab) return state;

    let targetWidth = updates.cubicleWidth !== undefined ? updates.cubicleWidth : cab.cubicleWidth;
    let targetDepth = updates.cubicleDepth !== undefined ? updates.cubicleDepth : cab.cubicleDepth;

    // Validar que el ancho total acumulado no supere el ancho de la sala
    const otherWidths = state.cubicles
      .filter((c) => c.id !== id)
      .reduce((sum, c) => sum + c.cubicleWidth, 0);

    const maxAllowedWidth = state.room.roomWidth - 100;
    if (targetWidth + otherWidths > maxAllowedWidth) {
      targetWidth = Math.max(700, maxAllowedWidth - otherWidths);
    }

    // Validar que la profundidad esté estrictamente entre 1000 mm (100 cm) y 1800 mm (180 cm) y no supere la sala
    const maxRoomDepth = Math.min(1800, Math.max(1000, state.room.roomLength - 200));
    targetDepth = Math.max(1000, Math.min(maxRoomDepth, targetDepth));

    return {
      cubicles: state.cubicles.map((c) =>
        c.id === id ? { ...c, ...updates, cubicleWidth: targetWidth, cubicleDepth: targetDepth } : c
      ),
    };
  }),
  toggleAllDoors: () => set((state) => {
    const anyOpen = state.cubicles.some((c) => c.doorState !== 'closed');
    const newState = anyOpen ? 'closed' : 'open_45';
    return {
      cubicles: state.cubicles.map((c) => ({ ...c, doorState: newState })),
    };
  }),

  setUrinalScreens: (u) => set({ urinalScreens: u }),
  addUrinalScreen: (wall = 'right_wall') => set((state) => {
    const nextIdx = state.urinalScreens.length + 1;
    let newPosX = 3800;
    let newPosZ = 1200 + (state.urinalScreens.length * 900);
    let rot = Math.PI / 2;

    if (wall === 'back_wall') {
      newPosX = 2600 + (state.urinalScreens.length * 800);
      newPosZ = 300;
      rot = 0;
    } else if (wall === 'front_wall') {
      newPosX = 1200 + (state.urinalScreens.length * 800);
      newPosZ = state.room.roomLength - 300;
      rot = Math.PI;
    } else if (wall === 'left_wall') {
      newPosX = 300;
      newPosZ = 1200 + (state.urinalScreens.length * 900);
      rot = -Math.PI / 2;
    }

    const newU: UrinalScreenConfig = {
      id: `urin_${Date.now()}`,
      name: `Separador Urinario ${nextIdx}`,
      width: 450,
      height: 1000,
      clearanceFloor: 450,
      posX: Math.min(state.room.roomWidth - 300, Math.max(300, newPosX)),
      posZ: Math.min(state.room.roomLength - 300, Math.max(300, newPosZ)),
      wallAttachment: wall,
      rotationY: rot,
      positionX: newPosX,
    };
    return { urinalScreens: [...state.urinalScreens, newU] };
  }),
  removeUrinalScreen: (id) => set((state) => ({
    urinalScreens: state.urinalScreens.filter((u) => u.id !== id),
  })),
  updateUrinalScreen: (id, updates) => set((state) => ({
    urinalScreens: state.urinalScreens.map((u) => (u.id === id ? { ...u, ...updates } : u)),
  })),
  moveUrinalScreen: (id, posX, posZ) => set((state) => ({
    urinalScreens: state.urinalScreens.map((u) => {
      if (u.id !== id) return u;
      return {
        ...u,
        posX: Math.round(posX),
        posZ: Math.round(posZ),
        positionX: Math.round(posX),
      };
    }),
  })),

  setPilasterWidths: (left, intermediate, right) => set({
    leftEndPilasterWidth: left,
    intermediatePilasterWidth: intermediate,
    rightEndPilasterWidth: right,
  }),
  setBatteryLayout: (l) => set({ batteryLayout: l }),
  updateRoom: (updates) => set((state) => ({ room: { ...state.room, ...updates } })),
  resetToDefaults: () => set({
    thicknessDoor: 12,
    thicknessPilaster: 12,
    thicknessDivider: 12,
    thicknessUrinal: 12,
    selectedFormatId: 'format_1610_3660',
    autoOptimizeFormat: true,
    selectedColorId: 'abet_410',
    customTextureUrl: null,
    customTextureName: null,
    hardwareFinish: 'satin',
    stabilizerSystem: 'round_19',
    footModel: 'sm_017',
    hingeModel: 'sm_005_c_spring',
    lockModel: 'sm_031_easyfix',
    handleModel: 'in_75_050_d',
    hookModel: 'sm_008_stopper',
    wallFixingModel: 'sm_024_clamp',
    footHeight: 150,
    panelHeight: 1800,
    cubicles: DEFAULT_CUBICLES,
    urinalScreens: DEFAULT_URINALS,
    leftEndPilasterWidth: 150,
    rightEndPilasterWidth: 150,
    intermediatePilasterWidth: 120,
    batteryLayout: 'inline_wall_left',
    room: {
      roomWidth: 4200,
      roomLength: 4500,
      roomHeight: 2800,
      wallTileColor: '#FFFFFF',
      floorTileColor: '#F8FAFC',
      tileFormat: 600,
      showFixtures: true,
    },
  }),
}));
