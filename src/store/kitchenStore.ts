import { create } from 'zustand';
import { RoomConfig, getPresetRoomVertices, generateWallsFromRoom } from '../utils/roomGeometry';
import { 
  constrainInsideRoomAndWalls, 
  repositionCabinetsOnRoomChange, 
  resolveCabinetsAgainstPillars, 
  getWallInwardNormal,
  findPerpendicularCabinetForCorner,
  findCornerCabinetForPerpendicular
} from '../utils/kitchenCollision';
import { 
  CountertopConfig, 
  DEFAULT_COUNTERTOP_CONFIG, 
  QstoneProductItem, 
  DEFAULT_QSTONE_CATALOG, 
  SinkModelId, 
  CooktopModelId,
  QSTONE_SINKS,
  FDV_COOKTOPS,
  IslandBackConfig,
  DEFAULT_ISLAND_BACK_CONFIG
} from '../types/countertop';
import { MepPoint, MepClash, MepPresetType, MEP_PRESETS } from '../types/mep';
import { generateDefaultMepPoints, calculateMepPositionOnWall } from '../utils/mepGeometry';
import { KitchenHandleConfig, DEFAULT_HANDLE_CONFIG } from '../types/handle';

export type { IslandBackConfig, KitchenHandleConfig };
export { DEFAULT_ISLAND_BACK_CONFIG, DEFAULT_HANDLE_CONFIG };


export type GolaSystem = 'none' | 'aluminum' | 'black';

export type ViewMode = '2d' | '3d';
export type ToolMode = 
  | 'select' 
  | 'draw_wall' 
  | 'place_base_1_door' 
  | 'place_base_2_doors' 
  | 'place_base_1_door_1_drawer' 
  | 'place_base_4_drawers' 
  | 'place_base_2_pot_drawers' 
  | 'place_base_spice_rack' 
  | 'place_base_corner_blind' 
  | 'place_base_wine_rack'
  | 'place_base_sink_u_drawer'
  | 'place_base_corner_l'
  | 'place_wall' 
  | 'place_wall_1_door'
  | 'place_wall_2_doors'
  | 'place_wall_lift_up'
  | 'place_wall_lift_up_double'
  | 'place_wall_microwave_niche'
  | 'place_wall_open'
  | 'place_wall_corner_blind'
  | 'place_wall_wine_rack'
  | 'place_tall' 
  | 'place_tall_1_door'
  | 'place_tall_split_2_doors'
  | 'place_tall_oven_micro'
  | 'place_tall_oven_vent'
  | 'place_tall_microwave_niche'
  | 'place_tall_open'
  | 'place_tall_2_doors'
  | 'place_tall_wine_rack'
  | 'place_tall_inner_drawers'
  | 'place_tall_terminal_shelves'
  | 'place_island' 
  | 'place_island_4_drawers'
  | 'place_island_2_drawers_1_pot'
  | 'place_island_1_door'
  | 'place_island_2_doors'
  | 'place_island_wine_rack'
  | 'place_closet_hanger'
  | 'place_closet_mixed'
  | 'place_closet_shelves'
  | 'place_closet_drawers'
  | 'place_closet_2_doors'
  | 'place_closet_walkin'
  | 'place_closet_inner_drawers'
  | 'place_deco_stove'
  | 'place_deco_fridge'
  | 'place_deco_hood'
  | 'place_deco_plant'
  | 'place_deco_dishwasher'
  | 'place_arch_door'
  | 'place_arch_window'
  | 'place_arch_pillar'
  | 'move_active';

export interface WallType {
  id: string;
  start: [number, number];
  end: [number, number];
  thickness: number;
  height: number;
  isInterior?: boolean;
  index?: number;
}

export interface ArchitecturalElement {
  id: string;
  wallId?: string;
  offset?: number;
  type: 'door' | 'window' | 'pillar';
  name: string;
  width: number;
  height: number;
  depth?: number; // thickness / depth for pillars
  length?: number; // length for pillars / walls
  elevation: number; // height from floor (0 for doors/pillars, e.g. 90 for windows)
  position: [number, number, number]; // [x, y, z]
  rotation: number;
  isOpen?: boolean;
  hingeSide?: 'left' | 'right';
}

export interface CoverPanelConfig {
  enabled: boolean;
  material?: 'melamina' | 'hpl';
  color?: string;
  thickness?: number;
  extendToFloor?: boolean;
  depth?: number; // Profundidad personalizada (ej. cubrir voladizo de isla)
}

export interface CabinetType {
  id: string;
  type: 'base' | 'wall' | 'tall' | 'island' | 'decoration' | 'closet';
  variant?: string;
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  rotation: number;
  color: string;
  structureColor?: string;
  doorColor?: string;
  drawerFrontColor?: string;
  drawerInnerColor?: string;
  shelfColor?: string;
  backColor?: string;
  socleColor?: string;
  structureMaterial?: 'melamina' | 'hpl';
  doorMaterial?: 'melamina' | 'hpl';
  drawerFrontMaterial?: 'melamina' | 'hpl';
  drawerInnerMaterial?: 'melamina' | 'hpl';
  shelfMaterial?: 'melamina' | 'hpl';
  backMaterial?: 'melamina' | 'hpl' | 'durolac';
  backThickness?: number;
  drawerBottomMaterial?: 'melamina' | 'durolac';
  drawerBottomThickness?: number;
  socleMaterial?: 'melamina' | 'hpl';
  grainDirection?: 'vertical' | 'horizontal';
  grainElements?: Record<string, 'vertical' | 'horizontal'>;
  hplBalancer?: boolean;
  isOpen?: boolean;
  openElements?: Record<string, boolean>;
  shelvesCount?: number;
  shelvesCountLower?: number;
  shelvesCountUpper?: number;
  drawersCount?: number;
  hasHanger?: boolean;
  hasDoors?: boolean;
  innerDrawers?: boolean;
  handleConfig?: KitchenHandleConfig;
  leftCoverPanel?: CoverPanelConfig;
  rightCoverPanel?: CoverPanelConfig;
  closetSocleHeight?: number;
  closetSocleColorMode?: 'structure' | 'doors';
  blindWidth?: number; // cm (ancho independiente de la zona ciega del esquinero, por defecto 65cm)
}

export interface GolaIncompatibilityAlert {
  isOpen: boolean;
  regruesoCm: number;
  stoneThicknessCm: number;
  attemptedAction: 'gola' | 'regrueso';
}

export function getCabinetLabel(cab: Partial<CabinetType>, index: number): string {
  if (cab.variant === 'deco_hood') return 'Campana FDV Conic 90';
  if (cab.variant === 'deco_stove') return 'Cocina FDV 90';
  if (cab.variant === 'deco_fridge') return 'Refrigerador SBS 513L';
  if (cab.variant === 'deco_plant') return 'Planta Interior';
  if (cab.variant === 'deco_dishwasher') return 'Lavavajillas FDV Active 12C';
  if (cab.variant === 'sink_u_drawer') return 'Fregadero Cajón en U';
  if (cab.variant === 'corner_l' || cab.variant === 'base_corner_l') return 'Esquinero en L (90x90)';
  if (cab.variant?.startsWith('wall_corner_blind')) return 'Aéreo Esquinero Ciego';
  if (cab.variant?.startsWith('corner_blind')) return 'Esquinero Ciego';
  if (cab.variant === 'base_wine_rack' || (cab.type === 'base' && cab.variant === 'wine_rack')) return 'Botellero Base';
  if (cab.variant === 'wall_wine_rack' || (cab.type === 'wall' && cab.variant === 'wine_rack')) return 'Botellero Aéreo';
  if (cab.variant === 'tall_wine_rack' || (cab.type === 'tall' && cab.variant === 'wine_rack')) return 'Botellero Despensa';
  if (cab.variant === 'island_wine_rack' || (cab.type === 'island' && cab.variant === 'wine_rack')) return 'Botellero Isla';
  if (cab.type === 'island') {
    if (cab.variant === '4_drawers') return 'Isla 4 Cajones';
    if (cab.variant === '2_drawers_1_pot') return 'Isla 2 Cajones + 1 Ollero';
    if (cab.variant === '1_door') return 'Isla 1 Puerta';
    if (cab.variant === '2_doors') return 'Isla 2 Puertas';
    if (cab.variant === '2_pot_drawers') return 'Isla 2 Olleros';
  }
  if (cab.variant === 'wine_rack') return 'Botellero';
  if (cab.variant === 'closet_hanger') return 'Clóset Barra + Maletero';
  if (cab.variant === 'closet_mixed') return 'Clóset Mixto (Barra + Cajones)';
  if (cab.variant === 'closet_shelves') return 'Clóset Lencero Repisas';
  if (cab.variant === 'closet_drawers') return 'Clóset Cajonera';
  if (cab.variant === 'closet_2_doors') return 'Clóset 2 Puertas Batientes';
  if (cab.variant === 'closet_walkin') return 'Clóset Walk-in Abierto';
  if (cab.variant === 'closet_inner_drawers') return 'Clóset Cajones Ocultos';
  if (cab.type === 'closet') return 'Clóset Modular';
  if (cab.variant === 'tall_1_door') return 'Despensa 1 Puerta Larga';
  if (cab.variant === 'tall_split_2_doors') return 'Despensa 2 Puertas (Línea Base)';
  if (cab.variant === 'tall_oven_micro') return 'Torre Horno + Micro';
  if (cab.variant === 'tall_oven_vent') return 'Torre Hornos Vent. Técnica';
  if (cab.variant === 'tall_inner_drawers') return 'Despensa Cajones Interiores';
  if (cab.variant === 'tall_microwave_niche') return 'Torre Nicho Micro';
  if (cab.variant === 'tall_open') return 'Despensa Abierta';
  if (cab.variant === 'tall_terminal_shelves') return 'Torre Terminal Repisas';
  if (cab.variant === 'tall_2_doors') return 'Despensa 2 Puertas';
  if (cab.variant === 'wall_1_door') return 'Aéreo 1 Puerta';
  if (cab.variant === 'wall_2_doors') return 'Aéreo 2 Puertas';
  if (cab.variant === 'wall_lift_up') return 'Aéreo Elevable Aventos';
  if (cab.variant === 'wall_lift_up_double') return 'Aéreo Doble Elevable';
  if (cab.variant === 'wall_microwave_niche') return 'Aéreo Nicho Micro';
  if (cab.variant === 'wall_open') return 'Aéreo Abierto Repisas';
  if (cab.variant === '1_door_1_drawer') return 'Base 1 Pta + 1 Cajón';
  if (cab.variant === '4_drawers') return 'Base 4 Cajones';
  if (cab.variant === '2_drawers_1_pot') return 'Base 2 Cajones + 1 Ollero';
  if (cab.variant === '2_pot_drawers') return 'Base 2 Olleros';
  if (cab.variant === 'spice_rack') return 'Base Especiero';
  if (cab.variant === '2_doors') return 'Base 2 Puertas';
  if (cab.variant === '1_door') return 'Base 1 Puerta';
  if (cab.type === 'base') return 'Mueble Base';
  if (cab.type === 'tall') return 'Torre / Despensa';
  if (cab.type === 'wall') return 'Mueble Aéreo';
  if (cab.type === 'island') return 'Isla Cocina';
  return `Módulo ${index + 1}`;
}

export interface FloorZoneDecoration {
  id: string;
  name: string;
  areaPercentage: number;
  supplyId?: string;
  supplyName?: string;
  priceClp?: number;
  unitFormat?: string;
  coveragePerUnitM2?: number;
}

export interface WallDecorationItem {
  wallId: string;
  finishType?: 'pintura' | 'papel_mural' | 'revestimiento';
  supplyId?: string;
  supplyName?: string;
  priceClp?: number;
  unitFormat?: string;
  coveragePerUnitM2?: number;
  notes?: string;
  imageUrl?: string;
}

export interface SpaceDecorationConfig {
  floorZones: FloorZoneDecoration[];
  wallDecorations: Record<string, WallDecorationItem>;
  cortinasSupplyId?: string;
  cortinasCount?: number;
  ventanasSupplyId?: string;
  ventanasCount?: number;
  puertasSupplyId?: string;
  puertasCount?: number;
  focosSupplyId?: string;
  focosCount?: number;
  rodonesSupplyId?: string;
  marqueteriaSupplyId?: string;
}

interface KitchenState {
  viewMode: ViewMode;
  toolMode: ToolMode;
  walls: WallType[];
  cabinets: CabinetType[];
  activeCabinetId: string | null;
  showSocle: boolean;
  socleFinish: 'aluminum' | 'black';
  socleHeight: number;
  golaSystem: GolaSystem;
  golaIncompatibilityAlert: GolaIncompatibilityAlert | null;
  drawingStart: [number, number] | null;
  isRoomPlannerOpen: boolean;
  roomConfig: RoomConfig;
  wallColor: string;
  floorType: string;
  spaceDecoration: SpaceDecorationConfig;
  activeWallId: string | null;
  architecturalElements: ArchitecturalElement[];
  activeArchElementId: string | null;
  draggingArchElementId: string | null;
  draggingCabinetId: string | null;
  draggingWallId: string | null;
  countertopConfig: CountertopConfig;
  islandBackConfig: IslandBackConfig;
  qstoneCatalog: QstoneProductItem[];
  handleConfig: KitchenHandleConfig;
  activeDecoWallId: string | null;
  isWallDecoTabOpen: boolean;

  setActiveDecoWallId: (id: string | null) => void;
  setIsWallDecoTabOpen: (isOpen: boolean) => void;

  setSpaceDecoration: (updates: Partial<SpaceDecorationConfig>) => void;
  setWallDecoration: (wallId: string, item: WallDecorationItem) => void;
  setFloorZoneDecoration: (zoneId: string, item: Partial<FloorZoneDecoration>) => void;
  addFloorZone: (zoneName?: string) => void;
  removeFloorZone: (zoneId: string) => void;

  setViewMode: (mode: ViewMode) => void;
  setToolMode: (mode: ToolMode) => void;
  setHandleConfig: (config: Partial<KitchenHandleConfig>) => void;
  addWall: (wall: WallType) => void;
  updateWall: (id: string, updates: Partial<WallType>) => void;
  removeWall: (id: string) => void;
  setActiveWall: (id: string | null) => void;
  setWalls: (walls: WallType[]) => void;
  addCabinet: (cabinet: CabinetType) => void;
  removeCabinet: (id: string) => void;
  setActiveCabinet: (id: string | null) => void;
  addArchitecturalElement: (el: ArchitecturalElement) => void;
  updateArchitecturalElement: (id: string, updates: Partial<ArchitecturalElement>) => void;
  moveArchElementTransient: (id: string, updates: Partial<ArchitecturalElement>) => void;
  removeArchitecturalElement: (id: string) => void;
  setActiveArchElement: (id: string | null) => void;
  setDraggingArchElementId: (id: string | null) => void;
  setDraggingCabinetId: (id: string | null) => void;
  setDraggingWallId: (id: string | null) => void;
  setDrawingStart: (pos: [number, number] | null) => void;
  setShowSocle: (val: boolean) => void;
  setSocleFinish: (finish: 'aluminum' | 'black') => void;
  setSocleHeight: (height: number) => void;
  setGolaSystem: (system: GolaSystem) => void;
  setGolaIncompatibilityAlert: (alert: GolaIncompatibilityAlert | null) => void;
  updateCabinet: (id: string, updates: Partial<CabinetType>) => void;
  moveCabinetTransient: (id: string, updates: Partial<CabinetType>) => void;
  setOpenElement: (id: string, elementKey: string, isOpen: boolean) => void;
  setRoomPlannerOpen: (open: boolean) => void;
  setRoomConfig: (config: RoomConfig) => void;
  setWallColor: (color: string) => void;
  setFloorType: (floorType: string) => void;
  applyGlobalTexture: (part: 'structure' | 'doors' | 'drawerFronts' | 'drawerInner' | 'shelves' | 'back' | 'socle' | 'islandBack' | 'coverPanels' | 'all', url: string, mat: 'melamina' | 'hpl' | 'durolac', thicknessMm?: number) => void;
  setCountertopConfig: (config: Partial<CountertopConfig>) => void;
  setIslandBackConfig: (updates: Partial<IslandBackConfig>) => void;
  setCountertopSink: (model: SinkModelId, cabinetId?: string | null) => { success: boolean; error?: string };
  setCountertopCooktop: (model: CooktopModelId, cabinetId?: string | null) => { success: boolean; error?: string };
  updateQstoneCatalogItemPrice: (id: string, priceM2Clp: number) => void;
  addQstoneCatalogItem: (item: QstoneProductItem) => void;
  updateQstoneCatalogItem: (id: string, updates: Partial<QstoneProductItem>) => void;
  removeQstoneCatalogItem: (id: string) => void;
  validateCabinetForSink: (cab: CabinetType, sinkModel: SinkModelId) => { valid: boolean; minWidth: number; actualWidth: number; reason?: string };
  validateCabinetForCooktop: (cab: CabinetType, cooktopModel: CooktopModelId) => { valid: boolean; minWidth: number; actualWidth: number; reason?: string };
  
  // MEP & Detección de Interferencias
  mepPoints: MepPoint[];
  activeMepId: string | null;
  showMep: boolean;
  showMepClashes: boolean;
  showMepDimensions: boolean;
  addMepPoint: (point: MepPoint) => void;
  updateMepPoint: (id: string, updates: Partial<MepPoint>) => void;
  removeMepPoint: (id: string) => void;
  setActiveMepId: (id: string | null) => void;
  setShowMep: (show: boolean) => void;
  setShowMepClashes: (show: boolean) => void;
  setShowMepDimensions: (show: boolean) => void;
  addMepPreset: (presetType: MepPresetType, wallId?: string, offsetCm?: number) => void;
  autoFixClash: (clash: MepClash) => void;

  // Historial de Deshacer (Undo) y Rehacer (Redo)
  history: Array<{
    cabinets: CabinetType[];
    architecturalElements: ArchitecturalElement[];
    showSocle: boolean;
    golaSystem: GolaSystem;
    countertopConfig: CountertopConfig;
    islandBackConfig: IslandBackConfig;
    mepPoints: MepPoint[];
    handleConfig: KitchenHandleConfig;
  }>;
  future: Array<{
    cabinets: CabinetType[];
    architecturalElements: ArchitecturalElement[];
    showSocle: boolean;
    golaSystem: GolaSystem;
    countertopConfig: CountertopConfig;
    islandBackConfig: IslandBackConfig;
    mepPoints: MepPoint[];
    handleConfig: KitchenHandleConfig;
  }>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  resetKitchen: () => void;
}

function resolveCabinetsWithResize(
  cabinets: CabinetType[],
  targetId: string,
  updates: Partial<CabinetType>
): CabinetType[] {
  const targetIndex = cabinets.findIndex((c) => c.id === targetId);
  if (targetIndex === -1) return cabinets;

  const target = cabinets[targetIndex];
  const nextCabinets = cabinets.map((c) => ({ ...c }));
  const updatedTarget = nextCabinets.find((c) => c.id === targetId)!;
  
  // Apply direct updates
  Object.assign(updatedTarget, updates);

  // Strictly enforce spice_rack width limits: min 15cm, max 30cm
  if (updatedTarget.variant === 'spice_rack') {
    updatedTarget.width = Math.min(30, Math.max(15, updatedTarget.width));
  }

  // Helper to get left and right flanks in XZ
  const getFlanks = (cab: CabinetType) => {
    const cCos = Math.cos(cab.rotation || 0);
    const cSin = Math.sin(cab.rotation || 0);
    const left: [number, number] = [
      cab.position[0] - (cab.width / 2) * cCos,
      cab.position[2] - (cab.width / 2) * cSin,
    ];
    const right: [number, number] = [
      cab.position[0] + (cab.width / 2) * cCos,
      cab.position[2] + (cab.width / 2) * cSin,
    ];
    return { left, right };
  };

  const dist = (p1: [number, number], p2: [number, number]) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

  // Helper to check if two cabinets share vertical space (overlap along Y axis > 10 cm)
  const hasVerticalOverlap = (c1: CabinetType, c2: CabinetType) => {
    const min1 = c1.position[1] - c1.height / 2;
    const max1 = c1.position[1] + c1.height / 2;
    const min2 = c2.position[1] - c2.height / 2;
    const max2 = c2.position[1] + c2.height / 2;
    return (Math.min(max1, max2) - Math.max(min1, min2)) > 10;
  };

  // Find left neighbor of a cabinet
  const findLeftNeighbor = (cab: CabinetType, list: CabinetType[]) => {
    const { left } = getFlanks(cab);
    return list.find((other) => {
      if (other.id === cab.id) return false;
      if (!hasVerticalOverlap(cab, other)) return false;
      const otherFlanks = getFlanks(other);
      return dist(left, otherFlanks.right) < 4;
    });
  };

  // Find right neighbor of a cabinet
  const findRightNeighbor = (cab: CabinetType, list: CabinetType[]) => {
    const { right } = getFlanks(cab);
    return list.find((other) => {
      if (other.id === cab.id) return false;
      if (!hasVerticalOverlap(cab, other)) return false;
      const otherFlanks = getFlanks(other);
      return dist(right, otherFlanks.left) < 4;
    });
  };

  // If height changed and position wasn't explicitly overridden, recalculate Y so it never separates from floor
  if (updates.height !== undefined && (!updates.position || updates.position[1] === undefined)) {
    const newHeight = updates.height;
    if (updatedTarget.type === 'base' || updatedTarget.type === 'tall' || updatedTarget.type === 'island' || updatedTarget.type === 'closet') {
      updatedTarget.position = [updatedTarget.position[0], newHeight / 2, updatedTarget.position[2]];

      // Sincronizar altura de gabinetes contiguos en la misma corrida continua (base o isla) para mantener la cubierta apoyada y plana
      if (updatedTarget.type === 'base' || updatedTarget.type === 'island') {
        const visitedChain = new Set<string>([updatedTarget.id]);
        const queue: CabinetType[] = [updatedTarget];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          const lNeighbor = findLeftNeighbor(curr, nextCabinets);
          if (lNeighbor && (lNeighbor.type === 'base' || lNeighbor.type === 'island') && !visitedChain.has(lNeighbor.id)) {
            visitedChain.add(lNeighbor.id);
            lNeighbor.height = newHeight;
            lNeighbor.position = [lNeighbor.position[0], newHeight / 2, lNeighbor.position[2]];
            queue.push(lNeighbor);
          }
          const rNeighbor = findRightNeighbor(curr, nextCabinets);
          if (rNeighbor && (rNeighbor.type === 'base' || rNeighbor.type === 'island') && !visitedChain.has(rNeighbor.id)) {
            visitedChain.add(rNeighbor.id);
            rNeighbor.height = newHeight;
            rNeighbor.position = [rNeighbor.position[0], newHeight / 2, rNeighbor.position[2]];
            queue.push(rNeighbor);
          }
        }
      }
    } else if (updatedTarget.type === 'wall' || updatedTarget.variant === 'deco_hood') {
      const currentBottom = target.position[1] - target.height / 2;
      updatedTarget.position = [updatedTarget.position[0], currentBottom + newHeight / 2, updatedTarget.position[2]];
    }
  }

  // If depth changed and position wasn't explicitly overridden, recalculate center along cabinet normal so the back remains anchored to the wall
  if (updates.depth !== undefined && (!updates.position || updates.position[0] === undefined || updates.position[2] === undefined)) {
    const oldDepth = target.depth;
    const newDepth = updates.depth;
    if (newDepth !== oldDepth) {
      const deltaD = newDepth - oldDepth;
      const rot = target.rotation || 0;
      const sin = Math.sin(rot);
      const cos = Math.cos(rot);
      // For wall, base, tall, and deco cabinets (except freestanding islands):
      // The rear face is at center - (depth/2)*[sin, cos].
      // To keep the rear face stationary against the wall, center moves forward by (deltaD/2)*[sin, cos].
      if (updatedTarget.type !== 'island') {
        updatedTarget.position = [
          updatedTarget.position[0] + (deltaD / 2) * sin,
          updatedTarget.position[1],
          updatedTarget.position[2] + (deltaD / 2) * cos,
        ];
      }

      // Sincronizar automáticamente el ancho del lado ciego de cualquier mueble esquinero perpendicular
      const perpCorner = findCornerCabinetForPerpendicular(updatedTarget, nextCabinets);
      if (perpCorner && newDepth > 0) {
        perpCorner.blindWidth = newDepth;
      }
    }
  }

  // Sincronización paramétrica continua del lado ciego (blindWidth) con la profundidad del mueble perpendicular
  for (const cab of nextCabinets) {
    if (cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || cab.variant?.startsWith('wall_corner_blind')) {
      const perp = findPerpendicularCabinetForCorner(cab, nextCabinets);
      if (perp && perp.depth > 0) {
        cab.blindWidth = perp.depth;
      }
    }
  }

  // If width is NOT changing, return updated list
  if (updates.width === undefined || updates.width === target.width) {
    return nextCabinets;
  }

  const oldWidth = target.width;
  const newWidth = updates.width;
  const deltaW = newWidth - oldWidth;

  const rot = target.rotation || 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const u: [number, number] = [cos, sin];

  // Build left chain (all continuous neighbors to the left)
  const leftChain: CabinetType[] = [];
  let currL = findLeftNeighbor(target, cabinets);
  const visitedL = new Set<string>();
  while (currL && !visitedL.has(currL.id)) {
    visitedL.add(currL.id);
    leftChain.push(currL);
    currL = findLeftNeighbor(currL, cabinets);
  }

  // Build right chain (all continuous neighbors to the right)
  const rightChain: CabinetType[] = [];
  let currR = findRightNeighbor(target, cabinets);
  const visitedR = new Set<string>();
  while (currR && !visitedR.has(currR.id)) {
    visitedR.add(currR.id);
    rightChain.push(currR);
    currR = findRightNeighbor(currR, cabinets);
  }

  if (target.variant === 'tall_terminal_shelves') {
    // Para la Torre Terminal de Repisas adosada a una despensa:
    // Su ancho (W) se extiende a lo largo de la profundidad de la despensa.
    // Al ensancharlo (para tapar el muro posterior), el frente (+n_p) debe permanecer
    // perfectamente enrasado con las puertas delanteras de la cocina, y el mueble
    // debe crecer hacia atrás (hacia el muro).
    const pantry = cabinets.find(
      (c) =>
        (c.type === 'tall' || c.type === 'base') &&
        c.variant !== 'tall_terminal_shelves' &&
        Math.hypot(c.position[0] - target.position[0], c.position[2] - target.position[2]) <
          (c.width + target.depth) / 2 + 15
    );
    if (pantry) {
      const pRot = pantry.rotation || 0;
      // Normal hacia el frente de la despensa (+n_pantry)
      const n_pX = Math.sin(pRot);
      const n_pZ = Math.cos(pRot);
      // Para mantener el frente inmóvil y expandir hacia atrás (contra n_pantry):
      updatedTarget.position = [
        updatedTarget.position[0] - (deltaW / 2) * n_pX,
        updatedTarget.position[1],
        updatedTarget.position[2] - (deltaW / 2) * n_pZ,
      ];
    } else {
      updatedTarget.position = [
        updatedTarget.position[0] - (deltaW / 2) * u[0],
        updatedTarget.position[1],
        updatedTarget.position[2] - (deltaW / 2) * u[1],
      ];
    }
    return nextCabinets;
  }

  if (leftChain.length > 0 && rightChain.length === 0) {
    // Anchored on left edge, expands cleanly to the right
    updatedTarget.position = [
      updatedTarget.position[0] + (deltaW / 2) * u[0],
      updatedTarget.position[1],
      updatedTarget.position[2] + (deltaW / 2) * u[1],
    ];
  } else if (leftChain.length === 0 && rightChain.length > 0) {
    // Anchored on right edge, expands cleanly to the left
    updatedTarget.position = [
      updatedTarget.position[0] - (deltaW / 2) * u[0],
      updatedTarget.position[1],
      updatedTarget.position[2] - (deltaW / 2) * u[1],
    ];
  } else if (leftChain.length > 0 && rightChain.length > 0) {
    // In the middle of a run: anchored on left, pushes all right neighbors to the right
    updatedTarget.position = [
      updatedTarget.position[0] + (deltaW / 2) * u[0],
      updatedTarget.position[1],
      updatedTarget.position[2] + (deltaW / 2) * u[1],
    ];
    const rightIds = new Set(rightChain.map((c) => c.id));
    for (const cab of nextCabinets) {
      if (rightIds.has(cab.id)) {
        cab.position = [
          cab.position[0] + deltaW * u[0],
          cab.position[1],
          cab.position[2] + deltaW * u[1],
        ];
      }
    }
  } else {
    // Isolated cabinet: adjust if it collides with another cabinet on the same tier
    for (const other of nextCabinets) {
      if (other.id === targetId) continue;
      if (updatedTarget.variant === 'tall_terminal_shelves' || other.variant === 'tall_terminal_shelves') continue;
      if (!hasVerticalOverlap(updatedTarget, other)) continue;
      const dx = other.position[0] - updatedTarget.position[0];
      const dz = other.position[2] - updatedTarget.position[2];
      const distance = Math.hypot(dx, dz);
      const minDistance = (updatedTarget.width + other.width) / 2;
      if (distance < minDistance - 0.5 && distance > 0.01) {
        const overlap = minDistance - distance;
        const pushX = (dx / distance) * overlap;
        const pushZ = (dz / distance) * overlap;
        other.position = [other.position[0] + pushX, other.position[1], other.position[2] + pushZ];
      }
    }
  }

  // Sincronización paramétrica continua del lado ciego (blindWidth) con la profundidad del mueble perpendicular
  for (const cab of nextCabinets) {
    if (cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || cab.variant?.startsWith('wall_corner_blind')) {
      const perp = findPerpendicularCabinetForCorner(cab, nextCabinets);
      if (perp && perp.depth > 0) {
        cab.blindWidth = perp.depth;
      }
    }
  }

  return nextCabinets;
}

const initialRoomConfig: RoomConfig = {
  type: 'rectangular',
  wallHeight: 250,
  wallThickness: 20,
  vertices: getPresetRoomVertices('rectangular'),
};

const initialWalls = generateWallsFromRoom(initialRoomConfig);

export const useKitchenStore = create<KitchenState>((set, get) => {
  const saveSnapshot = (state: KitchenState) => {
    const snapshot = {
      cabinets: JSON.parse(JSON.stringify(state.cabinets)),
      architecturalElements: JSON.parse(JSON.stringify(state.architecturalElements)),
      showSocle: state.showSocle,
      socleFinish: state.socleFinish,
      socleHeight: state.socleHeight || 10,
      golaSystem: state.golaSystem,
      countertopConfig: JSON.parse(JSON.stringify(state.countertopConfig)),
      islandBackConfig: JSON.parse(JSON.stringify(state.islandBackConfig)),
      mepPoints: JSON.parse(JSON.stringify(state.mepPoints)),
      handleConfig: JSON.parse(JSON.stringify(state.handleConfig)),
    };
    const prevHistory = state.history || [];
    return [snapshot, ...prevHistory.slice(0, 29)];
  };

  return {
  viewMode: '3d',
  toolMode: 'select',
  walls: initialWalls,
  cabinets: [],
  activeCabinetId: null,
  showSocle: false,
  socleFinish: 'aluminum',
  socleHeight: 10,
  golaSystem: 'none',
  drawingStart: null,
  isRoomPlannerOpen: false,
  roomConfig: initialRoomConfig,
  wallColor: '#E2E8F0',
  spaceDecoration: {
    floorZones: [
      { id: 'floor_zone_1', name: 'Zona Principal / Completa', areaPercentage: 100 }
    ],
    wallDecorations: {},
  },
  activeWallId: null,
  architecturalElements: [],
  activeArchElementId: null,
  draggingArchElementId: null,
  draggingCabinetId: null,
  draggingWallId: null,
  countertopConfig: DEFAULT_COUNTERTOP_CONFIG,
  islandBackConfig: DEFAULT_ISLAND_BACK_CONFIG,
  qstoneCatalog: DEFAULT_QSTONE_CATALOG,
  handleConfig: DEFAULT_HANDLE_CONFIG,
  activeDecoWallId: null,
  isWallDecoTabOpen: false,
  setActiveDecoWallId: (id) => set({ activeDecoWallId: id }),
  setIsWallDecoTabOpen: (isOpen) => set({ isWallDecoTabOpen: isOpen }),
  golaIncompatibilityAlert: null,
  mepPoints: [],
  activeMepId: null,
  showMep: true,
  showMepClashes: true,
  showMepDimensions: true,
  history: [],
  future: [],

  setSpaceDecoration: (updates: Partial<SpaceDecorationConfig>) => {
    set((state) => ({
      spaceDecoration: { ...state.spaceDecoration, ...updates }
    }));
  },

  setWallDecoration: (wallId: string, item: WallDecorationItem) => {
    set((state) => ({
      spaceDecoration: {
        ...state.spaceDecoration,
        wallDecorations: {
          ...state.spaceDecoration.wallDecorations,
          [wallId]: item,
        }
      }
    }));
  },

  setFloorZoneDecoration: (zoneId: string, item: Partial<FloorZoneDecoration>) => {
    set((state) => ({
      spaceDecoration: {
        ...state.spaceDecoration,
        floorZones: state.spaceDecoration.floorZones.map((z) =>
          z.id === zoneId ? { ...z, ...item } : z
        )
      }
    }));
  },

  addFloorZone: (zoneName?: string) => {
    set((state) => {
      const count = state.spaceDecoration.floorZones.length + 1;
      const newZone: FloorZoneDecoration = {
        id: `floor_zone_${Date.now()}`,
        name: zoneName || `Zona ${count}`,
        areaPercentage: Math.max(10, Math.floor(100 / count)),
      };
      return {
        spaceDecoration: {
          ...state.spaceDecoration,
          floorZones: [...state.spaceDecoration.floorZones, newZone]
        }
      };
    });
  },

  removeFloorZone: (zoneId: string) => {
    set((state) => {
      if (state.spaceDecoration.floorZones.length <= 1) return state; // Mantener al menos 1 zona
      return {
        spaceDecoration: {
          ...state.spaceDecoration,
          floorZones: state.spaceDecoration.floorZones.filter((z) => z.id !== zoneId)
        }
      };
    });
  },

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
    
    // Save current state into future stack for redo
    const currentSnapshot = {
      cabinets: JSON.parse(JSON.stringify(state.cabinets)),
      architecturalElements: JSON.parse(JSON.stringify(state.architecturalElements)),
      showSocle: state.showSocle,
      socleFinish: state.socleFinish,
      socleHeight: state.socleHeight || 10,
      golaSystem: state.golaSystem,
      countertopConfig: JSON.parse(JSON.stringify(state.countertopConfig)),
      islandBackConfig: JSON.parse(JSON.stringify(state.islandBackConfig)),
      mepPoints: JSON.parse(JSON.stringify(state.mepPoints)),
      handleConfig: JSON.parse(JSON.stringify(state.handleConfig)),
    };

    const [previousState, ...remainingHistory] = currentHistory;
    const newFuture = [currentSnapshot, ...(state.future || []).slice(0, 29)];

    set({
      cabinets: previousState.cabinets,
      architecturalElements: previousState.architecturalElements,
      showSocle: previousState.showSocle,
      socleFinish: (previousState as any).socleFinish || 'aluminum',
      socleHeight: (previousState as any).socleHeight || 10,
      golaSystem: previousState.golaSystem,
      countertopConfig: previousState.countertopConfig,
      islandBackConfig: previousState.islandBackConfig,
      mepPoints: previousState.mepPoints,
      handleConfig: previousState.handleConfig,
      history: remainingHistory,
      future: newFuture,
      activeCabinetId: null,
      activeArchElementId: null,
    });
  },

  redo: () => {
    const state = get();
    const currentFuture = state.future;
    if (!currentFuture || currentFuture.length === 0) return;

    // Save current state into history stack for undo
    const currentSnapshot = {
      cabinets: JSON.parse(JSON.stringify(state.cabinets)),
      architecturalElements: JSON.parse(JSON.stringify(state.architecturalElements)),
      showSocle: state.showSocle,
      socleFinish: state.socleFinish,
      socleHeight: state.socleHeight || 10,
      golaSystem: state.golaSystem,
      countertopConfig: JSON.parse(JSON.stringify(state.countertopConfig)),
      islandBackConfig: JSON.parse(JSON.stringify(state.islandBackConfig)),
      mepPoints: JSON.parse(JSON.stringify(state.mepPoints)),
      handleConfig: JSON.parse(JSON.stringify(state.handleConfig)),
    };

    const [nextState, ...remainingFuture] = currentFuture;
    const newHistory = [currentSnapshot, ...(state.history || []).slice(0, 29)];

    set({
      cabinets: nextState.cabinets,
      architecturalElements: nextState.architecturalElements,
      showSocle: nextState.showSocle,
      socleFinish: (nextState as any).socleFinish || 'aluminum',
      socleHeight: (nextState as any).socleHeight || 10,
      golaSystem: nextState.golaSystem,
      countertopConfig: nextState.countertopConfig,
      islandBackConfig: nextState.islandBackConfig,
      mepPoints: nextState.mepPoints,
      handleConfig: nextState.handleConfig,
      history: newHistory,
      future: remainingFuture,
      activeCabinetId: null,
      activeArchElementId: null,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setToolMode: (mode) => set({ toolMode: mode, drawingStart: null }),
  setHandleConfig: (config) =>
    set((state) => ({
      handleConfig: { ...state.handleConfig, ...config },
      cabinets: state.cabinets.map((cab) => ({
        ...cab,
        handleConfig: undefined,
      })),
    })),
  addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
  updateWall: (id, updates) =>
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  removeWall: (id) =>
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      activeWallId: state.activeWallId === id ? null : state.activeWallId,
    })),
  setActiveWall: (id) =>
    set((state) => {
      if (state.activeWallId === id && (!id || (!state.activeCabinetId && !state.activeArchElementId))) return state;
      return {
        activeWallId: id,
        activeCabinetId: id ? null : state.activeCabinetId,
        activeArchElementId: id ? null : state.activeArchElementId,
      };
    }),
  setWalls: (walls) =>
    set((state) => {
      const roomPoly = state.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
      const updatedMepPoints = state.mepPoints.map((pt) => {
        const wall = walls.find((w) => w.id === pt.wallId) || walls[0];
        if (wall) {
          const calc = calculateMepPositionOnWall(wall, pt.wallOffset || 0, pt.elevation, roomPoly);
          return {
            ...pt,
            wallId: wall.id,
            position: calc.position,
            rotation: calc.rotation,
          };
        }
        return pt;
      });
      return { walls, mepPoints: updatedMepPoints };
    }),
  addCabinet: (cabinet) =>
    set((state) => {
      const history = saveSnapshot(state);
      const walls = state.walls;
      const roomPoly = state.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
      const isSingleDoorVariant = (v?: string) =>
        v === '1_door' ||
        v === '1_door_1_drawer' ||
        v === 'tall_1_door' ||
        v === 'tall_split_2_doors' ||
        v === 'tall_inner_drawers' ||
        v === 'tall_oven_micro' ||
        v === 'tall_oven_vent' ||
        v === 'tall_microwave_niche';
      const finalWidth = isSingleDoorVariant(cabinet.variant)
        ? Math.min(cabinet.width, 60)
        : cabinet.width;
      const constrainedPos = constrainInsideRoomAndWalls(
        cabinet.position,
        cabinet.rotation || 0,
        finalWidth,
        cabinet.depth,
        cabinet.height,
        walls,
        roomPoly,
        state.architecturalElements
      );
      const newCabList = [...state.cabinets, { ...cabinet, width: finalWidth, position: constrainedPos }];
      for (const cab of newCabList) {
        if (cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || cab.variant?.startsWith('wall_corner_blind')) {
          const perp = findPerpendicularCabinetForCorner(cab, newCabList);
          if (perp && perp.depth > 0) {
            cab.blindWidth = perp.depth;
          }
        }
      }
      return { history, cabinets: newCabList };
    }),
  removeCabinet: (id) =>
    set((state) => {
      const history = saveSnapshot(state);
      return {
        history,
        cabinets: state.cabinets.filter((c) => c.id !== id),
        activeCabinetId: state.activeCabinetId === id ? null : state.activeCabinetId,
      };
    }),
  setActiveCabinet: (id) =>
    set((state) => {
      if (state.activeCabinetId === id && (!id || (!state.activeArchElementId && !state.activeWallId))) return state;
      return {
        activeCabinetId: id,
        activeArchElementId: id ? null : state.activeArchElementId,
        activeWallId: id ? null : state.activeWallId,
      };
    }),
  addArchitecturalElement: (el) =>
    set((state) => {
      const history = saveSnapshot(state);
      const architecturalElements = [...state.architecturalElements, el];
      if (el.type === 'pillar') {
        const roomPoly = state.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
        const resolvedCabinets = resolveCabinetsAgainstPillars(state.cabinets, architecturalElements, state.walls, roomPoly);
        return { history, architecturalElements, cabinets: resolvedCabinets, activeArchElementId: el.id, activeCabinetId: null };
      }
      return { history, architecturalElements, activeArchElementId: el.id, activeCabinetId: null };
    }),
   updateArchitecturalElement: (id, updates) =>
    set((state) => {
      const history = saveSnapshot(state);
      const effectiveWalls = state.walls && state.walls.length > 0 ? state.walls : (state.roomConfig?.vertices && state.roomConfig.vertices.length >= 3 ? state.roomConfig.vertices.map((v, i, arr) => {
         const next = arr[(i + 1) % arr.length];
         return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
      }) : []);

      const architecturalElements = state.architecturalElements.map((el) => {
        if (el.id !== id) return el;
        const merged = { ...el, ...updates };
        const wall = effectiveWalls.find((w) => w.id === merged.wallId) || effectiveWalls[0];
        const wallMaxH = wall?.height || 240;

        // Validar y limitar altura y elevación para que nunca sobresalga del muro
        if (merged.height > wallMaxH) {
          merged.height = wallMaxH;
        }
        if (merged.elevation + merged.height > wallMaxH) {
          merged.elevation = Math.max(0, wallMaxH - merged.height);
        }

        if (updates.offset !== undefined && updates.position === undefined) {
          if (wall) {
             const [x1, z1] = wall.start;
             const [x2, z2] = wall.end;
             const wLen = Math.hypot(x2 - x1, z2 - z1);
             if (wLen >= 10) {
               const uX = (x2 - x1) / wLen;
               const uZ = (z2 - z1) / wLen;
               const sClamped = Math.max(merged.width / 2 + 2, Math.min(wLen - merged.width / 2 - 2, updates.offset + wLen / 2));
               const pX = x1 + sClamped * uX;
               const pZ = z1 + sClamped * uZ;
               merged.offset = sClamped - wLen / 2;
               merged.position = [pX, merged.elevation + merged.height / 2, pZ];
               merged.rotation = Math.atan2(x1 - x2, z1 - z2);
             }
          }
        } else {
          // Actualizar Y en position acorde a elevación y altura
          merged.position = [merged.position[0], merged.elevation + merged.height / 2, merged.position[2]];
        }
        return merged;
      });
      const updatedEl = architecturalElements.find((el) => el.id === id);
      if (updatedEl?.type === 'pillar') {
        const roomPoly = state.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
        const resolvedCabinets = resolveCabinetsAgainstPillars(state.cabinets, architecturalElements, state.walls, roomPoly);
        return { history, architecturalElements, cabinets: resolvedCabinets };
      }
      return { history, architecturalElements };
    }),
  removeArchitecturalElement: (id) => set((state) => ({
    history: saveSnapshot(state),
    architecturalElements: state.architecturalElements.filter(el => el.id !== id),
    activeArchElementId: state.activeArchElementId === id ? null : state.activeArchElementId,
    draggingArchElementId: state.draggingArchElementId === id ? null : state.draggingArchElementId
  })),
  setActiveArchElement: (id) =>
    set((state) => {
      if (state.activeArchElementId === id && (!id || (!state.activeCabinetId && !state.activeWallId))) return state;
      return {
        activeArchElementId: id,
        activeCabinetId: id ? null : state.activeCabinetId,
        activeWallId: id ? null : state.activeWallId,
      };
    }),
  moveArchElementTransient: (id, updates) =>
    set((state) => ({
      architecturalElements: state.architecturalElements.map((el) => {
        if (el.id !== id) return el;
        return { ...el, ...updates };
      }),
    })),
  setDraggingArchElementId: (id) =>
    set((state) => ({
      history: id && !state.draggingArchElementId ? saveSnapshot(state) : state.history,
      draggingArchElementId: id,
    })),
  setDraggingCabinetId: (id) =>
    set((state) => ({
      history: id && !state.draggingCabinetId ? saveSnapshot(state) : state.history,
      draggingCabinetId: id,
    })),
  moveCabinetTransient: (id, updates) =>
    set((state) => ({
      cabinets: state.cabinets.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  setDraggingWallId: (id) => set({ draggingWallId: id }),
  setDrawingStart: (pos) => set({ drawingStart: pos }),
  setShowSocle: (val) => set((state) => ({ history: saveSnapshot(state), showSocle: val })),
  setSocleFinish: (finish) => set((state) => ({ history: saveSnapshot(state), socleFinish: finish })),
  setSocleHeight: (height) => set((state) => ({ history: saveSnapshot(state), socleHeight: height })),
  setGolaIncompatibilityAlert: (alert) => set({ golaIncompatibilityAlert: alert }),
  setGolaSystem: (system) => {
    const state = useKitchenStore.getState();
    if (system !== 'none' && state.countertopConfig.enabled && (state.countertopConfig.regruesoCm || 0) > 0) {
      const prod = state.qstoneCatalog.find((p) => p.id === state.countertopConfig.selectedProductId) || state.qstoneCatalog[0];
      const thicknessCm = (prod?.thicknessMm || 20) / 10;
      const regruesoCm = state.countertopConfig.regruesoCm || 0;
      if (regruesoCm > thicknessCm + 2.0) {
        set({
          golaIncompatibilityAlert: {
            isOpen: true,
            regruesoCm,
            stoneThicknessCm: thicknessCm,
            attemptedAction: 'gola',
          },
        });
        return;
      }
    }
    set((state) => {
      const updatedCabinets = state.cabinets.map((c) => ({ ...c }));
      for (const cab of updatedCabinets) {
        if (cab.variant?.startsWith('corner_blind') || cab.variant === 'corner_blind' || cab.variant?.startsWith('wall_corner_blind')) {
          const perp = findPerpendicularCabinetForCorner(cab, updatedCabinets);
          if (perp && perp.depth > 0) {
            cab.blindWidth = perp.depth;
          }
        }
      }
      return { history: saveSnapshot(state), golaSystem: system, cabinets: updatedCabinets };
    });
  },
  updateCabinet: (id, updates) =>
    set((state) => {
      const history = saveSnapshot(state);
      const targetCab = state.cabinets.find((c) => c.id === id);
      const isBaseOrIsland = targetCab?.type === 'base' || targetCab?.type === 'island';

      const isSingleDoorVariant = (v?: string) =>
        v === '1_door' ||
        v === '1_door_1_drawer' ||
        v === 'tall_1_door' ||
        v === 'tall_split_2_doors' ||
        v === 'tall_inner_drawers' ||
        v === 'tall_oven_micro' ||
        v === 'tall_oven_vent' ||
        v === 'tall_microwave_niche';

      if (targetCab && isSingleDoorVariant(targetCab.variant)) {
        if (updates.width !== undefined && updates.width > 60) {
          updates.width = 60;
        }
      }

      let nextCountertopConfig = state.countertopConfig;
      if (isBaseOrIsland) {
        let changedCountertop = false;
        let newWaterfallLeft = state.countertopConfig.waterfallLeft;
        let newWaterfallRight = state.countertopConfig.waterfallRight;

        if (updates.leftCoverPanel?.enabled && state.countertopConfig.waterfallLeft) {
          newWaterfallLeft = false;
          changedCountertop = true;
        }
        if (updates.rightCoverPanel?.enabled && state.countertopConfig.waterfallRight) {
          newWaterfallRight = false;
          changedCountertop = true;
        }
        if (changedCountertop) {
          nextCountertopConfig = {
            ...state.countertopConfig,
            waterfallLeft: newWaterfallLeft,
            waterfallRight: newWaterfallRight,
          };
        }
      }

      const resolved = resolveCabinetsWithResize(state.cabinets, id, updates);
      const effectiveWalls = (state.walls && state.walls.length > 0)
        ? state.walls
        : (state.roomConfig?.vertices && state.roomConfig.vertices.length >= 3
            ? generateWallsFromRoom(state.roomConfig)
            : []);
      const roomPoly = state.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];

      const aligned = resolved.map((c) => {
        // Enforce flush wall alignment for wall cabinets (muebles aéreos) or when depth was modified on a wall-bound cabinet
        if (effectiveWalls.length > 0 && (c.type === 'wall' || (c.id === id && updates.depth !== undefined && (c.type === 'base' || c.type === 'tall' || c.variant === 'deco_hood')))) {
          let bestWall: any = null;
          let bestDist = Infinity;
          let bestS = 0;
          let bestNormal: [number, number] = [0, 1];
          let bestWallLen = 0;

          const cabSin = Math.sin(c.rotation || 0);
          const cabCos = Math.cos(c.rotation || 0);

          for (const w of effectiveWalls) {
            const x1 = w.start[0];
            const z1 = w.start[1];
            const x2 = w.end[0];
            const z2 = w.end[1];
            const dx = x2 - x1;
            const dz = z2 - z1;
            const wallLen = Math.hypot(dx, dz);
            if (wallLen < 1) continue;

            const uX = dx / wallLen;
            const uZ = dz / wallLen;
            const [nX, nZ] = getWallInwardNormal(x1, z1, x2, z2, roomPoly);
            const isInteriorWall = Boolean(w.isInterior || (w.id && !w.id.startsWith('wall_v_') && !/^wall_\d+_/.test(w.id)));
            const candidateDirs = isInteriorWall ? [1, -1] : [1];

            const s = (c.position[0] - x1) * uX + (c.position[2] - z1) * uZ;
            const sClamped = Math.max(c.width / 2 + 0.5, Math.min(wallLen - c.width / 2 - 0.5, s));
            const projX = x1 + sClamped * uX;
            const projZ = z1 + sClamped * uZ;
            const dist = Math.hypot(c.position[0] - projX, c.position[2] - projZ);

            for (const dir of candidateDirs) {
              const curNX = nX * dir;
              const curNZ = nZ * dir;

              const dot = curNX * cabSin + curNZ * cabCos;
              const penalty = dot > 0.4 ? 0 : 50;

              if (dist + penalty < bestDist) {
                bestDist = dist + penalty;
                bestWall = w;
                bestS = sClamped;
                bestNormal = [curNX, curNZ];
                bestWallLen = wallLen;
              }
            }
          }

          if (bestWall && bestDist < 120) {
            const wallThickness = bestWall.thickness || state.roomConfig?.wallThickness || 20;
            const flushDist = wallThickness / 2 + c.depth / 2;
            const uX = (bestWall.end[0] - bestWall.start[0]) / bestWallLen;
            const uZ = (bestWall.end[1] - bestWall.start[1]) / bestWallLen;
            const newX = bestWall.start[0] + bestS * uX + flushDist * bestNormal[0];
            const newZ = bestWall.start[1] + bestS * uZ + flushDist * bestNormal[1];
            const rot = Math.atan2(bestNormal[0], bestNormal[1]);

            return {
              ...c,
              position: [newX, c.position[1], newZ] as [number, number, number],
              rotation: rot,
            };
          }
        }
        return c;
      });

      const clamped = aligned.map((c) => ({
        ...c,
        position: constrainInsideRoomAndWalls(
          c.position,
          c.rotation || 0,
          c.width,
          c.depth,
          c.height,
          effectiveWalls,
          roomPoly,
          state.architecturalElements
        ),
      }));
      return { history, cabinets: clamped, countertopConfig: nextCountertopConfig };
    }),
  setOpenElement: (id, elementKey, isOpen) =>
    set((state) => ({
      cabinets: state.cabinets.map((cab) => {
        if (cab.id !== id) return cab;
        const openElements = { ...(cab.openElements || {}) };
        openElements[elementKey] = isOpen;
        return { ...cab, openElements };
      }),
    })),
  setRoomPlannerOpen: (open) => set({ isRoomPlannerOpen: open }),
  setRoomConfig: (config) => {
    const generatedWalls = generateWallsFromRoom(config);
    const roomPoly = config.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
    set((state) => {
      const repositionedCabinets = repositionCabinetsOnRoomChange(
        state.cabinets,
        generatedWalls,
        config
      );
      const updatedMepPoints = state.mepPoints.map((pt) => {
        const wall = generatedWalls.find((w) => w.id === pt.wallId) || generatedWalls[0];
        if (wall) {
          const calc = calculateMepPositionOnWall(wall, pt.wallOffset || 0, pt.elevation, roomPoly);
          return {
            ...pt,
            wallId: wall.id,
            position: calc.position,
            rotation: calc.rotation,
          };
        }
        return pt;
      });
      return {
        roomConfig: config,
        walls: generatedWalls,
        cabinets: repositionedCabinets,
        mepPoints: updatedMepPoints,
      };
    });
  },
  setWallColor: (color) => set({ wallColor: color }),
  setFloorType: (floorType) => set({ floorType }),
  applyGlobalTexture: (part, url, mat, thicknessMm) =>
    set((state) => {
      // Si la textura o material corresponde a cuarzo, sinterizado o piedra Qstone de marmolería,
      // DEBE aplicarse ÚNICAMENTE a las cubiertas y nunca a gabinetes/puertas/cajones.
      const isExplicitCabinetMat = mat === 'melamina' || mat === 'hpl' || mat === 'durolac';
      const isStone =
        !isExplicitCabinetMat &&
        ((mat as any) === 'cuarzo' ||
        (mat as any) === 'sinterizado' ||
        (mat as any) === 'granito' ||
        (mat as any) === 'marmol' ||
        state.qstoneCatalog.some((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)));

      if (isStone) {
        const matchedProd =
          state.qstoneCatalog.find((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)) ||
          state.qstoneCatalog[0];
        if (matchedProd) {
          setTimeout(() => {
            useKitchenStore.getState().setCountertopConfig({
              selectedProductId: matchedProd.id,
              enabled: true,
            });
          }, 0);
        }
        return state; // No modificar gabinetes
      }

      if (part === 'islandBack') {
        return {
          islandBackConfig: {
            ...state.islandBackConfig,
            enabled: true,
            materialType: 'decorative',
            decorativeColor: url,
            decorativeMaterial: mat as any,
          },
        };
      }
      const updatedCabinets = state.cabinets.map((c) => {
        if (c.type === 'decoration') return c;
        const updates: Partial<CabinetType> = {};
        if (part === 'structure' || part === 'all') {
          updates.structureColor = url;
          updates.structureMaterial = mat as any;
        }
        if (part === 'doors' || part === 'all') {
          updates.doorColor = url;
          updates.doorMaterial = mat as any;
        }
        if (part === 'drawerFronts' || part === 'all') {
          updates.drawerFrontColor = url;
          updates.drawerFrontMaterial = mat as any;
        }
        if (part === 'drawerInner' || part === 'all') {
          updates.drawerInnerColor = url;
          updates.drawerInnerMaterial = mat as any;
        }
        if (part === 'shelves' || part === 'all') {
          updates.shelfColor = url;
          updates.shelfMaterial = mat as any;
        }
        if (part === 'back' || part === 'all') {
          updates.backColor = url;
          updates.backMaterial = mat as any;
          if (part === 'back' && thicknessMm !== undefined) {
            updates.backThickness = thicknessMm;
          }
        }
        if (part === 'socle' || part === 'all') {
          updates.socleColor = url;
          updates.socleMaterial = mat as any;
        }
        if (part === 'coverPanels' || part === 'all') {
          if (c.leftCoverPanel) {
            updates.leftCoverPanel = { ...c.leftCoverPanel, color: url, material: mat as any };
          }
          if (c.rightCoverPanel) {
            updates.rightCoverPanel = { ...c.rightCoverPanel, color: url, material: mat as any };
          }
        }
        return { ...c, ...updates };
      });
      return { cabinets: updatedCabinets };
    }),
  setCountertopConfig: (updates) => {
    const state = useKitchenStore.getState();
    const targetProductId = updates.selectedProductId || state.countertopConfig.selectedProductId;
    const prod = state.qstoneCatalog.find((p) => p.id === targetProductId) || state.qstoneCatalog[0];
    const thicknessCm = (prod?.thicknessMm || 20) / 10;
    const targetRegrueso = updates.regruesoCm !== undefined ? updates.regruesoCm : state.countertopConfig.regruesoCm;

    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.waterfallLeft) {
      normalizedUpdates.overhangLeftCm = 0;
      if (normalizedUpdates.baseWaterfallLeft === undefined) normalizedUpdates.baseWaterfallLeft = true;
      if (normalizedUpdates.islandWaterfallLeft === undefined) normalizedUpdates.islandWaterfallLeft = true;
    }
    if (normalizedUpdates.waterfallRight) {
      normalizedUpdates.overhangRightCm = 0;
      if (normalizedUpdates.baseWaterfallRight === undefined) normalizedUpdates.baseWaterfallRight = true;
      if (normalizedUpdates.islandWaterfallRight === undefined) normalizedUpdates.islandWaterfallRight = true;
    }
    if (normalizedUpdates.baseWaterfallLeft) {
      normalizedUpdates.baseOverhangLeftCm = 0;
    }
    if (normalizedUpdates.baseWaterfallRight) {
      normalizedUpdates.baseOverhangRightCm = 0;
    }
    if (normalizedUpdates.islandWaterfallLeft) {
      normalizedUpdates.islandOverhangLeftCm = 0;
    }
    if (normalizedUpdates.islandWaterfallRight) {
      normalizedUpdates.islandOverhangRightCm = 0;
    }

    if (normalizedUpdates.islandOverhangBackCm !== undefined) {
      normalizedUpdates.islandOverhangCm = normalizedUpdates.islandOverhangBackCm;
      normalizedUpdates.overhangBackCm = normalizedUpdates.islandOverhangBackCm;
    } else if (normalizedUpdates.islandOverhangCm !== undefined) {
      normalizedUpdates.islandOverhangBackCm = normalizedUpdates.islandOverhangCm;
      normalizedUpdates.overhangBackCm = normalizedUpdates.islandOverhangCm;
    }

    if (state.golaSystem !== 'none' && targetRegrueso > thicknessCm + 2.0) {
      set({
        golaIncompatibilityAlert: {
          isOpen: true,
          regruesoCm: targetRegrueso,
          stoneThicknessCm: thicknessCm,
          attemptedAction: 'regrueso',
        },
      });
      // Aplicar las demás actualizaciones sin modificar regruesoCm incompatible
      const { regruesoCm, ...safeUpdates } = normalizedUpdates;
      set((s) => {
        let nextCabinets = s.cabinets;
        if (safeUpdates.waterfallLeft) {
          nextCabinets = nextCabinets.map((c) =>
            (c.type === 'base' || c.type === 'island') && c.leftCoverPanel?.enabled
              ? { ...c, leftCoverPanel: { ...c.leftCoverPanel, enabled: false } }
              : c
          );
        }
        if (safeUpdates.waterfallRight) {
          nextCabinets = nextCabinets.map((c) =>
            (c.type === 'base' || c.type === 'island') && c.rightCoverPanel?.enabled
              ? { ...c, rightCoverPanel: { ...c.rightCoverPanel, enabled: false } }
              : c
          );
        }
        return {
          cabinets: nextCabinets,
          countertopConfig: { ...s.countertopConfig, ...safeUpdates },
        };
      });
      return;
    }
    set((s) => {
      let nextCabinets = s.cabinets;
      if (normalizedUpdates.waterfallLeft) {
        nextCabinets = nextCabinets.map((c) =>
          (c.type === 'base' || c.type === 'island') && c.leftCoverPanel?.enabled
            ? { ...c, leftCoverPanel: { ...c.leftCoverPanel, enabled: false } }
            : c
        );
      }
      if (normalizedUpdates.waterfallRight) {
        nextCabinets = nextCabinets.map((c) =>
          (c.type === 'base' || c.type === 'island') && c.rightCoverPanel?.enabled
            ? { ...c, rightCoverPanel: { ...c.rightCoverPanel, enabled: false } }
            : c
        );
      }
      return {
        cabinets: nextCabinets,
        countertopConfig: { ...s.countertopConfig, ...normalizedUpdates },
      };
    });
  },
  setIslandBackConfig: (updates) =>
    set((state) => {
      const next = { ...state.islandBackConfig, ...updates };
      // Regla estricta: si es material de cubierta, solo hasta el piso (sin zócalo)
      if (next.materialType === 'countertop') {
        next.heightMode = 'to_floor';
      }
      return { islandBackConfig: next };
    }),
  updateQstoneCatalogItemPrice: (id, priceM2Clp) =>
    set((state) => ({
      qstoneCatalog: state.qstoneCatalog.map((item) =>
        item.id === id ? { ...item, priceM2Clp } : item
      ),
    })),
  addQstoneCatalogItem: (item) =>
    set((state) => ({
      qstoneCatalog: [
        ...state.qstoneCatalog.filter((c) => c.id !== item.id),
        item,
      ],
    })),
  updateQstoneCatalogItem: (id, updates) =>
    set((state) => ({
      qstoneCatalog: state.qstoneCatalog.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeQstoneCatalogItem: (id) =>
    set((state) => ({
      qstoneCatalog: state.qstoneCatalog.filter((item) => item.id !== id),
    })),
  validateCabinetForSink: (cab, sinkModel) => {
    if (sinkModel === 'none') return { valid: true, minWidth: 0, actualWidth: cab.width };
    const spec = QSTONE_SINKS[sinkModel];
    if (!spec) return { valid: true, minWidth: 0, actualWidth: cab.width };

    // ALFA ONEC requires min 80cm, ALFA TWOC requires min 90cm
    const minWidth = spec.minCabinetWidthCm;
    const actualWidth = cab.width;
    const valid = actualWidth >= minWidth;
    return {
      valid,
      minWidth,
      actualWidth,
      reason: valid
        ? undefined
        : `La cubeta ${spec.name} requiere un mueble base de al menos ${minWidth} cm de ancho (Encastre: ${(spec.cutoutWidthMm / 10).toFixed(1)} cm). El mueble seleccionado mide ${actualWidth} cm.`,
    };
  },
  validateCabinetForCooktop: (cab, cooktopModel) => {
    if (cooktopModel === 'none') return { valid: true, minWidth: 0, actualWidth: cab.width };
    const spec = FDV_COOKTOPS[cooktopModel];
    if (!spec) return { valid: true, minWidth: 0, actualWidth: cab.width };

    const minWidth = spec.minCabinetWidthCm;
    const actualWidth = cab.width;
    const valid = actualWidth >= minWidth;
    return {
      valid,
      minWidth,
      actualWidth,
      reason: valid
        ? undefined
        : `La encimera ${spec.name} requiere un mueble de al menos ${minWidth} cm de ancho (Encastre: ${(spec.cutoutWidthMm / 10).toFixed(1)} cm). El mueble seleccionado mide ${actualWidth} cm.`,
    };
  },
  setCountertopSink: (model, cabinetId) => {
    const state = useKitchenStore.getState();
    const targetCabId = cabinetId !== undefined ? cabinetId : state.activeCabinetId;
    if (model === 'none') {
      set((s) => ({
        countertopConfig: { ...s.countertopConfig, sinkModel: 'none', sinkCabinetId: null },
      }));
      return { success: true };
    }
    if (!targetCabId) {
      return { success: false, error: 'Debes seleccionar un mueble base para instalar la cubeta.' };
    }
    const cab = state.cabinets.find((c) => c.id === targetCabId);
    if (!cab || (cab.type !== 'base' && cab.type !== 'island')) {
      return { success: false, error: 'Solo se puede instalar la cubeta en un mueble tipo Base o Isla.' };
    }
    const validation = state.validateCabinetForSink(cab, model);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }
    set((s) => ({
      countertopConfig: { ...s.countertopConfig, sinkModel: model, sinkCabinetId: targetCabId },
    }));
    return { success: true };
  },
  setCountertopCooktop: (model, cabinetId) => {
    const state = useKitchenStore.getState();
    const targetCabId = cabinetId !== undefined ? cabinetId : state.activeCabinetId;
    if (model === 'none') {
      set((s) => ({
        countertopConfig: { ...s.countertopConfig, cooktopModel: 'none', cooktopCabinetId: null },
      }));
      return { success: true };
    }
    if (!targetCabId) {
      return { success: false, error: 'Debes seleccionar un mueble base o isla para situar la encimera.' };
    }
    const cab = state.cabinets.find((c) => c.id === targetCabId);
    if (!cab || (cab.type !== 'base' && cab.type !== 'island')) {
      return { success: false, error: 'Solo se puede instalar la encimera en un mueble tipo Base o Isla.' };
    }
    const validation = state.validateCabinetForCooktop(cab, model);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }
    set((s) => ({
      countertopConfig: { ...s.countertopConfig, cooktopModel: model, cooktopCabinetId: targetCabId },
    }));
    return { success: true };
  },

  addMepPoint: (point) => set((s) => ({ mepPoints: [...s.mepPoints, point], activeMepId: point.id })),
  
  updateMepPoint: (id, updates) => set((s) => {
    const roomPoly = s.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
    const nextPoints = s.mepPoints.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };
      if ((updates.wallOffset !== undefined || updates.elevation !== undefined) && merged.wallId) {
        const wall = s.walls.find((w) => w.id === merged.wallId) || s.walls[0];
        if (wall) {
          const calc = calculateMepPositionOnWall(wall, merged.wallOffset || 0, merged.elevation, roomPoly);
          merged.position = calc.position;
          merged.rotation = calc.rotation;
        }
      }
      return merged;
    });
    return { mepPoints: nextPoints };
  }),

  removeMepPoint: (id) => set((s) => ({
    mepPoints: s.mepPoints.filter((p) => p.id !== id),
    activeMepId: s.activeMepId === id ? null : s.activeMepId,
  })),

  setActiveMepId: (id) => set({ activeMepId: id, activeCabinetId: id ? null : undefined, activeArchElementId: id ? null : undefined }),
  setShowMep: (show) => set({ showMep: show }),
  setShowMepClashes: (show) => set({ showMepClashes: show }),
  setShowMepDimensions: (show) => set({ showMepDimensions: show }),

  addMepPreset: (presetType, wallId, offsetCm) => set((s) => {
    const preset = MEP_PRESETS.find((pr) => pr.id === presetType);
    if (!preset || s.walls.length === 0) return {};
    const roomPoly = s.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
    const targetWall = (wallId && s.walls.find((w) => w.id === wallId)) || s.walls[0];
    const [x1, z1] = targetWall.start;
    const [x2, z2] = targetWall.end;
    const wLen = Math.hypot(x2 - x1, z2 - z1);
    const baseOffset = offsetCm !== undefined ? offsetCm : wLen / 2;

    const newPoints: MepPoint[] = preset.points.map((pt, idx) => {
      const pointOffset = Math.max(10, Math.min(wLen - 10, baseOffset + pt.relativeOffsetCm));
      const calc = calculateMepPositionOnWall(targetWall, pointOffset, pt.elevationCm, roomPoly);
      return {
        id: `mep-${preset.id}-${Date.now()}-${idx}`,
        name: `${preset.name} (${idx + 1})`,
        type: pt.type,
        wallId: targetWall.id,
        wallOffset: pointOffset,
        elevation: pt.elevationCm,
        position: calc.position,
        rotation: calc.rotation,
        specs: pt.specs,
      };
    });

    return {
      mepPoints: [...s.mepPoints, ...newPoints],
      activeMepId: newPoints[0]?.id || s.activeMepId,
    };
  }),

  autoFixClash: (clash) => set((s) => {
    if (clash.autoFixAction === 'convert_to_u_drawer' && clash.cabinetId) {
      return {
        cabinets: s.cabinets.map((c) =>
          c.id === clash.cabinetId ? { ...c, variant: 'sink_u_drawer' } : c
        ),
      };
    }
    if (clash.autoFixAction === 'add_sanitary_void' && clash.mepPointId) {
      return {
        mepPoints: s.mepPoints.map((p) =>
          p.id === clash.mepPointId ? { ...p, hasSanitaryVoidRecess: true } : p
        ),
      };
    }
    if (clash.autoFixAction === 'shift_mep_clearance' && clash.relatedMepPointId) {
      const targetPoint = s.mepPoints.find((p) => p.id === clash.relatedMepPointId);
      if (targetPoint && targetPoint.wallId) {
        const wall = s.walls.find((w) => w.id === targetPoint.wallId);
        if (wall) {
          const roomPoly = s.roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
          const newOffset = (targetPoint.wallOffset || 50) + 55;
          const calc = calculateMepPositionOnWall(wall, newOffset, targetPoint.elevation, roomPoly);
          return {
            mepPoints: s.mepPoints.map((p) =>
              p.id === targetPoint.id
                ? { ...p, wallOffset: newOffset, position: calc.position, rotation: calc.rotation }
                : p
            ),
          };
        }
      }
    }
    return {};
  }),

  resetKitchen: () => {
    const defaultRoom: RoomConfig = {
      type: 'rectangular',
      wallHeight: 250,
      wallThickness: 20,
      vertices: getPresetRoomVertices('rectangular'),
    };
    const defaultWalls = generateWallsFromRoom(defaultRoom);
    set({
      cabinets: [],
      activeCabinetId: null,
      activeWallId: null,
      walls: defaultWalls,
      roomConfig: defaultRoom,
      wallColor: '#E2E8F0',
      floorType: 'ceramic_white_60x60',
      toolMode: 'select',
      viewMode: '3d',
      showSocle: false,
      golaSystem: 'none',
      drawingStart: null,
      countertopConfig: DEFAULT_COUNTERTOP_CONFIG,
      islandBackConfig: DEFAULT_ISLAND_BACK_CONFIG,
      handleConfig: DEFAULT_HANDLE_CONFIG,
      mepPoints: [],
      activeMepId: null,
      showMep: true,
      showMepClashes: true,
      showMepDimensions: true,
    });
  },
};
});
