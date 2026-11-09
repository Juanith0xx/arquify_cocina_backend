import { create } from 'zustand';

export type SpecialColorId = 'terracota' | 'gris_grafito' | 'verde_agua' | 'verde_petroleo' | 'negro';
export type AbetTextureId = 'abet_broccato_2831' | 'abet_fiore_pop_2824' | string;

export interface SpecialColorConfig {
  id: SpecialColorId;
  name: string;
  hex: string;
  description: string;
}

export const SPECIAL_COLORS: SpecialColorConfig[] = [
  { id: 'terracota', name: 'Terracota', hex: '#C85A48', description: 'Tono cálido arcilla natural de alta elegancia' },
  { id: 'gris_grafito', name: 'Gris Grafito', hex: '#373E44', description: 'Gris mineral profundo antracita mate' },
  { id: 'verde_agua', name: 'Verde Agua', hex: '#7AAFA6', description: 'Verde menta pastel nórdico contemporáneo' },
  { id: 'verde_petroleo', name: 'Verde Petróleo', hex: '#1E4D54', description: 'Verde azulado profundo e intenso' },
  { id: 'negro', name: 'Negro', hex: '#1C1C1C', description: 'Negro mate absoluto sofisticado' },
];

export interface AbetTextureConfig {
  id: string;
  name: string;
  code: string;
  finish: string;
  url: string;
  previewUrl: string;
  description: string;
}

export const ABET_TEXTURES: AbetTextureConfig[] = [
  {
    id: 'abet_broccato_2831',
    name: 'Broccato 2831',
    code: 'SAP 2831',
    finish: 'Acabado Longline',
    url: '/textures/abet-broccato-2831.svg',
    previewUrl: '/textures/abet-broccato-2831.svg',
    description: 'Motivo damasco barroco de gran sofisticación en tonos verde petróleo y grafito'
  },
  {
    id: 'abet_fiore_pop_2824',
    name: 'Fiore Pop 2824',
    code: 'SAP 2824',
    finish: 'Acabado Longline',
    url: '/textures/abet-fiore-pop-2824.svg',
    previewUrl: '/textures/abet-fiore-pop-2824.svg',
    description: 'Patrón floral pop vanguardista sobre fondo magenta vibrante con pétalos lilas'
  }
];

export interface SpecialFurnitureState {
  // Dimensiones Principales (cm)
  width: number;       // Ancho total (60 a 140 cm, default 90 cm)
  height: number;      // Alto total mueble (120 a 220 cm, default 180 cm)
  depth: number;       // Profundidad total (35 a 60 cm, default 42 cm)
  thickness: number;   // Espesor de tableros (cm, default 1.8 cm = 18mm)
  legHeight: number;   // Altura de patas metálicas (cm, default 25 cm)
  
  // Colores y Materiales
  exteriorColor: SpecialColorId;
  backTexture: string;
  customBackTextureUrl: string | null;
  
  // Opciones de detalle
  doorGlassType: 'transparent' | 'grid' | 'smoked'; // Vidrio con micro-malla o transparente
  doorOpen: boolean;
  drawerOpen: boolean;
  showDimensions: boolean;
  isTransparent: boolean; // Modo rayos X para ver ensambles y herrajes interiores
  
  // Herrajes y Construcción
  assemblyType: 'minifix' | 'confirmat';
  hardwareBrand: 'Hafele' | 'Provelcar' | 'Blum';
  
  // Acciones
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setDepth: (d: number) => void;
  setThickness: (t: number) => void;
  setLegHeight: (lh: number) => void;
  setExteriorColor: (color: SpecialColorId) => void;
  setBackTexture: (tex: string) => void;
  setCustomBackTextureUrl: (url: string | null) => void;
  setDoorGlassType: (t: 'transparent' | 'grid' | 'smoked') => void;
  setDoorOpen: (open: boolean) => void;
  toggleDoorOpen: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawerOpen: () => void;
  setShowDimensions: (show: boolean) => void;
  setIsTransparent: (tr: boolean) => void;
  setAssemblyType: (a: 'minifix' | 'confirmat') => void;
  setHardwareBrand: (b: 'Hafele' | 'Provelcar' | 'Blum') => void;
  resetToDefaults: () => void;
}

export const useSpecialFurnitureStore = create<SpecialFurnitureState>((set) => ({
  width: 90,
  height: 185,
  depth: 42,
  thickness: 1.8,
  legHeight: 25,
  
  exteriorColor: 'terracota',
  backTexture: 'abet_broccato_2831',
  customBackTextureUrl: null,
  
  doorGlassType: 'grid',
  doorOpen: false,
  drawerOpen: false,
  showDimensions: true,
  isTransparent: false,
  
  assemblyType: 'minifix',
  hardwareBrand: 'Hafele',
  
  setWidth: (width) => set({ width: Math.max(60, Math.min(120, width)) }),
  setHeight: (height) => set({ height: Math.max(120, Math.min(230, height)) }),
  setDepth: (depth) => set({ depth: Math.max(35, Math.min(65, depth)) }),
  setThickness: (thickness) => set({ thickness }),
  setLegHeight: (legHeight) => set({ legHeight: Math.max(15, Math.min(35, legHeight)) }),
  setExteriorColor: (exteriorColor) => set({ exteriorColor }),
  setBackTexture: (backTexture) => set({ backTexture, customBackTextureUrl: null }),
  setCustomBackTextureUrl: (customBackTextureUrl) => set({ customBackTextureUrl, backTexture: 'custom' }),
  setDoorGlassType: (doorGlassType) => set({ doorGlassType }),
  setDoorOpen: (doorOpen) => set({ doorOpen }),
  toggleDoorOpen: () => set((state) => ({ doorOpen: !state.doorOpen })),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  toggleDrawerOpen: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setIsTransparent: (isTransparent) => set({ isTransparent }),
  setAssemblyType: (assemblyType) => set({ assemblyType }),
  setHardwareBrand: (hardwareBrand) => set({ hardwareBrand }),
  resetToDefaults: () => set({
    width: 90,
    height: 185,
    depth: 42,
    thickness: 1.8,
    legHeight: 25,
    exteriorColor: 'terracota',
    backTexture: 'abet_broccato_2831',
    customBackTextureUrl: null,
    doorGlassType: 'grid',
    doorOpen: false,
    drawerOpen: false,
    showDimensions: true,
    isTransparent: false,
  }),
}));
