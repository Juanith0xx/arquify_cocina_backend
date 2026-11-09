import { create } from 'zustand';

export type ChairLegsColor = 'blanco' | 'verde_manzana' | 'terracota' | 'azul_petroleo';

export interface ChairLegsColorOption {
  id: ChairLegsColor;
  name: string;
  ral: string;
  hex: string;
  textColor: string;
  metalness: number;
  roughness: number;
}

export const CHAIR_LEGS_COLORS: Record<ChairLegsColor, ChairLegsColorOption> = {
  blanco: {
    id: 'blanco',
    name: 'Blanco Esmaltado',
    ral: 'RAL 9016',
    hex: '#F8FAFC',
    textColor: '#1E293B',
    metalness: 0.15,
    roughness: 0.35,
  },
  verde_manzana: {
    id: 'verde_manzana',
    name: 'Verde Manzana',
    ral: 'RAL 6018',
    hex: '#65A30D',
    textColor: '#FFFFFF',
    metalness: 0.15,
    roughness: 0.35,
  },
  terracota: {
    id: 'terracota',
    name: 'Terracota',
    ral: 'RAL 3016',
    hex: '#C25E40',
    textColor: '#FFFFFF',
    metalness: 0.15,
    roughness: 0.35,
  },
  azul_petroleo: {
    id: 'azul_petroleo',
    name: 'Azul Petróleo',
    ral: 'RAL 5011',
    hex: '#164E63',
    textColor: '#FFFFFF',
    metalness: 0.2,
    roughness: 0.3,
  },
};

export interface AbetLaminateOption {
  id: string;
  name: string;
  code: string;
  hex: string;
  isTexture?: boolean;
  textureUrl?: string;
  category: 'Colores Lisos' | 'Diseño & Textura' | 'Maderas' | 'Personalizados';
  sheetFormat: string; // '130 x 305 cm'
}

export const ABET_LAMINATI_CATALOG: AbetLaminateOption[] = [
  // Lisos
  { id: 'abet_410', name: 'Blanco Polar', code: 'ABET 410', hex: '#F8FAFC', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_478', name: 'Gris Perla', code: 'ABET 478', hex: '#D1D5DB', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_421', name: 'Negro Grafito', code: 'ABET 421', hex: '#1E293B', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_859', name: 'Azzurro Cielo', code: 'ABET 859', hex: '#93C5FD', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_838', name: 'Verde Pomona', code: 'ABET 838', hex: '#84CC16', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_860', name: 'Terracotta Warm', code: 'ABET 860', hex: '#E07A5F', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  { id: 'abet_463', name: 'Amarillo Mostaza', code: 'ABET 463', hex: '#EAB308', category: 'Colores Lisos', sheetFormat: '130 x 305 cm' },
  
  // Diseño & Textura
  { id: 'abet_bacterio', name: 'Memphis Bacterio (Sottsass)', code: 'ABET 1982', hex: '#F8FAFC', isTexture: true, textureUrl: '/textures/abet-bacterio.svg', category: 'Diseño & Textura', sheetFormat: '130 x 305 cm' },
  { id: 'abet_broccato', name: 'Broccato Contemporáneo', code: 'ABET 2831', hex: '#E5E7EB', isTexture: true, textureUrl: '/textures/abet-broccato-2831.svg', category: 'Diseño & Textura', sheetFormat: '130 x 305 cm' },
  { id: 'abet_fiore', name: 'Fiore Pop Floral', code: 'ABET 2824', hex: '#E5E7EB', isTexture: true, textureUrl: '/textures/abet-fiore-pop-2824.svg', category: 'Diseño & Textura', sheetFormat: '130 x 305 cm' },
  { id: 'abet_terrazzo', name: 'Terrazzo Italiano', code: 'ABET 2840', hex: '#E2E8F0', isTexture: true, textureUrl: '/textures/abet-terrazzo.svg', category: 'Diseño & Textura', sheetFormat: '130 x 305 cm' },

  // Maderas
  { id: 'abet_wood_rovere', name: 'Rovere Nórdico', code: 'ABET 604', hex: '#D4B996', isTexture: true, textureUrl: '/textures/light-wood-grain.svg', category: 'Maderas', sheetFormat: '130 x 305 cm' },
];

export interface ChairFixedDimensions {
  readonly totalHeight: number; // 775 mm (Plano Proyecto Hormiga)
  readonly seatHeight: number;  // 450 mm
  readonly seatWidth: number;   // 446 mm
  readonly seatDepth: number;   // 431 mm
  readonly backrestWidth: number; // 461 mm
  readonly backrestHeight: number; // 219 mm
  readonly backrestRadius: number; // 396 mm (R396, flecha 69 mm)
  readonly baseFloorWidth: number; // 526 mm (Ancho patas suelo)
  readonly overallWidth: number; // 526 mm
  readonly overallDepth: number; // 431 mm
  readonly tubeDiameter: number; // 16 mm (Barra 16mm electropintada)
  readonly tubeWallThickness: number; // 1.5 mm
  readonly plywoodThickness: number; // 12 mm
  readonly laminateThickness: number; // 0.9 mm
  readonly sheetWidth: number; // 1300 mm (130 cm)
  readonly sheetLength: number; // 3050 mm (305 cm)
  readonly backrestAngle: number; // 81°
}

export const CHAIR_FIXED_DIMENSIONS: ChairFixedDimensions = {
  totalHeight: 775,
  seatHeight: 450,
  seatWidth: 446,
  seatDepth: 431,
  backrestWidth: 461,
  backrestHeight: 219,
  backrestRadius: 396,
  baseFloorWidth: 526,
  overallWidth: 526,
  overallDepth: 431,
  tubeDiameter: 16,
  tubeWallThickness: 1.5,
  plywoodThickness: 12,
  laminateThickness: 0.9,
  sheetWidth: 1300,
  sheetLength: 3050,
  backrestAngle: 81,
};

export type ChairFrameStyle = 'classic_4legs' | 'stackable_contract' | 'sled_cantilever';

export interface CustomUploadedTexture {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export interface ChairState {
  // Modelo de estructura
  frameStyle: ChairFrameStyle;
  setFrameStyle: (style: ChairFrameStyle) => void;

  // Patas de fierro
  legsColor: ChairLegsColor;
  setLegsColor: (color: ChairLegsColor) => void;

  // Asiento
  seatLaminateId: string;
  setSeatLaminateId: (id: string) => void;

  // Respaldo
  backrestSameBothSides: boolean;
  setBackrestSameBothSides: (same: boolean) => void;
  backrestFrontLaminateId: string;
  setBackrestFrontLaminateId: (id: string) => void;
  backrestRearLaminateId: string;
  setBackrestRearLaminateId: (id: string) => void;

  // Cantidad de sillas en proyecto
  chairQuantity: number;
  setChairQuantity: (qty: number) => void;

  // Texturas personalizadas cargadas por el usuario
  customTextures: CustomUploadedTexture[];
  addCustomTexture: (texture: CustomUploadedTexture) => void;
  removeCustomTexture: (id: string) => void;

  // Modelo 3D OBJ personalizado (.obj / .obj.txt)
  customObjText: string | null;
  customObjName: string | null;
  setCustomObjText: (text: string | null, name: string | null) => void;

  // Controles de visualización
  showDimensions3D: boolean;
  setShowDimensions3D: (show: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;
  explodedView: boolean;
  setExplodedView: (exploded: boolean) => void;

  // Reset
  resetConfig: () => void;
}

export const useChairStore = create<ChairState>((set) => ({
  frameStyle: 'classic_4legs',
  setFrameStyle: (style) => set({ frameStyle: style }),

  legsColor: 'azul_petroleo',
  setLegsColor: (color) => set({ legsColor: color }),

  seatLaminateId: 'abet_bacterio',
  setSeatLaminateId: (id) => set({ seatLaminateId: id }),

  backrestSameBothSides: false,
  setBackrestSameBothSides: (same) => set((state) => ({
    backrestSameBothSides: same,
    backrestRearLaminateId: same ? state.backrestFrontLaminateId : state.backrestRearLaminateId,
  })),

  backrestFrontLaminateId: 'abet_bacterio',
  setBackrestFrontLaminateId: (id) => set((state) => ({
    backrestFrontLaminateId: id,
    backrestRearLaminateId: state.backrestSameBothSides ? id : state.backrestRearLaminateId,
  })),

  backrestRearLaminateId: 'abet_410',
  setBackrestRearLaminateId: (id) => set({ backrestRearLaminateId: id }),

  chairQuantity: 1,
  setChairQuantity: (qty) => set({ chairQuantity: Math.max(1, Math.min(1000, qty)) }),

  customTextures: [],
  addCustomTexture: (texture) => set((state) => ({
    customTextures: [texture, ...state.customTextures],
  })),
  removeCustomTexture: (id) => set((state) => ({
    customTextures: state.customTextures.filter((t) => t.id !== id),
  })),

  customObjText: null,
  customObjName: null,
  setCustomObjText: (text, name) => set({ customObjText: text, customObjName: name }),

  showDimensions3D: true,
  setShowDimensions3D: (show) => set({ showDimensions3D: show }),
  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  explodedView: false,
  setExplodedView: (exploded) => set({ explodedView: exploded }),

  resetConfig: () => set({
    frameStyle: 'classic_4legs',
    legsColor: 'azul_petroleo',
    seatLaminateId: 'abet_bacterio',
    backrestSameBothSides: false,
    backrestFrontLaminateId: 'abet_bacterio',
    backrestRearLaminateId: 'abet_410',
    chairQuantity: 1,
    customObjText: null,
    customObjName: null,
    showDimensions3D: true,
    autoRotate: false,
    explodedView: false,
  }),
}));
