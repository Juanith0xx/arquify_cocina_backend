import React, { useState, useEffect, useRef } from 'react';
import { useKitchenStore, CabinetType } from '../../store/kitchenStore';
import { useStore, PartType } from '../../store';
import { useAdminStore } from '../../store/adminStore';
import { isCabinetWithDoors, getDefaultShelvesCount, isCabinetWithSplitDoors, getSplitCabinetShelvesCounts, isWhiteMelamine } from '../../utils/kitchenManufacturing';
import { SlidersHorizontal, X, RefreshCw, ArrowUpDown, ArrowLeftRight, RotateCw, Move3D, DoorOpen, DoorClosed, Layers, Trash2, Palette, Sparkles, Box, Info, Check, ShieldAlert, Sliders, ChevronDown, ChevronRight, Ruler, Maximize2, AlertTriangle } from 'lucide-react';
import { HANDLE_CATALOG, FINISH_LABELS, FINISH_HEX, HandleModelId, HandleFinish, KitchenHandleConfig } from '../../types/handle';
import { IslandBackPanelConfigSection } from './IslandBackPanelConfigSection';
import { DottedDepthSlider } from './DottedDepthSlider';
import { findCornerSnapForCabinet, findPerpendicularCabinetForCorner } from '../../utils/kitchenCollision';

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isLight: boolean;
}

function AccordionSection({
  id,
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
  isLight
}: AccordionSectionProps) {
  return (
    <div 
      id={`accordion-${id}`}
      className={`rounded-xl border transition-all overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer select-none ${
          isOpen
            ? (isLight ? 'bg-orange-50/60 border-b border-orange-100' : 'bg-white/[0.04] border-b border-white/5')
            : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className={`p-1 rounded-md shrink-0 ${
            isOpen
              ? 'bg-orange-500 text-black shadow-xs'
              : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300')
          }`}>
            <Icon size={13} />
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${
            isOpen
              ? (isLight ? 'text-orange-700' : 'text-orange-400')
              : (isLight ? 'text-slate-800' : 'text-slate-200')
          }`}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {badge && (
            <div className="text-[10px]">
              {badge}
            </div>
          )}
          {isOpen ? (
            <ChevronDown size={14} className={isLight ? "text-orange-600" : "text-orange-400"} />
          ) : (
            <ChevronRight size={14} className={isLight ? "text-slate-400" : "text-slate-500"} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

const DEFAULT_TEXTURES = [
  { id: 'def_mas_blanco', name: 'Masisa Blanco', url: '#FFFFFF' },
  { id: 'def_mas_negro', name: 'Masisa Negro', url: '#171717' },
  { id: 'def_abet_2831', name: 'Abet Broccato 2831', url: '/textures/abet-broccato-2831.svg' },
  { id: 'def_abet_2824', name: 'Abet Fiore Pop 2824', url: '/textures/abet-fiore-pop-2824.svg' },
  { id: 'def_wood_grain', name: 'Veta Madera Clara', url: '/textures/light-wood-grain.svg' }
];

interface DimensionMmControlProps {
  label: string;
  valueCm: number;
  minCm: number;
  maxCm: number;
  stepMm?: number;
  onChangeCm: (valCm: number) => void;
  isLight: boolean;
}

function DimensionMmControl({
  label,
  valueCm,
  minCm,
  maxCm,
  stepMm = 1,
  onChangeCm,
  isLight
}: DimensionMmControlProps) {
  const valueMm = Math.round((valueCm || 0) * 10);
  const minMm = Math.round(minCm * 10);
  const maxMm = Math.round(maxCm * 10);
  const [localText, setLocalText] = useState(String(valueMm));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalText(String(Math.round((valueCm || 0) * 10)));
    }
  }, [valueCm]);

  const commitValue = (valStr: string) => {
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const clampedMm = Math.max(minMm, Math.min(maxMm, Math.round(parsed)));
      onChangeCm(clampedMm / 10);
      setLocalText(String(clampedMm));
    } else {
      setLocalText(String(Math.round((valueCm || 0) * 10)));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={localText}
            onFocus={() => { isFocused.current = true; }}
            onBlur={(e) => {
              isFocused.current = false;
              commitValue(e.target.value);
            }}
            onChange={(e) => {
              setLocalText(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed) && parsed >= minMm && parsed <= maxMm) {
                onChangeCm(parsed / 10);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={`w-20 px-2 py-0.5 text-right font-mono font-bold text-xs rounded border outline-none transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-orange-600 focus:border-orange-500 shadow-xs'
                : 'bg-black/50 border-white/15 text-orange-400 focus:border-orange-500'
            }`}
          />
          <span className="font-mono font-bold text-xs text-orange-500">mm</span>
        </div>
      </div>
      <input
        type="range"
        min={minMm}
        max={maxMm}
        step={stepMm}
        value={valueMm}
        onChange={(e) => {
          const newMm = Number(e.target.value);
          onChangeCm(newMm / 10);
          setLocalText(String(newMm));
        }}
        className="w-full cursor-pointer accent-orange-500"
      />
    </div>
  );
}

export function KitchenModuleContextMenu({ 
  isLight: propIsLight,
  inline = true,
  onOpenIslandBack
}: { 
  isLight?: boolean; 
  inline?: boolean;
  onOpenIslandBack?: () => void;
} = {}) {
  const { 
    activeCabinetId, 
    cabinets, 
    updateCabinet, 
    removeCabinet, 
    setActiveCabinet, 
    setToolMode, 
    setViewMode, 
    handleConfig: globalHandleConfig, 
    golaSystem,
    setGolaSystem,
    islandBackConfig,
    setIslandBackConfig,
    countertopConfig
  } = useKitchenStore();
  const globalStore = useStore();
  const adminTextures = useAdminStore((s) => s.textures);
  const [targetZone, setTargetZone] = useState<PartType>('doors');
  const [moduleStockAlert, setModuleStockAlert] = useState<{ textureName: string; stock: number } | null>(null);
  const [selectedDoorSection, setSelectedDoorSection] = useState<'lower' | 'upper'>('lower');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dimensions: true,
    mechanisms: false,
    grain: false,
    shelves: false,
    closetConfig: false,
    handles: false,
    coverPanels: false,
    finishes: false,
    islandBack: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isLight = propIsLight !== undefined ? propIsLight : (() => {
    try {
      return localStorage.getItem('arquify_kitchen_theme') === 'light';
    } catch {
      return false;
    }
  })();

  if (!activeCabinetId) return null;
  const activeCabinet = cabinets.find(c => c.id === activeCabinetId);
  if (!activeCabinet) return null;

  const isDecoration = activeCabinet.type === 'decoration' || activeCabinet.variant?.startsWith('deco_');

  if (isDecoration) {
    const decoTitle =
      activeCabinet.variant === 'deco_hood'
        ? 'Campana FDV New Conic 90'
        : activeCabinet.variant === 'deco_stove'
        ? 'Cocina FDV FS Unique 90'
        : activeCabinet.variant === 'deco_fridge'
        ? 'Refrigerador FDV SBS'
        : activeCabinet.variant === 'deco_dishwasher'
        ? 'Lavavajillas FDV Active 12C'
        : activeCabinet.variant === 'deco_plant'
        ? 'Planta Decorativa'
        : 'Elemento de Equipamiento';

    return (
      <div className={`w-full border rounded-2xl overflow-hidden flex flex-col transition-all mb-4 ${
        inline
          ? isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-white/[0.04] border-white/10 shadow-lg text-white'
          : isLight
            ? 'absolute top-6 right-6 w-80 backdrop-blur-xl bg-white/95 border-slate-200 shadow-2xl shadow-slate-300 text-slate-800 z-50'
            : 'absolute top-6 right-6 w-80 backdrop-blur-xl bg-[#141416]/95 border-white/10 shadow-2xl shadow-black/80 text-white z-50'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/40'
        }`}>
          <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-wider truncate pr-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 animate-pulse"></span>
            <span className="truncate">{decoTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const currentRot = activeCabinet.rotation || 0;
                const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                updateCabinet(activeCabinet.id, { rotation: nextRot });
              }}
              className="text-xs text-cyan-500 hover:text-cyan-600 p-1 rounded font-semibold cursor-pointer"
              title="Girar 90°"
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={() => setActiveCabinet(null)}
              className={`transition-colors p-1 rounded ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title="Deseleccionar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3.5">
          {/* Dimensiones */}
          <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <div>
              <div className={`text-[9px] uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ancho</div>
              <div className={`font-mono text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeCabinet.width} cm</div>
            </div>
            <div>
              <div className={`text-[9px] uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Alto</div>
              <div className={`font-mono text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeCabinet.height} cm</div>
            </div>
            <div>
              <div className={`text-[9px] uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fondo</div>
              <div className={`font-mono text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeCabinet.depth} cm</div>
            </div>
          </div>

          {/* Acciones principales: Mover y Girar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToolMode('move_active');
                setViewMode('3d');
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
            >
              <Move3D size={15} />
              Mover
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentRot = activeCabinet.rotation || 0;
                const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                updateCabinet(activeCabinet.id, { rotation: nextRot });
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 font-bold rounded-xl text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <RotateCw size={15} className={isLight ? 'text-cyan-600' : 'text-cyan-400'} />
              Girar 90°
            </button>
          </div>

          {/* Si es campana: regular elevación */}
          {activeCabinet.variant === 'deco_hood' && (
            <div className={`flex flex-col gap-2 p-2.5 border rounded-xl ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
            }`}>
              <div className={`flex justify-between items-center text-[10px] ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                <span className={`uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Elevación Base (piso)</span>
                <span className={`font-mono font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {Math.round(activeCabinet.position[1] - activeCabinet.height / 2)} cm
                </span>
              </div>
              <input
                type="range"
                min={120}
                max={170}
                step={2}
                value={Math.round(activeCabinet.position[1] - activeCabinet.height / 2)}
                onChange={(e) => {
                  const newBottom = Number(e.target.value);
                  updateCabinet(activeCabinet.id, {
                    position: [activeCabinet.position[0], newBottom + activeCabinet.height / 2, activeCabinet.position[2]]
                  });
                }}
                className={`w-full cursor-pointer accent-orange-500 ${isLight ? 'bg-slate-300' : ''}`}
              />
            </div>
          )}

          {/* Botón Eliminar */}
          <button
            onClick={() => removeCabinet(activeCabinet.id)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs uppercase font-bold tracking-wider transition-all cursor-pointer border ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-sm'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            <Trash2 size={14} />
            Eliminar Equipamiento
          </button>
        </div>
      </div>
    );
  }

  const cabinetIndex = cabinets.findIndex(c => c.id === activeCabinetId);

  const handleOverride = (key: string, value: any) => {
    updateCabinet(activeCabinetId, { [key]: value });
  };

  const handleClearOverrides = () => {
    updateCabinet(activeCabinetId, {
      structureColor: undefined,
      doorColor: undefined,
      drawerFrontColor: undefined,
      drawerInnerColor: undefined,
      shelfColor: undefined,
      backColor: undefined,
      socleColor: undefined,
      leftCoverPanel: undefined,
      rightCoverPanel: undefined,
      structureMaterial: undefined,
      doorMaterial: undefined,
      drawerFrontMaterial: undefined,
      drawerInnerMaterial: undefined,
      shelfMaterial: undefined,
      backMaterial: undefined,
      socleMaterial: undefined,
      grainDirection: undefined,
      grainElements: undefined,
      hplBalancer: undefined,
      handleConfig: undefined,
      isOpen: false,
      openElements: undefined
    });
  };

  const toggleGrain = (key: string) => {
    const newGrainElements = { ...(activeCabinet.grainElements || {}) };
    const current = newGrainElements[key] ?? activeCabinet.grainDirection ?? 'vertical';
    const next = current === 'vertical' ? 'horizontal' : 'vertical';

    newGrainElements[key] = next;
    updateCabinet(activeCabinetId, { grainElements: newGrainElements });
  };

  const getGrain = (key: string) => {
    return activeCabinet.grainElements?.[key] ?? activeCabinet.grainDirection ?? 'vertical';
  };

  const isElementOpen = (key: string) => {
    return activeCabinet.openElements?.[key] ?? activeCabinet.isOpen ?? false;
  };

  const toggleElementOpen = (key: string) => {
    const newOpenElements = { ...(activeCabinet.openElements || {}) };
    const current = isElementOpen(key);
    newOpenElements[key] = !current;
    updateCabinet(activeCabinetId, { openElements: newOpenElements });
  };

  const toggleAllOpen = () => {
    const currentAnyOpen = getElementsList().some(el => isElementOpen(el.id));
    const nextState = !currentAnyOpen;
    
    const newOpenElements: Record<string, boolean> = {};
    getElementsList().forEach(el => {
      newOpenElements[el.id] = nextState;
    });

    updateCabinet(activeCabinetId, { isOpen: nextState, openElements: newOpenElements });
  };

  const handleSnapToCorner = () => {
    if (!activeCabinet) return;
    const storeState = useKitchenStore.getState();
    const effectiveWalls = storeState.walls && storeState.walls.length > 0 
      ? storeState.walls 
      : (storeState.roomConfig?.vertices && storeState.roomConfig.vertices.length >= 3 
          ? storeState.roomConfig.vertices.map((v, i, arr) => {
              const next = arr[(i + 1) % arr.length];
              return { id: `wall_v_${i}`, start: [v.x, v.y] as [number, number], end: [next.x, next.y] as [number, number], thickness: 20, height: 240 };
            }) 
          : []);
    const vertices = storeState.roomConfig?.vertices || [];
    const roomPoly: [number, number][] = vertices.length >= 3 ? vertices.map(v => [v.x, v.y]) : [];

    const cornerSnap = findCornerSnapForCabinet(
      activeCabinet,
      cabinets,
      effectiveWalls,
      roomPoly
    );

    if (cornerSnap) {
      updateCabinet(activeCabinet.id, {
        position: cornerSnap.position,
        rotation: cornerSnap.rotation,
        ...(cornerSnap.blindWidth ? { blindWidth: cornerSnap.blindWidth } : {}),
      });

      if (cornerSnap.connectedUpdates && cornerSnap.connectedUpdates.length > 0) {
        for (const conn of cornerSnap.connectedUpdates) {
          updateCabinet(conn.id, {
            position: conn.position,
            rotation: conn.rotation,
          });
        }
      }
    }
  };

  const handleUpdateCornerBlind = (updates: { newBlindWidth?: number; newDoorWidth?: number; newTotalWidth?: number }) => {
    const currentBlindW = activeCabinet.blindWidth && activeCabinet.blindWidth > 0 
      ? activeCabinet.blindWidth 
      : (activeCabinet.width >= 100 ? 60 : Math.round(activeCabinet.width / 2));
    const currentDoorW = Math.max(20, activeCabinet.width - currentBlindW);

    let nextBlindW = currentBlindW;
    let nextDoorW = currentDoorW;
    let nextTotalW = activeCabinet.width;

    if (updates.newBlindWidth !== undefined) {
      nextBlindW = updates.newBlindWidth;
      nextTotalW = Math.round((nextBlindW + currentDoorW) * 10) / 10;
      // Sincronizar profundidad del mueble perpendicular adyacente si existe
      const perp = findPerpendicularCabinetForCorner(activeCabinet, cabinets);
      if (perp && perp.depth !== nextBlindW) {
        updateCabinet(perp.id, { depth: nextBlindW });
      }
    } else if (updates.newDoorWidth !== undefined) {
      nextDoorW = updates.newDoorWidth;
      nextTotalW = Math.round((currentBlindW + nextDoorW) * 10) / 10;
    } else if (updates.newTotalWidth !== undefined) {
      nextTotalW = updates.newTotalWidth;
      nextBlindW = Math.min(nextTotalW - 25, currentBlindW);
    }

    const patch: Partial<CabinetType> = {
      blindWidth: nextBlindW,
      width: nextTotalW,
    };

    const storeState = useKitchenStore.getState();
    const effectiveWalls =
      storeState.walls && storeState.walls.length > 0
        ? storeState.walls
        : (storeState.roomConfig?.vertices && storeState.roomConfig.vertices.length >= 3
            ? storeState.roomConfig.vertices.map((v, i, arr) => {
                const next = arr[(i + 1) % arr.length];
                return { id: `wall_v_${i}`, start: [v.x, v.y] as [number, number], end: [next.x, next.y] as [number, number], thickness: 20, height: 240 };
              })
            : []);
    const vertices = storeState.roomConfig?.vertices || [];
    const roomPoly: [number, number][] = vertices.length >= 3 ? vertices.map(v => [v.x, v.y]) : [];

    const cornerSnap = findCornerSnapForCabinet(
      { ...activeCabinet, ...patch },
      cabinets,
      effectiveWalls,
      roomPoly
    );

    if (cornerSnap) {
      const currentDist = Math.hypot(activeCabinet.position[0] - cornerSnap.position[0], activeCabinet.position[2] - cornerSnap.position[2]);
      if (currentDist < 35) {
        patch.position = cornerSnap.position;
        patch.rotation = cornerSnap.rotation;
        if (cornerSnap.connectedUpdates && cornerSnap.connectedUpdates.length > 0) {
          for (const conn of cornerSnap.connectedUpdates) {
            updateCabinet(conn.id, {
              position: conn.position,
              rotation: conn.rotation,
            });
          }
        }
      }
    }

    updateCabinet(activeCabinet.id, patch);
  };

  const handleApplyTexture = (url: string, name: string, specificThickness?: number, specificMat?: 'melamina' | 'hpl' | 'durolac') => {
    const nameLower = name.toLowerCase();
    const urlLower = url.toLowerCase();
    const isHPL = nameLower.includes('abet') || nameLower.includes('hpl') || nameLower.includes('laminati') || urlLower.includes('abet') || urlLower.includes('fiore') || urlLower.includes('broccato');
    const isDurolac = specificMat === 'durolac' || nameLower.includes('durolac');
    const mat: 'melamina' | 'hpl' | 'durolac' = specificMat || (isDurolac ? 'durolac' : (isHPL ? 'hpl' : 'melamina'));

    if (isHPL && activeCabinet.hplBalancer === undefined) {
      updateCabinet(activeCabinetId, { hplBalancer: true });
    }

    switch (targetZone) {
      case 'all':
        updateCabinet(activeCabinetId, {
          structureColor: url,
          structureMaterial: mat as any,
          doorColor: url,
          doorMaterial: mat as any,
          drawerFrontColor: url,
          drawerFrontMaterial: mat as any,
          drawerInnerColor: url,
          drawerInnerMaterial: mat as any,
          shelfColor: url,
          shelfMaterial: mat as any,
          backColor: url,
          backMaterial: mat as any,
          ...(specificThickness ? { backThickness: specificThickness } : {}),
          leftCoverPanel: activeCabinet.leftCoverPanel?.enabled ? {
            ...activeCabinet.leftCoverPanel,
            color: url,
            material: mat as any
          } : undefined,
          rightCoverPanel: activeCabinet.rightCoverPanel?.enabled ? {
            ...activeCabinet.rightCoverPanel,
            color: url,
            material: mat as any
          } : undefined
        });
        break;
      case 'structure':
        updateCabinet(activeCabinetId, { structureColor: url, structureMaterial: mat as any });
        break;
      case 'doors':
        updateCabinet(activeCabinetId, { doorColor: url, doorMaterial: mat as any });
        break;
      case 'drawerFronts':
        updateCabinet(activeCabinetId, { drawerFrontColor: url, drawerFrontMaterial: mat as any });
        break;
      case 'drawerInner':
        updateCabinet(activeCabinetId, { drawerInnerColor: url, drawerInnerMaterial: mat as any });
        break;
      case 'shelves':
        updateCabinet(activeCabinetId, { shelfColor: url, shelfMaterial: mat as any });
        break;
      case 'back':
        updateCabinet(activeCabinetId, { 
          backColor: url, 
          backMaterial: mat,
          backThickness: specificThickness || (mat === 'durolac' ? 3 : 15)
        });
        break;
      case 'socle':
        updateCabinet(activeCabinetId, { socleColor: url, socleMaterial: mat as any });
        break;
      case 'coverPanels':
        updateCabinet(activeCabinetId, {
          leftCoverPanel: activeCabinet.leftCoverPanel?.enabled ? {
            ...activeCabinet.leftCoverPanel,
            color: url,
            material: mat as any
          } : undefined,
          rightCoverPanel: activeCabinet.rightCoverPanel?.enabled ? {
            ...activeCabinet.rightCoverPanel,
            color: url,
            material: mat as any
          } : undefined
        });
        break;
      case 'leftCoverPanel':
        updateCabinet(activeCabinetId, {
          leftCoverPanel: {
            enabled: true,
            extendToFloor: activeCabinet.leftCoverPanel?.extendToFloor ?? false,
            color: url,
            material: mat as any,
            thickness: activeCabinet.leftCoverPanel?.thickness
          }
        });
        break;
      case 'rightCoverPanel':
        updateCabinet(activeCabinetId, {
          rightCoverPanel: {
            enabled: true,
            extendToFloor: activeCabinet.rightCoverPanel?.extendToFloor ?? false,
            color: url,
            material: mat as any,
            thickness: activeCabinet.rightCoverPanel?.thickness
          }
        });
        break;
    }
  };

  const approvedBackofficeTextures = (adminTextures || [])
    .filter((t) => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus))
    .filter((t) => {
      const n = (t.name || '').toLowerCase();
      const b = (t.brand || '').toLowerCase();
      const p = (t.providerName || '').toLowerCase();
      return !n.includes('qstone') && !b.includes('qstone') && !p.includes('qstone') && !b.includes('sysprotec') && t.category !== 'piedras_marmoles';
    })
    .map((t) => ({
      id: t.id,
      name: t.name.toLowerCase().includes((t.brand || '').toLowerCase()) ? t.name : `${t.brand ? t.brand + ' ' : ''}${t.name}`,
      url: t.url || t.previewUrl || '#CCCCCC',
      brand: t.brand || t.providerName,
      providerName: t.providerName,
      category: t.category,
      thicknessMm: t.thicknessMm || (t.category === 'hpl_autor' ? 0.9 : (t.name?.includes('15') ? 15 : 18)),
      sheetFormat: t.sheetFormat,
      stock: t.stock !== undefined ? t.stock : 30
    }));

  const allTextures = approvedBackofficeTextures;
  const isMasisaItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = ((t as any).brand || '').toLowerCase();
    const p = ((t as any).providerName || '').toLowerCase();
    return n.includes('masisa') || b.includes('masisa') || p.includes('masisa');
  };

  const isAraucoItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = ((t as any).brand || '').toLowerCase();
    const p = ((t as any).providerName || '').toLowerCase();
    return n.includes('arauco') || b.includes('arauco') || p.includes('arauco') || n.includes('vesto') || b.includes('vesto');
  };

  const isRehauItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = ((t as any).brand || '').toLowerCase();
    const p = ((t as any).providerName || '').toLowerCase();
    return n.includes('rehau') || b.includes('rehau') || p.includes('rehau') || n.includes('rauvisio') || b.includes('rauvisio');
  };

  const isAbetItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = ((t as any).brand || '').toLowerCase();
    const p = ((t as any).providerName || '').toLowerCase();
    return n.includes('abet') || b.includes('abet') || p.includes('abet') || n.includes('laminati') || n.includes('hpl') || (t as any).category === 'hpl_autor';
  };

  const masisaTextures = allTextures.filter(t => isMasisaItem(t));
  const araucoTextures = allTextures.filter(t => !isMasisaItem(t) && isAraucoItem(t));
  const rehauTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && isRehauItem(t));
  const abetTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && !isRehauItem(t) && isAbetItem(t));
  const otherTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && !isRehauItem(t) && !isAbetItem(t));

  const variant = activeCabinet.variant || (activeCabinet.width > 60 ? '2_doors' : '1_door');
  const is4Drawers = variant === '4_drawers';
  const is2PotDrawers = variant === '2_pot_drawers';
  const is1Door1Drawer = variant === '1_door_1_drawer';
  const is2Doors = variant === '2_doors' || variant === 'tall_2_doors' || variant === 'wall_2_doors';
  const is1Door = variant === '1_door' || variant === 'wall_1_door' || variant === 'tall_1_door';
  const isSplit2Doors = variant === 'tall_split_2_doors';
  const isLiftUp = variant === 'wall_lift_up';
  const isLiftUpDouble = variant === 'wall_lift_up_double';
  const isOvenMicro = variant === 'tall_oven_micro';
  const isSpiceRack = variant === 'spice_rack';
  const isCornerBlind = variant === 'corner_blind' || variant === 'corner_blind_left' || variant === 'corner_blind_right' || variant?.startsWith('corner_blind') || variant?.startsWith('wall_corner_blind');

  const getElementsList = () => {
    const elements: { id: string; label: string; type: 'door' | 'drawer' }[] = [];
    if (is2Doors) {
      elements.push({ id: 'door-0', label: 'Puerta Izquierda', type: 'door' });
      elements.push({ id: 'door-1', label: 'Puerta Derecha', type: 'door' });
    } else if (is1Door || isCornerBlind) {
      const doorLabel = variant?.startsWith('wall_corner_blind')
        ? 'Puerta Esquinero Aéreo'
        : (isCornerBlind ? 'Puerta Esquinero' : 'Puerta Frontal');
      elements.push({ id: 'door-0', label: doorLabel, type: 'door' });
    } else if (isSplit2Doors) {
      elements.push({ id: 'door-upper', label: 'Puerta Superior', type: 'door' });
      elements.push({ id: 'door-lower', label: 'Puerta Inferior', type: 'door' });
    } else if (isLiftUpDouble) {
      elements.push({ id: 'door-upper', label: 'Pta. Elevable Sup.', type: 'door' });
      elements.push({ id: 'door-lower', label: 'Pta. Elevable Inf.', type: 'door' });
    } else if (variant === 'wall_microwave_niche') {
      elements.push({ id: 'door-top', label: 'Pta. Superior Elevable', type: 'door' });
    } else if (isLiftUp) {
      elements.push({ id: 'door-lift', label: 'Puerta Elevable', type: 'door' });
    } else if (variant === 'corner_l' || variant === 'base_corner_l') {
      elements.push({ id: 'door-0', label: 'Puerta Escuadra 1', type: 'door' });
      elements.push({ id: 'door-1', label: 'Puerta Escuadra 2', type: 'door' });
    } else if (variant === 'sink_u_drawer') {
      elements.push({ id: 'drawer-0', label: 'Cajón en U (Sifón)', type: 'drawer' });
      elements.push({ id: 'drawer-1', label: 'Cacerolero Inferior', type: 'drawer' });
    } else if (variant === 'tall_inner_drawers') {
      elements.push({ id: 'door-0', label: 'Puerta Despensa 155°', type: 'door' });
      elements.push({ id: 'drawer-0', label: 'Cajón Interior 1 (Sup.)', type: 'drawer' });
      elements.push({ id: 'drawer-1', label: 'Cajón Interior 2', type: 'drawer' });
      elements.push({ id: 'drawer-2', label: 'Cajón Interior 3', type: 'drawer' });
      elements.push({ id: 'drawer-3', label: 'Cajón Interior 4 (Inf.)', type: 'drawer' });
    } else if (isOvenMicro || variant === 'tall_oven_vent' || variant === 'tall_microwave_niche') {
      elements.push({ id: 'door-lower', label: 'Puerta Inferior', type: 'door' });
      elements.push({ id: 'door-top', label: 'Puerta Superior', type: 'door' });
    } else if (is1Door1Drawer) {
      elements.push({ id: 'drawer-0', label: 'Cajón Superior', type: 'drawer' });
      elements.push({ id: 'door-0', label: 'Puerta Inferior', type: 'door' });
    } else if (is4Drawers) {
      elements.push({ id: 'drawer-0', label: 'Cajón 1 (Superior)', type: 'drawer' });
      elements.push({ id: 'drawer-1', label: 'Cajón 2', type: 'drawer' });
      elements.push({ id: 'drawer-2', label: 'Cajón 3', type: 'drawer' });
      elements.push({ id: 'drawer-3', label: 'Cajón 4 (Inferior)', type: 'drawer' });
    } else if (is2PotDrawers) {
      elements.push({ id: 'drawer-0', label: 'Cacerolero Superior', type: 'drawer' });
      elements.push({ id: 'drawer-1', label: 'Cacerolero Inferior', type: 'drawer' });
    } else if (isSpiceRack) {
      elements.push({ id: 'drawer-0', label: 'Especiero Extraíble', type: 'drawer' });
    } else if (activeCabinet.type === 'closet' || activeCabinet.variant?.startsWith('closet_')) {
      const isClosetDoors = Boolean(activeCabinet.hasDoors || activeCabinet.variant === 'closet_2_doors' || activeCabinet.variant === 'closet_inner_drawers');
      if (isClosetDoors) {
        if (activeCabinet.width > 50) {
          elements.push({ id: 'door-0', label: 'Puerta Izquierda', type: 'door' });
          elements.push({ id: 'door-1', label: 'Puerta Derecha', type: 'door' });
        } else {
          elements.push({ id: 'door-0', label: 'Puerta Clóset', type: 'door' });
        }
      }
      const effDrawersCount = activeCabinet.drawersCount !== undefined 
        ? activeCabinet.drawersCount 
        : (activeCabinet.variant === 'closet_drawers' ? 4 : (activeCabinet.variant === 'closet_mixed' || activeCabinet.variant === 'closet_inner_drawers' ? 3 : (activeCabinet.variant === 'closet_2_doors' ? 2 : 0)));
      for (let i = 0; i < effDrawersCount; i++) {
        elements.push({ id: `drawer-${i}`, label: `Cajón ${i + 1}`, type: 'drawer' });
      }
    }
    return elements;
  };

  const interactiveElements = getElementsList();
  const hasInteractiveElements = !isDecoration && interactiveElements.length > 0;
  const anyElementOpen = interactiveElements.some(el => isElementOpen(el.id));

  const renderTextureButton = (tex: any) => {
    const is15 = tex.thicknessMm === 15;
    const is18 = tex.thicknessMm === 18;
    const isOutOfStock = tex.stock !== undefined && tex.stock <= 0;
    const stockCount = tex.stock !== undefined ? tex.stock : 30;
    const isRehau = isRehauItem(tex);
    const finishLower = (tex.finish || '').toLowerCase();
    const isExtraMate = finishLower.includes('mate') || finishLower.includes('matt');
    const isExtraBrillo = finishLower.includes('brillo') || finishLower.includes('brilliant') || finishLower.includes('gloss');

    const handleButtonClick = () => {
      if (isOutOfStock) {
        setModuleStockAlert({ textureName: tex.name, stock: 0 });
        return;
      }
      const isBack = targetZone === 'back';
      const specificMat = isBack ? (tex.category === 'hpl_autor' ? 'hpl' : 'melamina') : undefined;
      handleApplyTexture(tex.url, tex.name, tex.thicknessMm, specificMat);
    };

    return (
      <div key={tex.id} className="relative group">
        <button 
          type="button"
          disabled={isOutOfStock}
          onClick={handleButtonClick}
          className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-all w-full border relative ${
            isOutOfStock
              ? 'opacity-35 grayscale cursor-not-allowed bg-zinc-900/60 border-dashed border-red-500/50'
              : isLight
                ? 'bg-white border-slate-200 hover:border-orange-500 shadow-sm cursor-pointer'
                : 'bg-white/5 border-white/10 hover:border-orange-500/60 cursor-pointer'
          }`}
          title={
            isOutOfStock
              ? `${tex.name} - SIN STOCK (0 planchas registradas)`
              : `${tex.name} ${tex.finish ? `[${tex.finish}]` : ''} ${tex.thicknessMm ? `[${tex.thicknessMm}mm]` : ''} [Stock: ${stockCount} planchas]`
          }
        >
          {isOutOfStock ? (
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-extrabold uppercase shadow-xs z-10 bg-red-600 text-white">
              SIN STOCK
            </span>
          ) : stockCount <= 10 ? (
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold uppercase shadow-xs z-10 bg-amber-500/90 text-black">
              {stockCount}
            </span>
          ) : null}

          {/* Badge de Acabado Específico (Extra Mate / Extra Brillo) */}
          {(isExtraMate || isExtraBrillo) && (
            <span className={`absolute top-1 left-1 px-1 py-0.2 rounded text-[6.5px] font-mono font-extrabold uppercase shadow-xs z-10 ${
              isExtraBrillo
                ? 'bg-cyan-400 text-black'
                : 'bg-purple-600 text-white'
            }`}>
              {isExtraBrillo ? 'EXTRA BRILLO' : 'EXTRA MATE'}
            </span>
          )}

          {tex.thicknessMm && (
            <span
              className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[7px] font-mono font-extrabold uppercase shadow-xs z-10 ${
                isOutOfStock
                  ? 'bg-zinc-800 text-zinc-500'
                  : is15
                  ? 'bg-blue-600 text-white'
                  : is18
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-700 text-zinc-200'
              }`}
            >
              {tex.thicknessMm}mm
            </span>
          )}
          <div 
            className={`w-full aspect-square rounded-md border bg-cover bg-center ${
              isOutOfStock
                ? 'border-red-500/20'
                : isLight ? 'border-slate-300 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/20 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]'
            }`}
            style={tex.url.startsWith('#') ? { backgroundColor: tex.url } : { backgroundImage: `url('${tex.url}')` }}
          />

          {/* Indicador de Tapacanto 1mm para Rehau Rauvisio */}
          {isRehau && (
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="text-[6.5px] font-mono font-bold text-purple-400 uppercase tracking-tighter">
                Canteado 1mm
              </span>
              <span className="text-[6.5px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                2800x1220
              </span>
            </div>
          )}

          <span className={`text-[8px] uppercase tracking-wider truncate w-full text-center ${
            isOutOfStock ? 'text-red-400/80 line-through' : isLight ? 'text-slate-600 font-bold' : 'text-slate-400'
          }`}>
            {tex.name.length > 14 ? tex.name.substring(0, 14) + '...' : tex.name}
          </span>
        </button>
      </div>
    );
  };

  const getModuleTitle = () => {
    if (activeCabinet.variant?.startsWith('corner_blind')) return 'Esquinero Ciego';
    if (activeCabinet.variant === 'tall_1_door') return 'Despensa 1 Puerta Larga';
    if (activeCabinet.variant === 'tall_split_2_doors') return 'Despensa 2 Puertas (Línea Base)';
    if (activeCabinet.variant === 'tall_oven_micro') return 'Torre Horno + Micro Empotrado';
    if (activeCabinet.variant === 'tall_microwave_niche') return 'Torre Nicho Micro Portátil';
    if (activeCabinet.variant === 'tall_open') return 'Despensa Abierta (Repisas)';
    if (activeCabinet.variant === 'tall_2_doors') return 'Despensa 2 Puertas Batientes';
    if (activeCabinet.variant === 'wall_1_door') return 'Mueble Aéreo 1 Puerta';
    if (activeCabinet.variant === 'wall_2_doors') return 'Mueble Aéreo 2 Puertas';
    if (activeCabinet.variant === 'wall_lift_up') return 'Aéreo Puerta Elevable Aventos';
    if (activeCabinet.variant === 'wall_lift_up_double') return 'Aéreo Doble Puerta Elevable';
    if (activeCabinet.variant === 'wall_microwave_niche') return 'Aéreo Nicho Micro + Puerta';
    if (activeCabinet.variant === 'wall_open') return 'Aéreo Repisas a la Vista';
    if (activeCabinet.variant === 'closet_hanger') return 'Clóset Barra + Maletero';
    if (activeCabinet.variant === 'closet_mixed') return 'Clóset Mixto (Barra + Cajones)';
    if (activeCabinet.variant === 'closet_shelves') return 'Clóset Lencero (Repisas)';
    if (activeCabinet.variant === 'closet_drawers') return 'Clóset Cajonera';
    if (activeCabinet.variant === 'closet_2_doors') return 'Clóset 2 Puertas Batientes';
    if (activeCabinet.variant === 'closet_walkin') return 'Walk-in Closet Abierto';
    if (activeCabinet.variant === 'closet_inner_drawers') return 'Clóset 2 Ptas + Cajones Ocultos';
    if (activeCabinet.type === 'closet') return 'Clóset Modular';
    return activeCabinet.variant || activeCabinet.type;
  };

  return (
    <div className={`w-full border rounded-2xl overflow-hidden flex flex-col transition-all mb-4 ${
      inline
        ? isLight
          ? 'bg-slate-50/80 border-slate-200 shadow-sm text-slate-800'
          : 'bg-white/[0.04] border-white/10 shadow-lg text-white'
        : isLight
          ? 'absolute top-6 right-6 w-80 max-h-[calc(100vh-100px)] backdrop-blur-xl bg-white/95 border-slate-200 shadow-2xl shadow-slate-300 text-slate-800 z-50'
          : 'absolute top-6 right-6 w-80 max-h-[calc(100vh-100px)] backdrop-blur-xl bg-[#141416]/95 border-white/10 shadow-2xl shadow-black/80 text-white z-50'
    }`}>
      {/* Header integrado de Mueble Activo Individual */}
      <div className={`px-3.5 py-2.5 border-b flex flex-col gap-1.5 shrink-0 ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#161618]'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] bg-orange-500 text-black shrink-0">
              MOD {cabinetIndex >= 0 ? cabinetIndex + 1 : '1'}
            </span>
            <span className={`truncate font-bold text-xs uppercase tracking-wide ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {getModuleTitle()}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              type="button"
              onClick={globalStore.toggleDimensions}
              title={globalStore.showDimensions ? "Ocultar Cotas y Medidas" : "Mostrar Cotas y Medidas"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                globalStore.showDimensions
                  ? 'bg-orange-500 text-black shadow-xs font-bold'
                  : isLight ? 'text-slate-600 hover:text-orange-600 hover:bg-slate-200/80' : 'text-zinc-400 hover:text-orange-400 hover:bg-white/10'
              }`}
            >
              <Ruler size={14} />
            </button>
            <button 
              type="button"
              onClick={() => {
                const currentRot = activeCabinet.rotation || 0;
                const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                updateCabinet(activeCabinet.id, { rotation: nextRot });
              }}
              title="Girar 90°"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-cyan-600 hover:bg-slate-200/80' : 'text-zinc-400 hover:text-cyan-400 hover:bg-white/10'
              }`}
            >
              <RotateCw size={14} />
            </button>
            <button 
              type="button"
              onClick={() => {
                setToolMode('move_active');
                setViewMode('3d');
              }}
              title="Mover posición"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-orange-600 hover:bg-slate-200/80' : 'text-zinc-400 hover:text-orange-400 hover:bg-white/10'
              }`}
            >
              <Move3D size={14} />
            </button>
            <button 
              type="button"
              onClick={() => removeCabinet(activeCabinet.id)} 
              title="Eliminar Módulo"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-100' : 'text-zinc-400 hover:text-rose-400 hover:bg-white/10'
              }`}
            >
              <Trash2 size={14} />
            </button>
            <button 
              type="button"
              onClick={() => setActiveCabinet(null)} 
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs' 
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
              }`}
              title="Deseleccionar Módulo y volver a vista general"
            >
              <X size={12} />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Indicador de edición local en cabecera */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
          <span className={`font-bold uppercase tracking-wider ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
            Modo Individual
          </span>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            — Los cambios aplican solo a este mueble
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">

        {/* ACORDEÓN 1: DIMENSIONES Y POSICIÓN */}
        <AccordionSection
          id="dimensions"
          title="Dimensiones y Posición"
          icon={SlidersHorizontal}
          badge={
            <span className="font-mono text-orange-500 font-extrabold">
              {Math.round(activeCabinet.width * 10)} × {Math.round(activeCabinet.height * 10)} × {Math.round(activeCabinet.depth * 10)} mm
            </span>
          }
          isOpen={openSections.dimensions}
          onToggle={() => toggleSection('dimensions')}
          isLight={isLight}
        >

          {(activeCabinet.variant?.startsWith('corner_blind') || activeCabinet.variant === 'corner_blind' || activeCabinet.variant?.startsWith('wall_corner_blind')) && (
            <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
              <label className={`text-[10px] uppercase tracking-wider font-bold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                Mano / Orientación Esquinero
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateCabinet(activeCabinet.id, { 
                    variant: activeCabinet.type === 'wall' ? 'wall_corner_blind_right' : 'corner_blind_right' 
                  })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    (!activeCabinet.variant.endsWith('_left'))
                      ? 'bg-orange-500 text-black shadow-xs font-extrabold'
                      : isLight
                        ? 'bg-white text-slate-700 border border-slate-200 hover:border-orange-500'
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                  }`}
                >
                  Derecho (Ciego Der)
                </button>
                <button
                  type="button"
                  onClick={() => updateCabinet(activeCabinet.id, { 
                    variant: activeCabinet.type === 'wall' ? 'wall_corner_blind_left' : 'corner_blind_left' 
                  })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    (activeCabinet.variant.endsWith('_left'))
                      ? 'bg-orange-500 text-black shadow-xs font-extrabold'
                      : isLight
                        ? 'bg-white text-slate-700 border border-slate-200 hover:border-orange-500'
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                  }`}
                >
                  Izquierdo (Ciego Izq)
                </button>
              </div>

              {/* Botón de Enrase y Tope a Esquina de Muro */}
              <button
                type="button"
                onClick={handleSnapToCorner}
                className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                  isLight
                    ? 'bg-orange-500 hover:bg-orange-600 text-black border-orange-600'
                    : 'bg-orange-500 hover:bg-orange-400 text-black border-orange-400'
                }`}
                title="Ajustar y enrasar el mueble esquinero contra el muro de fondo / perpendicular de la esquina"
              >
                <Maximize2 size={13} />
                <span>Ajustar a Esquina de Muro (Tope a Fondo)</span>
              </button>

              {/* Ajuste Independiente de Zona Ciega y Puerta */}
              <div className={`mt-1 pt-2 border-t flex flex-col gap-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isLight ? 'text-slate-800' : 'text-orange-400'}`}>
                    Anchos Independientes (Ciego / Puerta)
                  </span>
                </div>

                {/* 1. Ancho Zona Ciega */}
                <DimensionMmControl
                  isLight={isLight}
                  label="Ancho Zona Ciega (Fondo a 90°)"
                  valueCm={activeCabinet.blindWidth && activeCabinet.blindWidth > 0 ? activeCabinet.blindWidth : (activeCabinet.width >= 100 ? 60 : Math.round(activeCabinet.width / 2))}
                  minCm={40}
                  maxCm={90}
                  stepMm={1}
                  onChangeCm={(val) => {
                    handleUpdateCornerBlind({ newBlindWidth: val });
                  }}
                />
                <div className={`text-[9px] -mt-1.5 font-medium leading-tight ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  💡 Se sincroniza automáticamente con la profundidad del mueble perpendicular para un encuentro Gola exacto a 90°.
                </div>

                {/* 2. Ancho Puerta Batiente */}
                <DimensionMmControl
                  isLight={isLight}
                  label="Ancho Puerta Batiente (Frente Útil)"
                  valueCm={Math.max(15, activeCabinet.width - (activeCabinet.blindWidth && activeCabinet.blindWidth > 0 ? activeCabinet.blindWidth : (activeCabinet.width >= 100 ? 60 : Math.round(activeCabinet.width / 2))))}
                  minCm={25}
                  maxCm={75}
                  stepMm={1}
                  onChangeCm={(val) => {
                    handleUpdateCornerBlind({ newDoorWidth: val });
                  }}
                />
              </div>
            </div>
          )}

          {/* ELEVACIÓN EN MURO (MUEBLES AÉREOS) */}
          {activeCabinet.type === 'wall' && (
            <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
              <div className={`flex justify-between items-center text-xs tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
                <span className={isLight ? "font-bold text-slate-800" : "font-semibold"}>Elevación en Muro (Cota Inf.)</span>
                <span className={`font-mono font-bold text-xs ${isLight ? 'text-orange-600' : 'text-orange-500'}`}>
                  {Math.round(activeCabinet.position[1] - activeCabinet.height / 2)} cm
                </span>
              </div>
              <input 
                type="range" 
                min={110} 
                max={180} 
                step={2}
                value={Math.round(activeCabinet.position[1] - activeCabinet.height / 2)} 
                onChange={(e) => {
                  const newBottom = Number(e.target.value);
                  updateCabinet(activeCabinet.id, {
                    position: [activeCabinet.position[0], newBottom + activeCabinet.height / 2, activeCabinet.position[2]]
                  });
                }}
                className="w-full cursor-pointer accent-orange-500" 
              />
            </div>
          )}

          {/* DIMENSIONES DEL MÓDULO (PRECISIÓN MM Y TECLADO) */}
          <div className="flex flex-col gap-2.5">
            {/* Ancho */}
            <DimensionMmControl
              isLight={isLight}
              label={
                activeCabinet.variant?.startsWith('corner_blind') || activeCabinet.variant === 'corner_blind'
                  ? 'Ancho Total Módulo (Ciego + Puerta)'
                  : activeCabinet.variant === 'tall_terminal_shelves'
                  ? 'Ancho (Largo Lateral / Cubre Muro)'
                  : 'Ancho'
              }
              valueCm={activeCabinet.width}
              minCm={
                activeCabinet.variant === "spice_rack" ? 15 : 
                activeCabinet.variant === 'tall_terminal_shelves' ? 40 :
                activeCabinet.variant?.includes('wine_rack') ? 15 :
                activeCabinet.variant?.startsWith('wall_corner_blind') ? 60 :
                (activeCabinet.variant?.startsWith('corner_blind') ? 80 : 30)
              }
              maxCm={
                activeCabinet.variant === "spice_rack" ? 30 :
                activeCabinet.variant === 'tall_terminal_shelves' ? 120 :
                activeCabinet.variant?.includes('wine_rack') ? 65 :
                activeCabinet.variant?.startsWith('wall_corner_blind') ? 100 :
                activeCabinet.variant?.startsWith('corner_blind') ? 160 :
                (activeCabinet.variant === '1_door' ||
                 activeCabinet.variant === '1_door_1_drawer' ||
                 activeCabinet.variant === 'tall_1_door' ||
                 activeCabinet.variant === 'tall_split_2_doors' ||
                 activeCabinet.variant === 'tall_inner_drawers' ||
                 activeCabinet.variant === 'tall_oven_micro' ||
                 activeCabinet.variant === 'tall_oven_vent' ||
                 activeCabinet.variant === 'tall_microwave_niche') ? 60 : 120
              }
              stepMm={1}
              onChangeCm={(val) => {
                if (activeCabinet.variant?.startsWith('corner_blind') || activeCabinet.variant === 'corner_blind') {
                  handleUpdateCornerBlind({ newTotalWidth: val });
                  return;
                }
                const patch: Partial<CabinetType> = { width: val };
                if (val > 60) {
                  if (activeCabinet.variant === 'wall_1_door') patch.variant = 'wall_2_doors';
                }
                updateCabinet(activeCabinet.id, patch);
              }}
            />

            {/* Alto Total */}
            <DimensionMmControl
              isLight={isLight}
              label="Alto Total"
              valueCm={activeCabinet.height}
              minCm={activeCabinet.type === 'closet' || activeCabinet.type === 'tall' ? 140 : (activeCabinet.type === 'base' ? 70 : 30)}
              maxCm={activeCabinet.type === 'closet' ? 260 : (activeCabinet.type === 'tall' ? 240 : (activeCabinet.type === 'wall' ? 120 : 100))}
              stepMm={1}
              onChangeCm={(val) => updateCabinet(activeCabinet.id, { height: val })}
            />

            {/* Profundidad */}
            <DimensionMmControl
              isLight={isLight}
              label={activeCabinet.variant === 'tall_terminal_shelves' ? 'Profundidad de Repisas (Saliente)' : 'Profundidad'}
              valueCm={activeCabinet.depth}
              minCm={activeCabinet.variant === 'tall_terminal_shelves' ? 15 : (activeCabinet.type === 'closet' ? 40 : (activeCabinet.type === 'island' ? 30 : 25))}
              maxCm={activeCabinet.variant === 'tall_terminal_shelves' ? 50 : (activeCabinet.type === 'closet' ? 80 : (activeCabinet.type === 'island' ? 120 : 80))}
              stepMm={1}
              onChangeCm={(val) => updateCabinet(activeCabinet.id, { depth: val })}
            />
          </div>

          {/* INFO ESPECÍFICA TORRE TERMINAL REPISAS */}
          {activeCabinet.variant === 'tall_terminal_shelves' && (
            <div className={`p-2.5 rounded-xl border text-xs ${isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'}`}>
              <div className="font-bold mb-1 flex items-center justify-between">
                <span>Torre Terminal Repisas Abiertas:</span>
                <span className="text-amber-500 font-extrabold">{activeCabinet.width} × {activeCabinet.depth} cm</span>
              </div>
              <div className="text-[11px] opacity-90 leading-relaxed">
                • <strong>Ancho:</strong> 40 - 120 cm (ensánchalo para cubrir y tapar el saliente del muro posterior).<br/>
                • <strong>Profundidad:</strong> 15 - 50 cm (fondo útil de las repisas a la vista).<br/>
                • Se adosa magnéticamente a 0 mm al lateral de cualquier despensa.
              </div>
            </div>
          )}

          {/* INFO ESPECÍFICA ESPECIERO */}
          {activeCabinet.variant === 'spice_rack' && (
            <div className={`p-2.5 rounded-xl border text-xs ${isLight ? 'bg-orange-50 border-orange-200 text-orange-950' : 'bg-orange-950/20 border-orange-500/30 text-orange-200'}`}>
              <div className="font-bold mb-1 flex items-center justify-between">
                <span>Especiero Extraíble:</span>
                <span className="text-orange-500 font-extrabold">{activeCabinet.width} cm</span>
              </div>
              <div className="text-[11px] opacity-90 leading-relaxed">
                • Rango normativo: <span className="font-mono font-bold">15 - 30 cm</span><br/>
                • Guías telescópicas laterales + carro melamina 2 niveles
              </div>
            </div>
          )}

          {/* INFO ESPECÍFICA BOTILLERO O ESQUINERO */}
          {activeCabinet.variant?.includes('wine_rack') && (() => {
            const innerW = activeCabinet.width - 3.6;
            const cols = Math.min(5, Math.max(1, Math.floor((innerW + 1.8) / (10.5 + 1.8))));
            const colW = (innerW - (cols - 1) * 1.8) / cols;
            return (
              <div className={`p-2.5 rounded-xl border text-xs ${isLight ? 'bg-orange-50 border-orange-200 text-orange-950' : 'bg-orange-950/20 border-orange-500/30 text-orange-200'}`}>
                <div className="font-bold mb-1 flex items-center justify-between">
                  <span>Distribución Botellero:</span>
                  <span className="text-orange-500 font-extrabold">{cols} {cols === 1 ? 'Corrida' : 'Corridas'}</span>
                </div>
                <div className="text-[11px] opacity-90 leading-relaxed">
                  • Ancho libre por celda: <span className="font-mono font-bold">{colW.toFixed(1)} cm</span><br/>
                  • Fondo útil: <span className="font-mono font-bold">32.0 cm</span>
                </div>
              </div>
            );
          })()}
        </AccordionSection>
        
        {/* ACORDEÓN 2: APERTURA INDIVIDUAL DE PUERTAS Y CAJONES */}
        {hasInteractiveElements && (
          <AccordionSection
            id="mechanisms"
            title="Apertura de Puertas / Cajones"
            icon={DoorOpen}
            badge={
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                anyElementOpen
                  ? (isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400')
                  : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-400')
              }`}>
                {anyElementOpen ? 'Abierto' : 'Cerrado'}
              </span>
            }
            isOpen={openSections.mechanisms}
            onToggle={() => toggleSection('mechanisms')}
            isLight={isLight}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Control Global
              </span>
              <button
                type="button"
                onClick={toggleAllOpen}
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200'
                    : 'bg-white/5 hover:bg-orange-500/20 text-orange-400'
                }`}
                title={anyElementOpen ? "Cerrar todo el módulo" : "Abrir todo el módulo"}
              >
                {anyElementOpen ? <DoorClosed size={12} /> : <DoorOpen size={12} />}
                {anyElementOpen ? 'Cerrar Todo' : 'Abrir Todo'}
              </button>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              {interactiveElements.map((el) => {
                const open = isElementOpen(el.id);
                return (
                  <div
                    key={`open-${el.id}`}
                    onClick={() => toggleElementOpen(el.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer group ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        : 'bg-[#242428] hover:bg-[#2c2c31]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        isLight ? 'text-slate-800 group-hover:text-black' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {el.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all ${
                        open 
                          ? isLight
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : isLight
                            ? 'bg-slate-200 text-slate-600 border border-slate-300'
                            : 'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}>
                        {open ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionSection>
        )}

        {/* ACORDEÓN 3: VETA (GRANO) POR PIEZA */}
        {hasInteractiveElements && (
          <AccordionSection
            id="grain"
            title="Orientación de Veta (Grano)"
            icon={ArrowUpDown}
            badge={
              <span className="font-mono text-orange-500 font-bold text-[10px]">
                {interactiveElements.length} {interactiveElements.length === 1 ? 'Pieza' : 'Piezas'}
              </span>
            }
            isOpen={openSections.grain}
            onToggle={() => toggleSection('grain')}
            isLight={isLight}
          >
            <div className="flex flex-col gap-1">
              {interactiveElements.map((el) => {
                const grain = getGrain(el.id);
                return (
                  <div 
                    key={`grain-${el.id}`}
                    onClick={() => toggleGrain(el.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer group ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        : 'bg-[#242428] hover:bg-[#2c2c31]'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${
                      isLight ? 'text-slate-800 group-hover:text-black' : 'text-zinc-200 group-hover:text-white'
                    }`}>{el.label}</span>
                    <span className={`${isLight ? 'text-orange-600' : 'text-orange-500'} font-bold text-xs tracking-wider flex items-center gap-1.5`}>
                      {grain === 'horizontal' ? (
                        <><ArrowLeftRight size={13} strokeWidth={2.5} /> HORIZ</>
                      ) : (
                        <><ArrowUpDown size={13} strokeWidth={2.5} /> VERT</>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </AccordionSection>
        )}

        {/* ACORDEÓN 4: REPISAS INTERIORES (MÓDULOS CON PUERTA - EXCLUYE CLÓSETS) */}
        {isCabinetWithDoors(activeCabinet) && activeCabinet.type !== 'closet' && !activeCabinet.variant?.startsWith('closet_') && (
          <AccordionSection
            id="shelves"
            title="Repisas Interiores"
            icon={Layers}
            badge={
              <span className="font-mono text-orange-500 font-bold text-[10px]">
                {activeCabinet.shelvesCount !== undefined
                  ? `${activeCabinet.shelvesCount} repisas`
                  : `${getDefaultShelvesCount(activeCabinet)} std`}
              </span>
            }
            isOpen={openSections.shelves}
            onToggle={() => toggleSection('shelves')}
            isLight={isLight}
          >
            {(() => {
          const isSplit = isCabinetWithSplitDoors(activeCabinet);

          if (isSplit) {
            const splitCounts = getSplitCabinetShelvesCounts(activeCabinet);
            const isLower = selectedDoorSection === 'lower';
            const defaultLower = 1;
            let defaultUpper = 3;
            let maxUpper = 6;
            let upperLabel = '(sobre 70cm)';

            if (activeCabinet.variant === 'tall_oven_vent' || activeCabinet.variant === 'tall_oven_micro') {
              defaultUpper = 1;
              maxUpper = 3;
              upperLabel = '(sobre hornos)';
            } else if (activeCabinet.variant === 'tall_microwave_niche') {
              defaultUpper = 2;
              maxUpper = 5;
              upperLabel = '(sobre nicho)';
            }

            const defaultSectionCount = isLower ? defaultLower : defaultUpper;
            const maxSectionCount = isLower ? 4 : maxUpper;
            const currentSectionCount = isLower ? splitCounts.lower : splitCounts.upper;
            const isCustom = isLower
              ? activeCabinet.shelvesCountLower !== undefined
              : activeCabinet.shelvesCountUpper !== undefined;
            const hasAnyCustom =
              activeCabinet.shelvesCountLower !== undefined ||
              activeCabinet.shelvesCountUpper !== undefined ||
              activeCabinet.shelvesCount !== undefined;

            return (
              <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1c1f] border-white/5'
              }`}>
                <div className="flex items-center justify-between px-1">
                  <div className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${
                    isLight ? 'text-slate-600' : 'text-zinc-400'
                  }`}>
                    <Layers size={13} className={isLight ? "text-orange-600" : "text-orange-400"} />
                    <span>
                      {activeCabinet.variant === 'tall_split_2_doors' ? 'Repisas Despensa Dividida' : 'Repisas Módulo 2 Puertas'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    Anti-Colisión
                  </span>
                </div>

                {/* SELECTOR DE PUERTA SUPERIOR / INFERIOR */}
                <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg border ${
                  isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-[#242428] border-white/5'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSelectedDoorSection('lower')}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isLower
                        ? isLight
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'bg-orange-500 text-black shadow-md'
                        : isLight
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Puerta 1 (Inferior)</span>
                    <span className="text-[9px] font-medium opacity-85">
                      {splitCounts.lower} repisa{splitCounts.lower !== 1 ? 's' : ''} (0-70cm)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDoorSection('upper')}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      !isLower
                        ? isLight
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'bg-orange-500 text-black shadow-md'
                        : isLight
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Puerta 2 (Superior)</span>
                    <span className="text-[9px] font-medium opacity-85">
                      {splitCounts.upper} repisa{splitCounts.upper !== 1 ? 's' : ''} {upperLabel}
                    </span>
                  </button>
                </div>

                {/* CONTROL DE CANTIDAD PARA LA SECCIÓN SELECCIONADA */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#242428] border-white/5'
                }`}>
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                      {isLower ? 'Puerta 1: Sección Inferior' : 'Puerta 2: Sección Superior'}
                    </span>
                    <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {currentSectionCount} repisa{currentSectionCount !== 1 ? 's' : ''}{' '}
                      {!isCustom ? `(Estándar: ${defaultSectionCount})` : '(Personalizado)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentSectionCount <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = Math.max(0, currentSectionCount - 1);
                        if (isLower) {
                          updateCabinet(activeCabinet.id, { shelvesCountLower: next });
                        } else {
                          updateCabinet(activeCabinet.id, { shelvesCountUpper: next });
                        }
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                        currentSectionCount <= 0
                          ? isLight ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-zinc-600'
                          : isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                      }`}
                      title="Disminuir repisas"
                    >
                      -
                    </button>

                    <div className={`w-8 text-center font-mono font-bold text-xs ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {currentSectionCount}
                    </div>

                    <button
                      type="button"
                      disabled={currentSectionCount >= maxSectionCount}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = Math.min(maxSectionCount, currentSectionCount + 1);
                        if (isLower) {
                          updateCabinet(activeCabinet.id, { shelvesCountLower: next });
                        } else {
                          updateCabinet(activeCabinet.id, { shelvesCountUpper: next });
                        }
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                        currentSectionCount >= maxSectionCount
                          ? isLight ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-zinc-600'
                          : isLight
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-black'
                      }`}
                      title="Agregar repisas"
                    >
                      +
                    </button>
                  </div>
                </div>

                {hasAnyCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCabinet(activeCabinet.id, {
                        shelvesCount: undefined,
                        shelvesCountLower: undefined,
                        shelvesCountUpper: undefined,
                      });
                    }}
                    className={`text-[9px] text-right font-medium hover:underline cursor-pointer px-1 ${
                      isLight ? 'text-slate-500 hover:text-orange-600' : 'text-zinc-400 hover:text-orange-400'
                    }`}
                  >
                    Restablecer ambas puertas a estándar ({defaultLower} inf + {defaultUpper} sup)
                  </button>
                )}
              </div>
            );
          }

          const defaultShelves = getDefaultShelvesCount(activeCabinet);
          const currentShelvesCount = activeCabinet.shelvesCount !== undefined ? activeCabinet.shelvesCount : defaultShelves;
          return (
            <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1c1f] border-white/5'
            }`}>
              <div className="flex items-center justify-between px-1">
                <div className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  <Layers size={13} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  <span>Repisas Interiores</span>
                </div>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  Anti-Colisión
                </span>
              </div>

              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#242428] border-white/5'
              }`}>
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Cantidad de Repisas
                  </span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {currentShelvesCount} repisa{currentShelvesCount !== 1 ? 's' : ''} {currentShelvesCount === defaultShelves ? '(Estándar)' : '(Personalizado)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentShelvesCount <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = Math.max(0, currentShelvesCount - 1);
                      updateCabinet(activeCabinet.id, { shelvesCount: next });
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                      currentShelvesCount <= 0
                        ? isLight ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-zinc-600'
                        : isLight
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                    }`}
                    title="Disminuir repisas"
                  >
                    -
                  </button>

                  <div className={`w-8 text-center font-mono font-bold text-xs ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {currentShelvesCount}
                  </div>

                  <button
                    type="button"
                    disabled={currentShelvesCount >= 8}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = Math.min(8, currentShelvesCount + 1);
                      updateCabinet(activeCabinet.id, { shelvesCount: next });
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                      currentShelvesCount >= 8
                        ? isLight ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-zinc-600'
                        : isLight
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-black'
                    }`}
                    title="Agregar repisas"
                  >
                    +
                  </button>
                </div>
              </div>

              {activeCabinet.shelvesCount !== undefined && activeCabinet.shelvesCount !== defaultShelves && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCabinet(activeCabinet.id, { shelvesCount: undefined });
                  }}
                  className={`text-[9px] text-right font-medium hover:underline cursor-pointer px-1 ${
                    isLight ? 'text-slate-500 hover:text-orange-600' : 'text-zinc-400 hover:text-orange-400'
                  }`}
                >
                  Restablecer a estándar ({defaultShelves})
                </button>
              )}
            </div>
          );
        })()}
          </AccordionSection>
        )}

        {/* ACORDEÓN ESPECIAL: CONFIGURACIÓN INTERIOR CLÓSET */}
        {(activeCabinet.type === 'closet' || activeCabinet.variant?.startsWith('closet_')) && (
          <AccordionSection
            id="closetConfig"
            title="Configuración de Clóset"
            icon={Box}
            badge={
              <span className="font-mono text-orange-500 font-bold text-[10px]">
                {activeCabinet.drawersCount ?? 0} caj.
              </span>
            }
            isOpen={openSections.closetConfig}
            onToggle={() => toggleSection('closetConfig')}
            isLight={isLight}
          >
            <div className={`flex flex-col gap-3 p-3 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1c1f] border-white/5'
            }`}>
              {/* Repisas Regulables */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>Repisas Interiores</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Maletero + bandejas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCabinet(activeCabinet.id, { shelvesCount: Math.max(0, (activeCabinet.shelvesCount ?? 2) - 1) })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    -
                  </button>
                  <span className={`font-mono font-bold text-xs w-6 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeCabinet.shelvesCount ?? 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCabinet(activeCabinet.id, { shelvesCount: Math.min(8, (activeCabinet.shelvesCount ?? 2) + 1) })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                      isLight ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-black'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cajones Telescópicos */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>Cajonera Inferior</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Correderas telescópicas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCabinet(activeCabinet.id, { drawersCount: Math.max(0, (activeCabinet.drawersCount ?? 0) - 1) })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    -
                  </button>
                  <span className={`font-mono font-bold text-xs w-6 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeCabinet.drawersCount ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCabinet(activeCabinet.id, { drawersCount: Math.min(5, (activeCabinet.drawersCount ?? 0) + 1) })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                      isLight ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-black'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Toggle Barra de Colgar */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>Barra de Colgar Cromada</span>
                <button
                  type="button"
                  onClick={() => updateCabinet(activeCabinet.id, { hasHanger: !Boolean(activeCabinet.hasHanger !== false) })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCabinet.hasHanger !== false
                      ? 'bg-orange-500 text-black shadow-xs font-extrabold'
                      : isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {activeCabinet.hasHanger !== false ? 'Activa' : 'Sin Barra'}
                </button>
              </div>

              {/* Configuración de Zócalo Independiente del Clóset */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Altura Zócalo Clóset
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCabinet(activeCabinet.id, { closetSocleHeight: Math.max(5, (activeCabinet.closetSocleHeight ?? 7) - 1) })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                        isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-mono font-bold text-xs w-10 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeCabinet.closetSocleHeight ?? 7} cm
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCabinet(activeCabinet.id, { closetSocleHeight: Math.min(15, (activeCabinet.closetSocleHeight ?? 7) + 1) })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer ${
                        isLight ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-black'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Acabado del Zócalo del Clóset */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Melamina del Zócalo
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-white/10 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => updateCabinet(activeCabinet.id, { closetSocleColorMode: 'structure' })}
                      className={`px-2 py-1 transition-all cursor-pointer ${
                        (activeCabinet.closetSocleColorMode ?? 'structure') === 'structure'
                          ? 'bg-orange-500 text-black'
                          : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'
                      }`}
                      title="Misma melamina de los laterales y casco"
                    >
                      Laterales
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCabinet(activeCabinet.id, { closetSocleColorMode: 'doors' })}
                      className={`px-2 py-1 transition-all cursor-pointer ${
                        activeCabinet.closetSocleColorMode === 'doors'
                          ? 'bg-orange-500 text-black'
                          : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'
                      }`}
                      title="Misma melamina de las puertas / frentes"
                    >
                      Puertas
                    </button>
                  </div>
                </div>
                <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Laterales al piso y zócalo frontal de melamina (independiente de la cocina).
                </p>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* ACORDEÓN 5: TIRADORES / MANILLAS INDEPENDIENTES DEL MÓDULO */}
        {!isDecoration && (
          <AccordionSection
            id="handles"
            title="Tirador del Módulo"
            icon={SlidersHorizontal}
            badge={
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                activeCabinet.handleConfig
                  ? isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'
                  : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-400'
              }`}>
                {activeCabinet.handleConfig ? 'Personalizado' : 'Global'}
              </span>
            }
            isOpen={openSections.handles}
            onToggle={() => toggleSection('handles')}
            isLight={isLight}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isLight ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                Modo de Asignación
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                activeCabinet.handleConfig
                  ? isLight ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-white/5 text-zinc-400 border border-white/10'
              }`}>
                {activeCabinet.handleConfig ? 'Personalizado' : 'Global (Heredado)'}
              </span>
            </div>

            {/* Selector de Modo: Heredar vs Personalizar */}
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => updateCabinet(activeCabinet.id, { handleConfig: undefined })}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !activeCabinet.handleConfig
                    ? 'bg-orange-500 text-black shadow-sm font-extrabold'
                    : isLight
                      ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-orange-500'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                }`}
              >
                Heredar Global
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activeCabinet.handleConfig) {
                    updateCabinet(activeCabinet.id, {
                      handleConfig: { ...globalHandleConfig }
                    });
                  }
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCabinet.handleConfig
                    ? 'bg-orange-500 text-black shadow-sm font-extrabold'
                    : isLight
                      ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-orange-500'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                }`}
              >
                Personalizar
              </button>
            </div>

            {/* Aviso si sistema Gola activo en módulo base o isla */}
            {golaSystem !== 'none' && (activeCabinet.type === 'base' || activeCabinet.type === 'island') && (
              <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 text-[10px] leading-tight ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-700/50 text-amber-300'
              }`}>
                <div className="flex items-start gap-1.5">
                  <ShieldAlert size={13} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>Perfil Gola activo (los tiradores frontales quedan ocultos).</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGolaSystem('none')}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[9px] uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
                >
                  Quitar Gola
                </button>
              </div>
            )}

            {/* Panel de Configuración de Tirador cuando está Personalizado */}
            {activeCabinet.handleConfig && (() => {
              const currentHConfig = activeCabinet.handleConfig;
              const selectedModelItem = HANDLE_CATALOG.find((m) => m.id === currentHConfig.model) || HANDLE_CATALOG[0];

              const onSelectModel = (modelId: HandleModelId) => {
                const item = HANDLE_CATALOG.find((m) => m.id === modelId);
                if (!item) return;
                const newFinish = item.finishes.includes(currentHConfig.finish)
                  ? currentHConfig.finish
                  : item.finishes[0] || 'negro';
                const newLength = item.lengths.includes(currentHConfig.lengthMm)
                  ? currentHConfig.lengthMm
                  : item.lengths[0] || 0;
                if (golaSystem !== 'none') {
                  setGolaSystem('none');
                }
                updateCabinet(activeCabinet.id, {
                  handleConfig: {
                    model: modelId,
                    finish: newFinish,
                    lengthMm: newLength,
                    orientation: currentHConfig.orientation || 'auto'
                  }
                });
              };

              const onSelectFinish = (finish: HandleFinish) => {
                updateCabinet(activeCabinet.id, {
                  handleConfig: {
                    ...currentHConfig,
                    finish
                  }
                });
              };

              const onSelectLength = (len: number) => {
                updateCabinet(activeCabinet.id, {
                  handleConfig: {
                    ...currentHConfig,
                    lengthMm: len
                  }
                });
              };

              return (
                <div className={`flex flex-col gap-3 p-2.5 rounded-xl border mt-1 ${
                  isLight ? 'bg-orange-50/40 border-orange-200' : 'bg-black/40 border-orange-500/30'
                }`}>
                  {/* Selector de Modelos */}
                  <div>
                    <label className={`text-[9px] uppercase tracking-wider font-bold mb-1.5 block ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      Modelo de Tirador
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {HANDLE_CATALOG.map((item) => {
                        const isSelected = currentHConfig.model === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectModel(item.id)}
                            className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer relative ${
                              isSelected
                                ? isLight
                                  ? 'bg-orange-100 border-orange-500 shadow-sm text-orange-950 font-bold'
                                  : 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                                : isLight
                                  ? 'bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50 text-slate-800'
                                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] truncate">{item.name}</span>
                              {isSelected && (
                                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center text-black shrink-0">
                                  <Check size={9} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] opacity-75 capitalize">{item.material}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {currentHConfig.model !== 'none' && (
                    <>
                      {/* Acabado / Color */}
                      {selectedModelItem.finishes.length > 0 && (
                        <div>
                          <label className={`text-[9px] uppercase tracking-wider font-bold mb-1.5 block ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}>
                            Acabado ({selectedModelItem.finishes.length})
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {selectedModelItem.finishes.map((finishKey) => {
                              const isSelected = currentHConfig.finish === finishKey;
                              const hex = FINISH_HEX[finishKey];
                              const label = FINISH_LABELS[finishKey];
                              return (
                                <button
                                  key={finishKey}
                                  type="button"
                                  onClick={() => onSelectFinish(finishKey)}
                                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? isLight
                                        ? 'bg-orange-100 border-orange-500 ring-1 ring-orange-500'
                                        : 'bg-orange-500/20 border-orange-500 ring-1 ring-orange-500'
                                      : isLight
                                        ? 'bg-white border-slate-200 hover:border-slate-300'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-inner"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span className={`text-[10px] font-semibold truncate ${
                                    isSelected
                                      ? isLight ? 'text-orange-950 font-bold' : 'text-orange-400 font-bold'
                                      : isLight ? 'text-slate-700' : 'text-slate-300'
                                  }`}>
                                    {label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Medidas / Entrecentros */}
                      {selectedModelItem.lengths.length > 0 && (
                        <div>
                          <label className={`text-[9px] uppercase tracking-wider font-bold mb-1.5 block ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}>
                            Entrecentros / Medida
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedModelItem.lengths.map((len) => {
                              const isSelected = currentHConfig.lengthMm === len;
                              return (
                                <button
                                  key={len}
                                  type="button"
                                  onClick={() => onSelectLength(len)}
                                  className={`py-1 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-500 text-black shadow-sm font-extrabold'
                                      : isLight
                                        ? 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:border-orange-500/50'
                                  }`}
                                >
                                  {len === 0 ? 'Punto Único' : `${len} mm`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Botón para restablecer */}
                  <button
                    type="button"
                    onClick={() => updateCabinet(activeCabinet.id, { handleConfig: undefined })}
                    className={`text-[9px] text-right font-medium hover:underline cursor-pointer px-1 pt-1 ${
                      isLight ? 'text-slate-500 hover:text-orange-600' : 'text-zinc-400 hover:text-orange-400'
                    }`}
                  >
                    Restablecer a Tirador Global del Proyecto
                  </button>
                </div>
              );
            })()}
          </AccordionSection>
        )}

        {/* ACORDEÓN 6: TAPAS LATERALES VISTAS (COSTADOS DECORATIVOS) */}
        {!isDecoration && (
          <AccordionSection
            id="coverPanels"
            title="Tapas Laterales Vistas"
            icon={Box}
            badge={
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                (activeCabinet.leftCoverPanel?.enabled && activeCabinet.rightCoverPanel?.enabled)
                  ? isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'
                  : (activeCabinet.leftCoverPanel?.enabled || activeCabinet.rightCoverPanel?.enabled)
                    ? isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'
                    : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-400'
              }`}>
                {activeCabinet.leftCoverPanel?.enabled && activeCabinet.rightCoverPanel?.enabled
                  ? 'Ambas Tapas'
                  : activeCabinet.leftCoverPanel?.enabled
                    ? 'Solo Izq'
                    : activeCabinet.rightCoverPanel?.enabled
                      ? 'Solo Der'
                      : 'Sin Tapas'}
              </span>
            }
            isOpen={openSections.coverPanels}
            onToggle={() => toggleSection('coverPanels')}
            isLight={isLight}
          >

            {/* Presets Rápidos */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'none', label: 'Ninguna', l: false, r: false },
                { id: 'left', label: 'Solo Izq', l: true, r: false },
                { id: 'right', label: 'Solo Der', l: false, r: true },
                { id: 'both', label: 'Ambas', l: true, r: true },
              ].map(preset => {
                const isActive = (preset.l === !!activeCabinet.leftCoverPanel?.enabled) && (preset.r === !!activeCabinet.rightCoverPanel?.enabled);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      updateCabinet(activeCabinet.id, {
                        leftCoverPanel: preset.l ? {
                          enabled: true,
                          extendToFloor: activeCabinet.leftCoverPanel?.extendToFloor ?? false,
                          color: activeCabinet.leftCoverPanel?.color,
                          material: activeCabinet.leftCoverPanel?.material,
                          thickness: activeCabinet.leftCoverPanel?.thickness,
                        } : { enabled: false },
                        rightCoverPanel: preset.r ? {
                          enabled: true,
                          extendToFloor: activeCabinet.rightCoverPanel?.extendToFloor ?? false,
                          color: activeCabinet.rightCoverPanel?.color,
                          material: activeCabinet.rightCoverPanel?.material,
                          thickness: activeCabinet.rightCoverPanel?.thickness,
                        } : { enabled: false }
                      });
                    }}
                    className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all text-center cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-black shadow-sm font-extrabold'
                        : isLight
                          ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-orange-500'
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Panel Izquierdo */}
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
              activeCabinet.leftCoverPanel?.enabled
                ? isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-white/[0.03] border-orange-500/30'
                : isLight ? 'bg-slate-50/60 border-slate-200 opacity-80' : 'bg-white/[0.01] border-white/5 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!activeCabinet.leftCoverPanel?.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      updateCabinet(activeCabinet.id, {
                        leftCoverPanel: enabled ? {
                          enabled: true,
                          extendToFloor: activeCabinet.leftCoverPanel?.extendToFloor ?? false,
                          color: activeCabinet.leftCoverPanel?.color,
                          material: activeCabinet.leftCoverPanel?.material,
                          thickness: activeCabinet.leftCoverPanel?.thickness
                        } : { enabled: false }
                      });
                    }}
                    className="accent-orange-500 w-3.5 h-3.5 cursor-pointer rounded"
                  />
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Tapa Lateral Izquierda
                  </span>
                </label>
                {activeCabinet.leftCoverPanel?.enabled && (
                  <span className="text-[9px] font-semibold text-orange-600 bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    {activeCabinet.leftCoverPanel.color ? 'Personalizado' : 'Igual a Puertas'}
                  </span>
                )}
              </div>

              {activeCabinet.leftCoverPanel?.enabled && (
                <div className="flex flex-col gap-2 pt-1 border-t border-dashed border-slate-200 dark:border-white/10">
                  {/* Selector rápido de acabado */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        updateCabinet(activeCabinet.id, {
                          leftCoverPanel: {
                            ...activeCabinet.leftCoverPanel,
                            enabled: true,
                            color: undefined,
                            material: undefined
                          }
                        });
                      }}
                      className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        !activeCabinet.leftCoverPanel.color
                          ? 'bg-orange-500 text-black font-extrabold'
                          : isLight ? 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400' : 'bg-white/5 border border-white/10 text-zinc-300'
                      }`}
                    >
                      Color de Puertas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetZone('leftCoverPanel');
                        setOpenSections(prev => ({ ...prev, finishes: true }));
                      }}
                      className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        activeCabinet.leftCoverPanel.color
                          ? 'bg-orange-500 text-black font-extrabold'
                          : isLight ? 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400' : 'bg-white/5 border border-white/10 text-zinc-300'
                      }`}
                    >
                      Elegir del Catálogo
                    </button>
                  </div>

                  {/* Extensión al suelo para muebles de piso */}
                  {(activeCabinet.type === 'base' || activeCabinet.type === 'tall' || activeCabinet.type === 'island' || activeCabinet.type === 'closet') && (
                    <label className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/60 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer">
                      <span className={`text-[10px] font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Extender hasta el piso (Tapa zócalo)
                      </span>
                      <input
                        type="checkbox"
                        checked={!!activeCabinet.leftCoverPanel.extendToFloor}
                        onChange={(e) => {
                          updateCabinet(activeCabinet.id, {
                            leftCoverPanel: {
                              ...activeCabinet.leftCoverPanel,
                              enabled: true,
                              extendToFloor: e.target.checked
                            }
                          });
                        }}
                        className="accent-orange-500 w-3.5 h-3.5 cursor-pointer rounded"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Panel Derecho */}
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
              activeCabinet.rightCoverPanel?.enabled
                ? isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-white/[0.03] border-orange-500/30'
                : isLight ? 'bg-slate-50/60 border-slate-200 opacity-80' : 'bg-white/[0.01] border-white/5 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!activeCabinet.rightCoverPanel?.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      updateCabinet(activeCabinet.id, {
                        rightCoverPanel: enabled ? {
                          enabled: true,
                          extendToFloor: activeCabinet.rightCoverPanel?.extendToFloor ?? false,
                          color: activeCabinet.rightCoverPanel?.color,
                          material: activeCabinet.rightCoverPanel?.material,
                          thickness: activeCabinet.rightCoverPanel?.thickness
                        } : { enabled: false }
                      });
                    }}
                    className="accent-orange-500 w-3.5 h-3.5 cursor-pointer rounded"
                  />
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Tapa Lateral Derecha
                  </span>
                </label>
                {activeCabinet.rightCoverPanel?.enabled && (
                  <span className="text-[9px] font-semibold text-orange-600 bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    {activeCabinet.rightCoverPanel.color ? 'Personalizado' : 'Igual a Puertas'}
                  </span>
                )}
              </div>

              {activeCabinet.rightCoverPanel?.enabled && (
                <div className="flex flex-col gap-2 pt-1 border-t border-dashed border-slate-200 dark:border-white/10">
                  {/* Selector rápido de acabado */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        updateCabinet(activeCabinet.id, {
                          rightCoverPanel: {
                            ...activeCabinet.rightCoverPanel,
                            enabled: true,
                            color: undefined,
                            material: undefined
                          }
                        });
                      }}
                      className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        !activeCabinet.rightCoverPanel.color
                          ? 'bg-orange-500 text-black font-extrabold'
                          : isLight ? 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400' : 'bg-white/5 border border-white/10 text-zinc-300'
                      }`}
                    >
                      Color de Puertas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetZone('rightCoverPanel');
                        setOpenSections(prev => ({ ...prev, finishes: true }));
                      }}
                      className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        activeCabinet.rightCoverPanel.color
                          ? 'bg-orange-500 text-black font-extrabold'
                          : isLight ? 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400' : 'bg-white/5 border border-white/10 text-zinc-300'
                      }`}
                    >
                      Elegir del Catálogo
                    </button>
                  </div>

                  {/* Extensión al suelo para muebles de piso */}
                  {(activeCabinet.type === 'base' || activeCabinet.type === 'tall' || activeCabinet.type === 'island' || activeCabinet.type === 'closet') && (
                    <label className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/60 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer">
                      <span className={`text-[10px] font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Extender hasta el piso (Tapa zócalo)
                      </span>
                      <input
                        type="checkbox"
                        checked={!!activeCabinet.rightCoverPanel.extendToFloor}
                        onChange={(e) => {
                          updateCabinet(activeCabinet.id, {
                            rightCoverPanel: {
                              ...activeCabinet.rightCoverPanel,
                              enabled: true,
                              extendToFloor: e.target.checked
                            }
                          });
                        }}
                        className="accent-orange-500 w-3.5 h-3.5 cursor-pointer rounded"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Control de Profundidad / Voladizo para Isla con Regla Punteada */}
            {activeCabinet.type === 'island' && (activeCabinet.leftCoverPanel?.enabled || activeCabinet.rightCoverPanel?.enabled) && (() => {
              const minDepth = activeCabinet.depth || 60;
              const overhang = countertopConfig.islandOverhangCm ?? 30;
              const maxDepth = minDepth + overhang;
              const currentSideDepth = activeCabinet.leftCoverPanel?.depth || activeCabinet.rightCoverPanel?.depth || islandBackConfig.sideDepthCm || minDepth;

              const handleDepthChange = (newDepth: number) => {
                updateCabinet(activeCabinet.id, {
                  leftCoverPanel: activeCabinet.leftCoverPanel?.enabled
                    ? { ...activeCabinet.leftCoverPanel, depth: newDepth }
                    : activeCabinet.leftCoverPanel,
                  rightCoverPanel: activeCabinet.rightCoverPanel?.enabled
                    ? { ...activeCabinet.rightCoverPanel, depth: newDepth }
                    : activeCabinet.rightCoverPanel,
                });
                setIslandBackConfig({
                  sidesEnabled: true,
                  sideDepthCm: newDepth,
                  sideLeftEnabled: !!activeCabinet.leftCoverPanel?.enabled,
                  sideRightEnabled: !!activeCabinet.rightCoverPanel?.enabled,
                });
              };

              return (
                <DottedDepthSlider
                  min={minDepth}
                  max={maxDepth}
                  step={1}
                  value={currentSideDepth}
                  onChange={handleDepthChange}
                  label="Profundidad Lateral Isla"
                  overhangCm={overhang}
                  isLight={isLight}
                />
              );
            })()}
          </AccordionSection>
        )}

        {/* ACORDEÓN 7: REVESTIMIENTO Y COSTADOS DE ISLA */}
        {activeCabinet.type === 'island' && (
          <AccordionSection
            id="islandBack"
            title="Revestimiento y Costados Isla"
            icon={Layers}
            badge={
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                islandBackConfig.enabled
                  ? (isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400')
                  : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-400')
              }`}>
                {islandBackConfig.enabled ? 'Activo' : 'Desactivado'}
              </span>
            }
            isOpen={openSections.islandBack}
            onToggle={() => toggleSection('islandBack')}
            isLight={isLight}
          >
            <IslandBackPanelConfigSection isLight={isLight} />
          </AccordionSection>
        )}

        {/* ACORDEÓN 8: ACABADOS Y MATERIALES EXCLUSIVOS DEL MÓDULO */}
        <AccordionSection
          id="finishes"
          title="Acabados y Materiales Exclusivos"
          icon={Palette}
          badge={
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
              activeCabinet.customColors && Object.keys(activeCabinet.customColors).length > 0
                ? isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'
                : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-400'
            }`}>
              {activeCabinet.customColors && Object.keys(activeCabinet.customColors).length > 0
                ? `${Object.keys(activeCabinet.customColors).length} zonas pers.`
                : 'Estándar'}
            </span>
          }
          isOpen={openSections.finishes}
          onToggle={() => toggleSection('finishes')}
          isLight={isLight}
        >
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-2">
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                isLight ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                1. Selecciona la zona a modificar:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Todo el Mueble' },
                  { id: 'doors', label: 'Puertas' },
                  { id: 'drawerFronts', label: 'Frentes Cajón' },
                  { id: 'coverPanels', label: 'Tapas Laterales' },
                  { id: 'structure', label: 'Paredes / Casco' },
                  { id: 'drawerInner', label: 'Cajas Cajón' },
                  { id: 'shelves', label: 'Repisas' },
                  { id: 'back', label: 'Trasera / Fondo' },
                ].map(part => {
                  const isSelected = targetZone === part.id;
                  return (
                    <button 
                      key={part.id}
                      type="button"
                      onClick={() => setTargetZone(part.id as PartType)}
                      className={`py-2 px-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? isLight
                            ? 'bg-orange-500 text-black shadow-xs font-bold'
                            : 'bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.35)]' 
                          : isLight
                            ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-xs'
                            : 'bg-[#2a2a2e] text-zinc-300 hover:bg-[#34343a] border border-white/5'
                      }`}
                    >
                      {part.label}
                    </button>
                  );
                })}
              </div>

              {/* Panel de Opciones Específicas de Trasera / Fondo para el módulo seleccionado */}
              {targetZone === 'back' && (
                <div className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-2 ${
                  isLight ? 'bg-orange-50/80 border-orange-200 shadow-xs' : 'bg-black/40 border-orange-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      isLight ? 'text-orange-950' : 'text-orange-400'
                    }`}>
                      Configuración Trasera del Módulo
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      Exclusivo
                    </span>
                  </div>
                  <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    Elige <strong>Durolac Blanco 3 mm</strong> (estándar en ranura de laterales) o selecciona cualquier <strong>decorativo de Melamina o HPL</strong> (15/18 mm) del catálogo inferior.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    {/* Botón Durolac 3 mm Blanco */}
                    <button
                      type="button"
                      onClick={() => {
                        handleApplyTexture('#FFFFFF', 'Durolac Blanco 3mm', 3, 'durolac');
                      }}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        (activeCabinet.backThickness === 3 || activeCabinet.backMaterial === 'durolac' || (activeCabinet.backColor === '#FFFFFF' && !activeCabinet.backThickness))
                          ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-xs'
                          : isLight
                            ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:border-orange-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold">Durolac Blanco</span>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">3 mm</span>
                      </div>
                      <span className="text-[8px] opacity-80 leading-tight">MDF lacado blanco estándar</span>
                    </button>

                    {/* Botón Igualar al Casco de este Módulo */}
                    <button
                      type="button"
                      onClick={() => {
                        const structColor = activeCabinet.structureColor || '#ffffff';
                        const structMat = activeCabinet.structureMaterial || 'melamina';
                        handleApplyTexture(structColor, 'Melamina Casco', 15, structMat);
                      }}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:border-orange-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold">Igualar al Casco</span>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">Mismo Color</span>
                      </div>
                      <span className="text-[8px] opacity-80 leading-tight">Mismo color del casco</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selector Interactivo y Regla de Restricción Técnica para Fondo de Cajón */}
              {targetZone === 'drawerInner' && (() => {
                const innerColor = activeCabinet.drawerInnerColor || activeCabinet.structureColor || useStore.getState().structureColor;
                const isWhite = isWhiteMelamine(innerColor);
                const isOver50 = activeCabinet.width > 50;
                const currentBottomMat = activeCabinet.drawerBottomMaterial || (isWhite && !isOver50 ? 'durolac' : 'melamina');
                const isDurolacActive = currentBottomMat === 'durolac' && isWhite && !isOver50;

                return (
                  <div className={`mt-2 p-3.5 rounded-2xl border flex flex-col gap-2.5 shadow-sm transition-all ${
                    isLight ? 'bg-orange-50/90 border-orange-200' : 'bg-black/40 border-orange-500/30'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] uppercase font-extrabold tracking-wider ${
                        isLight ? 'text-orange-950' : 'text-orange-400'
                      }`}>
                        Configuración Fondo de Cajón
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isDurolacActive
                          ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                          : (isLight ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30')
                      }`}>
                        {isDurolacActive ? 'Durolac 3 mm' : 'Melamina 15/18 mm'}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-snug font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                      {!isWhite
                        ? 'Caja en melamina de color/madera: Por estándar de mercado, el fondo se fabrica en la misma melamina (15/18 mm).'
                        : isOver50
                          ? `Módulo de ${activeCabinet.width} cm (> 50 cm): Restricción de sobrecarga activa. Durolac 3 mm restringido para evitar pandeo.`
                          : `Módulo de ${activeCabinet.width} cm (≤ 50 cm) con melamina blanca: Puedes alternar entre Durolac 3 mm o Melamina.`}
                    </p>

                    {/* Botones de Selección Interactiva de Fondo de Cajón */}
                    <div className="flex flex-col gap-2 mt-1">
                      {/* Opción A: Durolac Blanco 3 mm */}
                      <button
                        type="button"
                        disabled={!isWhite || isOver50}
                        onClick={() => {
                          if (isWhite && !isOver50) {
                            updateCabinet(activeCabinet.id, { 
                              drawerBottomMaterial: 'durolac',
                              drawerBottomThickness: 3
                            });
                          }
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                          !isWhite || isOver50
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'
                            : isDurolacActive
                              ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm cursor-pointer ring-2 ring-orange-500/20'
                              : isLight
                                ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500 hover:bg-orange-50/40 cursor-pointer shadow-xs'
                                : 'bg-white/5 text-zinc-200 border-white/10 hover:border-orange-500/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-bold leading-snug">Durolac Blanco</span>
                          <span className={`text-[11px] leading-tight font-medium ${isDurolacActive ? 'text-black/80' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            {!isWhite 
                              ? 'Solo disponible en melamina blanca' 
                              : isOver50 
                                ? 'Restringido (Módulo > 50 cm)' 
                                : 'MDF lacado 3 mm ranurado'}
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                          isDurolacActive 
                            ? 'bg-black/15 text-black' 
                            : isLight 
                              ? 'bg-slate-100 text-slate-700' 
                              : 'bg-white/10 text-zinc-200'
                        }`}>
                          3 mm
                        </span>
                      </button>

                      {/* Opción B: Misma Melamina */}
                      <button
                        type="button"
                        onClick={() => {
                          updateCabinet(activeCabinet.id, { 
                            drawerBottomMaterial: 'melamina',
                            drawerBottomThickness: 15
                          });
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          !isDurolacActive
                            ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm ring-2 ring-orange-500/20'
                            : isLight
                              ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500 hover:bg-orange-50/40 shadow-xs'
                              : 'bg-white/5 text-zinc-200 border-white/10 hover:border-orange-500/50'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-bold leading-snug">Misma Melamina Estructural</span>
                          <span className={`text-[11px] leading-tight font-medium ${!isDurolacActive ? 'text-black/80' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Mismo tono y espesor de la caja
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                          !isDurolacActive 
                            ? 'bg-black/15 text-black' 
                            : isLight 
                              ? 'bg-slate-100 text-slate-700' 
                              : 'bg-white/10 text-zinc-200'
                        }`}>
                          15/18 mm
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Masisa */}
            {masisaTextures.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  2. Masisa (Melaminas)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {masisaTextures.map(t => renderTextureButton(t))}
                </div>
              </div>
            )}

            {/* Arauco / Vesto */}
            {araucoTextures.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  3. Arauco / Vesto (Melaminas)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {araucoTextures.map(t => renderTextureButton(t))}
                </div>
              </div>
            )}

            {/* Rehau Rauvisio */}
            {rehauTextures.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-slate-600' : 'text-zinc-400'
                  }`}>
                    4. Rehau Rauvisio (Superficies Poliméricas 2.80 x 1.22 m)
                  </div>
                  <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Tapacanto Exclusivo 1 mm
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {rehauTextures.map(t => renderTextureButton(t))}
                </div>
              </div>
            )}

            {/* Abet */}
            {abetTextures.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  5. Abet Laminati (HPL)
                </div>

                {/* Sub-opción contextual en Abet Laminati: Trascara Balancer Blanco 0,9 mm */}
                <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                  isLight ? 'bg-orange-50/70 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                        Trascara Balancer Blanco (0,9 mm)
                      </span>
                      <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        Equilibrio mecánico anti-alabeo para enchapes HPL
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = activeCabinet.hplBalancer ?? globalStore.hplBalancer;
                        handleOverride('hplBalancer', !current);
                      }}
                      className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0 ${
                        (activeCabinet.hplBalancer ?? globalStore.hplBalancer)
                          ? isLight
                            ? 'bg-orange-500 text-black font-extrabold shadow-xs'
                            : 'bg-orange-500 text-black font-extrabold shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                          : isLight
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {(activeCabinet.hplBalancer ?? globalStore.hplBalancer) ? 'Activado (0,9 mm)' : 'Mismo Diseño'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {abetTextures.map(t => renderTextureButton(t))}
                </div>
              </div>
            )}

            {/* Otras Texturas Oficiales de Proveedor */}
            {otherTextures.length > 0 && (
              <div className={`pt-3 border-t flex flex-col gap-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  6. Otras Terminaciones de Proveedor
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {otherTextures.map(t => renderTextureButton(t))}
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Clear overrides */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button 
            onClick={handleClearOverrides}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-center cursor-pointer transition-all text-[11px] uppercase font-bold tracking-wider border ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
          >
            <RefreshCw size={13} /> Revertir Global
          </button>
          <button 
            onClick={() => removeCabinet(activeCabinet.id)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-center cursor-pointer transition-all text-[11px] uppercase font-bold tracking-wider border ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700 shadow-sm'
                : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}
          >
            <Trash2 size={13} /> Eliminar Mueble
          </button>
        </div>

        {/* Modal de Alerta de Stock para Módulo */}
        {moduleStockAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-red-300 text-slate-800' : 'bg-zinc-900 border-red-500/50 text-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl shrink-0 mt-0.5 border border-red-500/30">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-500">
                      Material Sin Stock
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModuleStockAlert(null)}
                      className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    El decorativo <strong className="text-white">"{moduleStockAlert.textureName}"</strong> se encuentra agotado y registra <strong className="text-red-400">0 planchas</strong> disponibles en stock. No es posible aplicarlo a este módulo.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setModuleStockAlert(null)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-red-500/20"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

