import React, { useState, useEffect } from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import {
  RoomConfig,
  RoomShapeType,
  RoomVertex,
  getPresetRoomVertices,
  centerVertices,
  analyzeRoomWalls,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  distanceBetween,
  adjustWallLengthOrthogonal,
  orthogonalizePolygon,
} from '../../utils/roomGeometry';
import { RoomPlannerCanvas } from './RoomPlannerCanvas';
import {
  Square,
  PenTool,
  CornerDownRight,
  ShieldAlert,
  ArrowRight,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Maximize2,
  Layers,
  ArrowLeft,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

interface WallLengthInputProps {
  initialLength: number;
  onCommit: (newVal: number) => void;
}

function WallLengthInput({ initialLength, onCommit }: WallLengthInputProps) {
  const [val, setVal] = useState<string>(String(Math.round(initialLength)));

  useEffect(() => {
    setVal(String(Math.round(initialLength)));
  }, [initialLength]);

  const handleBlurOrEnter = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 30 && num <= 3500) {
      onCommit(num);
    } else {
      setVal(String(Math.round(initialLength)));
    }
  };

  return (
    <input
      type="number"
      value={val}
      min={30}
      max={3500}
      step={5}
      onChange={(e) => {
        setVal(e.target.value);
        const num = parseFloat(e.target.value);
        if (!isNaN(num) && num >= 50 && num <= 3500) {
          onCommit(num);
        }
      }}
      onBlur={handleBlurOrEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleBlurOrEnter();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-right font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-inner"
    />
  );
}

interface ShapeCardOption {
  type: RoomShapeType;
  title: string;
  badge?: string;
  description: string;
  renderIcon: () => React.ReactNode;
}

export function RoomPlannerModal() {
  const { isRoomPlannerOpen, setRoomPlannerOpen, roomConfig, setRoomConfig } = useKitchenStore();

  const [step, setStep] = useState<'select_type' | 'edit_dimensions'>('select_type');
  const [selectedShape, setSelectedShape] = useState<RoomShapeType>(roomConfig.type || 'rectangular');
  const [vertices, setVertices] = useState<RoomVertex[]>(roomConfig.vertices);
  const [wallHeight, setWallHeight] = useState<number>(roomConfig.wallHeight || 250);
  const [wallThickness, setWallThickness] = useState<number>(roomConfig.wallThickness || 20);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [isFreehandDrawing, setIsFreehandDrawing] = useState(false);

  // Sincronizar estado al abrir
  useEffect(() => {
    if (isRoomPlannerOpen) {
      setVertices(roomConfig.vertices);
      setWallHeight(roomConfig.wallHeight);
      setWallThickness(roomConfig.wallThickness);
      setSelectedShape(roomConfig.type);
    }
  }, [isRoomPlannerOpen, roomConfig]);

  if (!isRoomPlannerOpen) return null;

  // Selección de plantilla
  const handleSelectShape = (type: RoomShapeType) => {
    setSelectedShape(type);
    if (type === 'freeform') {
      setVertices([]);
      setIsFreehandDrawing(true);
    } else {
      const newVerts = getPresetRoomVertices(type);
      setVertices(newVerts);
      setIsFreehandDrawing(false);
    }
    setStep('edit_dimensions');
  };

  // Deshacer el último vértice en modo dibujo libre
  const handleUndoLastVertex = () => {
    if (vertices.length === 0) return;
    const updated = vertices.slice(0, -1);
    setVertices(updated);
    if (updated.length === 0) {
      setSelectedVertexIndex(null);
    } else {
      setSelectedVertexIndex(updated.length - 1);
    }
  };

  // Limpiar todo el dibujo libre
  const handleClearFreehand = () => {
    setVertices([]);
    setSelectedVertexIndex(null);
    setIsFreehandDrawing(true);
  };

  // Finalizar y cerrar planta en modo dibujo libre
  const handleFinishFreehand = () => {
    if (vertices.length < 3) return;
    setIsFreehandDrawing(false);
    setVertices(centerVertices(vertices));
  };

  // Modificar longitud de una pared numéricamente manteniendo ortogonalidad estricta (90°)
  const handleWallLengthChange = (segmentIndex: number, newLength: number) => {
    if (newLength < 30 || isNaN(newLength)) return;
    const updated = adjustWallLengthOrthogonal(vertices, segmentIndex, newLength, 5);
    setVertices(updated);
  };

  // Restaurar escuadras y ortogonalidad estricta a 90°
  const handleRestoreSquares = () => {
    setVertices(orthogonalizePolygon(vertices, 5));
  };

  // Modificar ángulo en una esquina
  const handleAnglePreset = (segmentIndex: number, targetDeg: number) => {
    const n = vertices.length;
    if (n < 3) return;
    const current = vertices[(segmentIndex + 1) % n];
    const prev = vertices[segmentIndex];
    const next = vertices[(segmentIndex + 2) % n];

    const rad = (targetDeg * Math.PI) / 180;
    const lenNext = distanceBetween(current, next);

    // Dirección previa
    const prevAngle = Math.atan2(prev.y - current.y, prev.x - current.x);
    const newNextAngle = prevAngle + rad;

    const newNextX = current.x + Math.cos(newNextAngle) * lenNext;
    const newNextY = current.y + Math.sin(newNextAngle) * lenNext;

    const nextIndex = (segmentIndex + 2) % n;
    const updated = vertices.map((v, i) => {
      if (i === nextIndex) {
        return { ...v, x: Math.round(newNextX * 10) / 10, y: Math.round(newNextY * 10) / 10 };
      }
      return v;
    });

    setVertices(updated);
  };

  // Añadir un nuevo vértice en el punto medio de la pared seleccionada
  const handleAddVertex = () => {
    const index = selectedVertexIndex !== null ? selectedVertexIndex : 0;
    const n = vertices.length;
    const p1 = vertices[index];
    const p2 = vertices[(index + 1) % n];

    const midVertex: RoomVertex = {
      id: `v_${Date.now()}`,
      x: Math.round((p1.x + p2.x) / 2),
      y: Math.round((p1.y + p2.y) / 2),
    };

    const newVertices = [...vertices];
    newVertices.splice(index + 1, 0, midVertex);
    setVertices(newVertices);
    setSelectedVertexIndex(index + 1);
  };

  // Eliminar vértice seleccionado
  const handleDeleteVertex = () => {
    if (vertices.length <= 3 || selectedVertexIndex === null) return;
    const updated = vertices.filter((_, i) => i !== selectedVertexIndex);
    setVertices(updated);
    setSelectedVertexIndex(null);
  };

  // Centrar y normalizar polígono
  const handleCenter = () => {
    setVertices(centerVertices(vertices));
  };

  // Confirmar y aplicar a la escena 3D/2D
  const handleApply = () => {
    const finalConfig: RoomConfig = {
      type: selectedShape,
      wallHeight,
      wallThickness,
      vertices: centerVertices(vertices),
    };
    setRoomConfig(finalConfig);
    setRoomPlannerOpen(false);
  };

  const wallSegments = analyzeRoomWalls(vertices);
  const areaM2 = calculatePolygonArea(vertices);
  const perimeterM = calculatePolygonPerimeter(vertices);

  // Opciones de plantilla (Imagen 2)
  const shapeOptions: ShapeCardOption[] = [
    {
      type: 'rectangular',
      title: 'Rectangular',
      description: 'Habitación estándar con 4 paredes ortogonales (A, B, C, D)',
      renderIcon: () => (
        <div className="w-28 h-28 border-4 border-slate-700 rounded-sm flex items-center justify-center bg-white/40 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 font-bold">90°</span>
        </div>
      ),
    },
    {
      type: 'freeform',
      title: 'Diseño libre',
      description: 'Dibuja libremente segmento a segmento o ajusta vértices poligonales',
      renderIcon: () => (
        <div className="w-28 h-28 relative flex items-center justify-center bg-white/40 rounded-sm border-2 border-dashed border-slate-400">
          <div className="absolute top-2 left-2 w-14 h-14 border-t-4 border-l-4 border-slate-700"></div>
          <PenTool size={36} className="text-orange-500 transform -rotate-45" />
        </div>
      ),
    },
    {
      type: 'l_shape',
      title: 'Forma en L',
      badge: '90°/270°',
      description: 'Cocina en esquina con 6 paredes parametrizadas',
      renderIcon: () => (
        <div className="w-28 h-28 relative flex items-center justify-center bg-white/40 rounded-sm">
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-slate-700 fill-slate-200/50" strokeWidth="6" strokeLinejoin="round">
            <polygon points="15,15 50,15 50,50 85,50 85,85 15,85" />
          </svg>
        </div>
      ),
    },
    {
      type: 'five_corners',
      title: '5 esquinas',
      badge: '135°',
      description: 'Habitación poligonal con chaflán diagonal / esquina ochava',
      renderIcon: () => (
        <div className="w-28 h-28 relative flex items-center justify-center bg-white/40 rounded-sm">
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-slate-700 fill-slate-200/50" strokeWidth="6" strokeLinejoin="round">
            <polygon points="15,15 60,15 85,40 85,85 15,85" />
          </svg>
        </div>
      ),
    },
    {
      type: 'u_shape',
      title: 'Forma en U',
      badge: '3 Paredes',
      description: 'Distribución envolvente con 3 alas de mobiliario',
      renderIcon: () => (
        <div className="w-28 h-28 relative flex items-center justify-center bg-white/40 rounded-sm">
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-slate-700 fill-slate-200/50" strokeWidth="6" strokeLinejoin="round">
            <polygon points="15,15 85,15 85,85 60,85 60,45 40,45 40,85 15,85" />
          </svg>
        </div>
      ),
    },
    {
      type: 'linear',
      title: 'Cocina abierta',
      description: 'Distribución abierta tipo loft / americana con isla frontal',
      renderIcon: () => (
        <div className="w-28 h-28 relative flex items-center justify-center bg-white/40 rounded-sm">
          <div className="w-20 h-16 border-t-4 border-r-4 border-slate-700"></div>
          <div className="absolute bottom-3 left-4 w-12 h-3 bg-orange-500/80 rounded-sm"></div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-8 animate-fadeIn">
      <div className="w-full max-w-7xl h-[96dvh] sm:h-[90vh] bg-[#FFFFFF] text-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* ========================================================================= */}
        {/* CABECERA TÉCNICA (Estilo Imagen 1 - Franja Amarilla / Acento Profesional) */}
        {/* ========================================================================= */}
        <header className="bg-[#FACC15] text-black px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {step === 'edit_dimensions' && (
              <button
                onClick={() => setStep('select_type')}
                className="p-1 hover:bg-black/10 rounded-md transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider cursor-pointer"
                title="Volver a seleccionar tipo de área"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Tipos</span>
              </button>
            )}
            <div className="h-5 w-px bg-black/20 mx-1"></div>
            <h1 className="text-sm sm:text-lg md:text-xl font-extrabold tracking-tight uppercase flex items-center gap-1.5 sm:gap-2">
              <span>Área de cocina</span>
              <span className="text-[10px] sm:text-xs bg-black text-white px-1.5 sm:px-2 py-0.5 rounded font-mono font-normal">
                {step === 'select_type' ? 'Paso 1' : 'Paso 2'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {step === 'edit_dimensions' && (
              <button
                onClick={handleApply}
                className="px-5 py-2 bg-black hover:bg-zinc-800 text-[#FACC15] font-extrabold text-sm uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                title="Aplicar área y generar muros 3D en la cocina"
              >
                <span>Aplicar a Cocina</span>
                <ArrowRight size={18} />
              </button>
            )}
            <button
              onClick={() => setRoomPlannerOpen(false)}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors text-black"
              title="Cerrar sin guardar"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* PASO 1: SELECTOR DE TIPO DE ESTANCIA / ÁREA (Estilo Imagen 2)             */}
        {/* ========================================================================= */}
        {step === 'select_type' ? (
          <div className="flex-1 p-8 bg-[#F4F4F5] overflow-y-auto custom-scrollbar flex flex-col justify-center">
            <div className="max-w-5xl mx-auto w-full">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  Selecciona la Geometría del Espacio de Cocina
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Elige una plantilla base o parte de un diseño libre para definir muros, cotas milimétricas y ángulos exactos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shapeOptions.map((opt) => {
                  const isSelected = selectedShape === opt.type;
                  return (
                    <div
                      key={opt.type}
                      onClick={() => handleSelectShape(opt.type)}
                      className={`group relative bg-[#E4E4E7] hover:bg-[#D4D4D8] border-2 transition-all duration-200 rounded-xl p-6 cursor-pointer flex flex-col items-center justify-between shadow-sm hover:shadow-md ${
                        isSelected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-transparent hover:border-slate-400'
                      }`}
                    >
                      {/* Badge angular en amarillo como en imagen de referencia */}
                      {opt.badge && (
                        <div className="absolute top-3 right-3 bg-[#FACC15] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <CornerDownRight size={10} />
                          <span>{opt.badge}</span>
                        </div>
                      )}

                      <div className="py-6 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                        {opt.renderIcon()}
                      </div>

                      <div className="w-full text-center mt-2 border-t border-slate-300 pt-3">
                        <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wide">
                          {opt.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setStep('edit_dimensions')}
                  className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continuar con Geometría Actual ({roomConfig.type})</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PASO 2: EDITOR TÉCNICO INTERACTIVO (Estilo Imagen 1 - Form + 2D Canvas)    */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F4F4F5]">
            
            {/* PANEL LATERAL: Inputs Paramétricos (Pared cm | Ángulo °) */}
            <aside className="w-full md:w-80 lg:w-96 order-2 md:order-1 max-h-[42vh] md:max-h-none bg-[#E4E4E7] border-t md:border-t-0 md:border-r border-slate-300 p-4 sm:p-6 flex flex-col overflow-y-auto custom-scrollbar shrink-0 shadow-inner">
              
              {/* Encabezado de Columnas */}
              <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-300 mb-3 text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                <div className="col-span-3">Pared</div>
                <div className="col-span-5 text-right">Longitud (cm)</div>
                <div className="col-span-4 text-right">Ángulo (°)</div>
              </div>

              {/* Lista de Filas de Paredes A, B, C, D... */}
              <div className="flex flex-col gap-2 mb-6">
                {wallSegments.map((seg) => {
                  const isSelected = selectedVertexIndex === seg.index;
                  return (
                    <div
                      key={seg.label}
                      onClick={() => setSelectedVertexIndex(seg.index)}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-white border-2 border-orange-500 shadow-sm'
                          : 'bg-[#F4F4F5] border border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {/* Letra de la pared */}
                      <div className="col-span-3 font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-mono font-bold">
                          {seg.label}
                        </span>
                      </div>

                      {/* Input de Longitud (cm) */}
                      <div className="col-span-5">
                        <div className="relative">
                          <WallLengthInput
                            initialLength={seg.length}
                            onCommit={(val) => handleWallLengthChange(seg.index, val)}
                          />
                        </div>
                      </div>

                      {/* Input / Selector de Ángulo (°) */}
                      <div className="col-span-4 flex items-center justify-end gap-1">
                        <select
                          value={seg.angleWithNext}
                          onChange={(e) => handleAnglePreset(seg.index, Number(e.target.value))}
                          className="bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono font-bold text-xs text-slate-800 focus:outline-none focus:border-orange-500 shadow-inner cursor-pointer"
                        >
                          <option value={90}>90°</option>
                          <option value={135}>135°</option>
                          <option value={45}>45°</option>
                          <option value={270}>270°</option>
                          {seg.angleWithNext !== 90 && seg.angleWithNext !== 135 && seg.angleWithNext !== 45 && seg.angleWithNext !== 270 && (
                            <option value={seg.angleWithNext}>{seg.angleWithNext}°</option>
                          )}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Parámetros Globales del Área de Cocina */}
              <div className="pt-4 border-t border-slate-300 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 block mb-1">
                      Altura pared (cm)
                    </label>
                    <input
                      type="number"
                      value={wallHeight}
                      min={180}
                      max={400}
                      step={5}
                      onChange={(e) => setWallHeight(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 block mb-1">
                      Grosor pared (cm)
                    </label>
                    <input
                      type="number"
                      value={wallThickness}
                      min={10}
                      max={50}
                      step={2}
                      onChange={(e) => setWallThickness(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-inner"
                    />
                  </div>
                </div>

                {/* Resumen de Métricas */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Superficie Útil</div>
                    <div className="text-xl font-black text-blue-600 font-mono">{areaM2.toFixed(2)} m²</div>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Perímetro</div>
                    <div className="text-sm font-bold text-slate-700 font-mono">{perimeterM.toFixed(2)} m</div>
                  </div>
                </div>

                {/* Herramientas de Modificación de Polígono */}
                {selectedShape === 'freeform' && isFreehandDrawing ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-300">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Controles de Dibujo Libre</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleUndoLastVertex}
                        disabled={vertices.length === 0}
                        className="py-2 px-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Deshacer la ubicación del último punto trazado"
                      >
                        <RotateCcw size={14} className="text-amber-600" />
                        <span>Deshacer Punto</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFreehand}
                        disabled={vertices.length === 0}
                        className="py-2 px-2.5 bg-white hover:bg-red-50 disabled:opacity-40 border border-slate-300 rounded text-xs font-bold text-red-600 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Borrar todos los puntos trazados y comenzar de nuevo"
                      >
                        <Trash2 size={14} />
                        <span>Reiniciar</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinishFreehand}
                      disabled={vertices.length < 3}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow transition-colors flex items-center justify-center gap-2 mt-1"
                      title="Cierra el perímetro trazado y permite ajustar la longitud exacta de cada muro"
                    >
                      <Check size={16} />
                      <span>Finalizar y Cerrar Planta ({vertices.length} Muros)</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Edición Poligonal</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleAddVertex}
                        className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Plus size={14} className="text-emerald-600" />
                        <span>Añadir Vértice</span>
                      </button>
                      <button
                        onClick={handleDeleteVertex}
                        disabled={vertices.length <= 3 || selectedVertexIndex === null}
                        className="py-2 px-2.5 bg-white hover:bg-red-50 disabled:opacity-40 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleRestoreSquares}
                        className="py-2 px-2.5 bg-white hover:bg-amber-50 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Endereza y alinea todas las paredes a 90°"
                      >
                        <LayoutGrid size={14} className="text-blue-600" />
                        <span>Escuadras 90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCenter}
                        className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <RotateCcw size={14} />
                        <span>Centrar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* CANVAS INTERACTIVO 2D CENTRAL (Cotas Azules, Muros, Nodos Verdes y Área Central) */}
            <main className="flex-1 order-1 md:order-2 min-h-[220px] md:min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <RoomPlannerCanvas
                vertices={vertices}
                wallThickness={wallThickness}
                wallHeight={wallHeight}
                isFreehandMode={isFreehandDrawing}
                onVerticesChange={(newVerts) => setVertices(newVerts)}
                selectedVertexIndex={selectedVertexIndex}
                onSelectVertexIndex={(idx) => setSelectedVertexIndex(idx)}
                onFinishFreehand={handleFinishFreehand}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
