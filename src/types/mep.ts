export type MepType = 
  | 'water_cold'       // Agua Fría (AF) Ø1/2"
  | 'water_hot'        // Agua Caliente (AC) Ø1/2"
  | 'drain'            // Desagüe Sanitario PVC Ø50mm o Ø110mm
  | 'electric_socket'  // Enchufe Estándar sobre cubierta (10A/16A)
  | 'electric_power'   // Enchufe de Fuerza (Horno/Encimera/Lavavajillas 16A/20A)
  | 'gas';             // Llave de paso de Gas Licuado/Natural

export interface MepTypeConfig {
  type: MepType;
  label: string;
  shortLabel: string;
  category: 'water' | 'drain' | 'electric' | 'gas';
  defaultElevationCm: number; // Altura recomendada sobre NPT (cm)
  colorHex: string;
  defaultDiameterMm: number;
  description: string;
  standardSymbol: string;
}

export const MEP_TYPE_CONFIGS: Record<MepType, MepTypeConfig> = {
  water_cold: {
    type: 'water_cold',
    label: 'Agua Fría (AF)',
    shortLabel: 'AF',
    category: 'water',
    defaultElevationCm: 55,
    colorHex: '#0284c7', // Sky blue
    defaultDiameterMm: 15,
    description: 'Terminal HE 1/2" para llave angular y flexible de monomando',
    standardSymbol: '💧',
  },
  water_hot: {
    type: 'water_hot',
    label: 'Agua Caliente (AC)',
    shortLabel: 'AC',
    category: 'water',
    defaultElevationCm: 55,
    colorHex: '#e11d48', // Rose red
    defaultDiameterMm: 15,
    description: 'Terminal HE 1/2" para monomando lavaplatos (lado izquierdo)',
    standardSymbol: '♨️',
  },
  drain: {
    type: 'drain',
    label: 'Desagüe Sanitario (DES)',
    shortLabel: 'DES',
    category: 'drain',
    defaultElevationCm: 45,
    colorHex: '#475569', // Slate grey PVC
    defaultDiameterMm: 50,
    description: 'Descarga sanitaria PVC Ø50mm a eje con campana para sifón',
    standardSymbol: '🚰',
  },
  electric_socket: {
    type: 'electric_socket',
    label: 'Enchufe Sobre Cubierta',
    shortLabel: '220V',
    category: 'electric',
    defaultElevationCm: 110,
    colorHex: '#eab308', // Yellow
    defaultDiameterMm: 65,
    description: 'Caja 2x4 embutida, 220V 10/16A sobre salpicadero',
    standardSymbol: '⚡',
  },
  electric_power: {
    type: 'electric_power',
    label: 'Enchufe Fuerza (Bajo Cubierta)',
    shortLabel: 'PWR',
    category: 'electric',
    defaultElevationCm: 35,
    colorHex: '#f97316', // Orange
    defaultDiameterMm: 65,
    description: 'Toma de fuerza 16A/20A para horno empotrado, lavavajillas o encimera',
    standardSymbol: '🔌',
  },
  gas: {
    type: 'gas',
    label: 'Llave de Paso de Gas',
    shortLabel: 'GAS',
    category: 'gas',
    defaultElevationCm: 75,
    colorHex: '#ca8a04', // Amber gold
    defaultDiameterMm: 20,
    description: 'Válvula de corte esférica gas licuado o natural (cobre Ø1/2" o 3/4")',
    standardSymbol: '🔥',
  },
};

export interface MepPoint {
  id: string;
  name: string;
  type: MepType;
  wallId?: string;
  wallOffset?: number; // cm desde el inicio del muro
  elevation: number;   // cm sobre el nivel de piso terminado (NPT)
  position: [number, number, number]; // [x, y, z] en coordenadas del mundo (cm)
  rotation: number;    // Radianes respecto al muro
  diameterMm?: number;
  specs?: string;
  hasSanitaryVoidRecess?: boolean; // Si el mueble asociado ya tiene calado
}

export interface MepClash {
  id: string;
  mepPointId: string;
  cabinetId?: string;
  relatedMepPointId?: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  resolutionRecommendation: string;
  autoFixAvailable: boolean;
  autoFixAction?: 'convert_to_u_drawer' | 'add_sanitary_void' | 'shift_mep_clearance' | 'relocate_outlet';
}

export type MepPresetType = 
  | 'sink_combo'
  | 'cooking_combo'
  | 'refrigerator_combo'
  | 'splashback_sockets'
  | 'hood_socket';

export interface MepPreset {
  id: MepPresetType;
  name: string;
  description: string;
  points: Array<{
    type: MepType;
    relativeOffsetCm: number;
    elevationCm: number;
    specs?: string;
  }>;
}

export const MEP_PRESETS: MepPreset[] = [
  {
    id: 'sink_combo',
    name: 'Zona Lavaplatos Completa (AF + AC + Desagüe)',
    description: 'Agua Caliente (izq), Agua Fría (der) a 55 cm y Desagüe central Ø50 a 45 cm.',
    points: [
      { type: 'water_hot', relativeOffsetCm: -10, elevationCm: 55, specs: 'Agua Caliente 1/2" HE' },
      { type: 'drain', relativeOffsetCm: 0, elevationCm: 45, specs: 'Descarga PVC Ø50mm' },
      { type: 'water_cold', relativeOffsetCm: 10, elevationCm: 55, specs: 'Agua Fría 1/2" HE' },
    ],
  },
  {
    id: 'cooking_combo',
    name: 'Zona Cocción (Gas + Fuerza Horno)',
    description: 'Toma de gas a 75 cm con llave de paso y enchufe de fuerza horno 16A a 35 cm.',
    points: [
      { type: 'electric_power', relativeOffsetCm: -15, elevationCm: 35, specs: 'Enchufe Horno 16A' },
      { type: 'gas', relativeOffsetCm: 15, elevationCm: 75, specs: 'Llave de Gas 1/2"' },
    ],
  },
  {
    id: 'refrigerator_combo',
    name: 'Zona Refrigerador (Enchufe + Toma Ice Maker)',
    description: 'Enchufe alto a 120 cm y toma de agua fría para dispensador de hielo a 50 cm.',
    points: [
      { type: 'electric_socket', relativeOffsetCm: 0, elevationCm: 120, specs: 'Enchufe Refri 10A' },
      { type: 'water_cold', relativeOffsetCm: 15, elevationCm: 50, specs: 'Toma Ice Maker 1/2"' },
    ],
  },
  {
    id: 'splashback_sockets',
    name: 'Enchufes Sobre Cubierta (Doble toma)',
    description: 'Dos puntos eléctricos dobles a 110 cm para pequeños electrodomésticos.',
    points: [
      { type: 'electric_socket', relativeOffsetCm: -30, elevationCm: 110, specs: 'Enchufe Doble 10/16A' },
      { type: 'electric_socket', relativeOffsetCm: 30, elevationCm: 110, specs: 'Enchufe Doble 10/16A' },
    ],
  },
  {
    id: 'hood_socket',
    name: 'Enchufe Campana Extractora',
    description: 'Punto eléctrico superior a 190 cm a eje de campana.',
    points: [
      { type: 'electric_socket', relativeOffsetCm: 0, elevationCm: 190, specs: 'Enchufe Campana 10A' },
    ],
  },
];
