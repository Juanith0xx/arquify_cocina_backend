export type HandleModelId = 
  | 'none' 
  | 'forza' 
  | 'ce' 
  | 'madrid' 
  | 'balin' 
  | 'denver' 
  | 'berlin' 
  | 'oslo';

export type HandleFinish = 
  | 'negro' 
  | 'satinado' 
  | 'dorado' 
  | 'envejecido' 
  | 'gris_perla';

export interface HandleCatalogItem {
  id: HandleModelId;
  name: string;
  category: 'asa' | 'perfil' | 'tubular' | 'pomo' | 'concha' | 'push';
  material: string;
  finishes: HandleFinish[];
  lengths: number[]; // Medidas en mm (o entrecentros)
  holeCount: number; // 0 = push/perfil, 1 = pomo/perilla, 2 = asa/barra
  isRearMount?: boolean; // montaje posterior (CE, Oslo)
  description: string;
}

export interface KitchenHandleConfig {
  model: HandleModelId;
  finish: HandleFinish;
  lengthMm: number;
  orientation: 'horizontal' | 'vertical' | 'auto';
}

export const HANDLE_CATALOG: HandleCatalogItem[] = [
  {
    id: 'forza',
    name: 'Tirador Forza',
    category: 'asa',
    material: 'Aluminio',
    finishes: ['negro', 'satinado'],
    lengths: [96, 128, 160, 192, 256, 320],
    holeCount: 2,
    description: 'Asa recta de aluminio de líneas geométricas puras con retorno a 90°.'
  },
  {
    id: 'ce',
    name: 'Tirador CE',
    category: 'perfil',
    material: 'Aluminio',
    finishes: ['negro'],
    lengths: [100, 150, 200, 300, 400],
    holeCount: 0,
    isRearMount: true,
    description: 'Perfil pestaña plana atornillado por el reverso del frente sobre el canto.'
  },
  {
    id: 'madrid',
    name: 'Tirador Madrid',
    category: 'tubular',
    material: 'Acero Inoxidable',
    finishes: ['negro', 'satinado'],
    lengths: [96, 128, 160, 192, 256, 320],
    holeCount: 2,
    description: 'Barra cilíndrica de Ø12 mm en acero inoxidable con postes torneados y voladizos.'
  },
  {
    id: 'balin',
    name: 'Tirador Balín',
    category: 'pomo',
    material: 'Aluminio',
    finishes: ['negro', 'satinado'],
    lengths: [22, 25, 28],
    holeCount: 1,
    description: 'Pomo cilíndrico compacto de aluminio con muesca ergonómica cóncava para dedos.'
  },
  {
    id: 'denver',
    name: 'Tirador Denver',
    category: 'asa',
    material: 'Zinc Alloy',
    finishes: ['negro', 'dorado', 'envejecido', 'gris_perla'],
    lengths: [64, 96, 128, 160],
    holeCount: 2,
    description: 'Tirador tipo asa prismática recta de Zinc Alloy con patas macizas integradas a 90° y entrecentros normalizados.'
  },
  {
    id: 'berlin',
    name: 'Perilla Berlín',
    category: 'pomo',
    material: 'Zinc Alloy',
    finishes: ['negro', 'dorado', 'gris_perla'],
    lengths: [25],
    holeCount: 1,
    description: 'Perilla esférica clásica de Ø25 mm con peana cónica torneada.'
  },
  {
    id: 'oslo',
    name: 'Tirador Oslo',
    category: 'perfil',
    material: 'Aluminio',
    finishes: ['negro'],
    lengths: [100, 150, 200, 300],
    holeCount: 0,
    isRearMount: true,
    description: 'Perfil pestaña ergonómica en ángulo biselado de aluminio para montaje en canto.'
  },
  {
    id: 'none',
    name: 'Sin Tirador (Push)',
    category: 'push',
    material: 'N/A',
    finishes: ['negro'],
    lengths: [0],
    holeCount: 0,
    description: 'Apertura mecánica push-to-open o gola oculta sin tiradores exteriores visibles.'
  }
];

export const FINISH_LABELS: Record<HandleFinish, string> = {
  negro: 'Negro Mate',
  satinado: 'Satinado (Inox)',
  dorado: 'Dorado Cepillado',
  envejecido: 'Envejecido / Bronce',
  gris_perla: 'Gris Perla'
};

export const FINISH_HEX: Record<HandleFinish, string> = {
  negro: '#1c1917',
  satinado: '#cbd5e1',
  dorado: '#eab308',
  envejecido: '#92400e',
  gris_perla: '#94a3b8'
};

export const DEFAULT_HANDLE_CONFIG: KitchenHandleConfig = {
  model: 'forza',
  finish: 'negro',
  lengthMm: 128,
  orientation: 'auto'
};
