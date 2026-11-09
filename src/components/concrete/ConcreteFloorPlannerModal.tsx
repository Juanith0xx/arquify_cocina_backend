import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  useConcreteHouseStore,
  RoomBlock,
  RoomBlockCategory,
  WallThicknessMm,
  RoofType,
} from '../../store/concreteHouseStore';
import {
  X,
  Check,
  LayoutGrid,
  Plus,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  Home,
  Utensils,
  Bed,
  Bath,
  TreePine,
  Flame,
  DoorOpen,
  ArrowRight,
  Move,
  Ruler,
  Info,
  Eraser,
} from 'lucide-react';

interface ConcreteFloorPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Plantillas preconfiguradas de recintos para agregar rápidamente
const ROOM_CATALOG: Array<{
  name: string;
  category: RoomBlockCategory;
  width: number;
  length: number;
  wallType: 'concrete_150' | 'concrete_200' | 'masonry_140' | 'drywall_90';
  hasSlabCover: boolean;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    name: 'Living / Estar Principal',
    category: 'living',
    width: 600,
    length: 500,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#3b82f6',
    icon: Home,
  },
  {
    name: 'Cocina Americana / Gourmet',
    category: 'kitchen',
    width: 450,
    length: 350,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#f59e0b',
    icon: Utensils,
  },
  {
    name: 'Master Suite Principal',
    category: 'bedroom',
    width: 500,
    length: 420,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#8b5cf6',
    icon: Bed,
  },
  {
    name: 'Dormitorio Secundario',
    category: 'bedroom',
    width: 380,
    length: 340,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#a855f7',
    icon: Bed,
  },
  {
    name: 'Baño Principal en Suite',
    category: 'bathroom',
    width: 280,
    length: 200,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#06b6d4',
    icon: Bath,
  },
  {
    name: 'Baño de Visitas',
    category: 'bathroom',
    width: 200,
    length: 160,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#0ea5e9',
    icon: Bath,
  },
  {
    name: 'Quincho Techado & Asador',
    category: 'quincho',
    width: 550,
    length: 400,
    wallType: 'concrete_150',
    hasSlabCover: true,
    color: '#ea580c',
    icon: Flame,
  },
  {
    name: 'Galería / Pérgola Exterior',
    category: 'terrace',
    width: 450,
    length: 600,
    wallType: 'concrete_150',
    hasSlabCover: false,
    color: '#10b981',
    icon: TreePine,
  },
  {
    name: 'Patio Interior / Atrio',
    category: 'patio',
    width: 300,
    length: 300,
    wallType: 'concrete_150',
    hasSlabCover: false,
    color: '#14b8a6',
    icon: Compass,
  },
];

// Presets morfológicos rápidos (L-Shape, U-Shape, etc.)
const MORPHOLOGY_PRESETS = [
  {
    id: 'l_shape_villa',
    name: 'Planta en L (Pabellón & Galería)',
    tag: 'Área Social + Privada en Ángulo Recto',
    blocks: [
      { id: 'b-1', name: 'Living-Comedor & Cocina', category: 'living' as const, x: 0, z: 0, width: 850, length: 550, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#3b82f6' },
      { id: 'b-2', name: 'Galería Techada Quincho', category: 'quincho' as const, x: 500, z: 550, width: 350, length: 450, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#ea580c' },
      { id: 'b-3', name: 'Ala Dormitorios & Suites', category: 'bedroom' as const, x: 0, z: 550, width: 500, length: 900, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#8b5cf6' },
    ],
  },
  {
    id: 'u_shape_atrio',
    name: 'Planta en U (Patio Central Protegido)',
    tag: 'Atrio Central con Muros de Hormigón Visto',
    blocks: [
      { id: 'b-1', name: 'Ala Social (Living/Cocina)', category: 'living' as const, x: 0, z: 0, width: 750, length: 450, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#3b82f6' },
      { id: 'b-2', name: 'Patio de Luz & Atrio Central', category: 'patio' as const, x: 220, z: 450, width: 310, length: 350, wallType: 'concrete_150' as const, hasSlabCover: false, color: '#14b8a6' },
      { id: 'b-3', name: 'Conexión / Galería Vidriada', category: 'corridor' as const, x: 0, z: 450, width: 220, length: 350, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#64748b' },
      { id: 'b-4', name: 'Pabellón Dormitorios Suite', category: 'bedroom' as const, x: 0, z: 800, width: 750, length: 550, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#8b5cf6' },
    ],
  },
  {
    id: 'casa_tt_linear',
    name: 'Casa TT Lineal & Pérgola (158 m²)',
    tag: 'GRUPO studio • Hormigón Visto & Pérgola',
    blocks: [
      { id: 'b-1', name: 'Estar-Comedor & Cocina', category: 'living' as const, x: 0, z: 0, width: 596, length: 1100, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#3b82f6' },
      { id: 'b-2', name: 'Patio Tender & Atrio', category: 'patio' as const, x: 0, z: 1100, width: 596, length: 248, wallType: 'concrete_150' as const, hasSlabCover: false, color: '#14b8a6' },
      { id: 'b-3', name: 'Pabellón 3 Dormitorios', category: 'bedroom' as const, x: 0, z: 1348, width: 596, length: 1297, wallType: 'concrete_150' as const, hasSlabCover: true, color: '#8b5cf6' },
    ],
  },
];

export function ConcreteFloorPlannerModal({ isOpen, onClose }: ConcreteFloorPlannerModalProps) {
  const store = useConcreteHouseStore();

  // Estado local para los bloques del diseñador
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [snapGridCm, setSnapGridCm] = useState<number>(25); // snap en cm
  const [wallThicknessMm, setWallThicknessMm] = useState<WallThicknessMm>(store.wallThicknessMm || 150);
  const [roofType, setRoofType] = useState<RoofType>(store.dimensions.roofType || 'losa_plana');
  const [wallHeightCm, setWallHeightCm] = useState<number>(store.dimensions.wallHeight || 285);

  // Estados de vista del SVG (Zoom y Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estado de arrastre de bloques
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  // Estado de redimensionamiento de bloque
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'e' | 's' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseZ: number; initW: number; initL: number }>({
    mouseX: 0,
    mouseZ: 0,
    initW: 0,
    initL: 0,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      if (store.roomBlocks && store.roomBlocks.length > 0) {
        setBlocks(JSON.parse(JSON.stringify(store.roomBlocks)));
      } else {
        // Iniciar en blanco (desde cero)
        setBlocks([]);
      }
      setWallThicknessMm(store.wallThicknessMm || 150);
      setRoofType(store.dimensions.roofType || 'losa_plana');
      setWallHeightCm(store.dimensions.wallHeight || 285);
      setSelectedBlockId(null);
    }
  }, [isOpen, store]);

  // Dimensiones globales envolventes (Bounding Box en cm)
  const boundingBox = useMemo(() => {
    if (blocks.length === 0) {
      return { minX: 0, maxX: 600, minZ: 0, maxZ: 1000, width: 600, length: 1000, totalAreaM2: 0 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let totalCoveredAreaCm2 = 0;

    blocks.forEach((b) => {
      if (b.x < minX) minX = b.x;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.z < minZ) minZ = b.z;
      if (b.z + b.length > maxZ) maxZ = b.z + b.length;
      totalCoveredAreaCm2 += b.width * b.length;
    });

    const width = Math.max(200, Math.round(maxX - minX));
    const length = Math.max(300, Math.round(maxZ - minZ));
    const totalAreaM2 = Number((totalCoveredAreaCm2 / 10000).toFixed(1));

    return { minX, maxX, minZ, maxZ, width, length, totalAreaM2 };
  }, [blocks]);

  // Conversión de coordenadas de pantalla a coordenadas centimétricas del canvas
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, z: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const viewBoxW = 1200;
    const viewBoxH = 1200;
    const clickX = ((clientX - rect.left) / rect.width) * viewBoxW;
    const clickY = ((clientY - rect.top) / rect.height) * viewBoxH;

    // Compensar pan y zoom (centrado en 600,600)
    const baseCenterX = 600;
    const baseCenterY = 600;
    const unzoomedX = (clickX - baseCenterX - pan.x) / zoom + baseCenterX;
    const unzoomedY = (clickY - baseCenterY - pan.y) / zoom + baseCenterY;

    // Escala del canvas: 1 unidad = 0.5 cm
    const cmX = (unzoomedX - 100) * 2;
    const cmZ = (unzoomedY - 100) * 2;

    const snap = snapGridCm;
    return {
      x: Math.round(cmX / snap) * snap,
      z: Math.round(cmZ / snap) * snap,
    };
  };

  // Agregar nuevo recinto desde el catálogo
  const handleAddRoom = (catItem: typeof ROOM_CATALOG[0]) => {
    const newId = `rb-${Date.now()}`;
    const nextZ = blocks.length > 0 ? boundingBox.maxZ : 0;
    const newBlock: RoomBlock = {
      id: newId,
      name: catItem.name,
      category: catItem.category,
      x: 0,
      z: nextZ,
      width: catItem.width,
      length: catItem.length,
      wallType: catItem.wallType,
      hasSlabCover: catItem.hasSlabCover,
      color: catItem.color,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newId);
  };

  // Eliminar recinto seleccionado
  const handleDeleteSelected = () => {
    if (!selectedBlockId) return;
    setBlocks(blocks.filter((b) => b.id !== selectedBlockId));
    setSelectedBlockId(null);
  };

  // Limpiar lienzo para empezar desde cero
  const handleClearAll = () => {
    setBlocks([]);
    setSelectedBlockId(null);
  };

  // Cargar preset morfológico
  const handleLoadMorphology = (preset: typeof MORPHOLOGY_PRESETS[0]) => {
    setBlocks(JSON.parse(JSON.stringify(preset.blocks)));
    setSelectedBlockId(null);
  };

  // Iniciar arrastre de bloque
  const handleBlockMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBlockId(id);
    setDraggingBlockId(id);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const targetBlock = blocks.find((b) => b.id === id);
    if (targetBlock) {
      setDragOffset({
        x: coords.x - targetBlock.x,
        z: coords.z - targetBlock.z,
      });
    }
  };

  // Iniciar redimensionamiento
  const handleResizeMouseDown = (id: string, handle: 'se' | 'e' | 's', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBlockId(id);
    setResizingBlockId(id);
    setResizeHandle(handle);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const targetBlock = blocks.find((b) => b.id === id);
    if (targetBlock) {
      setResizeStart({
        mouseX: coords.x,
        mouseZ: coords.z,
        initW: targetBlock.width,
        initL: targetBlock.length,
      });
    }
  };

  // Manejador de mouse move en SVG
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingBlockId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = Math.max(0, coords.x - dragOffset.x);
      const newZ = Math.max(0, coords.z - dragOffset.z);

      setBlocks(
        blocks.map((b) => (b.id === draggingBlockId ? { ...b, x: newX, z: newZ } : b))
      );
      return;
    }

    if (resizingBlockId && resizeHandle) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const deltaX = coords.x - resizeStart.mouseX;
      const deltaZ = coords.z - resizeStart.mouseZ;

      setBlocks(
        blocks.map((b) => {
          if (b.id !== resizingBlockId) return b;
          let newW = b.width;
          let newL = b.length;

          if (resizeHandle === 'se' || resizeHandle === 'e') {
            newW = Math.max(150, resizeStart.initW + deltaX);
          }
          if (resizeHandle === 'se' || resizeHandle === 's') {
            newL = Math.max(150, resizeStart.initL + deltaZ);
          }

          return { ...b, width: newW, length: newL };
        })
      );
    }
  };

  // Fin de arrastre o resize
  const handleSvgMouseUp = () => {
    setIsPanning(false);
    setDraggingBlockId(null);
    setResizingBlockId(null);
    setResizeHandle(null);
  };

  // Iniciar Pan al hacer clic en el fondo
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      setSelectedBlockId(null);
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  // Aplicar cambios a la vivienda 3D BIM
  const handleApplyTo3D = () => {
    if (blocks.length === 0) {
      store.applyFloorPlanLayout({
        width: 600,
        length: 800,
        wallHeight: wallHeightCm,
        blocks: [],
        wallThicknessMm,
        roofType,
        showPergola: false,
        pergolaWidth: 400,
        pergolaLength: 600,
        hasCentralPatio: false,
        centralPatioOffset: 0,
        centralPatioLength: 0,
      });
      onClose();
      return;
    }

    // Normalizar coordenadas X y Z para que comiencen en (0,0)
    const normalizedBlocks = blocks.map((b) => ({
      ...b,
      x: Math.max(0, b.x - boundingBox.minX),
      z: Math.max(0, b.z - boundingBox.minZ),
    }));

    // Detectar si hay patio o pérgola
    const patioBlock = normalizedBlocks.find((b) => b.category === 'patio' || !b.hasSlabCover);
    const terraceBlock = normalizedBlocks.find((b) => b.category === 'terrace' || b.category === 'quincho');

    store.applyFloorPlanLayout({
      width: Math.max(350, boundingBox.width),
      length: Math.max(600, boundingBox.length),
      wallHeight: wallHeightCm,
      blocks: normalizedBlocks,
      wallThicknessMm,
      roofType,
      showPergola: Boolean(terraceBlock),
      pergolaWidth: terraceBlock ? terraceBlock.width : 400,
      pergolaLength: terraceBlock ? terraceBlock.length : 600,
      hasCentralPatio: Boolean(patioBlock),
      centralPatioOffset: patioBlock ? patioBlock.z : 1100,
      centralPatioLength: patioBlock ? patioBlock.length : 300,
    });

    onClose();
  };

  if (!isOpen) return null;

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200 select-none font-sans">
      <div className="bg-[#0c121e] border border-slate-700/80 w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* 1. HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
              <LayoutGrid size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                  Diseñador de Planta 2D & Recintos
                </h2>
                <span className="text-xs text-orange-400 font-mono font-bold bg-orange-500/15 px-2.5 py-0.5 rounded border border-orange-500/30">
                  Hormigón Armado NCh430
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Arrastra recintos, diseña plantas en L / U y ajusta la técnica constructiva de hormigón antes de extruir a 3D.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-sm font-mono">
              <span className="text-slate-400">Dimensiones:</span>
              <span className="font-bold text-orange-400">{boundingBox.width} × {boundingBox.length} cm</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Sup. Construida:</span>
              <span className="font-bold text-emerald-400 text-base">{boundingBox.totalAreaM2} m²</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 2. BODY PRINCIPAL (3 Columnas: Paleta | Canvas 2D | Inspector) */}
        <div className="flex-1 flex overflow-hidden">
          {/* COLUMNA IZQUIERDA: Paleta de Recintos & Presets */}
          <div className="w-80 bg-slate-950/90 border-r border-slate-800/80 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
            {/* Presets Morfológicos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-400" />
                  Morfologías Rápidas
                </h3>
              </div>

              {/* Botón Empezar en Blanco */}
              <button
                onClick={handleClearAll}
                className="w-full mb-2 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/90 hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-slate-800 hover:border-red-500/40 text-sm font-semibold transition-all cursor-pointer"
                title="Vaciar lienzo para diseñar desde cero"
              >
                <Eraser size={16} className="text-red-400" />
                <span>Empezar en Blanco (Desde Cero)</span>
              </button>

              <div className="space-y-1.5">
                {MORPHOLOGY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadMorphology(preset)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/40 transition-all group cursor-pointer"
                  >
                    <div className="text-sm font-bold text-white group-hover:text-orange-400">
                      {preset.name}
                    </div>
                    <div className="text-xs text-slate-400">{preset.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-800"></div>

            {/* Catálogo de Recintos para Agregar */}
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Plus size={16} className="text-emerald-400" />
                Agregar Recintos (Drag / Clic)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {ROOM_CATALOG.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddRoom(cat)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all text-left group cursor-pointer"
                    >
                      <div
                        className="p-2.5 rounded-lg shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-200 group-hover:text-white truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {cat.width / 100}m × {cat.length / 100}m • {((cat.width * cat.length) / 10000).toFixed(1)} m²
                        </div>
                      </div>
                      <Plus size={16} className="text-slate-500 group-hover:text-emerald-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración Técnica de Hormigón */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} className="text-sky-400" />
                Técnica de Hormigón Global
              </h4>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Espesor Muros Estructurales</label>
                <select
                  value={wallThicknessMm}
                  onChange={(e) => setWallThicknessMm(Number(e.target.value) as WallThicknessMm)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none cursor-pointer"
                >
                  <option value={150}>150 mm (Malla Doble ICH)</option>
                  <option value={200}>200 mm (Muro Contención / Corte)</option>
                  <option value={100}>100 mm (Malla Central)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Sistema de Cubierta / Losa</label>
                <select
                  value={roofType}
                  onChange={(e) => setRoofType(e.target.value as RoofType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="losa_plana">Losa Plana Hormigón (e=12cm)</option>
                  <option value="dos_aguas_hormigon">Dos Aguas en Hormigón Visto</option>
                  <option value="cadena_coronacion_techo_liviano">Cadena Coronación + Techo Madera</option>
                </select>
              </div>
            </div>
          </div>

          {/* COLUMNA CENTRAL: Canvas Interactivo SVG 2D */}
          <div className="flex-1 bg-[#090d16] flex flex-col relative overflow-hidden">
            {/* Barra de herramientas flotante superior */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Disminuir Zoom"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Restablecer Vista"
              >
                <RotateCcw size={16} />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              {/* Selector de Snap Grid */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 px-1">
                <Ruler size={13} className="text-orange-400" />
                <span className="text-[10px] text-slate-400">Snap:</span>
                <select
                  value={snapGridCm}
                  onChange={(e) => setSnapGridCm(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-1 py-0.5 outline-none cursor-pointer"
                >
                  <option value={10}>10 cm</option>
                  <option value={25}>25 cm</option>
                  <option value={50}>50 cm</option>
                  <option value={100}>1.0 m</option>
                </select>
              </div>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              {/* Botón rápido para limpiar lienzo */}
              <button
                onClick={handleClearAll}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                title="Limpiar todo / Lienzo en blanco"
              >
                <Eraser size={14} className="text-red-400" />
                <span className="text-[10px] font-medium text-slate-300">Lienzo en Blanco</span>
              </button>
            </div>

            {/* Canvas SVG */}
            <div className="flex-1 w-full h-full flex items-center justify-center p-4">
              <svg
                ref={svgRef}
                viewBox="0 0 1200 1200"
                className="w-full h-full cursor-crosshair"
                onMouseDown={handleSvgMouseDown}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
              >
                <defs>
                  {/* Patrón de Rejilla de Fondo */}
                  <pattern id="grid-pattern-small" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                  <pattern id="grid-pattern-large" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="url(#grid-pattern-small)" />
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Fondo con grilla */}
                <rect width="1200" height="1200" fill="#080c14" />
                <rect width="1200" height="1200" fill="url(#grid-pattern-large)" opacity="0.6" />

                {/* Contenedor con Zoom y Pan */}
                <g transform={`translate(${600 + pan.x}, ${600 + pan.y}) scale(${zoom}) translate(-600, -600)`}>
                  {/* Origen de coordenadas y guías */}
                  <line x1="80" y1="100" x2="1100" y2="100" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="100" y1="80" x2="100" y2="1100" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Guía visual cuando el lienzo está en blanco */}
                  {blocks.length === 0 && (
                    <g pointerEvents="none">
                      <rect
                        x="200"
                        y="260"
                        width="800"
                        height="380"
                        rx="16"
                        fill="#0f172a80"
                        stroke="#334155"
                        strokeWidth="1.5"
                        strokeDasharray="6 6"
                      />
                      <text
                        x="600"
                        y="410"
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="20"
                        fontWeight="bold"
                      >
                        Lienzo en Blanco (Diseño desde Cero)
                      </text>
                      <text
                        x="600"
                        y="445"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="14"
                      >
                        Haz clic en los recintos de la columna izquierda para agregarlos al plano
                      </text>
                      <text
                        x="600"
                        y="475"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="12"
                      >
                        (Living, Cocina, Baños, Dormitorios, Quinchos o Morfologías Rápidas)
                      </text>
                    </g>
                  )}

                  {/* Renderizado de Bloques de Recintos */}
                  {blocks.map((block) => {
                    const isSelected = block.id === selectedBlockId;
                    const svgX = 100 + block.x * 0.5;
                    const svgY = 100 + block.z * 0.5;
                    const svgW = block.width * 0.5;
                    const svgH = block.length * 0.5;
                    const areaM2 = ((block.width * block.length) / 10000).toFixed(1);

                    return (
                      <g key={block.id} className="cursor-move">
                        {/* Rectángulo del Recinto */}
                        <rect
                          x={svgX}
                          y={svgY}
                          width={svgW}
                          height={svgH}
                          fill={block.hasSlabCover ? `${block.color || '#3b82f6'}20` : '#14b8a615'}
                          stroke={isSelected ? '#f97316' : block.color || '#64748b'}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={block.hasSlabCover ? 'none' : '6 4'}
                          rx={6}
                          onMouseDown={(e) => handleBlockMouseDown(block.id, e)}
                        />

                        {/* Muro perimetral dibujado con espesor visual */}
                        <rect
                          x={svgX}
                          y={svgY}
                          width={svgW}
                          height={svgH}
                          fill="none"
                          stroke={isSelected ? '#ea580c' : '#475569'}
                          strokeWidth={block.wallType === 'concrete_200' ? 6 : block.wallType === 'concrete_150' ? 4 : 2}
                          rx={6}
                          pointerEvents="none"
                        />

                        {/* Etiquetas de Nombre y Dimensiones con fondo de legibilidad */}
                        <g pointerEvents="none">
                          {/* Sombra / Fondo sutil para máximo contraste */}
                          <rect
                            x={svgX + 8}
                            y={svgY + svgH / 2 - 24}
                            width={Math.max(40, svgW - 16)}
                            height={48}
                            rx={8}
                            fill="#090d16"
                            fillOpacity={0.75}
                          />

                          <text
                            x={svgX + svgW / 2}
                            y={svgY + svgH / 2 - 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={Math.max(15, Math.min(22, svgW / 9))}
                            fontWeight="bold"
                            letterSpacing="0.3px"
                          >
                            {block.name}
                          </text>
                          <text
                            x={svgX + svgW / 2}
                            y={svgY + svgH / 2 + 16}
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize={Math.max(12, Math.min(16, svgW / 12))}
                            fontWeight="600"
                            fontFamily="monospace"
                          >
                            {block.width / 100}m × {block.length / 100}m ({areaM2} m²)
                          </text>
                        </g>

                        {/* Cotas en bordes del bloque seleccionado */}
                        {isSelected && (
                          <g pointerEvents="none">
                            {/* Cota Superior X (con fondo de alto contraste) */}
                            <g transform={`translate(${svgX + svgW / 2}, ${svgY - 14})`}>
                              <rect
                                x={-45}
                                y={-12}
                                width={90}
                                height={22}
                                rx={5}
                                fill="#0f172a"
                                stroke="#f97316"
                                strokeWidth={1.5}
                              />
                              <text
                                x={0}
                                y={3}
                                textAnchor="middle"
                                fill="#fb923c"
                                fontSize={13}
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {block.width} cm
                              </text>
                            </g>

                            {/* Cota Lateral Z (con fondo de alto contraste) */}
                            <g transform={`translate(${svgX + svgW + 18}, ${svgY + svgH / 2}) rotate(90)`}>
                              <rect
                                x={-45}
                                y={-12}
                                width={90}
                                height={22}
                                rx={5}
                                fill="#0f172a"
                                stroke="#f97316"
                                strokeWidth={1.5}
                              />
                              <text
                                x={0}
                                y={3}
                                textAnchor="middle"
                                fill="#fb923c"
                                fontSize={13}
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {block.length} cm
                              </text>
                            </g>
                          </g>
                        )}

                        {isSelected && (
                          <>
                            {/* Tirador SE para redimensionar */}
                            <circle
                              cx={svgX + svgW}
                              cy={svgY + svgH}
                              r={9}
                              fill="#f97316"
                              stroke="#ffffff"
                              strokeWidth={2.5}
                              className="cursor-nwse-resize"
                              onMouseDown={(e) => handleResizeMouseDown(block.id, 'se', e)}
                            />
                            {/* Tirador E (Ancho) */}
                            <circle
                              cx={svgX + svgW}
                              cy={svgY + svgH / 2}
                              r={8}
                              fill="#f97316"
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="cursor-ew-resize"
                              onMouseDown={(e) => handleResizeMouseDown(block.id, 'e', e)}
                            />
                            {/* Tirador S (Largo) */}
                            <circle
                              cx={svgX + svgW / 2}
                              cy={svgY + svgH}
                              r={8}
                              fill="#f97316"
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="cursor-ns-resize"
                              onMouseDown={(e) => handleResizeMouseDown(block.id, 's', e)}
                            />
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Bounding Box Global con Cotas Generales */}
                  {blocks.length > 0 && (
                    <g pointerEvents="none">
                      {/* Rectángulo envolvente punteado */}
                      <rect
                        x={100 + boundingBox.minX * 0.5 - 10}
                        y={100 + boundingBox.minZ * 0.5 - 10}
                        width={boundingBox.width * 0.5 + 20}
                        height={boundingBox.length * 0.5 + 20}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="6 6"
                        opacity={0.6}
                      />
                    </g>
                  )}
                </g>
              </svg>
            </div>
          </div>

          {/* COLUMNA DERECHA: Inspector de Recinto Seleccionado */}
          <div className="w-80 bg-slate-950/90 border-l border-slate-800/80 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
            {selectedBlock ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Move size={16} className="text-orange-400" />
                    Propiedades del Recinto
                  </h3>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                    title="Eliminar Recinto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Nombre */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Nombre del Recinto</label>
                  <input
                    type="text"
                    value={selectedBlock.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, name: val } : b)));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Dimensiones (Ancho x Largo en cm) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Ancho X (cm)</label>
                    <input
                      type="number"
                      min={100}
                      max={2000}
                      step={snapGridCm}
                      value={selectedBlock.width}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, width: val } : b)));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Largo Z (cm)</label>
                    <input
                      type="number"
                      min={100}
                      max={3000}
                      step={snapGridCm}
                      value={selectedBlock.length}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, length: val } : b)));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Posición (X, Z en cm) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Posición X (cm)</label>
                    <input
                      type="number"
                      min={0}
                      max={3000}
                      step={snapGridCm}
                      value={selectedBlock.x}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, x: val } : b)));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Posición Z (cm)</label>
                    <input
                      type="number"
                      min={0}
                      max={3000}
                      step={snapGridCm}
                      value={selectedBlock.z}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, z: val } : b)));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Tipo de Muro */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Material de Muros</label>
                  <select
                    value={selectedBlock.wallType}
                    onChange={(e) => {
                      const val = e.target.value as RoomBlock['wallType'];
                      setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, wallType: val } : b)));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="concrete_150">Hormigón Armado (e = 15 cm)</option>
                    <option value="concrete_200">Hormigón Armado (e = 20 cm)</option>
                    <option value="masonry_140">Albañilería Confinada (e = 14 cm)</option>
                    <option value="drywall_90">Tabiquería Metalcon (e = 9 cm)</option>
                  </select>
                </div>

                {/* Cubierta de Losa / Patio */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBlock.hasSlabCover}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, hasSlabCover: val } : b)));
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-sm font-semibold text-slate-200">Losa de Hormigón Superior</span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1 pl-6.5">
                    Desmarca para atrios, patios de luz o terrazas apergoladas descubiertas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Info size={32} className="mb-2 opacity-50 text-slate-400" />
                <p className="text-sm font-bold text-slate-300">Ningún recinto seleccionado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Haz clic sobre cualquier recinto en el lienzo para ajustar sus dimensiones, material de muro o posición.
                </p>
              </div>
            )}

            {/* Resumen de Recintos */}
            <div className="mt-auto bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Total Recintos:</span>
                <span className="font-bold text-white text-base">{blocks.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Área Construida:</span>
                <span className="font-bold text-emerald-400 text-base">{boundingBox.totalAreaM2} m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FOOTER */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-sm text-slate-300 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Muros listos para extrusión BIM 3D con armaduras NCh430 / ICH</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyTo3D}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <Check size={18} />
              Aplicar y Generar Modelo 3D BIM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
