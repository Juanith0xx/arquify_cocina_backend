import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  X, 
  Check, 
  AlertTriangle, 
  Building2, 
  Home, 
  ShieldCheck, 
  Sparkles, 
  Scissors, 
  Flame, 
  Droplet, 
  Info,
  Maximize2,
  Search,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { useKitchenStore } from '../../store/kitchenStore';
import { useAdminStore, getEffectiveSupplyPrice, isSupplyOfferValid } from '../../store/adminStore';
import { QSTONE_SINKS, FDV_COOKTOPS, SinkModelId, CooktopModelId, CountertopRunOverride } from '../../types/countertop';
import { generateCountertopPieces, detectContinuousCabinetRuns } from '../../utils/countertopNesting';

interface CountertopConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function CountertopConfigModal({ isOpen, onClose, isLight: isLightProp }: CountertopConfigModalProps) {
  const isLight = isLightProp ?? (typeof window !== 'undefined' && localStorage.getItem('arquify_kitchen_theme') === 'light');

  const {
    countertopConfig,
    setCountertopConfig,
    qstoneCatalog,
    cabinets,
    activeCabinetId,
    setCountertopSink,
    setCountertopCooktop,
    validateCabinetForSink,
    validateCabinetForCooktop,
    golaSystem,
    setGolaIncompatibilityAlert,
    islandBackConfig,
    setIslandBackConfig,
    walls,
    architecturalElements,
    roomConfig,
  } = useKitchenStore();

  const adminTextures = useAdminStore((s) => s.textures);

  const fullCatalog = useMemo(() => {
    // 1. Tomar texturas de cubiertas activas y aprobadas del adminStore (piedras, sinterizados y HPL compacto de cubiertas)
    const stoneTextures = (adminTextures || [])
      .filter((t) => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus))
      .filter((t) => {
        const cat = t.category;
        const n = (t.name || '').toLowerCase();
        const b = (t.brand || t.providerName || '').toLowerCase();
        return (
          cat === 'piedras_marmoles' ||
          (cat as string) === 'cubiertas_hpl' ||
          n.includes('qstone') ||
          b.includes('qstone') ||
          b.includes('sysprotec') ||
          (b.includes('abet') && t.thicknessMm === 8)
        );
      });

    const adminMapped = stoneTextures.map((t) => {
      const isHpl =
        (t.category as string) === 'cubiertas_hpl' ||
        t.thicknessMm === 8 ||
        (t.brand && t.brand.toLowerCase().includes('abet')) ||
        (t.name && t.name.toLowerCase().includes('hpl'));
      const isSintered =
        !isHpl &&
        (t.name.toLowerCase().includes('sinteriz') ||
          (t.finish && t.finish.toLowerCase().includes('sinteriz')) ||
          t.thicknessMm === 12 ||
          t.name.includes('12'));
      const thickness = t.thicknessMm || (isHpl ? 8 : isSintered ? 12 : t.name.includes('20') ? 20 : 18);
      const basePriceM2 = t.priceM2Clp || Math.round((t.priceSheetClp || 280000) / (isHpl ? 3.965 : 5.12)) || 185000;
      const effectivePriceM2 = getEffectiveSupplyPrice({
        priceClp: basePriceM2,
        isOfferActive: t.isOfferActive,
        offerDiscountPercent: t.offerDiscountPercent,
        offerPriceClp: t.offerPriceClp,
        offerStockLimit: t.offerStockLimit,
        offerExpirationDate: t.offerExpirationDate,
        stock: t.stock
      });
      return {
        id: t.id,
        code: t.code || (isHpl ? 'ABET-CUSTOM' : 'QS-CUSTOM'),
        name: t.name,
        materialType: isHpl ? ('hpl_abet' as const) : isSintered ? ('sinterizado' as const) : ('quarzo' as const),
        thicknessMm: (thickness === 8 || thickness === 12 || thickness === 18 || thickness === 20 ? thickness : 18) as 8 | 12 | 18 | 20,
        priceM2Clp: effectivePriceM2,
        originalPriceM2Clp: basePriceM2,
        isOfferActive: isSupplyOfferValid(t),
        offerDiscountPercent: t.offerDiscountPercent || 30,
        sheetWidthMm: isHpl ? 3050 : 3200,
        sheetHeightMm: isHpl ? 1300 : 1600,
        colorHex: t.url && t.url.startsWith('#') ? t.url : '#F5F5F7',
        textureUrl: t.url && !t.url.startsWith('#') ? t.url : t.previewUrl && !t.previewUrl.startsWith('#') ? t.previewUrl : undefined,
        finish: t.finish || (isHpl ? 'Compacto 8mm' : 'Pulido Seda'),
        description: `${t.brand || (isHpl ? 'ABET LAMINATI' : 'SYSPROTEC (QSTONE)')} - ${t.finish || 'Formato Placa'}`,
        active: true,
      };
    });

    // Combinar con qstoneCatalog para garantizar disponibilidad de Abet Laminati HPL 8mm y catálogo base
    const adminIds = new Set(adminMapped.map((p) => p.id));
    const catalogExtras = qstoneCatalog.filter((p) => p.active !== false && !adminIds.has(p.id));
    return [...adminMapped, ...catalogExtras];
  }, [adminTextures, qstoneCatalog]);

  const [activeTab, setActiveTab] = useState<'material' | 'dimensions' | 'appliances' | 'nesting'>('material');
  const [furnitureTypeTab, setFurnitureTypeTab] = useState<'base' | 'island'>('base');
  const [selectedRunTab, setSelectedRunTab] = useState<string>('all');
  const [applianceError, setApplianceError] = useState<string | null>(null);
  const [materialFilter, setMaterialFilter] = useState<'all' | 'quarzo' | 'sinterizado' | 'hpl_abet'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const updateRunOverride = (runId: string, partial: Partial<CountertopRunOverride>) => {
    const currentOverrides = countertopConfig.runOverrides || {};
    const currentRunOverride = currentOverrides[runId] || {};
    setCountertopConfig({
      runOverrides: {
        ...currentOverrides,
        [runId]: {
          ...currentRunOverride,
          ...partial,
        },
      },
    });
  };

  const removeRunOverride = (runId: string) => {
    const currentOverrides = { ...(countertopConfig.runOverrides || {}) };
    delete currentOverrides[runId];
    setCountertopConfig({
      runOverrides: Object.keys(currentOverrides).length > 0 ? currentOverrides : undefined,
    });
  };

  const filteredCatalog = useMemo(() => {
    return fullCatalog.filter((product) => {
      const matchesType = materialFilter === 'all' || product.materialType === materialFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || product.code.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [fullCatalog, materialFilter, searchQuery]);

  const selectedProduct = useMemo(() => {
    return fullCatalog.find((p) => p.id === countertopConfig.selectedProductId) || fullCatalog[0];
  }, [countertopConfig.selectedProductId, fullCatalog]);

  const nestingBOM = useMemo(() => {
    return generateCountertopPieces(cabinets, countertopConfig, fullCatalog, islandBackConfig, walls, architecturalElements, roomConfig);
  }, [cabinets, countertopConfig, fullCatalog, islandBackConfig, walls, architecturalElements, roomConfig]);

  const continuousRuns = useMemo(() => {
    return detectContinuousCabinetRuns(cabinets, countertopConfig, walls, architecturalElements, roomConfig);
  }, [cabinets, countertopConfig, walls, architecturalElements, roomConfig]);

  const baseAndIslandCabs = useMemo(() => {
    return cabinets.filter(
      (c) => (c.type === 'base' || c.type === 'island') && !c.variant?.startsWith('deco_')
    );
  }, [cabinets]);

  const canAnyWaterfallLeft = useMemo(() => {
    if (!nestingBOM?.runs || nestingBOM.runs.length === 0) return true;
    return nestingBOM.runs.some((r) => r.canWaterfallLeft);
  }, [nestingBOM]);

  const canAnyWaterfallRight = useMemo(() => {
    if (!nestingBOM?.runs || nestingBOM.runs.length === 0) return true;
    return nestingBOM.runs.some((r) => r.canWaterfallRight);
  }, [nestingBOM]);

  const canBaseWaterfallLeft = useMemo(() => {
    const baseRuns = nestingBOM?.runs?.filter((r) => r.type === 'base') || [];
    if (baseRuns.length === 0) return true;
    return baseRuns.some((r) => r.canWaterfallLeft);
  }, [nestingBOM]);

  const canBaseWaterfallRight = useMemo(() => {
    const baseRuns = nestingBOM?.runs?.filter((r) => r.type === 'base') || [];
    if (baseRuns.length === 0) return true;
    return baseRuns.some((r) => r.canWaterfallRight);
  }, [nestingBOM]);

  const canIslandWaterfallLeft = useMemo(() => {
    const islandRuns = nestingBOM?.runs?.filter((r) => r.type === 'island') || [];
    if (islandRuns.length === 0) return true;
    return islandRuns.some((r) => r.canWaterfallLeft);
  }, [nestingBOM]);

  const canIslandWaterfallRight = useMemo(() => {
    const islandRuns = nestingBOM?.runs?.filter((r) => r.type === 'island') || [];
    if (islandRuns.length === 0) return true;
    return islandRuns.some((r) => r.canWaterfallRight);
  }, [nestingBOM]);

  const hasIslands = useMemo(() => {
    return cabinets.some((c) => c.type === 'island');
  }, [cabinets]);

  const hasBaseCabinets = useMemo(() => {
    return cabinets.some((c) => c.type === 'base');
  }, [cabinets]);

  if (!isOpen) return null;

  const handleSelectProduct = (productId: string) => {
    const prod = fullCatalog.find((p) => p.id === productId);
    const isHpl8mm = prod && (prod.thicknessMm === 8 || prod.materialType === 'hpl_abet');
    if (isHpl8mm) {
      const overrides = countertopConfig.runOverrides;
      const cleanedOverrides: Record<string, CountertopRunOverride> = {};
      if (overrides) {
        for (const k of Object.keys(overrides)) {
          const runOv = overrides[k];
          if (runOv) {
            cleanedOverrides[k] = { ...runOv, regruesoCm: 0 };
          }
        }
      }
      setCountertopConfig({
        selectedProductId: productId,
        enabled: true,
        regruesoCm: 0,
        baseRegruesoCm: 0,
        islandRegruesoCm: 0,
        ...(overrides ? { runOverrides: cleanedOverrides } : {}),
      });
    } else {
      setCountertopConfig({ selectedProductId: productId, enabled: true });
    }
  };

  const handleSinkChange = (sinkId: SinkModelId) => {
    setApplianceError(null);
    if (sinkId === 'none') {
      setCountertopSink('none');
      return;
    }
    // Try to install on currently active cabinet if valid, else first valid cabinet
    const activeCab = cabinets.find((c) => c.id === activeCabinetId);
    if (activeCab && (activeCab.type === 'base' || activeCab.type === 'island')) {
      const res = setCountertopSink(sinkId, activeCab.id);
      if (!res.success) {
        setApplianceError(res.error || 'Error de validación');
      }
      return;
    }

    // Auto-pick first eligible cabinet
    const eligible = baseAndIslandCabs.find(
      (c) => validateCabinetForSink(c, sinkId).valid
    );
    if (eligible) {
      setCountertopSink(sinkId, eligible.id);
    } else {
      const spec = QSTONE_SINKS[sinkId];
      setApplianceError(
        `No hay ningún mueble base con ancho suficiente (mínimo ${spec.minCabinetWidthCm} cm) para la cubeta ${spec.name}. Modifica el ancho de un mueble a >= ${spec.minCabinetWidthCm} cm.`
      );
    }
  };

  const handleCooktopChange = (cooktopId: CooktopModelId) => {
    setApplianceError(null);
    if (cooktopId === 'none') {
      setCountertopCooktop('none');
      return;
    }
    const activeCab = cabinets.find((c) => c.id === activeCabinetId);
    if (activeCab && (activeCab.type === 'base' || activeCab.type === 'island')) {
      const res = setCountertopCooktop(cooktopId, activeCab.id);
      if (!res.success) {
        setApplianceError(res.error || 'Error de validación');
      }
      return;
    }

    // Auto-pick first eligible cabinet
    const eligible = baseAndIslandCabs.find(
      (c) => c.id !== countertopConfig.sinkCabinetId && validateCabinetForCooktop(c, cooktopId).valid
    );
    if (eligible) {
      setCountertopCooktop(cooktopId, eligible.id);
    } else {
      const spec = FDV_COOKTOPS[cooktopId];
      setApplianceError(
        `No hay ningún mueble disponible con ancho suficiente (mínimo ${spec.minCabinetWidthCm} cm) para la encimera ${spec.name}.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh] border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
          : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {/* Header */}
        <div className={`px-3.5 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between gap-2 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight
                ? 'bg-amber-100 border border-amber-300 text-amber-700'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-semibold tracking-wide ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>
                  Configurador de Cubiertas Qstone
                </h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  Cuarzos & Sinterizados
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Marmolería técnica, regruesos, respaldos, cubetas bajo cubierta y optimización de corte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              isLight
                ? 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200'
                : 'text-slate-300 bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}>
              <input
                type="checkbox"
                checked={countertopConfig.enabled}
                onChange={(e) => setCountertopConfig({ enabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Cubierta Activa</span>
            </label>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                isLight
                  ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 gap-2 text-xs font-medium transition-colors ${
          isLight ? 'border-slate-200 bg-slate-100/80' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <button
            onClick={() => setActiveTab('material')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'material'
                ? isLight
                  ? 'border-orange-500 text-orange-600 font-bold'
                  : 'border-amber-400 text-amber-300 font-semibold'
                : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Catálogo Qstone ({fullCatalog.length})
          </button>
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dimensions'
                ? isLight
                  ? 'border-orange-500 text-orange-600 font-bold'
                  : 'border-amber-400 text-amber-300 font-semibold'
                : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Regrueso, Respaldo & Cascada
          </button>
          <button
            onClick={() => setActiveTab('appliances')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appliances'
                ? isLight
                  ? 'border-orange-500 text-orange-600 font-bold'
                  : 'border-amber-400 text-amber-300 font-semibold'
                : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            Cubetas & Encimeras
          </button>
          <button
            onClick={() => setActiveTab('nesting')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'nesting'
                ? isLight
                  ? 'border-orange-500 text-orange-600 font-bold'
                  : 'border-amber-400 text-amber-300 font-semibold'
                : isLight
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Despiece & Nesting de Disco
          </button>
        </div>

        {/* Content Body */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${
          isLight ? 'bg-slate-50/60' : 'bg-slate-900/30'
        }`}>
          {/* TAB 1: MATERIAL & CATALOG */}
          {activeTab === 'material' && (
            <div className="space-y-4">
              <div className={`rounded-xl p-3 border flex items-start gap-3 transition-colors ${
                isLight
                  ? 'bg-amber-50/90 border-amber-200/80 text-slate-700'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
              }`}>
                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <div className="text-xs leading-relaxed">
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Regla de Fabricación Estructural:</span> Las cubiertas{' '}
                  <span className={`font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Sinterizadas (12 mm)</span> exigen{' '}
                  <span className={`underline ${isLight ? 'decoration-amber-500' : 'decoration-amber-400'}`}>tapa continua de melamina completa</span> en el
                  mueble base para dar soporte rígido homogéneo. Las de{' '}
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>Cuarzo (18/20 mm)</span> utilizan el sistema tradicional de
                  barras de armado de 10 cm.
                </div>
              </div>

              {/* Filter and Search Toolbar */}
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-700/60'
              }`}>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setMaterialFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      materialFilter === 'all'
                        ? isLight ? 'bg-amber-500 text-white font-bold shadow' : 'bg-amber-500 text-slate-950 font-bold shadow'
                        : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Todos ({fullCatalog.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilter('quarzo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      materialFilter === 'quarzo'
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Cuarzo ({fullCatalog.filter((p) => p.materialType === 'quarzo').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilter('sinterizado')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      materialFilter === 'sinterizado'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Sinterizado ({fullCatalog.filter((p) => p.materialType === 'sinterizado').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialFilter('hpl_abet')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      materialFilter === 'hpl_abet'
                        ? 'bg-emerald-600 text-white font-bold shadow'
                        : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    HPL 8mm Abet ({fullCatalog.filter((p) => p.materialType === 'hpl_abet').length})
                  </button>
                </div>

                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isLight ? 'text-slate-400' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o código..."
                    className={`w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none transition ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-400 focus:border-amber-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold cursor-pointer ${
                        isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {filteredCatalog.length === 0 ? (
                <div className={`py-12 text-center text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  No se encontraron decorativos con los criterios seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCatalog.map((product) => {
                    const isSelected = countertopConfig.selectedProductId === product.id;
                    const isSintered = product.materialType === 'sinterizado';
                    const isHpl = product.materialType === 'hpl_abet' || product.thicknessMm === 8;

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className={`relative p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? isLight
                              ? 'border-orange-500 bg-orange-50/70 shadow-md ring-1 ring-orange-500'
                              : 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-950/30'
                            : isLight
                              ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                              : 'border-slate-700/80 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg shadow-inner border border-black/10 shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden relative"
                              style={{ backgroundColor: product.colorHex }}
                            >
                              {product.textureUrl && !product.textureUrl.startsWith('#') ? (
                                <img
                                  src={product.textureUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                  {product.thicknessMm}mm
                                </span>
                              )}
                            </div>
                            <div>
                              <div className={`text-sm font-semibold flex items-center gap-1.5 ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}>
                                {product.name}
                                {isSelected && <Check className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />}
                              </div>
                              <div className={`text-xs flex items-center gap-2 mt-0.5 ${
                                isLight ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    isHpl
                                      ? isLight
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                                      : isSintered
                                        ? isLight
                                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                          : 'bg-purple-900/60 text-purple-300 border border-purple-700'
                                        : isLight
                                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                          : 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                                  }`}
                                >
                                  {isHpl ? 'HPL 8mm Abet' : isSintered ? 'Sinterizado' : 'Cuarzo'}
                                </span>
                                <span>{product.thicknessMm} mm</span>
                                <span>• Cod: {product.code}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {product.isOfferActive ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                  <span className="line-through text-[10px] text-slate-500">
                                    ${(product as any).originalPriceM2Clp?.toLocaleString('es-CL')}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-rose-500 text-white font-extrabold text-[9px] rounded uppercase flex items-center gap-0.5 animate-pulse shadow-sm">
                                    <Flame size={10} className="fill-white" />
                                    {(product as any).offerDiscountPercent || 30}% OFF
                                  </span>
                                </div>
                                <div className="text-sm font-extrabold text-emerald-400 font-mono">
                                  ${product.priceM2Clp.toLocaleString('es-CL')}
                                </div>
                              </div>
                            ) : (
                              <div className={`text-sm font-bold ${isLight ? 'text-orange-600' : 'text-amber-400'}`}>
                                ${product.priceM2Clp.toLocaleString('es-CL')}
                              </div>
                            )}
                            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>por m² c/IVA</div>
                          </div>
                        </div>

                        {/* Technical note banner */}
                        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                          isLight ? 'border-slate-100' : 'border-slate-700/50'
                        }`}>
                          <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>
                            {isHpl ? 'Canto Simple 8mm (Sin Regrueso Frontal)' : isSintered ? 'Requiere Tapa Melamina Completa' : 'Sistema Barras 10 cm'}
                          </span>
                          <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>
                            Formato: {(product.sheetWidthMm / 10).toFixed(0)}x{(product.sheetHeightMm / 10).toFixed(0)} cm ({( (product.sheetWidthMm * product.sheetHeightMm) / 1000000 ).toFixed(2)} m²)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIMENSIONS, REGRUESO & WATERFALL */}
          {activeTab === 'dimensions' && (
            <div className="space-y-6">
              {/* SELECTOR DE CORRIDAS / CUBIERTAS DETECTADAS */}
              <div className={`rounded-xl p-3 border transition-colors ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      Cubiertas Detectadas en Escena ({continuousRuns.length})
                    </span>
                  </div>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {continuousRuns.length > 1 ? 'Selecciona una cubierta para configurar sus dimensiones y remates de forma independiente' : 'Tramo continuo detectado'}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRunTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      selectedRunTab === 'all'
                        ? isLight
                          ? 'bg-orange-500 text-white shadow-sm font-bold'
                          : 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : isLight
                          ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>🌐 Vista General (Todas)</span>
                  </button>

                  {continuousRuns.map((run, idx) => {
                    const isRunSelected = selectedRunTab === run.id;
                    const hasOverride = !!countertopConfig.runOverrides?.[run.id];
                    const isIsl = run.type === 'island';
                    const lenCm = (run.totalLengthMm / 10).toFixed(0);

                    return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => setSelectedRunTab(run.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                          isRunSelected
                            ? isLight
                              ? 'bg-orange-500 text-white shadow-sm font-bold'
                              : 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : isLight
                              ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isIsl ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                        <span>Cubierta {idx + 1}: {isIsl ? 'Isla' : 'Base Muro'} ({lenCm} cm)</span>
                        {hasOverride && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isRunSelected
                              ? 'bg-white/20 text-white'
                              : isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-400/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            Independiente
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VISTA INDIVIDUAL SI SE SELECCIONÓ UNA CUBIERTA ESPECÍFICA */}
              {selectedRunTab !== 'all' && (() => {
                const currentRun = continuousRuns.find((r) => r.id === selectedRunTab);
                if (!currentRun) return null;

                const isIsl = currentRun.type === 'island';
                const runIndex = continuousRuns.findIndex((r) => r.id === selectedRunTab) + 1;
                const override = countertopConfig.runOverrides?.[currentRun.id];
                const isCustomized = !!override;

                const effectiveRegrueso = override?.regruesoCm !== undefined
                  ? override.regruesoCm
                  : (isIsl ? (countertopConfig.islandRegruesoCm ?? countertopConfig.regruesoCm) : (countertopConfig.baseRegruesoCm ?? countertopConfig.regruesoCm));

                const effectiveFrontOverhang = override?.overhangFrontCm !== undefined
                  ? override.overhangFrontCm
                  : (isIsl ? (countertopConfig.islandOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2) : (countertopConfig.baseOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2));

                const effectiveBackOverhang = override?.overhangBackCm !== undefined
                  ? override.overhangBackCm
                  : (isIsl ? (countertopConfig.islandOverhangBackCm ?? countertopConfig.islandOverhangCm ?? 30) : 0);

                const effectiveWaterLeft = override?.waterfallLeft !== undefined
                  ? override.waterfallLeft
                  : (isIsl ? (countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft ?? false) : (countertopConfig.baseWaterfallLeft ?? countertopConfig.waterfallLeft ?? false));

                const effectiveWaterRight = override?.waterfallRight !== undefined
                  ? override.waterfallRight
                  : (isIsl ? (countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight ?? false) : (countertopConfig.baseWaterfallRight ?? countertopConfig.waterfallRight ?? false));

                const effectiveLeftOverhang = effectiveWaterLeft ? 0 : (
                  override?.overhangLeftCm !== undefined
                    ? override.overhangLeftCm
                    : (isIsl ? (countertopConfig.islandOverhangLeftCm ?? countertopConfig.overhangLeftCm ?? 0) : (countertopConfig.baseOverhangLeftCm ?? countertopConfig.overhangLeftCm ?? 0))
                );

                const effectiveRightOverhang = effectiveWaterRight ? 0 : (
                  override?.overhangRightCm !== undefined
                    ? override.overhangRightCm
                    : (isIsl ? (countertopConfig.islandOverhangRightCm ?? countertopConfig.overhangRightCm ?? 0) : (countertopConfig.baseOverhangRightCm ?? countertopConfig.overhangRightCm ?? 0))
                );

                const effectiveBacksplashMode = override?.backsplashMode !== undefined
                  ? override.backsplashMode
                  : countertopConfig.backsplashMode;

                return (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    {/* Tarjeta de Resumen del Tramo */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          #{runIndex}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              Cubierta #{runIndex}: {isIsl ? 'Isla Central / Península' : 'Muebles Base Contra Muro'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              isCustomized
                                ? isLight ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-amber-400 text-slate-950 font-bold'
                                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {isCustomized ? '⚙️ Ajustes Independientes' : '🔗 Hereda Parámetros Globales'}
                            </span>
                          </div>
                          <div className={`text-xs mt-0.5 flex items-center gap-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            <span>Largo mueble: <strong>{(currentRun.totalLengthMm / 10).toFixed(0)} cm</strong></span>
                            <span>• Fondo base: <strong>{(currentRun.depthMm / 10).toFixed(0)} cm</strong></span>
                            <span>• Gabinetes: <strong>{currentRun.cabinets.length} unid.</strong></span>
                          </div>
                        </div>
                      </div>

                      {isCustomized && (
                        <button
                          type="button"
                          onClick={() => removeRunOverride(currentRun.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-red-600'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-red-400'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restablecer a Global</span>
                        </button>
                      )}
                    </div>

                    {/* Regrueso Frontal para esta cubierta */}
                    {(() => {
                      const isHpl8mm = selectedProduct?.thicknessMm === 8 || selectedProduct?.materialType === 'hpl_abet';
                      return (
                        <div className={`rounded-xl p-4 border ${
                          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <label className={`text-sm font-semibold flex items-center gap-2 ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              <span>Regrueso Frontal (Faldón) en Cubierta #{runIndex}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                isHpl8mm
                                  ? isLight ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                                  : isLight ? 'text-amber-800 bg-amber-100 border-amber-200' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                              }`}>
                                {isHpl8mm ? '0 cm (Canto simple)' : `${effectiveRegrueso} cm`}
                              </span>
                            </label>
                          </div>
                          {isHpl8mm ? (
                            <div className={`p-2.5 rounded-lg text-xs border flex items-center gap-2 mb-2 ${
                              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            }`}>
                              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                              <span>
                                <strong>HPL 8mm (Abet Laminati):</strong> Canto simple macizo de 8 mm sin regrueso frontal. Los respaldos posteriores de muro sí están operativos.
                              </span>
                            </div>
                          ) : (
                            <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              Modifica de forma exclusiva el faldón de esta cubierta. Se incluye automáticamente en los remates y voladizos.
                            </p>
                          )}
                          <div className="grid grid-cols-6 gap-2">
                            {[0, 1, 2, 3, 4, 5].map((val) => {
                              const disabled = isHpl8mm && val > 0;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => !disabled && updateRunOverride(currentRun.id, { regruesoCm: val })}
                                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                    (isHpl8mm ? val === 0 : effectiveRegrueso === val)
                                      ? isLight ? 'bg-orange-500 text-white border-orange-600 shadow-sm font-bold' : 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                                      : disabled
                                      ? isLight ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
                                      : isLight ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  }`}
                                >
                                  {val === 0 ? '0 cm' : `${val} cm`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Voladizos y Laterales para esta cubierta */}
                    <div className={`rounded-xl p-4 border ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-semibold flex items-center gap-2 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                          <span>Voladizos y Remates Laterales de Cubierta #{runIndex}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Frente */}
                        <div className={`p-3 rounded-lg border ${
                          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              Voladizo Frontal (Delantero)
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {effectiveFrontOverhang} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={effectiveFrontOverhang}
                            onChange={(e) => updateRunOverride(currentRun.id, { overhangFrontCm: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>0 cm</span>
                            <span>2 cm</span>
                            <span>10 cm</span>
                          </div>
                        </div>

                        {/* Fondo (si es isla) */}
                        {isIsl && (
                          <div className={`p-3 rounded-lg border ${
                            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                Voladizo Posterior (Barra Isla)
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {effectiveBackOverhang} cm
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="5"
                              value={effectiveBackOverhang}
                              onChange={(e) => updateRunOverride(currentRun.id, { overhangBackCm: Number(e.target.value) })}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                            <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>0 cm (A ras)</span>
                              <span>30 cm (Barra)</span>
                              <span>50 cm</span>
                            </div>
                          </div>
                        )}

                        {/* Lateral Izquierdo */}
                        <div className={`p-3 rounded-lg border ${
                          effectiveWaterLeft
                            ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-80' : 'bg-slate-900/30 border-slate-800 opacity-70'
                            : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              Lateral Izquierdo
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              effectiveWaterLeft
                                ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {effectiveLeftOverhang} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            disabled={effectiveWaterLeft}
                            value={effectiveLeftOverhang}
                            onChange={(e) => updateRunOverride(currentRun.id, { overhangLeftCm: Number(e.target.value) })}
                            className={`w-full accent-amber-500 ${effectiveWaterLeft ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="mt-2 pt-2 border-t flex items-center justify-between border-slate-200 dark:border-slate-800">
                            <label className={`flex items-center gap-2 text-xs font-medium ${currentRun.canWaterfallLeft ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                              <input
                                type="checkbox"
                                disabled={!currentRun.canWaterfallLeft}
                                checked={effectiveWaterLeft && currentRun.canWaterfallLeft}
                                onChange={(e) => updateRunOverride(currentRun.id, { waterfallLeft: e.target.checked })}
                                className="rounded text-amber-500"
                              />
                              <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                                Pata Cascada Izquierda (a piso)
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Lateral Derecho */}
                        <div className={`p-3 rounded-lg border ${
                          effectiveWaterRight
                            ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-80' : 'bg-slate-900/30 border-slate-800 opacity-70'
                            : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              Lateral Derecho
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              effectiveWaterRight
                                ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {effectiveRightOverhang} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            disabled={effectiveWaterRight}
                            value={effectiveRightOverhang}
                            onChange={(e) => updateRunOverride(currentRun.id, { overhangRightCm: Number(e.target.value) })}
                            className={`w-full accent-amber-500 ${effectiveWaterRight ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="mt-2 pt-2 border-t flex items-center justify-between border-slate-200 dark:border-slate-800">
                            <label className={`flex items-center gap-2 text-xs font-medium ${currentRun.canWaterfallRight ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                              <input
                                type="checkbox"
                                disabled={!currentRun.canWaterfallRight}
                                checked={effectiveWaterRight && currentRun.canWaterfallRight}
                                onChange={(e) => updateRunOverride(currentRun.id, { waterfallRight: e.target.checked })}
                                className="rounded text-amber-500"
                              />
                              <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                                Pata Cascada Derecha (a piso)
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Respaldo para muebles base */}
                    {!isIsl && (
                      <div className={`rounded-xl p-4 border ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                      }`}>
                        <label className={`text-sm font-semibold block mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Respaldo / Zócalo Posterior de Cubierta #{runIndex}
                        </label>
                        <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Se dimensiona automáticamente cubriendo el 100% del largo total de esta cubierta continua (incluyendo voladizos y cascadas).
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => updateRunOverride(currentRun.id, { backsplashMode: 'none' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              effectiveBacksplashMode === 'none'
                                ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                                : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Respaldo</div>
                            <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Directo a pared</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateRunOverride(currentRun.id, { backsplashMode: 'standard_5cm' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              effectiveBacksplashMode === 'standard_5cm'
                                ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                                : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Zócalo Estándar (5 cm)</div>
                            <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tira de 50 mm</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateRunOverride(currentRun.id, { backsplashMode: 'full_height' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              effectiveBacksplashMode === 'full_height'
                                ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                                : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Revestimiento Completo</div>
                            <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Hasta aéreos (55 cm)</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* VISTA GENERAL (TODAS LAS CUBIERTAS) */}
              {selectedRunTab === 'all' && (
                <>
              {/* Regrueso delantero (Faldón) */}
              {(() => {
                const isHpl8mm = selectedProduct?.thicknessMm === 8 || selectedProduct?.materialType === 'hpl_abet';
                return (
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-semibold flex items-center gap-2 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        <span>Regrueso Frontal (Faldón Delantero)</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          isHpl8mm
                            ? isLight ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                            : isLight ? 'text-amber-800 bg-amber-100 border-amber-200' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                        }`}>
                          {isHpl8mm ? '0 cm (Canto simple)' : `${countertopConfig.regruesoCm} cm`}
                        </span>
                      </label>
                      <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isHpl8mm ? 'Sin regrueso frontal' : 'Rango: 0 a 5 cm (paso 1 cm)'}
                      </span>
                    </div>

                    {isHpl8mm ? (
                      <div className={`p-3 rounded-lg text-xs border flex items-center gap-2.5 mb-3 ${
                        isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      }`}>
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>
                          <strong>Cubierta HPL 8 mm (Abet Laminati):</strong> Canto simple macizo de 8 mm sin regrueso frontal. Los <strong>respaldos y zócalos posteriores</strong> sí están disponibles y operativos.
                        </span>
                      </div>
                    ) : (
                      <p className={`text-xs mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        El regrueso crea un frente visualmente robusto. Modifica y deduce automáticamente la altura de puertas y frentes de cajón para garantizar una apertura ergonómica y despejada bajo la cubierta.
                      </p>
                    )}

                    {!isHpl8mm && golaSystem !== 'none' && (
                      <div className={`mb-3 px-3 py-2 rounded-lg text-[11px] flex items-center justify-between border ${
                        isLight
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        <span>
                          <strong>Riel Gola activo ({golaSystem === 'black' ? 'Negro' : 'Aluminio'}):</strong> Regrueso máximo permitido{' '}
                          <strong>{Number(((selectedProduct?.thicknessMm || 20) / 10 + 2.0).toFixed(1))} cm</strong> (Espesor {(selectedProduct?.thicknessMm || 20) / 10} cm + 2 cm).
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-6 gap-2">
                      {[0, 1, 2, 3, 4, 5].map((val) => {
                        const disabled = isHpl8mm && val > 0;
                        const stoneThicknessCm = (selectedProduct?.thicknessMm || 20) / 10;
                        const isBlocked = !isHpl8mm && golaSystem !== 'none' && val > stoneThicknessCm + 2.0;

                        return (
                          <button
                            key={val}
                            disabled={disabled}
                            onClick={() => {
                              if (disabled) return;
                              if (isBlocked) {
                                setGolaIncompatibilityAlert({
                                  isOpen: true,
                                  regruesoCm: val,
                                  stoneThicknessCm,
                                  attemptedAction: 'regrueso',
                                });
                                return;
                              }
                              setCountertopConfig({ regruesoCm: val });
                            }}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition relative cursor-pointer ${
                              (isHpl8mm ? val === 0 : countertopConfig.regruesoCm === val)
                                ? isLight ? 'bg-orange-500 text-white border-orange-600 shadow-sm font-bold' : 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                                : disabled
                                ? isLight ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
                                : isBlocked
                                ? isLight ? 'bg-red-50 text-slate-400 border-dashed border-red-300 hover:border-amber-400' : 'bg-slate-900/60 text-slate-500 border-dashed border-red-500/40 hover:border-amber-400 hover:text-amber-300'
                                : isLight ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title={isBlocked ? `Incompatible con Riel Gola (excede ${stoneThicknessCm + 2} cm)` : undefined}
                          >
                            {val === 0 ? 'Sin faldón (0 cm)' : `${val} cm`}
                            {isBlocked && (
                              <span className={`block text-[9px] font-normal mt-0.5 ${isLight ? 'text-red-500' : 'text-red-400'}`}>
                                Bloquea Gola
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!isHpl8mm && countertopConfig.regruesoCm > 0 && (
                      <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
                        isLight ? 'border-slate-100' : 'border-slate-700/60'
                      }`}>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={countertopConfig.regruesoOnOverhangSides !== false}
                            onChange={(e) => setCountertopConfig({ regruesoOnOverhangSides: e.target.checked })}
                            className="rounded text-amber-500"
                          />
                          <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                            Aplicar faldón/regrueso en bordes laterales y voladizos libres
                          </span>
                        </label>
                        <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Remate ingletado 90°
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Selector de Tipo de Mueble: Base vs Isla */}
              <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-800/80 border-slate-700'
              }`}>
                <button
                  type="button"
                  onClick={() => setFurnitureTypeTab('base')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    furnitureTypeTab === 'base'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                        : 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Muebles Base (Contra Muro)</span>
                  {hasBaseCabinets && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      furnitureTypeTab === 'base'
                        ? isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900/40 text-slate-950 font-bold'
                        : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-300'
                    }`}>
                      Activo
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFurnitureTypeTab('island')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    furnitureTypeTab === 'island'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                        : 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Muebles Isla / Península</span>
                  {hasIslands && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      furnitureTypeTab === 'island'
                        ? isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900/40 text-slate-950 font-bold'
                        : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-300'
                    }`}>
                      En escena
                    </span>
                  )}
                </button>
              </div>

              {/* SECCIÓN A: MUEBLES BASE (CONTRA MURO) */}
              {furnitureTypeTab === 'base' && (
                <div className="space-y-6">
                  {/* Voladizos Muebles Base */}
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Maximize2 className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                        <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Voladizos en Muebles Base (Contra Muro)
                        </span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                      }`}>
                        Frente & Laterales
                      </span>
                    </div>
                    <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Define la proyección de la cubierta en muebles adosados a muros. La parte trasera se mantiene a 0 cm para sellado continuo contra muro o salpicadero.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Borde Frontal Base */}
                      <div className={`p-3 rounded-lg border ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            Frontal (Delantero)
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {countertopConfig.baseOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={countertopConfig.baseOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2}
                          onChange={(e) => setCountertopConfig({ baseOverhangFrontCm: Number(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>0 cm</span>
                          <span>2 cm (Estándar)</span>
                          <span>10 cm</span>
                        </div>
                        {golaSystem !== 'none' && (
                          <p className={`text-[10px] mt-1.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                            * Riel Gola activo: 2 a 3 cm recomendado.
                          </p>
                        )}
                      </div>

                      {/* Lateral Izquierdo Base */}
                      {(() => {
                        const isWaterLeft = countertopConfig.baseWaterfallLeft ?? countertopConfig.waterfallLeft;
                        const currentVal = isWaterLeft ? 0 : (countertopConfig.baseOverhangLeftCm ?? countertopConfig.overhangLeftCm ?? 0);
                        return (
                          <div className={`p-3 rounded-lg border ${
                            isWaterLeft
                              ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-70' : 'bg-slate-900/30 border-slate-800 opacity-60'
                              : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                Lateral Izquierdo
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isWaterLeft
                                  ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                  : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {currentVal} cm
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="1"
                              disabled={isWaterLeft}
                              value={currentVal}
                              onChange={(e) => setCountertopConfig({ baseOverhangLeftCm: Number(e.target.value) })}
                              className={`w-full accent-amber-500 ${isWaterLeft ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            />
                            <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>0 cm (A ras)</span>
                              <span>15 cm</span>
                              <span>30 cm</span>
                            </div>
                            {isWaterLeft && (
                              <p className={`text-[10px] mt-1.5 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                                * Bloqueado en 0 cm por Pata Cascada Izquierda activa.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Lateral Derecho Base */}
                      {(() => {
                        const isWaterRight = countertopConfig.baseWaterfallRight ?? countertopConfig.waterfallRight;
                        const currentVal = isWaterRight ? 0 : (countertopConfig.baseOverhangRightCm ?? countertopConfig.overhangRightCm ?? 0);
                        return (
                          <div className={`p-3 rounded-lg border ${
                            isWaterRight
                              ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-70' : 'bg-slate-900/30 border-slate-800 opacity-60'
                              : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                Lateral Derecho
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isWaterRight
                                  ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                  : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {currentVal} cm
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="1"
                              disabled={isWaterRight}
                              value={currentVal}
                              onChange={(e) => setCountertopConfig({ baseOverhangRightCm: Number(e.target.value) })}
                              className={`w-full accent-amber-500 ${isWaterRight ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            />
                            <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>0 cm (A ras)</span>
                              <span>15 cm</span>
                              <span>30 cm</span>
                            </div>
                            {isWaterRight && (
                              <p className={`text-[10px] mt-1.5 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                                * Bloqueado en 0 cm por Pata Cascada Derecha activa.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Remates Laterales en Cascada para Base */}
                  <div className={`rounded-xl p-4 border space-y-3 transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <span className={`text-sm font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Remates Laterales en Cascada (Muebles Base)
                    </span>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Pata vertical que baja a 90° ingletado hasta el suelo en los extremos libres de los muebles base.
                    </p>
                    <div className={`flex flex-col sm:flex-row gap-4 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <label 
                        className={`flex items-center gap-2 ${canBaseWaterfallLeft ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        title={!canBaseWaterfallLeft ? 'No permitido: hay mueble despensa o esquina en este extremo' : undefined}
                      >
                        <input
                          type="checkbox"
                          disabled={!canBaseWaterfallLeft}
                          checked={(countertopConfig.baseWaterfallLeft ?? countertopConfig.waterfallLeft) && canBaseWaterfallLeft}
                          onChange={(e) => setCountertopConfig({ baseWaterfallLeft: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Cascada Izq. Base {!canBaseWaterfallLeft && <span className={`text-[10px] block sm:inline ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>(Bloqueada por despensa/esquina)</span>}</span>
                      </label>
                      <label 
                        className={`flex items-center gap-2 ${canBaseWaterfallRight ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        title={!canBaseWaterfallRight ? 'No permitido: hay mueble despensa o esquina en este extremo' : undefined}
                      >
                        <input
                          type="checkbox"
                          disabled={!canBaseWaterfallRight}
                          checked={(countertopConfig.baseWaterfallRight ?? countertopConfig.waterfallRight) && canBaseWaterfallRight}
                          onChange={(e) => setCountertopConfig({ baseWaterfallRight: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Cascada Der. Base {!canBaseWaterfallRight && <span className={`text-[10px] block sm:inline ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>(Bloqueada por despensa/esquina)</span>}</span>
                      </label>
                    </div>
                  </div>

                  {/* Respaldo / Salpicadero */}
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <label className={`text-sm font-semibold block mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Respaldo Posterior (Salpicadero contra Muro)
                    </label>
                    <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Protección de muro en el mismo material de cuarzo o piedra sinterizada.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setCountertopConfig({ backsplashMode: 'none' })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          countertopConfig.backsplashMode === 'none'
                            ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                            : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Respaldo</div>
                        <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Directo a pintura o cerámica</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCountertopConfig({ backsplashMode: 'standard_5cm' })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          countertopConfig.backsplashMode === 'standard_5cm'
                            ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                            : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Zócalo Estándar (5 cm)</div>
                        <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tira perimetral de 50 mm</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCountertopConfig({ backsplashMode: 'full_height' })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          countertopConfig.backsplashMode === 'full_height'
                            ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                            : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Revestimiento Completo</div>
                        <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cubre hasta muebles aéreos (55 cm)</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN B: MUEBLES ISLA / PENÍNSULA */}
              {furnitureTypeTab === 'island' && (
                <div className="space-y-6">
                  {/* Voladizos Paramétricos Isla (4 Cuadrantes) */}
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Maximize2 className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                        <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Voladizos en Muebles Isla / Península (4 Lados)
                        </span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                      }`}>
                        Configuración 360° Libre
                      </span>
                    </div>
                    <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Permite extender la cubierta en frente, fondo (barra desayunadora) y laterales de la isla. Si se activa <strong>Pata Cascada</strong> en algún lateral, dicho voladizo se ajusta automáticamente a 0 cm.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Borde Frontal Isla */}
                      <div className={`p-3 rounded-lg border ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            Borde Frontal (Delantero)
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {countertopConfig.islandOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={countertopConfig.islandOverhangFrontCm ?? countertopConfig.overhangFrontCm ?? 2}
                          onChange={(e) => setCountertopConfig({ islandOverhangFrontCm: Number(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>0 cm</span>
                          <span>2 cm (Estándar)</span>
                          <span>10 cm</span>
                        </div>
                      </div>

                      {/* Borde Posterior Isla (Barra Desayunadora) */}
                      <div className={`p-3 rounded-lg border ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            Borde Posterior / Fondo (Barra Desayunadora)
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {countertopConfig.islandOverhangBackCm ?? countertopConfig.islandOverhangCm ?? 30} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={countertopConfig.islandOverhangBackCm ?? countertopConfig.islandOverhangCm ?? 30}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCountertopConfig({ islandOverhangBackCm: val, islandOverhangCm: val });
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>0 cm (A ras)</span>
                          <span>30 cm (Barra estándar)</span>
                          <span>50 cm</span>
                        </div>
                      </div>

                      {/* Lateral Izquierdo Isla */}
                      {(() => {
                        const isWaterLeft = countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft;
                        const currentVal = isWaterLeft ? 0 : (countertopConfig.islandOverhangLeftCm ?? countertopConfig.overhangLeftCm ?? 0);
                        return (
                          <div className={`p-3 rounded-lg border ${
                            isWaterLeft
                              ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-70' : 'bg-slate-900/30 border-slate-800 opacity-60'
                              : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                Lateral Izquierdo Isla
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isWaterLeft
                                  ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                  : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {currentVal} cm
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              step="2.5"
                              disabled={isWaterLeft}
                              value={currentVal}
                              onChange={(e) => setCountertopConfig({ islandOverhangLeftCm: Number(e.target.value) })}
                              className={`w-full accent-amber-500 ${isWaterLeft ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            />
                            <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>0 cm</span>
                              <span>15 cm</span>
                              <span>40 cm</span>
                            </div>
                            {isWaterLeft && (
                              <p className={`text-[10px] mt-1.5 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                                * Bloqueado en 0 cm por Pata Cascada Izquierda activa en Isla.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Lateral Derecho Isla */}
                      {(() => {
                        const isWaterRight = countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight;
                        const currentVal = isWaterRight ? 0 : (countertopConfig.islandOverhangRightCm ?? countertopConfig.overhangRightCm ?? 0);
                        return (
                          <div className={`p-3 rounded-lg border ${
                            isWaterRight
                              ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-70' : 'bg-slate-900/30 border-slate-800 opacity-60'
                              : isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                Lateral Derecho Isla
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isWaterRight
                                  ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                                  : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {currentVal} cm
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              step="2.5"
                              disabled={isWaterRight}
                              value={currentVal}
                              onChange={(e) => setCountertopConfig({ islandOverhangRightCm: Number(e.target.value) })}
                              className={`w-full accent-amber-500 ${isWaterRight ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            />
                            <div className={`flex justify-between text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>0 cm</span>
                              <span>15 cm</span>
                              <span>40 cm</span>
                            </div>
                            {isWaterRight && (
                              <p className={`text-[10px] mt-1.5 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                                * Bloqueado en 0 cm por Pata Cascada Derecha activa en Isla.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Presets Rápidos Isla */}
                    <div className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-2 ${
                      isLight ? 'border-slate-100' : 'border-slate-700/60'
                    }`}>
                      <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Presets Rápidos Isla:
                      </span>
                      <button
                        type="button"
                        onClick={() => setCountertopConfig({
                          islandOverhangFrontCm: 2,
                          islandOverhangBackCm: 0,
                          islandOverhangLeftCm: 0,
                          islandOverhangRightCm: 0,
                          islandOverhangCm: 0,
                        })}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        A ras (0cm fondo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCountertopConfig({
                          islandOverhangFrontCm: 2,
                          islandOverhangBackCm: 30,
                          islandOverhangLeftCm: 0,
                          islandOverhangRightCm: 0,
                          islandOverhangCm: 30,
                        })}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Barra Desayunadora (+30cm fondo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isWaterL = countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft;
                          const isWaterR = countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight;
                          setCountertopConfig({
                            islandOverhangFrontCm: 2,
                            islandOverhangBackCm: 30,
                            islandOverhangLeftCm: isWaterL ? 0 : 15,
                            islandOverhangRightCm: isWaterR ? 0 : 15,
                            islandOverhangCm: 30,
                          });
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Isla Envolvente (+15cm laterales)
                      </button>
                    </div>
                  </div>

                  {/* Remates en Cascada para Isla */}
                  <div className={`rounded-xl p-4 border space-y-3 transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <span className={`text-sm font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Remates Laterales en Cascada (Muebles Isla)
                    </span>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Patas de cuarzo o piedra sinterizada que caen al piso en los laterales de la isla a 90° ingletado.
                    </p>
                    <div className={`flex flex-col sm:flex-row gap-4 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <label 
                        className={`flex items-center gap-2 ${canIslandWaterfallLeft ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canIslandWaterfallLeft}
                          checked={(countertopConfig.islandWaterfallLeft ?? countertopConfig.waterfallLeft) && canIslandWaterfallLeft}
                          onChange={(e) => setCountertopConfig({ islandWaterfallLeft: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Cascada Izq. Isla</span>
                      </label>
                      <label 
                        className={`flex items-center gap-2 ${canIslandWaterfallRight ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canIslandWaterfallRight}
                          checked={(countertopConfig.islandWaterfallRight ?? countertopConfig.waterfallRight) && canIslandWaterfallRight}
                          onChange={(e) => setCountertopConfig({ islandWaterfallRight: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Cascada Der. Isla</span>
                      </label>
                    </div>
                  </div>

                  {/* Placa Trasera Exterior de Isla en Piedra Qstone */}
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Placa Trasera Exterior en Piedra Qstone (Solo Muebles Isla)
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            Exclusivo Isla
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Placa adicional adosada que forra la espalda exterior de los muebles isla con el mismo cuarzo o piedra sinterizada, descendiendo a piso. No aplica a muebles base contra muro ni aéreos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isCountertopActive = islandBackConfig.enabled && islandBackConfig.materialType === 'countertop';
                          setIslandBackConfig({
                            enabled: !isCountertopActive,
                            materialType: 'countertop',
                            heightMode: 'to_floor',
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          islandBackConfig.enabled && islandBackConfig.materialType === 'countertop'
                            ? 'bg-amber-500'
                            : isLight ? 'bg-slate-300' : 'bg-white/20'
                        }`}
                        role="switch"
                        aria-checked={islandBackConfig.enabled && islandBackConfig.materialType === 'countertop'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            islandBackConfig.enabled && islandBackConfig.materialType === 'countertop' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {islandBackConfig.enabled && islandBackConfig.materialType === 'countertop' && (
                      <div className={`mt-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        <Sparkles size={14} className="shrink-0" />
                        <span>
                          Placa trasera exterior activada en <strong>{selectedProduct.name}</strong> hasta el piso (sin zócalo). Se incluye en la cubicación y nesting de planchas.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
                {/* Remate y Extensión Seleccionable hacia Muro o Pilar */}
                <div className={`col-span-1 md:col-span-2 rounded-xl p-4 border transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Maximize2 className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                      <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Extensión de Cubierta hacia Muro o Pilar
                      </span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                    }`}>
                      Ajuste de obra
                    </span>
                  </div>

                  <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Por defecto las cubiertas terminan exactamente donde termina el mueble. Activa estas opciones si deseas que la cubierta se prolongue automáticamente hasta topar con un muro o pilar cercano (ideal para cubrir el espacio libre del lavavajillas eléctrico o cerrar vanos entre muebles y muros).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      countertopConfig.extendToWallLeft
                        ? isLight ? 'bg-orange-50/70 border-orange-300 text-slate-900' : 'bg-amber-950/20 border-amber-500/50 text-white'
                        : isLight ? 'bg-slate-50/60 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700 text-slate-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={countertopConfig.extendToWallLeft ?? false}
                        onChange={(e) => setCountertopConfig({ extendToWallLeft: e.target.checked })}
                        className="rounded text-amber-500 accent-amber-500"
                      />
                      <div>
                        <div className="text-xs font-semibold">Extender Extremo Izquierdo a Muro/Pilar</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Cierra a tope con el muro o pilar de la izquierda
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      countertopConfig.extendToWallRight
                        ? isLight ? 'bg-orange-50/70 border-orange-300 text-slate-900' : 'bg-amber-950/20 border-amber-500/50 text-white'
                        : isLight ? 'bg-slate-50/60 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700 text-slate-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={countertopConfig.extendToWallRight ?? false}
                        onChange={(e) => setCountertopConfig({ extendToWallRight: e.target.checked })}
                        className="rounded text-amber-500 accent-amber-500"
                      />
                      <div>
                        <div className="text-xs font-semibold">Extender Extremo Derecho a Muro/Pilar</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Cierra a tope con el muro o pilar de la derecha
                        </div>
                      </div>
                    </label>
                  </div>

                  {(countertopConfig.extendToWallLeft || countertopConfig.extendToWallRight) && (
                    <div className={`p-3.5 rounded-lg border space-y-3.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-700/60'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          Distancia Máxima de Búsqueda de Muro/Pilar:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="300"
                            step="5"
                            value={countertopConfig.extendToWallMaxGapCm ?? 50}
                            onChange={(e) => setCountertopConfig({ extendToWallMaxGapCm: Math.max(10, Math.min(300, Number(e.target.value))) })}
                            className={`w-16 px-2 py-0.5 text-xs text-right font-bold rounded border ${
                              isLight ? 'bg-white border-slate-300 text-orange-600' : 'bg-slate-800 border-slate-700 text-amber-400'
                            }`}
                          />
                          <span className={`text-xs font-bold ${isLight ? 'text-orange-600' : 'text-amber-400'}`}>cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={countertopConfig.extendToWallMaxGapCm ?? 50}
                        onChange={(e) => setCountertopConfig({ extendToWallMaxGapCm: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className={`flex justify-between text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>10 cm</span>
                        <span>60 cm (lavavajillas)</span>
                        <span>150 cm</span>
                        <span>300 cm (muro distante)</span>
                      </div>

                      {/* Botones de ajuste rápido de distancia */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ajuste rápido:</span>
                        {[50, 60, 95, 150, 200, 300].map((presetCm) => (
                          <button
                            key={presetCm}
                            type="button"
                            onClick={() => setCountertopConfig({ extendToWallMaxGapCm: presetCm })}
                            className={`text-[10px] px-2 py-0.5 rounded border transition ${
                              (countertopConfig.extendToWallMaxGapCm ?? 50) === presetCm
                                ? isLight
                                  ? 'bg-orange-500 text-white border-orange-600 font-bold'
                                  : 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                : isLight
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {presetCm} cm
                          </button>
                        ))}
                      </div>

                      {/* Diagnóstico en tiempo real de muros detectados */}
                      <div className={`p-2.5 rounded border text-[11px] space-y-1.5 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <div className="font-semibold flex items-center justify-between">
                          <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Estado de detección en el proyecto:</span>
                          <span className="text-[10px] opacity-70">Rango activo: {countertopConfig.extendToWallMaxGapCm ?? 50} cm</span>
                        </div>
                        {continuousRuns.map((r, rIdx) => {
                          const extL = (r.extensionToWallLeftMm || 0) / 10;
                          const extR = (r.extensionToWallRightMm || 0) / 10;
                          return (
                            <div key={r.id || rIdx} className="space-y-1 border-t border-black/5 pt-1">
                              <div className="font-medium text-amber-500 text-[10px] uppercase">{r.name}:</div>
                              {countertopConfig.extendToWallLeft && (
                                <div className="flex items-center gap-1.5">
                                  {extL > 0 ? (
                                    <>
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>
                                        Flanco Izquierdo: Muro detectado a <strong>{extL.toFixed(1)} cm</strong> (Cubierta extendida a tope)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-amber-500 font-bold">⚠</span>
                                      <span className={isLight ? 'text-amber-800' : 'text-amber-300'}>
                                        Flanco Izquierdo: No se detectó muro a &le; {countertopConfig.extendToWallMaxGapCm ?? 50} cm. Si el muro está más lejos, aumenta el control a <strong>150 cm o 300 cm</strong>.
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                              {countertopConfig.extendToWallRight && (
                                <div className="flex items-center gap-1.5">
                                  {extR > 0 ? (
                                    <>
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>
                                        Flanco Derecho: Muro detectado a <strong>{extR.toFixed(1)} cm</strong> (Cubierta extendida a tope)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-amber-500 font-bold">⚠</span>
                                      <span className={isLight ? 'text-amber-800' : 'text-amber-300'}>
                                        Flanco Derecho: No se detectó muro a &le; {countertopConfig.extendToWallMaxGapCm ?? 50} cm. Si el muro está más lejos, aumenta el control a <strong>150 cm o 300 cm</strong>.
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <label className={`text-xs flex items-center gap-2 cursor-pointer ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          <input
                            type="checkbox"
                            checked={countertopConfig.extendBaseOnly ?? true}
                            onChange={(e) => setCountertopConfig({ extendBaseOnly: e.target.checked })}
                            className="rounded text-amber-500 accent-amber-500"
                          />
                          <span>Aplicar solo a muebles base contra muro (mantener islas con remate libre)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </>
              )}
            </div>
          )}

          {/* TAB 3: SINKS & COOKTOPS */}
          {activeTab === 'appliances' && (
            <div className="space-y-6">
              {applianceError && (
                <div className={`rounded-xl p-3 flex items-start gap-3 text-xs border ${
                  isLight
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                }`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-red-600' : 'text-rose-400'}`} />
                  <div>{applianceError}</div>
                </div>
              )}

              {/* Cubetas Bajo Cubierta (Sysprotec / Qstone) */}
              <div className={`rounded-xl p-4 border transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Cubeta Lavaplatos Bajo Cubierta</span>
                </div>
                <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Instalación bajo cubierta con pulido perimetral de piedra y perforación con disco.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* None */}
                  <div
                    onClick={() => handleSinkChange('none')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.sinkModel === 'none'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Cubeta</div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Solo mesón ciego</div>
                  </div>

                  {/* ALFA ONEC 3018 */}
                  <div
                    onClick={() => handleSinkChange('alfa_onec_3018')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.sinkModel === 'alfa_onec_3018'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>ALFA ONEC 3018</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-900/60 text-cyan-300'
                      }`}>1 Cubeta</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      77.5 x 48 cm (Prof. 23 cm)
                    </div>
                    <div className={`text-[10px] font-medium mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      Encastre: 69.5 x 40 cm • Mueble mín: 80 cm
                    </div>
                  </div>

                  {/* ALFA TWOC F5858A */}
                  <div
                    onClick={() => handleSinkChange('alfa_twoc_f5858a')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.sinkModel === 'alfa_twoc_f5858a'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>ALFA TWOC F5858A</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-900/60 text-cyan-300'
                      }`}>2 Cubetas</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      81.0 x 48 cm (Prof. 21 cm)
                    </div>
                    <div className={`text-[10px] font-medium mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      Encastre: 73.0 x 40 cm • Mueble mín: 90 cm
                    </div>
                  </div>
                </div>
              </div>

              {/* Encimeras FDV */}
              <div className={`rounded-xl p-4 border transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Encimera Sobre Cubierta (FDV)</span>
                </div>
                <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Perforación de encastre rectangular para artefacto de cocción.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* None */}
                  <div
                    onClick={() => handleCooktopChange('none')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.cooktopModel === 'none'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Encimera</div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sin perforación de gas</div>
                  </div>

                  {/* FDV DESIGN 60 2.0 */}
                  <div
                    onClick={() => handleCooktopChange('fdv_design_60')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.cooktopModel === 'fdv_design_60'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>FDV DESIGN 60 2.0</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-900/60 text-orange-300'
                      }`}>4 Platos</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      58 x 50 cm • Triple Corona
                    </div>
                    <div className={`text-[10px] font-medium mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      Encastre: 55 x 47 cm • Mueble mín: 60 cm
                    </div>
                  </div>

                  {/* FDV DESIGN 90 */}
                  <div
                    onClick={() => handleCooktopChange('fdv_design_90')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      countertopConfig.cooktopModel === 'fdv_design_90'
                        ? isLight ? 'border-orange-500 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500 shadow-sm' : 'border-amber-400 bg-amber-950/20 text-white'
                        : isLight ? 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>FDV DESIGN 90</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-900/60 text-orange-300'
                      }`}>5 Platos Wok</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      86 x 50 cm • Acero Inoxidable
                    </div>
                    <div className={`text-[10px] font-medium mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      Encastre: 84 x 47 cm • Mueble mín: 90 cm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NESTING & BOM */}
          {activeTab === 'nesting' && (
            <div className="space-y-6">
              {!nestingBOM ? (
                <div className={`text-center py-12 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Activa la cubierta y agrega al menos un mueble base para calcular el despiece y nesting.
                </div>
              ) : (
                <>
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-xl border transition-colors ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Área Neta Cubiertas</div>
                      <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{nestingBOM.totalNetAreaM2} m²</div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>En piezas instaladas</div>
                    </div>

                    <div className={`p-3 rounded-xl border transition-colors ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Planchas 320x160cm</div>
                      <div className={`text-xl font-bold mt-1 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{nestingBOM.slabsCount} un</div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {nestingBOM.grossBilledM2} m² brutos (5.12 m²/plancha)
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border transition-colors ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Rendimiento Nesting</div>
                      <div className={`text-xl font-bold mt-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{nestingBOM.efficiencyPercent}%</div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Corte disco kerf 3.5mm</div>
                    </div>

                    <div className={`p-3 rounded-xl border transition-colors ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Estimado Cubierta</div>
                      <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        ${nestingBOM.totalCostClp.toLocaleString('es-CL')}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Material + elaboración</div>
                    </div>
                  </div>

                  {/* Cutout details */}
                  {nestingBOM.cutouts.length > 0 && (
                    <div className={`rounded-xl p-3.5 border transition-colors ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                    }`}>
                      <span className={`text-xs font-semibold block mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Perforaciones de Encastre y Procesamiento de Taller:
                      </span>
                      <div className={`space-y-1.5 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {nestingBOM.cutouts.map((c, i) => (
                          <div key={i} className={`flex items-center justify-between py-1 border-b ${
                            isLight ? 'border-slate-100' : 'border-slate-700/50'
                          }`}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-orange-500' : 'bg-amber-400'}`}></span>
                              {c.modelName} ({c.type === 'sink' ? 'Lavaplatos Bajo Cubierta' : 'Encimera'})
                            </span>
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                              Corte: {c.cutoutWidthMm} x {c.cutoutDepthMm} mm • {c.polished ? 'Borde Pulido' : 'Corte Simple'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Continuous Runs & Logistics Criteria */}
                  <div className={`rounded-xl p-4 border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Maximize2 className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                        <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Criterio de Despiece por Corrida Continua & Transporte:
                        </span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-mono border ${
                        isLight
                          ? 'bg-amber-100 border-amber-200 text-amber-800'
                          : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                      }`}>
                        {countertopConfig.buildingType === 'edificio' ? 'Edificio: Máx 2000 mm' : 'Casa: Máx 2500 mm'}
                      </span>
                    </div>
                    <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      El despiece calcula el largo total agrupado de la corrida continua en lugar de cortar por cada mueble individual, garantizando cubiertas enteras sin uniones innecesarias.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {nestingBOM.runs.map((run, rIdx) => (
                        <div key={rIdx} className={`p-2.5 rounded-lg border text-xs ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-700/80'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-semibold ${isLight ? 'text-orange-700' : 'text-amber-300'}`}>{run.name}</span>
                            <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{run.cabinets.length} muebles</span>
                          </div>
                          <div className={`flex justify-between items-center mt-1 text-[11px] ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            <span>Largo Total: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{run.totalLengthMm} mm</strong></span>
                            <span>Prof: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{run.depthMm} mm</strong></span>
                            <span>Tramos: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{run.segmentsCount} tramo(s)</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual 2D Slab Nesting Layout (Planchas 3200 x 1600 mm) */}
                  <div className={`rounded-xl border overflow-hidden ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-semibold flex justify-between items-center ${
                      isLight ? 'bg-slate-100/90 border-slate-200 text-slate-800' : 'bg-slate-950/40 border-slate-800 text-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Scissors className={`w-3.5 h-3.5 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                        <span>Optimización de Corte en Plancha Qstone (Formato 3200 x 1600 mm)</span>
                      </div>
                      <span className={`text-[11px] font-mono font-medium ${isLight ? 'text-orange-700' : 'text-amber-400'}`}>
                        {nestingBOM.slabsLayout.length} Plancha(s) • Kerf 3.5 mm
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {nestingBOM.slabsLayout.map((slab) => (
                        <div key={slab.slabIndex} className={`rounded-xl p-3 border ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-700/80'
                        }`}>
                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              Plancha #{slab.slabIndex} (3200 x 1600 mm)
                            </span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                                Rendimiento: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{slab.efficiencyPercent}%</strong>
                              </span>
                              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                                Área Útil: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{slab.usedAreaM2} m²</strong>
                              </span>
                              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                                Retazo: <strong className={isLight ? 'text-amber-700' : 'text-amber-400'}>{slab.offcutAreaM2} m²</strong>
                              </span>
                            </div>
                          </div>

                          <div className={`w-full overflow-x-auto rounded-lg p-2 flex justify-center ${
                            isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-950'
                          }`}>
                            <svg
                              viewBox="-20 -20 3240 1640"
                              className={`w-full max-w-[820px] max-h-[380px] rounded border ${
                                isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-900 border-slate-700'
                              }`}
                              preserveAspectRatio="xMidYMid meet"
                            >
                              {/* Plancha Base */}
                              <rect x={0} y={0} width={3200} height={1600} fill={isLight ? '#e2e8f0' : '#1e293b'} stroke={isLight ? '#94a3b8' : '#475569'} strokeWidth={4} />

                              {/* Margen despunte 10mm */}
                              <rect x={10} y={10} width={3180} height={1580} fill="none" stroke={isLight ? '#64748b' : '#64748b'} strokeWidth={2} strokeDasharray="16,10" />

                              {/* Piezas anidadas */}
                              {slab.pieces.map((p, pi) => {
                                let fill = isLight ? '#d97706' : '#d97706';
                                let stroke = isLight ? '#b45309' : '#fbbf24';
                                if (p.type === 'apron') {
                                  fill = isLight ? '#ea580c' : '#ea580c';
                                  stroke = isLight ? '#c2410c' : '#fdba74';
                                } else if (p.type === 'backsplash') {
                                  fill = isLight ? '#0284c7' : '#0284c7';
                                  stroke = isLight ? '#0369a1' : '#7dd3fc';
                                } else if (p.type === 'waterfall') {
                                  fill = isLight ? '#9333ea' : '#9333ea';
                                  stroke = isLight ? '#7e22ce' : '#d8b4fe';
                                }

                                const fs = Math.max(22, Math.min(p.widthMm / 14, p.lengthMm / 4, 44));

                                return (
                                  <g key={pi}>
                                    <rect
                                      x={p.x}
                                      y={p.y}
                                      width={p.widthMm}
                                      height={p.lengthMm}
                                      fill={fill}
                                      fillOpacity={isLight ? 0.6 : 0.4}
                                      stroke={stroke}
                                      strokeWidth={3}
                                    />

                                    {/* Calado encastre si aplica */}
                                    {p.hasCutout && p.widthMm > 600 && p.lengthMm > 350 && (
                                      <g>
                                        <rect
                                          x={p.x + (p.widthMm - (p.hasCutout === 'sink' ? 695 : 550)) / 2}
                                          y={p.y + (p.lengthMm - (p.hasCutout === 'sink' ? 400 : 470)) / 2}
                                          width={p.hasCutout === 'sink' ? 695 : 550}
                                          height={p.hasCutout === 'sink' ? 400 : 470}
                                          fill="#ffffff"
                                          fillOpacity={isLight ? 0.3 : 0.15}
                                          stroke="#ef4444"
                                          strokeWidth={3}
                                          strokeDasharray="12,8"
                                        />
                                        <text
                                          x={p.x + p.widthMm / 2}
                                          y={p.y + p.lengthMm / 2 + 8}
                                          textAnchor="middle"
                                          fontSize={24}
                                          fontWeight="bold"
                                          fill="#dc2626"
                                        >
                                          {p.hasCutout === 'sink' ? 'ENCASTRE LAVAPLATOS' : 'ENCASTRE ENCIMERA'}
                                        </text>
                                      </g>
                                    )}

                                    {p.widthMm > 140 && p.lengthMm > 60 && (
                                      <>
                                        <text
                                          x={p.x + p.widthMm / 2}
                                          y={p.y + p.lengthMm / 2 - (p.lengthMm > 100 ? fs * 0.4 : 0)}
                                          textAnchor="middle"
                                          fontSize={fs}
                                          fontWeight="bold"
                                          fill="#ffffff"
                                        >
                                          {p.pieceId}
                                        </text>
                                        {p.lengthMm > 100 && (
                                          <text
                                            x={p.x + p.widthMm / 2}
                                            y={p.y + p.lengthMm / 2 + fs * 0.85}
                                            textAnchor="middle"
                                            fontSize={fs * 0.75}
                                            fontFamily="monospace"
                                            fill={isLight ? '#fef3c7' : '#fde68a'}
                                          >
                                            {p.widthMm} x {p.lengthMm} mm
                                          </text>
                                        )}
                                      </>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      ))}

                      {/* Leyenda de colores */}
                      <div className={`flex flex-wrap items-center gap-4 text-xs pt-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-amber-600/80 border border-amber-400"></span>
                          <span>Cubierta Principal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-orange-600/80 border border-orange-400"></span>
                          <span>Faldón Regrueso</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-sky-600/80 border border-sky-400"></span>
                          <span>Respaldo Zócalo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-purple-600/80 border border-purple-400"></span>
                          <span>Pata Cascada</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm border border-red-500 border-dashed bg-red-500/20"></span>
                          <span>Calado Encastre</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Parts List Table */}
                  <div className={`rounded-xl border overflow-hidden ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-semibold flex justify-between items-center ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-950/40 border-slate-800 text-white'
                    }`}>
                      <span>Despiece Técnico de Marmolería (Piedra Qstone)</span>
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{nestingBOM.pieces.length} piezas</span>
                    </div>
                    <div className="overflow-x-auto max-h-60">
                      <table className={`w-full text-left text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        <thead className={`uppercase text-[10px] tracking-wider sticky top-0 ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-900/80 text-slate-400'
                        }`}>
                          <tr>
                            <th className="py-2 px-3">Código</th>
                            <th className="py-2 px-3">Descripción</th>
                            <th className="py-2 px-3">Largo</th>
                            <th className="py-2 px-3">Ancho</th>
                            <th className="py-2 px-3">Espesor</th>
                            <th className="py-2 px-3">Área (m²)</th>
                            <th className="py-2 px-3">Pulido (m)</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                          {nestingBOM.pieces.map((p) => (
                            <tr key={p.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}>
                              <td className={`py-2 px-3 font-mono text-[11px] ${isLight ? 'text-amber-700 font-bold' : 'text-amber-400'}`}>{p.id}</td>
                              <td className="py-2 px-3">{p.name}</td>
                              <td className="py-2 px-3">{p.lengthMm} mm</td>
                              <td className="py-2 px-3">{p.widthMm} mm</td>
                              <td className="py-2 px-3">{p.thicknessMm} mm</td>
                              <td className="py-2 px-3 font-medium">{p.areaM2.toFixed(3)}</td>
                              <td className="py-2 px-3">{p.edgePolishingM.toFixed(2)} m</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between transition-colors ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/50'
        }`}>
          <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Producto activo:{' '}
            <span className={`font-medium ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>
              {selectedProduct.name} ({selectedProduct.thicknessMm}mm)
            </span>{' '}
            • ${selectedProduct.priceM2Clp.toLocaleString('es-CL')} / m²
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isLight
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
            }`}
          >
            Guardar & Aplicar al Proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
