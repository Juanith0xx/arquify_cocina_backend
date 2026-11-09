import { create } from 'zustand';

export type MaterialType = 'melamina' | 'hpl';
export type PartType = 'structure' | 'doors' | 'drawerFronts' | 'drawerInner' | 'shelves' | 'back' | 'socle' | 'islandBack' | 'coverPanels' | 'leftCoverPanel' | 'rightCoverPanel' | 'all';

export interface TextureItem {
  id: string;
  name: string;
  url: string;
}

export interface ClosetModuleOverrides {
  structureMaterial?: MaterialType;
  structureColor?: string;
  doorMaterial?: MaterialType;
  doorColor?: string;
  drawerFrontMaterial?: MaterialType;
  drawerFrontColor?: string;
  drawerInnerMaterial?: MaterialType;
  drawerInnerColor?: string;
  shelfMaterial?: MaterialType;
  shelfColor?: string;
  backMaterial?: MaterialType;
  backColor?: string;
  socleMaterial?: MaterialType;
  socleColor?: string;
  grainDirection?: 'vertical' | 'horizontal';
  isOpen?: boolean;
  openElements?: Record<string, boolean>;
  grainElements?: Record<string, 'vertical' | 'horizontal'>;
  hplBalancer?: boolean;
}

export interface ClosetModule {
  id: string;
  width: number;
  shelves: number;
  drawers: number;
  doors: boolean;
  hasHanger?: boolean;
  innerDrawers?: boolean;
  overrides?: ClosetModuleOverrides;
}

export interface ClosetState {
  height: number;
  depth: number;
  thickness: number;
  
  // Materials & Colors
  structureMaterial: MaterialType;
  structureColor: string;
  doorMaterial: MaterialType;
  doorColor: string;
  drawerFrontMaterial: MaterialType;
  drawerFrontColor: string;
  drawerInnerMaterial: MaterialType;
  drawerInnerColor: string;
  shelfMaterial: MaterialType;
  shelfColor: string;
  socleMaterial: MaterialType;
  socleColor: string;
  backColor: string;
  backMaterial?: MaterialType | 'durolac';
  backThickness?: number;
  drawerBottomMaterial?: 'melamina' | 'durolac';
  hplInnerFace: 'blanco' | 'color'; // only applies if a part is HPL

  edgeBandingThicknessCabinets: 0.5 | 1.0 | 1.5 | 2.0;
  edgeBandingThicknessFronts: 0.5 | 1.0 | 1.5 | 2.0;

  showTopWall: boolean;
  showBottomWall: boolean;
  hplBalancer: boolean;
  setHplBalancer: (val: boolean) => void;
  showLeftWall: boolean;
  showRightWall: boolean;
  showBackWall: boolean;
  showSocle: boolean;
  showLegs: boolean;
  showDimensions: boolean;
  dimensionLevel: number;
  showDecorations: boolean;
  isTransparent: boolean;
  
  drawerHardware: 'Provelcar' | 'Hafele';
  assemblyType: 'spax' | 'minifix';
  drawerAssemblyType: 'spax' | 'minifix';
  
  modules: ClosetModule[];
  activeModuleId: string | null;
  savedDesigns: string[];
  isPrinting: boolean;

  targetPart: PartType;
  setTargetPart: (part: PartType) => void;
  applyTextureToTarget: (textureUrl: string) => void;
  
  customTextures: TextureItem[];
  setCustomTextures: (textures: TextureItem[]) => void;
  
  setHeight: (h: number) => void;
  setDepth: (d: number) => void;
  setThickness: (t: number) => void;
  
  setStructureMaterial: (m: MaterialType) => void;
  setStructureColor: (c: string) => void;
  setDoorMaterial: (m: MaterialType) => void;
  setDoorColor: (c: string) => void;
  setDrawerFrontMaterial: (m: MaterialType) => void;
  setDrawerFrontColor: (c: string) => void;
  setDrawerInnerMaterial: (m: MaterialType) => void;
  setDrawerInnerColor: (c: string) => void;
  setShelfMaterial: (m: MaterialType) => void;
  setShelfColor: (c: string) => void;
  setSocleMaterial: (m: MaterialType) => void;
  setSocleColor: (c: string) => void;
  setBackColor: (c: string) => void;
  setBackMaterial?: (m: MaterialType | 'durolac') => void;
  setBackThickness?: (t: number) => void;
  setDrawerBottomMaterial?: (m: 'melamina' | 'durolac') => void;
  setHplInnerFace: (f: 'blanco' | 'color') => void;
  setEdgeBandingThicknessCabinets: (t: 0.5 | 1.0 | 1.5 | 2.0) => void;
  setEdgeBandingThicknessFronts: (t: 0.5 | 1.0 | 1.5 | 2.0) => void;

  toggleTopWall: () => void;
  toggleBottomWall: () => void;
  toggleLeftWall: () => void;
  toggleRightWall: () => void;
  toggleBackWall: () => void;
  toggleSocle: () => void;
  toggleLegs: () => void;
  toggleDimensions: () => void;
  setShowDimensions: (val: boolean) => void;
  setDimensionLevel: (l: number) => void;
  toggleDecorations: () => void;
  toggleTransparent: () => void;
  
  setDrawerHardware: (type: 'Provelcar' | 'Hafele') => void;
  setAssemblyType: (type: 'spax' | 'minifix') => void;
  setDrawerAssemblyType: (type: 'spax' | 'minifix') => void;
  
  addModule: () => void;
  updateModule: (id: string, updates: Partial<ClosetModule>) => void;
  updateModuleOverrides: (id: string, overrides: Partial<ClosetModuleOverrides> | null) => void;
  removeModule: (id: string) => void;
  setActiveModule: (id: string | null) => void;
  
  history: Array<{
    modules: ClosetModule[];
    height: number;
    depth: number;
    thickness: number;
    structureColor: string;
    structureMaterial: MaterialType;
    doorColor: string;
    doorMaterial: MaterialType;
    drawerFrontColor: string;
    drawerFrontMaterial: MaterialType;
    shelfColor: string;
    shelfMaterial: MaterialType;
    socleColor: string;
    socleMaterial: MaterialType;
    backColor: string;
    showSocle: boolean;
    showLegs: boolean;
  }>;
  future: Array<{
    modules: ClosetModule[];
    height: number;
    depth: number;
    thickness: number;
    structureColor: string;
    structureMaterial: MaterialType;
    doorColor: string;
    doorMaterial: MaterialType;
    drawerFrontColor: string;
    drawerFrontMaterial: MaterialType;
    shelfColor: string;
    shelfMaterial: MaterialType;
    socleColor: string;
    socleMaterial: MaterialType;
    backColor: string;
    showSocle: boolean;
    showLegs: boolean;
  }>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  saveDesign: (name: string) => void;
  loadDesign: (name: string) => void;
  setIsPrinting: (val: boolean) => void;
}

const defaultModule: ClosetModule = {
  id: 'mod-1',
  width: 90,
  shelves: 2,
  drawers: 2,
  doors: false,
  hasHanger: false,
  innerDrawers: false,
};

const defaultModules: ClosetModule[] = [
  {
    id: 'mod-1',
    width: 90,
    shelves: 2,
    drawers: 2,
    doors: false,
    hasHanger: false,
    innerDrawers: false,
  },
  {
    id: 'mod-2',
    width: 100,
    shelves: 2,
    drawers: 0,
    doors: false,
    hasHanger: true,
    innerDrawers: false
  },
  {
    id: 'mod-3',
    width: 80,
    shelves: 2,
    drawers: 2,
    doors: true,
    hasHanger: false,
    innerDrawers: false,
  }
];

const getSavedDesigns = () => {
  const designs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('closet-design-')) {
      designs.push(key.replace('closet-design-', ''));
    }
  }
  return designs;
};

export const useStore = create<ClosetState>((set, get) => {
  const saveSnapshot = (state: ClosetState) => {
    const snapshot = {
      modules: JSON.parse(JSON.stringify(state.modules)),
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      structureColor: state.structureColor,
      structureMaterial: state.structureMaterial,
      doorColor: state.doorColor,
      doorMaterial: state.doorMaterial,
      drawerFrontColor: state.drawerFrontColor,
      drawerFrontMaterial: state.drawerFrontMaterial,
      shelfColor: state.shelfColor,
      shelfMaterial: state.shelfMaterial,
      socleColor: state.socleColor,
      socleMaterial: state.socleMaterial,
      backColor: state.backColor,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
    };
    const prevHistory = state.history || [];
    return [snapshot, ...prevHistory.slice(0, 29)];
  };

  return {
  height: 240,
  depth: 60,
  thickness: 1.8,
  
  structureMaterial: 'melamina',
  structureColor: '#ffffff',
  doorMaterial: 'melamina',
  doorColor: '#e5e7eb',
  drawerFrontMaterial: 'melamina',
  drawerFrontColor: '#e5e7eb',
  drawerInnerMaterial: 'melamina',
  drawerInnerColor: '#ffffff',
  shelfMaterial: 'melamina',
  shelfColor: '#ffffff',
  socleMaterial: 'melamina',
  socleColor: '#ffffff',
  backColor: '#f3f4f6',
  backMaterial: 'durolac',
  backThickness: 3,
  hplInnerFace: 'blanco',
  edgeBandingThicknessCabinets: 1.0,
  edgeBandingThicknessFronts: 1.0,

  showTopWall: true,
  showBottomWall: true,
  hplBalancer: true,
  showLeftWall: true,
  showRightWall: true,
  showBackWall: true,
  showSocle: true,
  showLegs: false,
  showDimensions: false,
  dimensionLevel: 2,
  showDecorations: true,
  isTransparent: false,
  
  drawerHardware: 'Provelcar',
  assemblyType: 'minifix',
  drawerAssemblyType: 'minifix',
  
  modules: defaultModules,
  activeModuleId: 'mod-1',
  savedDesigns: getSavedDesigns(),
  isPrinting: false,
  history: [],
  future: [],

  canUndo: () => {
    return (get().history?.length || 0) > 0;
  },

  canRedo: () => {
    return (get().future?.length || 0) > 0;
  },

  undo: () => {
    const state = get();
    const currentHistory = state.history;
    if (!currentHistory || currentHistory.length === 0) return;
    
    const currentSnapshot = {
      modules: JSON.parse(JSON.stringify(state.modules)),
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      structureColor: state.structureColor,
      structureMaterial: state.structureMaterial,
      doorColor: state.doorColor,
      doorMaterial: state.doorMaterial,
      drawerFrontColor: state.drawerFrontColor,
      drawerFrontMaterial: state.drawerFrontMaterial,
      shelfColor: state.shelfColor,
      shelfMaterial: state.shelfMaterial,
      socleColor: state.socleColor,
      socleMaterial: state.socleMaterial,
      backColor: state.backColor,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
    };

    const [prev, ...rest] = currentHistory;
    const newFuture = [currentSnapshot, ...(state.future || []).slice(0, 29)];

    set({
      modules: prev.modules,
      height: prev.height,
      depth: prev.depth,
      thickness: prev.thickness,
      structureColor: prev.structureColor,
      structureMaterial: prev.structureMaterial,
      doorColor: prev.doorColor,
      doorMaterial: prev.doorMaterial,
      drawerFrontColor: prev.drawerFrontColor,
      drawerFrontMaterial: prev.drawerFrontMaterial,
      shelfColor: prev.shelfColor,
      shelfMaterial: prev.shelfMaterial,
      socleColor: prev.socleColor,
      socleMaterial: prev.socleMaterial,
      backColor: prev.backColor,
      showSocle: prev.showSocle,
      showLegs: prev.showLegs,
      history: rest,
      future: newFuture,
      activeModuleId: prev.modules[0]?.id || null,
    });
  },

  redo: () => {
    const state = get();
    const currentFuture = state.future;
    if (!currentFuture || currentFuture.length === 0) return;

    const currentSnapshot = {
      modules: JSON.parse(JSON.stringify(state.modules)),
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      structureColor: state.structureColor,
      structureMaterial: state.structureMaterial,
      doorColor: state.doorColor,
      doorMaterial: state.doorMaterial,
      drawerFrontColor: state.drawerFrontColor,
      drawerFrontMaterial: state.drawerFrontMaterial,
      shelfColor: state.shelfColor,
      shelfMaterial: state.shelfMaterial,
      socleColor: state.socleColor,
      socleMaterial: state.socleMaterial,
      backColor: state.backColor,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
    };

    const [next, ...rest] = currentFuture;
    const newHistory = [currentSnapshot, ...(state.history || []).slice(0, 29)];

    set({
      modules: next.modules,
      height: next.height,
      depth: next.depth,
      thickness: next.thickness,
      structureColor: next.structureColor,
      structureMaterial: next.structureMaterial,
      doorColor: next.doorColor,
      doorMaterial: next.doorMaterial,
      drawerFrontColor: next.drawerFrontColor,
      drawerFrontMaterial: next.drawerFrontMaterial,
      shelfColor: next.shelfColor,
      shelfMaterial: next.shelfMaterial,
      socleColor: next.socleColor,
      socleMaterial: next.socleMaterial,
      backColor: next.backColor,
      showSocle: next.showSocle,
      showLegs: next.showLegs,
      history: newHistory,
      future: rest,
      activeModuleId: next.modules[0]?.id || null,
    });
  },

  targetPart: 'structure',
  setTargetPart: (part) => set({ targetPart: part }),
  applyTextureToTarget: (textureUrl) => set((state) => {
    switch(state.targetPart) {
      case 'structure': return { structureColor: textureUrl };
      case 'doors': return { doorColor: textureUrl };
      case 'drawerFronts': return { drawerFrontColor: textureUrl };
      case 'drawerInner': return { drawerInnerColor: textureUrl };
      case 'shelves': return { shelfColor: textureUrl };
      case 'back': return { backColor: textureUrl };
      case 'socle': return { socleColor: textureUrl };
      case 'all': return {
        structureColor: textureUrl,
        doorColor: textureUrl,
        drawerFrontColor: textureUrl,
        drawerInnerColor: textureUrl,
        shelfColor: textureUrl,
        backColor: textureUrl,
        socleColor: textureUrl,
      };
      default: return state;
    }
  }),
  
  customTextures: [],
  setCustomTextures: (textures) => set({ customTextures: textures }),
  
  setHeight: (height) => set({ height }),
  setDepth: (depth) => set({ depth }),
  setThickness: (thickness) => set({ thickness }),
  
  setStructureMaterial: (m) => set({ structureMaterial: m }),
  setStructureColor: (c) => set({ structureColor: c }),
  setDoorMaterial: (m) => set({ doorMaterial: m }),
  setDoorColor: (c) => set({ doorColor: c }),
  setDrawerFrontMaterial: (m) => set({ drawerFrontMaterial: m }),
  setDrawerFrontColor: (c) => set({ drawerFrontColor: c }),
  setDrawerInnerMaterial: (m) => set({ drawerInnerMaterial: m }),
  setDrawerInnerColor: (c) => set({ drawerInnerColor: c }),
  setShelfMaterial: (m) => set({ shelfMaterial: m }),
  setShelfColor: (c) => set({ shelfColor: c }),
  setSocleMaterial: (m) => set({ socleMaterial: m }),
  setSocleColor: (c) => set({ socleColor: c }),
  setBackColor: (c) => set({ backColor: c }),
  setBackMaterial: (m) => set({ backMaterial: m }),
  setBackThickness: (t) => set({ backThickness: t }),
  setDrawerBottomMaterial: (m) => set({ drawerBottomMaterial: m }),
  setHplInnerFace: (f) => set({ hplInnerFace: f }),
  setEdgeBandingThicknessCabinets: (t) => set({ edgeBandingThicknessCabinets: t }),
  setEdgeBandingThicknessFronts: (t) => set({ edgeBandingThicknessFronts: t }),

  toggleTopWall: () => set((state) => ({ showTopWall: !state.showTopWall })),
  toggleBottomWall: () => set((state) => ({ showBottomWall: !state.showBottomWall })),
  setHplBalancer: (val) => set({ hplBalancer: val }),
  toggleLeftWall: () => set((state) => ({ showLeftWall: !state.showLeftWall })),
  toggleRightWall: () => set((state) => ({ showRightWall: !state.showRightWall })),
  toggleBackWall: () => set((state) => ({ showBackWall: !state.showBackWall })),
  toggleSocle: () => set((state) => ({ history: saveSnapshot(state), showSocle: !state.showSocle })),
  toggleLegs: () => set((state) => ({ history: saveSnapshot(state), showLegs: !state.showLegs })),
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setDimensionLevel: (dimensionLevel) => set({ dimensionLevel }),
  toggleDecorations: () => set((state) => ({ showDecorations: !state.showDecorations })),
  toggleTransparent: () => set((state) => ({ isTransparent: !state.isTransparent })),
  
  setDrawerHardware: (type) => set({ drawerHardware: type }),
  setAssemblyType: (type) => set({ assemblyType: type }),
  setDrawerAssemblyType: (type) => set({ drawerAssemblyType: type }),
  
  addModule: () => set((state) => {
    const history = saveSnapshot(state);
    const newId = `mod-${Date.now()}`;
    return {
      history,
      modules: [...state.modules, { ...defaultModule, id: newId }],
      activeModuleId: newId
    };
  }),
  
  updateModule: (id, updates) => set((state) => ({
    history: saveSnapshot(state),
    modules: state.modules.map(m => m.id === id ? { ...m, ...updates } : m)
  })),
  
  updateModuleOverrides: (id, overrides) => set((state) => ({
    history: saveSnapshot(state),
    modules: state.modules.map(m => m.id === id ? { 
      ...m, 
      overrides: overrides === null ? undefined : { ...(m.overrides || {}), ...overrides } 
    } : m)
  })),
  
  removeModule: (id) => set((state) => {
    const history = saveSnapshot(state);
    const newModules = state.modules.filter(m => m.id !== id);
    return {
      history,
      modules: newModules,
      activeModuleId: state.activeModuleId === id ? (newModules[0]?.id || null) : state.activeModuleId
    };
  }),
  
  setActiveModule: (id) => set({ activeModuleId: id }),
  
  saveDesign: (name) => set((state) => {
    const design = {
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      structureMaterial: state.structureMaterial,
      structureColor: state.structureColor,
      doorMaterial: state.doorMaterial,
      doorColor: state.doorColor,
      drawerFrontMaterial: state.drawerFrontMaterial,
      drawerFrontColor: state.drawerFrontColor,
      drawerInnerMaterial: state.drawerInnerMaterial,
      drawerInnerColor: state.drawerInnerColor,
      shelfMaterial: state.shelfMaterial,
      shelfColor: state.shelfColor,
      socleMaterial: state.socleMaterial,
      socleColor: state.socleColor,
      backColor: state.backColor,
      hplInnerFace: state.hplInnerFace,
      edgeBandingThicknessCabinets: state.edgeBandingThicknessCabinets,
      edgeBandingThicknessFronts: state.edgeBandingThicknessFronts,
      showTopWall: state.showTopWall,
      showBottomWall: state.showBottomWall,
      hplBalancer: state.hplBalancer,
      showLeftWall: state.showLeftWall,
      showRightWall: state.showRightWall,
      showBackWall: state.showBackWall,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
      drawerHardware: state.drawerHardware,
      assemblyType: state.assemblyType,
      drawerAssemblyType: state.drawerAssemblyType,
      modules: state.modules
    };
    localStorage.setItem(`closet-design-${name}`, JSON.stringify(design));
    return { savedDesigns: getSavedDesigns() };
  }),
  
  loadDesign: (name) => set((state) => {
    const saved = localStorage.getItem(`closet-design-${name}`);
    if (saved) {
      const design = JSON.parse(saved);
      return {
        ...design,
        activeModuleId: design.modules[0]?.id || null
      };
    }
    return state;
  }),
  
  setIsPrinting: (val) => set({ isPrinting: val })
};
});
