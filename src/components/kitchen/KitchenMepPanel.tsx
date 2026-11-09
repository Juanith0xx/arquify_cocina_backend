import React, { useMemo, useState } from 'react';
import { 
  useKitchenStore, 
  WallType 
} from '../../store/kitchenStore';
import { 
  MEP_TYPE_CONFIGS, 
  MEP_PRESETS, 
  MepType, 
  MepPresetType, 
  MepPoint 
} from '../../types/mep';
import { detectMepClashes } from '../../utils/mepClashDetection';
import { calculateMepPositionOnWall } from '../../utils/mepGeometry';
import { getWallDescriptiveInfo, getAllWallsDescriptiveInfo } from '../../utils/mepWallNaming';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sliders, 
  Flame, 
  Zap, 
  Droplets, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  ArrowRight,
  Minus,
  Layers,
  Sparkles,
  Info,
  Ruler,
  Compass
} from 'lucide-react';

interface KitchenMepPanelProps {
  onClose?: () => void;
  isLight?: boolean;
}

export const KitchenMepPanel: React.FC<KitchenMepPanelProps> = ({ onClose, isLight = false }) => {
  const {
    mepPoints,
    showMep,
    showMepClashes,
    showMepDimensions,
    activeMepId,
    setActiveMepId,
    setShowMep,
    setShowMepClashes,
    setShowMepDimensions,
    addMepPoint,
    updateMepPoint,
    removeMepPoint,
    addMepPreset,
    autoFixClash,
    walls,
    cabinets,
    architecturalElements,
    countertopConfig,
    setActiveCabinet,
    roomConfig,
  } = useKitchenStore();

  const [selectedWallId, setSelectedWallId] = useState<string>(walls[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'clashes' | 'points' | 'add'>('clashes');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'water' | 'electric' | 'gas'>('all');

  // Muros descriptivos (Muro A · Fondo / Norte · 500 cm)
  const descriptiveWalls = useMemo(() => {
    return getAllWallsDescriptiveInfo(walls, cabinets, architecturalElements);
  }, [walls, cabinets, architecturalElements]);

  // Detectar interferencias
  const clashes = useMemo(() => {
    return detectMepClashes(mepPoints, cabinets, countertopConfig);
  }, [mepPoints, cabinets, countertopConfig]);

  const activePoint = mepPoints.find((p) => p.id === activeMepId);
  const activeWall = walls.find((w) => w.id === (activePoint?.wallId || selectedWallId)) || walls[0];
  const activeWallInfo = descriptiveWalls.find((dw) => dw.id === activeWall?.id) || descriptiveWalls[0];

  const handleAddPoint = (type: MepType) => {
    if (!activeWall) return;
    const config = MEP_TYPE_CONFIGS[type];
    const [x1, z1] = activeWall.start;
    const [x2, z2] = activeWall.end;
    const wLen = Math.hypot(x2 - x1, z2 - z1);
    const offset = wLen / 2;
    const roomPoly = roomConfig?.vertices?.map(v => [v.x, v.y] as [number, number]) || [];

    const calc = calculateMepPositionOnWall(activeWall, offset, config.defaultElevationCm, roomPoly);
    const newPoint: MepPoint = {
      id: `mep-${type}-${Date.now()}`,
      name: `${config.label}`,
      type,
      wallId: activeWall.id,
      wallOffset: offset,
      elevation: config.defaultElevationCm,
      position: calc.position,
      rotation: calc.rotation,
      diameterMm: config.defaultDiameterMm,
      specs: config.description,
    };

    addMepPoint(newPoint);
    setActiveMepId(newPoint.id);
    setActiveTab('points');
  };

  // Conteo por categorías
  const waterPointsCount = useMemo(() => mepPoints.filter(p => ['water_cold', 'water_hot', 'drain'].includes(p.type)).length, [mepPoints]);
  const electricPointsCount = useMemo(() => mepPoints.filter(p => ['electric_socket', 'electric_power'].includes(p.type)).length, [mepPoints]);
  const gasPointsCount = useMemo(() => mepPoints.filter(p => p.type === 'gas').length, [mepPoints]);

  const filteredPoints = useMemo(() => {
    if (categoryFilter === 'all') return mepPoints;
    if (categoryFilter === 'water') return mepPoints.filter(p => ['water_cold', 'water_hot', 'drain'].includes(p.type));
    if (categoryFilter === 'electric') return mepPoints.filter(p => ['electric_socket', 'electric_power'].includes(p.type));
    if (categoryFilter === 'gas') return mepPoints.filter(p => p.type === 'gas');
    return mepPoints;
  }, [mepPoints, categoryFilter]);

  // Grupos de puntos individuales para añadir
  const waterTypes: MepType[] = ['water_cold', 'water_hot', 'drain'];
  const electricTypes: MepType[] = ['electric_socket', 'electric_power'];
  const gasTypes: MepType[] = ['gas'];

  return (
    <div className={`flex flex-col gap-4 text-xs transition-colors ${
      isLight ? 'text-slate-800' : 'text-slate-200'
    }`}>
      {/* 1. Encabezado MEP & Estado de Colisiones */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isLight 
          ? 'bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 border-slate-200/90 shadow-sm' 
          : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border-slate-800 shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              isLight 
                ? 'bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm' 
                : 'bg-cyan-950/80 border-cyan-700/60 text-cyan-400'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Trazado MEP & Interferencias
              </h3>
              <p className={`text-xs mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Sanitario, Gas y Electricidad BIM
              </p>
            </div>
          </div>

          {/* Badge de estado normativo */}
          <div className="shrink-0">
            {clashes.length === 0 ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isLight 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>0 Conflictos</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all animate-pulse ${
                isLight 
                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' 
                  : 'bg-rose-950 text-rose-300 border-rose-600'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{clashes.length} Conflicto{clashes.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>

        {/* Controles de visualización y visibilidad */}
        <div className={`mt-3.5 pt-3 border-t grid grid-cols-3 gap-1.5 ${
          isLight ? 'border-slate-200/80' : 'border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setShowMep(!showMep)}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              showMep
                ? isLight
                  ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-sm'
                  : 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : isLight
                  ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
            title="Mostrar / Ocultar capas MEP en 3D"
          >
            {showMep ? <Eye className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span className="truncate">Ver MEP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMepDimensions(!showMepDimensions)}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              showMepDimensions
                ? isLight
                  ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-sm'
                  : 'bg-sky-950/80 border-sky-500 text-sky-300'
                : isLight
                  ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
            title="Cotas exclusivas para MEP: Offset a esquinas, elevación NPT e inter-distancia (no se mezclan con muebles)"
          >
            <Ruler className={`w-3.5 h-3.5 ${showMepDimensions ? 'text-sky-600' : 'text-slate-400'} shrink-0`} />
            <span className="truncate">Cotas MEP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMepClashes(!showMepClashes)}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              showMepClashes
                ? isLight
                  ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300'
                : isLight
                  ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
            title="Detección de interferencias con cajones y fondos"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${showMepClashes ? 'text-rose-600' : 'text-slate-400'} shrink-0`} />
            <span className="truncate">Alertas</span>
          </button>
        </div>
      </div>

      {/* 2. Selector Segmentado de Pestañas MEP */}
      <div className={`p-1 rounded-xl border grid grid-cols-3 gap-1 transition-all ${
        isLight 
          ? 'bg-slate-200/80 border-slate-300/80' 
          : 'bg-black/50 border-white/10'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('clashes')}
          className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'clashes'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${clashes.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          <span>Conflictos</span>
          {clashes.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white leading-tight">
              {clashes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('points')}
          className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'points'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-500" />
          <span>Puntos BIM</span>
          <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
            isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
          }`}>
            {mepPoints.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'add'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5 text-emerald-500" />
          <span>Añadir</span>
        </button>
      </div>

      {/* 3. Contenido de las Pestañas */}
      <div className="space-y-4">
        {/* TAB 1: INTERFERENCIAS Y CLASH DETECTION */}
        {activeTab === 'clashes' && (
          <div className="space-y-3">
            {clashes.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                isLight 
                  ? 'bg-emerald-50/70 border-emerald-200/90 shadow-sm' 
                  : 'bg-emerald-950/30 border-emerald-800/40'
              }`}>
                <div className={`inline-flex p-3 rounded-full ${
                  isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/40 text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${
                    isLight ? 'text-emerald-900' : 'text-emerald-200'
                  }`}>
                    ¡Red BIM Verificada y Sin Conflictos!
                  </h4>
                  <p className={`text-xs mt-1.5 leading-relaxed max-w-xs mx-auto ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Todas las instalaciones de agua, desagüe, gas y electricidad cumplen con las distancias normativas de seguridad (SEC) y no colisionan mecánicamente con cajones o fondos de muebles.
                  </p>
                </div>
              </div>
            ) : (
              clashes.map((clash) => {
                const isCritical = clash.severity === 'critical';
                return (
                  <div
                    key={clash.id}
                    onClick={() => {
                      if (clash.mepPointId) setActiveMepId(clash.mepPointId);
                      if (clash.cabinetId) setActiveCabinet(clash.cabinetId);
                    }}
                    className={`p-4 rounded-2xl border space-y-3 transition-all cursor-pointer ${
                      isCritical
                        ? isLight
                          ? 'bg-rose-50/80 border-rose-200 shadow-sm hover:border-rose-400'
                          : 'bg-rose-950/40 border-rose-700/80 hover:border-rose-500'
                        : isLight
                          ? 'bg-amber-50/80 border-amber-200 shadow-sm hover:border-amber-400'
                          : 'bg-amber-950/40 border-amber-700/80 hover:border-amber-500'
                    }`}
                  >
                    {/* Cabecera del Conflicto */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertTriangle className={`w-4 h-4 shrink-0 ${
                          isCritical ? 'text-rose-500' : 'text-amber-500'
                        }`} />
                        <span className={isLight ? (isCritical ? 'text-rose-950' : 'text-amber-950') : 'text-white'}>
                          {clash.title}
                        </span>
                      </div>
                      <span
                        className={`text-xs uppercase px-2 py-0.5 rounded-md font-bold shrink-0 ${
                          isCritical
                            ? isLight
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-rose-900/90 text-rose-200 border border-rose-600'
                            : isLight
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-amber-900/90 text-amber-200 border border-amber-600'
                        }`}
                      >
                        {isCritical ? 'Crítico' : 'Advertencia'}
                      </span>
                    </div>

                    {/* Descripción con tipografía legible */}
                    <p className={`text-xs leading-relaxed ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {clash.description}
                    </p>

                    {/* Solución Técnica Recomendada */}
                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isLight 
                        ? 'bg-white/95 border-rose-200/80 text-slate-800 shadow-xs' 
                        : 'bg-black/40 border-white/10 text-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Solución Técnica Recomendada:</span>
                      </div>
                      <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {clash.resolutionRecommendation}
                      </p>
                    </div>

                    {/* Botón de Auto-Solución */}
                    {clash.autoFixAvailable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          autoFixClash(clash);
                        }}
                        className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer"
                      >
                        <span>⚡ Auto-Solucionar Interferencia</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: GESTOR DE PUNTOS INSTALADOS */}
        {activeTab === 'points' && (
          <div className="space-y-4">
            {/* Filtro rápido por especialidad */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `Todos (${mepPoints.length})` },
                { id: 'water', label: `💧 Agua (${waterPointsCount})` },
                { id: 'electric', label: `⚡ Red (${electricPointsCount})` },
                { id: 'gas', label: `🔥 Gas (${gasPointsCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCategoryFilter(f.id as any)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === f.id
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-cyan-500 text-black font-bold'
                      : isLight
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista de Puntos en Muro */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Puntos Instalados ({filteredPoints.length})
                </label>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Haz clic para editar cotas
                </span>
              </div>

              {filteredPoints.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  No hay puntos de instalación en esta categoría. Puedes añadir uno desde la pestaña "Añadir".
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {filteredPoints.map((point) => {
                    const cfg = MEP_TYPE_CONFIGS[point.type];
                    const isSelected = activeMepId === point.id;
                    const wallInfo = descriptiveWalls.find(w => w.id === point.wallId) || descriptiveWalls[0];

                    return (
                      <div
                        key={point.id}
                        onClick={() => setActiveMepId(point.id)}
                        className={`p-3 rounded-xl cursor-pointer border flex items-center justify-between transition-all ${
                          isSelected
                            ? isLight
                              ? 'bg-cyan-50/90 border-cyan-500 text-slate-900 ring-2 ring-cyan-500/20 shadow-sm'
                              : 'bg-cyan-950/70 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md'
                            : isLight
                              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                              : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: cfg.colorHex }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs block truncate">
                              {point.name}
                            </span>
                            <span className={`text-[11px] block truncate ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {wallInfo ? wallInfo.shortLabel : 'Muro'} · Offset: {Math.round(point.wallOffset || 0)} cm
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-cyan-300'
                          }`}>
                            +{point.elevation} cm
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMepPoint(point.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                            }`}
                            title="Eliminar punto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Editor paramétrico del punto seleccionado */}
            {activePoint && (
              <div className={`p-4 rounded-2xl border space-y-3.5 transition-all ${
                isLight 
                  ? 'bg-slate-50/90 border-slate-200 shadow-sm' 
                  : 'bg-slate-900 border-slate-800 shadow-md'
              }`}>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: MEP_TYPE_CONFIGS[activePoint.type].colorHex }}
                    />
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      Propiedades del Punto
                    </span>
                  </div>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-md font-bold text-white shadow-xs"
                    style={{ backgroundColor: MEP_TYPE_CONFIGS[activePoint.type].colorHex }}
                  >
                    {MEP_TYPE_CONFIGS[activePoint.type].shortLabel}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Nombre / Etiqueta BIM
                  </label>
                  <input
                    type="text"
                    value={activePoint.name}
                    onChange={(e) => updateMepPoint(activePoint.id, { name: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border transition-colors ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500' 
                        : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Muro Asignado
                  </label>
                  <select
                    value={activePoint.wallId || walls[0]?.id}
                    onChange={(e) => {
                      const newWallId = e.target.value;
                      const targetWall = walls.find(w => w.id === newWallId);
                      if (targetWall) {
                        const roomPoly = roomConfig?.vertices?.map(v => [v.x, v.y] as [number, number]) || [];
                        const calc = calculateMepPositionOnWall(targetWall, activePoint.wallOffset || 50, activePoint.elevation, roomPoly);
                        updateMepPoint(activePoint.id, {
                          wallId: targetWall.id,
                          position: calc.position,
                          rotation: calc.rotation,
                        });
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' 
                        : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                    }`}
                  >
                    {descriptiveWalls.map((wInfo) => (
                      <option key={wInfo.id} value={wInfo.id}>
                        {wInfo.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ajuste de Cota NPT y Offset con botones steppers rápidos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-semibold ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      Cota NPT (cm)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateMepPoint(activePoint.id, { elevation: Math.max(5, activePoint.elevation - 5) })}
                        className={`p-2 rounded-lg border font-bold text-xs cursor-pointer ${
                          isLight ? 'bg-white hover:bg-slate-100 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="-5 cm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={activePoint.elevation}
                        onChange={(e) => updateMepPoint(activePoint.id, { elevation: Number(e.target.value) })}
                        className={`w-full rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-center border transition-colors ${
                          isLight 
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' 
                            : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => updateMepPoint(activePoint.id, { elevation: activePoint.elevation + 5 })}
                        className={`p-2 rounded-lg border font-bold text-xs cursor-pointer ${
                          isLight ? 'bg-white hover:bg-slate-100 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="+5 cm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-semibold ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      Offset en Muro (cm)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateMepPoint(activePoint.id, { wallOffset: Math.max(0, (activePoint.wallOffset || 0) - 5) })}
                        className={`p-2 rounded-lg border font-bold text-xs cursor-pointer ${
                          isLight ? 'bg-white hover:bg-slate-100 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="-5 cm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={Math.round(activePoint.wallOffset || 0)}
                        onChange={(e) => updateMepPoint(activePoint.id, { wallOffset: Number(e.target.value) })}
                        className={`w-full rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-center border transition-colors ${
                          isLight 
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' 
                            : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => updateMepPoint(activePoint.id, { wallOffset: (activePoint.wallOffset || 0) + 5 })}
                        className={`p-2 rounded-lg border font-bold text-xs cursor-pointer ${
                          isLight ? 'bg-white hover:bg-slate-100 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="+5 cm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Especificación Técnica / Diámetro
                  </label>
                  <input
                    type="text"
                    value={activePoint.specs || ''}
                    onChange={(e) => updateMepPoint(activePoint.id, { specs: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border transition-colors ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' 
                        : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AÑADIR PUNTOS Y PRESETS */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            {/* Selección de muro destino */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Muro Destino para Instalación
                </label>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  {descriptiveWalls.length} Muros detectados
                </span>
              </div>
              <select
                value={selectedWallId}
                onChange={(e) => setSelectedWallId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' 
                    : 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                }`}
              >
                {descriptiveWalls.map((wInfo) => (
                  <option key={wInfo.id} value={wInfo.id}>
                    {wInfo.fullLabel}
                  </option>
                ))}
              </select>

              {/* Tarjeta visual de referencia del muro seleccionado */}
              {(() => {
                const curWallInfo = descriptiveWalls.find(w => w.id === selectedWallId) || descriptiveWalls[0];
                if (!curWallInfo) return null;
                return (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950' : 'bg-cyan-950/40 border-cyan-900/60 text-cyan-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {curWallInfo.letter}
                      </span>
                      <div>
                        <span className="font-bold block">{curWallInfo.orientation}</span>
                        <span className="text-[11px] opacity-80">Longitud: {curWallInfo.lengthCm} cm · {curWallInfo.cabinetsCount} muebles</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono opacity-75 block">Origen: 0 cm</span>
                      <span className="text-[10px] font-mono opacity-75 block">Fin: {curWallInfo.lengthCm} cm</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Presets completos de obra BIM */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Combos de Instalación Rápida
                </label>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  Normativos
                </span>
              </div>

              <div className="space-y-2.5">
                {MEP_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isLight 
                        ? 'bg-white hover:border-cyan-400 border-slate-200 shadow-xs' 
                        : 'bg-slate-900/90 border-slate-800 hover:border-cyan-700/80 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className={`font-bold text-xs ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {preset.name}
                        </h5>
                        <p className={`text-xs mt-0.5 leading-relaxed ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {preset.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addMepPreset(preset.id, selectedWallId);
                          setActiveTab('points');
                        }}
                        className="shrink-0 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insertar</span>
                      </button>
                    </div>

                    {/* Chips de puntos incluidos en el preset */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {preset.points.map((pt, idx) => {
                        const cfg = MEP_TYPE_CONFIGS[pt.type];
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              isLight 
                                ? 'bg-slate-50 border-slate-200 text-slate-700' 
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cfg.colorHex }}
                            />
                            <span>{cfg.shortLabel} {pt.elevationCm}cm</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Puntos individuales organizados por especialidad */}
            <div className="space-y-3 pt-2">
              <label className={`text-xs font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Añadir Puntos Individuales
              </label>

              {/* Categoría: Sanitario */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Sanitario y Fontanería</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {waterTypes.map((type) => {
                    const cfg = MEP_TYPE_CONFIGS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddPoint(type)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isLight 
                            ? 'bg-white hover:bg-sky-50/50 hover:border-sky-300 border-slate-200 shadow-xs' 
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cfg.colorHex }}
                        />
                        <div className="overflow-hidden min-w-0">
                          <span className={`font-bold text-xs block truncate ${
                            isLight ? 'text-slate-800' : 'text-slate-200'
                          }`}>
                            {cfg.label}
                          </span>
                          <span className={`text-[11px] block truncate ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            h = {cfg.defaultElevationCm} cm
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categoría: Electricidad */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Electricidad y Fuerza</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {electricTypes.map((type) => {
                    const cfg = MEP_TYPE_CONFIGS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddPoint(type)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isLight 
                            ? 'bg-white hover:bg-amber-50/50 hover:border-amber-300 border-slate-200 shadow-xs' 
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cfg.colorHex }}
                        />
                        <div className="overflow-hidden min-w-0">
                          <span className={`font-bold text-xs block truncate ${
                            isLight ? 'text-slate-800' : 'text-slate-200'
                          }`}>
                            {cfg.label}
                          </span>
                          <span className={`text-[11px] block truncate ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            h = {cfg.defaultElevationCm} cm
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categoría: Gas */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Gas Licuado / Natural</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {gasTypes.map((type) => {
                    const cfg = MEP_TYPE_CONFIGS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddPoint(type)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isLight 
                            ? 'bg-white hover:bg-orange-50/50 hover:border-orange-300 border-slate-200 shadow-xs' 
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cfg.colorHex }}
                        />
                        <div className="overflow-hidden min-w-0">
                          <span className={`font-bold text-xs block truncate ${
                            isLight ? 'text-slate-800' : 'text-slate-200'
                          }`}>
                            {cfg.label}
                          </span>
                          <span className={`text-[11px] block truncate ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            h = {cfg.defaultElevationCm} cm
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
