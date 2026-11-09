import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Copy,
  Trash2,
  Sliders,
  Ruler,
  Grid as GridIcon,
  Eye,
  Check,
  X,
  Plus,
  Lock,
  Unlock,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { useOfficeStore, MELAMINE_FINISHES, SCREEN_FABRICS } from '../../store/officeStore';

export function OfficeFloorPlanner2D() {
  const floorPlan = useOfficeStore((state) => state.floorPlan);
  const placedItems = useOfficeStore((state) => state.placedItems);
  const selectedItemId = useOfficeStore((state) => state.selectedItemId);
  const selectItem = useOfficeStore((state) => state.selectItem);
  const updateItemPosition = useOfficeStore((state) => state.updateItemPosition);
  const moveItemDelta = useOfficeStore((state) => state.moveItemDelta);
  const toggleItemLock = useOfficeStore((state) => state.toggleItemLock);
  const rotateItem = useOfficeStore((state) => state.rotateItem);
  const duplicateItem = useOfficeStore((state) => state.duplicateItem);
  const removeItem = useOfficeStore((state) => state.removeItem);
  const toggleItemReturnSide = useOfficeStore((state) => state.toggleItemReturnSide);

  const calibration = useOfficeStore((state) => state.calibration);
  const setCalibrationPoint1 = useOfficeStore((state) => state.setCalibrationPoint1);
  const setCalibrationPoint2 = useOfficeStore((state) => state.setCalibrationPoint2);
  const applyCalibration = useOfficeStore((state) => state.applyCalibration);
  const cancelCalibration = useOfficeStore((state) => state.cancelCalibration);
  const startCalibration = useOfficeStore((state) => state.startCalibration);

  const showGrid = useOfficeStore((state) => state.showGrid);
  const setShowGrid = useOfficeStore((state) => state.setShowGrid);
  const showDimensions2D = useOfficeStore((state) => state.showDimensions2D);
  const setShowDimensions2D = useOfficeStore((state) => state.setShowDimensions2D);
  const showClearanceZones = useOfficeStore((state) => state.showClearanceZones);
  const setShowClearanceZones = useOfficeStore((state) => state.setShowClearanceZones);
  const setFloorPlanOpacity = useOfficeStore((state) => state.setFloorPlanOpacity);

  const [calibDistanceInput, setCalibDistanceInput] = useState<string>('2.4');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; z: number } | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [snapStep, setSnapStep] = useState<number>(0.05); // 5cm por defecto para gran precisión

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Escala en píxeles por metro en la vista 2D
  const pxPerMeter = (floorPlan.scalePxPerMeter || 60) * zoom;

  // Auto-cargar medida preliminar estimada al llegar al paso de ingresar distancia
  useEffect(() => {
    if (calibration.step === 'input-distance' && calibration.point1 && calibration.point2) {
      const dx = calibration.point2.x - calibration.point1.x;
      const dy = calibration.point2.y - calibration.point1.y;
      const measured = Math.hypot(dx, dy);
      if (measured > 0.05) {
        setCalibDistanceInput(measured.toFixed(2).replace('.', ','));
      }
    }
  }, [calibration.step, calibration.point1, calibration.point2]);

  // Aplicar calibración con soporte de coma y punto decimal
  const handleApplyCalibration = () => {
    const cleanStr = calibDistanceInput.trim().replace(',', '.');
    let val = parseFloat(cleanStr);
    if (isNaN(val) || val <= 0) return;
    
    // Si el usuario ingresó la medida en centímetros (ej: 240 para 2.40m o 150 para 1.50m)
    if (val > 30) {
      val = val / 100;
    }
    applyCalibration(val);
  };

  // Centro de pantalla a coordenadas del mundo (metros)
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; z: number } => {
      if (!containerRef.current) return { x: 0, z: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left - rect.width / 2 - pan.x;
      const screenY = clientY - rect.top - rect.height / 2 - pan.y;
      return {
        x: screenX / pxPerMeter,
        z: screenY / pxPerMeter,
      };
    },
    [pan, pxPerMeter]
  );

  // Coordenadas del mundo (metros) a pantalla (píxeles)
  const worldToScreen = useCallback(
    (worldX: number, worldZ: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: rect.width / 2 + pan.x + worldX * pxPerMeter,
        y: rect.height / 2 + pan.y + worldZ * pxPerMeter,
      };
    },
    [pan, pxPerMeter]
  );

  // Manejo de eventos de mouse para Pan & Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.max(0.15, Math.min(5, prev * zoomFactor)));
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (calibration.isCalibrating) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      if (calibration.step === 'point1') {
        setCalibrationPoint1({ x: worldPos.x, y: worldPos.z });
      } else if (calibration.step === 'point2') {
        setCalibrationPoint2({ x: worldPos.x, y: worldPos.z });
      }
      return;
    }

    // Panning con clic central, altKey o clic en fondo
    if (e.button === 1 || e.altKey || (!draggedItemId && e.target === containerRef.current)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      if (e.target === containerRef.current && e.button === 0) {
        selectItem(null);
      }
    }
  };

  // Global listeners para arrastre suave y seguro
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }

      if (draggedItemId && isDraggingRef.current) {
        const item = placedItems.find((i) => i.id === draggedItemId);
        if (item && item.isLocked) return;

        const worldPos = screenToWorld(e.clientX, e.clientY);
        const rawX = worldPos.x - dragStartOffset.x;
        const rawZ = worldPos.z - dragStartOffset.z;

        // Snapping paramétrico
        const snappedX = snapStep > 0 ? Math.round(rawX / snapStep) * snapStep : rawX;
        const snappedZ = snapStep > 0 ? Math.round(rawZ / snapStep) * snapStep : rawZ;

        const cleanX = Math.round(snappedX * 100) / 100;
        const cleanZ = Math.round(snappedZ * 100) / 100;

        setDragCurrentPos({ x: cleanX, z: cleanZ });
        updateItemPosition(draggedItemId, [cleanX, 0, cleanZ]);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (draggedItemId) {
        isDraggingRef.current = false;
        setDraggedItemId(null);
        setDragCurrentPos(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isPanning, draggedItemId, placedItems, dragStartOffset, snapStep, screenToWorld, updateItemPosition]);

  // Atajos de teclado (R: rotar, D: duplicar, L: bloquear/fijar, Supr: eliminar, Flechas: micro-desplazamiento)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItemId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = e.shiftKey ? 0.5 : 0.05;

      if (e.key.toLowerCase() === 'r') {
        rotateItem(selectedItemId, Math.PI / 4);
      } else if (e.key.toLowerCase() === 'd') {
        duplicateItem(selectedItemId);
      } else if (e.key.toLowerCase() === 'l') {
        toggleItemLock(selectedItemId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeItem(selectedItemId);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveItemDelta(selectedItemId, 0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveItemDelta(selectedItemId, 0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveItemDelta(selectedItemId, -step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveItemDelta(selectedItemId, step, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, rotateItem, duplicateItem, toggleItemLock, removeItem, moveItemDelta]);

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      className={`w-full h-full relative overflow-hidden bg-[#F8FAFC] select-none ${
        isPanning ? 'cursor-grabbing' : draggedItemId ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Barra flotante de herramientas de navegación y visualización 2D */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 p-1.5 rounded-xl shadow-xl text-white">
        <button
          onClick={() => setZoom((z) => Math.min(4, z * 1.25))}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Acercar (Zoom In)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z / 1.25))}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Centrar Vista"
        >
          <Maximize2 size={16} />
        </button>

        <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showGrid ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-zinc-800'
          }`}
          title="Mostrar/Ocultar Grilla Métrica"
        >
          <GridIcon size={16} />
        </button>

        <button
          onClick={() => setShowDimensions2D(!showDimensions2D)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showDimensions2D ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-zinc-800'
          }`}
          title="Mostrar Cotas de Muebles"
        >
          <Ruler size={16} />
        </button>

        <button
          onClick={() => setShowClearanceZones(!showClearanceZones)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showClearanceZones ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-zinc-800'
          }`}
          title="Mostrar Zonas de Circulación y Ergonomía"
        >
          <Eye size={16} />
        </button>

        <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

        {/* Selector de Snapping */}
        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-[11px]">
          <Crosshair size={12} className="text-orange-400" />
          <span className="text-slate-400 text-[10px]">Ajuste:</span>
          <select
            value={snapStep}
            onChange={(e) => setSnapStep(parseFloat(e.target.value))}
            className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value={0.01} className="bg-zinc-900 text-white">1 cm (Libre)</option>
            <option value={0.05} className="bg-zinc-900 text-white">5 cm (Preciso)</option>
            <option value={0.10} className="bg-zinc-900 text-white">10 cm (Estándar)</option>
            <option value={0.25} className="bg-zinc-900 text-white">25 cm</option>
            <option value={0.50} className="bg-zinc-900 text-white">50 cm</option>
          </select>
        </div>

        <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

        <button
          onClick={startCalibration}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            floorPlan.isCalibrated
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
          }`}
          title="Calibrar Escala Métrica con Cota de Referencia"
        >
          <Ruler size={14} />
          <span>{floorPlan.isCalibrated ? 'Escala Calibrada ✓' : 'Calibrar Escala'}</span>
        </button>
      </div>

      {/* Control de opacidad del plano de fondo si está cargado */}
      {floorPlan.fileUrl && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 px-3 py-1.5 rounded-xl shadow-xl text-xs text-slate-300">
          <Sliders size={14} className="text-orange-400" />
          <span>Opacidad Plano:</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={floorPlan.opacity}
            onChange={(e) => setFloorPlanOpacity(parseFloat(e.target.value))}
            className="w-20 accent-orange-500 cursor-pointer"
          />
          <span className="font-mono text-[10px] w-7">{Math.round(floorPlan.opacity * 100)}%</span>
        </div>
      )}

      {/* Banner de Modo Calibración Activo */}
      {calibration.isCalibrating && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-zinc-950 font-bold px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-amber-300 animate-in fade-in duration-200">
          <Ruler size={20} className="shrink-0 text-zinc-950" />
          <div className="text-xs">
            {calibration.step === 'point1' && 'Paso 1: Haz clic en el primer extremo de una cota conocida del plano.'}
            {calibration.step === 'point2' && 'Paso 2: Haz clic en el segundo extremo de la cota.'}
            {calibration.step === 'input-distance' && 'Paso 3: Ingresa la medida real en metros (ej. 2.4 o 2,4):'}
          </div>
          {calibration.step === 'input-distance' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyCalibration();
              }}
              className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-inner"
            >
              <input
                type="text"
                autoFocus
                placeholder="2.4"
                value={calibDistanceInput}
                onChange={(e) => setCalibDistanceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCalibration();
                  }
                }}
                className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white text-zinc-900 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
              />
              <span className="text-xs font-bold text-zinc-700 pr-1">m</span>
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-colors text-xs font-bold"
                title="Aplicar calibración de escala"
              >
                <Check size={14} />
                <span>Aplicar</span>
              </button>
            </form>
          )}
          <button
            onClick={cancelCalibration}
            className="p-1 hover:bg-black/10 rounded-lg text-zinc-900 ml-1 cursor-pointer"
            title="Cancelar calibración"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SVG Canvas de Dibujo 2D */}
      <svg
        className="w-full h-full absolute inset-0"
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => {
          // Si el clic es directo en el SVG o fondo, deseleccionar
          if (e.target === e.currentTarget) {
            selectItem(null);
          }
        }}
      >
        <g transform={`translate(${containerRef.current ? containerRef.current.clientWidth / 2 + pan.x : 0}, ${containerRef.current ? containerRef.current.clientHeight / 2 + pan.y : 0})`}>
          {/* Plano de arquitectura rasterizado de fondo */}
          {floorPlan.fileUrl && (
            <image
              href={floorPlan.fileUrl}
              x={(-floorPlan.realWidthMeters / 2 + floorPlan.offsetX) * pxPerMeter}
              y={(-floorPlan.realHeightMeters / 2 + floorPlan.offsetY) * pxPerMeter}
              width={floorPlan.realWidthMeters * pxPerMeter}
              height={floorPlan.realHeightMeters * pxPerMeter}
              opacity={floorPlan.opacity}
              preserveAspectRatio="none"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Grilla técnica métrica (1x1 m y subdivisiones a 0.5m) */}
          {showGrid && (
            <g opacity="0.35" style={{ pointerEvents: 'none' }}>
              {Array.from({ length: 41 }).map((_, idx) => {
                const coord = (idx - 20) * pxPerMeter;
                return (
                  <React.Fragment key={`grid-${idx}`}>
                    <line x1={coord} y1={-20 * pxPerMeter} x2={coord} y2={20 * pxPerMeter} stroke="#94A3B8" strokeWidth={idx % 5 === 0 ? '1.5' : '0.5'} />
                    <line x1={-20 * pxPerMeter} y1={coord} x2={20 * pxPerMeter} y2={coord} stroke="#94A3B8" strokeWidth={idx % 5 === 0 ? '1.5' : '0.5'} />
                  </React.Fragment>
                );
              })}
              {/* Ejes principales X e Y (Origen 0,0) */}
              <line x1={0} y1={-20 * pxPerMeter} x2={0} y2={20 * pxPerMeter} stroke="#F97316" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
              <line x1={-20 * pxPerMeter} y1={0} x2={20 * pxPerMeter} y2={0} stroke="#F97316" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
            </g>
          )}

          {/* Líneas guía magnéticas durante el arrastre */}
          {draggedItemId && dragCurrentPos && (
            <g style={{ pointerEvents: 'none' }} opacity="0.7">
              <line
                x1={dragCurrentPos.x * pxPerMeter}
                y1={-20 * pxPerMeter}
                x2={dragCurrentPos.x * pxPerMeter}
                y2={20 * pxPerMeter}
                stroke="#F97316"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <line
                x1={-20 * pxPerMeter}
                y1={dragCurrentPos.z * pxPerMeter}
                x2={20 * pxPerMeter}
                y2={dragCurrentPos.z * pxPerMeter}
                stroke="#F97316"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </g>
          )}

          {/* Renderizado de Muebles en 2D */}
          {placedItems.map((item) => {
            const isSel = item.id === selectedItemId;
            const isBeingDragged = item.id === draggedItemId;
            const wPx = (item.dimensionsCm.width / 100) * pxPerMeter;
            const dPx = (item.dimensionsCm.depth / 100) * pxPerMeter;
            const rotDeg = (item.rotation * 180) / Math.PI;
            const posX = item.position[0] * pxPerMeter;
            const posY = item.position[2] * pxPerMeter;

            const isChair = item.category === 'chairs' || item.type.startsWith('chair-');
            const itemColor = isChair
              ? (SCREEN_FABRICS.find((s) => s.id === item.screenFinish)?.hex || item.chairFabricColor || '#374151')
              : (MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish)?.hex || '#E2DAD0');

            return (
              <g
                key={item.id}
                transform={`translate(${posX}, ${posY}) rotate(${rotDeg})`}
                className={`transition-shadow ${
                  item.isLocked
                    ? 'cursor-pointer'
                    : isBeingDragged
                    ? 'cursor-grabbing'
                    : 'cursor-grab hover:cursor-grab'
                }`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  selectItem(item.id);
                  if (item.isLocked) return;

                  isDraggingRef.current = true;
                  setDraggedItemId(item.id);
                  const worldPos = screenToWorld(e.clientX, e.clientY);
                  setDragStartOffset({
                    x: worldPos.x - item.position[0],
                    z: worldPos.z - item.position[2],
                  });
                  setDragCurrentPos({ x: item.position[0], z: item.position[2] });
                }}
              >
                {/* Zona de holgura y circulación libre ergonómica (80 cm al frente) */}
                {showClearanceZones && (
                  <rect
                    x={-wPx / 2}
                    y={dPx / 2}
                    width={wPx}
                    height={0.8 * pxPerMeter}
                    fill="#38BDF8"
                    fillOpacity="0.12"
                    stroke="#38BDF8"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Sombra proyectada al arrastrar */}
                {isBeingDragged && (
                  <rect
                    x={-wPx / 2 + 4}
                    y={-dPx / 2 + 4}
                    width={wPx}
                    height={dPx}
                    fill="#000000"
                    fillOpacity="0.2"
                    rx="4"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Bounding box principal del mueble */}
                <rect
                  x={-wPx / 2}
                  y={-dPx / 2}
                  width={wPx}
                  height={dPx}
                  fill={itemColor}
                  fillOpacity={isBeingDragged ? 0.95 : 0.85}
                  stroke={isSel ? '#F97316' : item.isLocked ? '#64748B' : '#334155'}
                  strokeWidth={isSel ? '3' : '1.5'}
                  strokeDasharray={item.isLocked ? '4 2' : undefined}
                  rx="3"
                />

                {/* Detalle interno para puestos en L */}
                {(item.type === 'desk-executive-l' || item.type === 'desk-open-l') && (
                  <rect
                    x={item.returnSide !== 'left' ? wPx / 2 - ((item.dimensionsCm.returnDepth || 45) / 100) * pxPerMeter : -wPx / 2}
                    y={-dPx / 2}
                    width={((item.dimensionsCm.returnDepth || 45) / 100) * pxPerMeter}
                    height={((item.dimensionsCm.returnWidth || 80) / 100) * pxPerMeter}
                    fill="#CBB297"
                    fillOpacity="0.9"
                    stroke="#475569"
                    strokeWidth="1"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Flecha de orientación frontal */}
                <path
                  d={`M 0,${-dPx / 4} L 0,${dPx / 3} M -4,${dPx / 3 - 5} L 0,${dPx / 3} L 4,${dPx / 3 - 5}`}
                  stroke={isSel ? '#F97316' : '#64748B'}
                  strokeWidth="1.5"
                  fill="none"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Nombre y tipo del módulo */}
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {item.name.length > 18 ? item.name.substring(0, 16) + '...' : item.name}
                </text>

                {/* Icono indicador si está bloqueado/fijado */}
                {item.isLocked && (
                  <circle cx={-wPx / 2 + 10} cy={-dPx / 2 + 10} r="6" fill="#F59E0B" />
                )}

                {/* Cotas en 2D */}
                {showDimensions2D && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text
                      x="0"
                      y={-dPx / 2 - 4}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {item.dimensionsCm.width} cm
                    </text>
                    <text
                      x={wPx / 2 + 6}
                      y="3"
                      textAnchor="start"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {item.dimensionsCm.depth} cm
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Marcador del Punto 1 mientras se selecciona el Punto 2 */}
          {calibration.point1 && !calibration.point2 && (
            <g style={{ pointerEvents: 'none' }}>
              <circle
                cx={calibration.point1.x * pxPerMeter}
                cy={calibration.point1.y * pxPerMeter}
                r="6"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={calibration.point1.x * pxPerMeter}
                cy={calibration.point1.y * pxPerMeter}
                r="12"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Línea de calibración completa entre Punto 1 y Punto 2 */}
          {calibration.point1 && calibration.point2 && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={calibration.point1.x * pxPerMeter}
                y1={calibration.point1.y * pxPerMeter}
                x2={calibration.point2.x * pxPerMeter}
                y2={calibration.point2.y * pxPerMeter}
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <circle cx={calibration.point1.x * pxPerMeter} cy={calibration.point1.y * pxPerMeter} r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx={calibration.point2.x * pxPerMeter} cy={calibration.point2.y * pxPerMeter} r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>

      {/* Badge de posición flotante mientras se arrastra */}
      {draggedItemId && dragCurrentPos && (
        <div className="absolute top-16 left-4 z-20 bg-orange-500 text-zinc-950 px-3 py-1.5 rounded-xl shadow-lg font-mono text-xs font-bold flex items-center gap-2 animate-in fade-in duration-100">
          <Move size={14} />
          <span>
            X: {dragCurrentPos.x >= 0 ? `+${dragCurrentPos.x.toFixed(2)}` : dragCurrentPos.x.toFixed(2)} m | Z: {dragCurrentPos.z >= 0 ? `+${dragCurrentPos.z.toFixed(2)}` : dragCurrentPos.z.toFixed(2)} m
          </span>
        </div>
      )}

      {/* Barra inferior de control para el mueble seleccionado */}
      {selectedItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-zinc-900/95 backdrop-blur-md border border-orange-500/40 p-2.5 px-4 rounded-2xl shadow-2xl text-white animate-in slide-in-from-bottom-3 duration-200">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-orange-400">{selectedItem.name}</p>
              {selectedItem.isLocked && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold rounded">
                  Fijado
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Pos: [X: {selectedItem.position[0].toFixed(2)}m, Z: {selectedItem.position[2].toFixed(2)}m] | {selectedItem.dimensionsCm.width}x{selectedItem.dimensionsCm.depth} cm
            </p>
          </div>

          <div className="w-[1px] h-6 bg-zinc-700 mx-1" />

          {/* D-Pad de Micro-desplazamiento con botones */}
          <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800" title="Mover con botones de paso fino">
            <button
              onClick={() => moveItemDelta(selectedItem.id, -0.05, 0)}
              disabled={selectedItem.isLocked}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Mover Izquierda 5 cm (←)"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveItemDelta(selectedItem.id, 0, -0.05)}
                disabled={selectedItem.isLocked}
                className="p-1 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
                title="Mover Arriba 5 cm (↑)"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={() => moveItemDelta(selectedItem.id, 0, 0.05)}
                disabled={selectedItem.isLocked}
                className="p-1 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
                title="Mover Abajo 5 cm (↓)"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <button
              onClick={() => moveItemDelta(selectedItem.id, 0.05, 0)}
              disabled={selectedItem.isLocked}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Mover Derecha 5 cm (→)"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Botón Fijar / Bloquear en Plano */}
          <button
            onClick={() => toggleItemLock(selectedItem.id)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedItem.isLocked
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-slate-200'
            }`}
            title={selectedItem.isLocked ? 'Desbloquear para mover' : 'Fijar posición en el plano para no moverlo por error (Tecla L)'}
          >
            {selectedItem.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{selectedItem.isLocked ? 'Fijado' : 'Fijar Posición'}</span>
          </button>

          {/* Rotar */}
          <button
            onClick={() => rotateItem(selectedItem.id, Math.PI / 4)}
            disabled={selectedItem.isLocked}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Rotar 45° (Tecla R)"
          >
            <RotateCw size={14} />
            <span>Rotar 45°</span>
          </button>

          {/* Invertir retorno para escritorios en L */}
          {(selectedItem.type === 'desk-executive-l' || selectedItem.type === 'desk-open-l') && (
            <button
              onClick={() => toggleItemReturnSide(selectedItem.id)}
              disabled={selectedItem.isLocked}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Cambiar mano de retorno (Izquierda / Derecha)"
            >
              Mano: {selectedItem.returnSide === 'left' ? 'Izq' : 'Der'}
            </button>
          )}

          {/* Duplicar */}
          <button
            onClick={() => duplicateItem(selectedItem.id)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Duplicar Puesto (Tecla D)"
          >
            <Copy size={14} />
            <span>Duplicar</span>
          </button>

          {/* Eliminar */}
          <button
            onClick={() => removeItem(selectedItem.id)}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Eliminar (Tecla Supr)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
