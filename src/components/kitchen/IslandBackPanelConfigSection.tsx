import React, { useState } from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { useAdminStore } from '../../store/adminStore';
import { 
  Layers, 
  Check, 
  Lock, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Palette,
  Sliders,
  ArrowUpDown,
  ArrowLeftRight
} from 'lucide-react';
import { DottedDepthSlider } from './DottedDepthSlider';

const DEFAULT_TEXTURES = [
  { id: 'def_mas_blanco', name: 'Masisa Blanco', url: '#FFFFFF', brand: 'Masisa' },
  { id: 'def_mas_negro', name: 'Masisa Negro', url: '#171717', brand: 'Masisa' }
];

export function IslandBackPanelConfigSection({ isLight = false }: { isLight?: boolean }) {
  const {
    islandBackConfig,
    setIslandBackConfig,
    countertopConfig,
    qstoneCatalog,
    cabinets,
    setShowSocle,
    socleHeight = 10
  } = useKitchenStore();

  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'abet' | 'masisa' | 'all'>('abet');
  const adminTextures = useAdminStore((s) => s.textures);

  // Verificar si hay muebles de isla en la escena
  const hasIslands = cabinets.some((c) => c.type === 'island');

  const selectedProduct = qstoneCatalog.find(
    (p) => p.id === countertopConfig.selectedProductId
  ) || qstoneCatalog[0];

  // Catálogo unificado de texturas del configurador
  const activeApprovedAdminTextures = (adminTextures || [])
    .filter((t) => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus))
    .map((t) => ({
      id: t.id,
      name: `${t.brand ? t.brand + ' ' : ''}${t.name}`,
      code: t.code,
      url: t.url || t.previewUrl || '#CCCCCC',
      category: t.category,
      brand: t.brand || t.providerName,
    }));

  const combinedMap = new Map<string, any>();
  DEFAULT_TEXTURES.forEach((t) => combinedMap.set(t.id, t));
  activeApprovedAdminTextures.forEach((t) => combinedMap.set(t.id, t));
  const allTextures = Array.from(combinedMap.values());

  const masisaTextures = allTextures.filter(
    (t) => t.name.toLowerCase().includes('masisa') || t.brand?.toLowerCase() === 'masisa'
  );
  const abetTextures = allTextures.filter((t) => {
    const n = t.name.toLowerCase();
    return (
      n.includes('abet') ||
      n.includes('laminati') ||
      n.includes('hpl') ||
      t.category === 'hpl_autor' ||
      t.brand?.toLowerCase() === 'abet laminati'
    );
  });
  const otherTextures = allTextures.filter((t) => {
    const n = t.name.toLowerCase();
    const isMasisa = n.includes('masisa') || t.brand?.toLowerCase() === 'masisa';
    const isAbet =
      n.includes('abet') ||
      n.includes('laminati') ||
      n.includes('hpl') ||
      t.category === 'hpl_autor' ||
      t.brand?.toLowerCase() === 'abet laminati';
    return !isMasisa && !isAbet;
  });

  const displayedTextures =
    pickerTab === 'abet'
      ? abetTextures
      : pickerTab === 'masisa'
        ? masisaTextures
        : allTextures;

  const isCountertopMat = islandBackConfig.materialType === 'countertop';

  // Referencias de profundidad para laterales decorativos de isla
  const islandCab = cabinets.find((c) => c.type === 'island');
  const minDepth = islandCab?.depth || 60;
  const overhang = countertopConfig.islandOverhangCm ?? 30;
  const maxDepth = minDepth + overhang;
  const currentSideDepth = islandBackConfig.sideDepthCm ?? minDepth;

  const handleSelectTexture = (url: string, name: string) => {
    const nameLower = name.toLowerCase();
    const isHPL = nameLower.includes('abet') || nameLower.includes('hpl') || nameLower.includes('laminati');
    setIslandBackConfig({
      decorativeColor: url,
      decorativeMaterial: isHPL ? 'hpl' : 'melamina',
      materialType: 'decorative',
    });
  };

  return (
    <section
      className={`rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
        isLight
          ? 'bg-white border-slate-200'
          : 'bg-zinc-900 border-white/10'
      }`}
      data-purpose="island-panel-setting"
    >
      {/* Header con Switch Principal */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              islandBackConfig.enabled
                ? 'bg-orange-500 text-white shadow-xs'
                : isLight
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-white/10 text-slate-400'
            }`}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3
              className={`text-sm font-bold leading-snug ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Placa trasera exterior isla
            </h3>
            <p
              className={`text-xs leading-normal ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Revestimiento adosado (no afecta fondo)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIslandBackConfig({ enabled: !islandBackConfig.enabled })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            islandBackConfig.enabled ? 'bg-orange-500' : isLight ? 'bg-slate-300' : 'bg-white/20'
          }`}
          role="switch"
          aria-checked={islandBackConfig.enabled}
          title={islandBackConfig.enabled ? 'Desactivar placa exterior' : 'Activar placa exterior'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              islandBackConfig.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <aside
        className={`flex gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
          isLight
            ? 'bg-amber-50/70 border-amber-200/60 text-amber-900'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}
      >
        <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p>
          Esta placa de revestimiento aplica <strong class="font-semibold">exclusivamente a módulos tipo Isla</strong> para ocultar uniones y patas por detrás. No afecta a muebles adosados a muro o aéreos.
        </p>
      </aside>

      {/* Configuración detallada cuando está habilitado */}
      {islandBackConfig.enabled && (
        <div className="flex flex-col gap-4 mt-4 pt-3.5 border-t border-slate-200 dark:border-white/10">
          {/* 1. Selector de Tipo de Material */}
          <div>
            <label
              className={`block text-[11px] uppercase tracking-wider font-bold mb-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              1. Material del Panel Trasero:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIslandBackConfig({ materialType: 'decorative' })}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  !isCountertopMat
                    ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                    : isLight
                      ? 'bg-white border-slate-300 hover:border-slate-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      !isCountertopMat
                        ? isLight
                          ? 'text-orange-700'
                          : 'text-orange-400'
                        : isLight
                          ? 'text-slate-800'
                          : 'text-slate-200'
                    }`}
                  >
                    Decorativo
                  </span>
                  {!isCountertopMat && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Melamina o HPL del configurador
                </span>
              </button>

              <button
                onClick={() =>
                  setIslandBackConfig({
                    materialType: 'countertop',
                    heightMode: 'to_floor', // Forzar hasta el piso
                  })
                }
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isCountertopMat
                    ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                    : isLight
                      ? 'bg-white border-slate-300 hover:border-slate-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-500" />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isCountertopMat
                          ? isLight
                            ? 'text-orange-700'
                            : 'text-orange-400'
                          : isLight
                            ? 'text-slate-800'
                            : 'text-slate-200'
                      }`}
                    >
                      Piedra Cubierta
                    </span>
                  </div>
                  {isCountertopMat && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Mismo Cuarzo / Sinterizado Qstone
                </span>
              </button>
            </div>
          </div>

          {/* 2. Cota Vertical / Zócalo */}
          <div>
            <label
              className={`block text-[11px] uppercase tracking-wider font-bold mb-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              2. Altura y Encuentro Inferior (Zócalo):
            </label>

            {isCountertopMat ? (
              // Modo Cubierta: Solo "Hasta el piso (Sin zócalo)" permitido por criterio de diseño
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-lg border border-orange-500/80 bg-orange-500/10 ${
                      isLight ? 'text-orange-800' : 'text-orange-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Hasta el Piso
                      </span>
                      <span className="text-[10px] opacity-80">Sin zócalo (Sella patas)</span>
                    </div>
                    <Check size={14} className="text-orange-500" strokeWidth={3} />
                  </div>

                  <div
                    className={`flex items-center justify-between p-2.5 rounded-lg border opacity-50 cursor-not-allowed ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                    title="Al seleccionar el material de cubierta, solo se permite la opción hasta el piso."
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Con Zócalo
                      </span>
                      <span className="text-[10px]">No permitido en piedra</span>
                    </div>
                    <Lock size={13} className="text-slate-400" />
                  </div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    isLight
                      ? 'bg-cyan-50/70 border-cyan-300 text-cyan-900'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  }`}
                >
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Regla Técnica:</strong> Al utilizar el mismo material de la cubierta (Qstone), la terminación desciende obligatoriamente hasta el nivel de suelo para un encuentro monolítico y ocultar completamente las patas de nivelación.
                  </p>
                </div>
              </div>
            ) : (
              // Modo Decorativo: Permite elegir "Hasta el piso" o "Con zócalo"
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIslandBackConfig({ heightMode: 'to_floor' })}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    islandBackConfig.heightMode === 'to_floor'
                      ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                      : isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        islandBackConfig.heightMode === 'to_floor'
                          ? isLight
                            ? 'text-orange-700'
                            : 'text-orange-400'
                          : isLight
                            ? 'text-slate-800'
                            : 'text-slate-200'
                      }`}
                    >
                      Hasta el Piso
                    </span>
                    {islandBackConfig.heightMode === 'to_floor' && (
                      <Check size={12} className="text-orange-500" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Sin zócalo (Cubre patas)
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIslandBackConfig({ heightMode: 'with_socle' });
                    setShowSocle(true);
                  }}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    islandBackConfig.heightMode === 'with_socle'
                      ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                      : isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        islandBackConfig.heightMode === 'with_socle'
                          ? isLight
                            ? 'text-orange-700'
                            : 'text-orange-400'
                          : isLight
                            ? 'text-slate-800'
                            : 'text-slate-200'
                      }`}
                    >
                      Con Zócalo
                    </span>
                    {islandBackConfig.heightMode === 'with_socle' && (
                      <Check size={12} className="text-orange-500" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Línea zócalo {socleHeight} cm libre
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Acabado Actual / Selector de Texturas */}
          <div>
            <label
              className={`block text-[11px] uppercase tracking-wider font-bold mb-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              3. Terminación Seleccionada:
            </label>

            {isCountertopMat ? (
              <div
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isLight
                    ? 'bg-white border-slate-300 shadow-sm'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-md border border-slate-400 shadow-inner flex items-center justify-center font-bold text-[10px] shrink-0"
                    style={{ backgroundColor: selectedProduct.colorHex || '#F4F5F8' }}
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                      title={selectedProduct.name}
                    >
                      {selectedProduct.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold block truncate ${
                        isLight ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      {selectedProduct.brand} • {selectedProduct.materialType === 'quarzo' ? 'Cuarzo' : 'Piedra Sinterizada'} ({selectedProduct.thicknessMm}mm)
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider border shrink-0 text-center self-start sm:self-auto ${
                    isLight
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  }`}
                >
                  Sincronizado
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Visualizador del decorativo actual */}
                <div
                  className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isLight
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded border border-slate-400 shadow-inner bg-cover bg-center shrink-0"
                      style={
                        islandBackConfig.decorativeColor.startsWith('#')
                          ? { backgroundColor: islandBackConfig.decorativeColor }
                          : { backgroundImage: `url('${islandBackConfig.decorativeColor}')` }
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-bold block truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                        title={allTextures.find((t) => t.url === islandBackConfig.decorativeColor)?.name || islandBackConfig.decorativeColor}
                      >
                        {allTextures.find((t) => t.url === islandBackConfig.decorativeColor)?.name ||
                          islandBackConfig.decorativeColor}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold block truncate ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {islandBackConfig.decorativeMaterial.toUpperCase()} (18 mm)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTexturePicker(!showTexturePicker)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border shrink-0 w-full sm:w-auto ${
                      isLight
                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}
                  >
                    <Palette size={13} />
                    <span>{showTexturePicker ? 'Cerrar' : 'Elegir'}</span>
                    {showTexturePicker ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Desplegable de selección de texturas */}
                {showTexturePicker && (
                  <div
                    className={`p-3 rounded-lg border max-h-72 overflow-y-auto ${
                      isLight
                        ? 'bg-orange-50/50 border-orange-300 shadow-inner'
                        : 'bg-black/40 border-orange-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-orange-200 dark:border-white/10">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        Seleccionar Terminación:
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPickerTab('abet')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            pickerTab === 'abet'
                              ? 'bg-orange-500 text-black shadow-sm'
                              : isLight
                                ? 'bg-white text-slate-700 border border-slate-300'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          Abet HPL ({abetTextures.length})
                        </button>
                        <button
                          onClick={() => setPickerTab('masisa')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            pickerTab === 'masisa'
                              ? 'bg-orange-500 text-black shadow-sm'
                              : isLight
                                ? 'bg-white text-slate-700 border border-slate-300'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          Masisa ({masisaTextures.length})
                        </button>
                        <button
                          onClick={() => setPickerTab('all')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            pickerTab === 'all'
                              ? 'bg-orange-500 text-black shadow-sm'
                              : isLight
                                ? 'bg-white text-slate-700 border border-slate-300'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          Todas ({allTextures.length})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {displayedTextures.map((tex) => {
                        const isSelected = islandBackConfig.decorativeColor === tex.url;
                        const isHPL = tex.name.toLowerCase().includes('abet') || tex.name.toLowerCase().includes('hpl') || tex.name.toLowerCase().includes('laminati');
                        return (
                          <button
                            key={tex.id}
                            onClick={() => handleSelectTexture(tex.url, tex.name)}
                            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.3)] ring-1 ring-orange-500'
                                : isLight
                                  ? 'bg-white border-slate-300 hover:border-orange-400'
                                  : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                            title={`${tex.name} (${isHPL ? 'Laminado HPL Abet' : 'Melamina'})`}
                          >
                            <div
                              className="w-full aspect-square rounded border border-slate-300 bg-cover bg-center relative"
                              style={
                                tex.url.startsWith('#')
                                  ? { backgroundColor: tex.url }
                                  : { backgroundImage: `url('${tex.url}')` }
                              }
                            >
                              <span className={`absolute bottom-0.5 right-0.5 text-[7px] font-black uppercase px-1 rounded ${
                                isHPL ? 'bg-orange-500 text-black' : 'bg-slate-800/80 text-white'
                              }`}>
                                {isHPL ? 'HPL' : 'MEL'}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider truncate w-full text-center ${
                                isSelected
                                  ? isLight
                                    ? 'text-orange-900 font-extrabold'
                                    : 'text-orange-300 font-extrabold'
                                  : isLight
                                    ? 'text-slate-700'
                                    : 'text-slate-300'
                              }`}
                            >
                              {tex.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Sentido / Orientación de la Veta */}
          {!isCountertopMat && (
            <div>
              <label
                className={`block text-[11px] uppercase tracking-wider font-bold mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                4. Sentido / Orientación de la Veta:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIslandBackConfig({ grainDirection: 'vertical' })}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    (islandBackConfig.grainDirection || 'vertical') === 'vertical'
                      ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                      : isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown size={13} className={(islandBackConfig.grainDirection || 'vertical') === 'vertical' ? 'text-orange-500' : 'text-slate-400'} />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          (islandBackConfig.grainDirection || 'vertical') === 'vertical'
                            ? isLight
                              ? 'text-orange-700'
                              : 'text-orange-400'
                            : isLight
                              ? 'text-slate-800'
                              : 'text-slate-200'
                        }`}
                      >
                        Vertical
                      </span>
                    </div>
                    {(islandBackConfig.grainDirection || 'vertical') === 'vertical' && (
                      <div className="w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Veta a lo alto (Estándar)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIslandBackConfig({ grainDirection: 'horizontal' })}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    islandBackConfig.grainDirection === 'horizontal'
                      ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                      : isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight size={13} className={islandBackConfig.grainDirection === 'horizontal' ? 'text-orange-500' : 'text-slate-400'} />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          islandBackConfig.grainDirection === 'horizontal'
                            ? isLight
                              ? 'text-orange-700'
                              : 'text-orange-400'
                            : isLight
                              ? 'text-slate-800'
                              : 'text-slate-200'
                        }`}
                      >
                        Horizontal
                      </span>
                    </div>
                    {islandBackConfig.grainDirection === 'horizontal' && (
                      <div className="w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Veta apaisada / continua
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Costados Laterales Decorativos de Isla (Melamina / HPL / MDF Laminado) */}
          {!isCountertopMat && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all ${
                islandBackConfig.sidesEnabled
                  ? isLight
                    ? 'bg-orange-50/40 border-orange-300 shadow-sm'
                    : 'bg-orange-500/10 border-orange-500/30'
                  : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className={isLight ? 'text-orange-600' : 'text-orange-400'} />
                  <span
                    className={`text-[11px] uppercase tracking-wider font-bold ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    5. Costados Laterales de Isla:
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!islandBackConfig.sidesEnabled}
                    onChange={(e) => setIslandBackConfig({ sidesEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {islandBackConfig.sidesEnabled && (
                <div className="flex flex-col gap-3 pt-2.5 border-t border-orange-200/60 dark:border-white/10">
                  {/* Flancos habilitados */}
                  <div>
                    <label
                      className={`block text-[10px] uppercase tracking-wider font-bold mb-1.5 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      Flancos con Lateral:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIslandBackConfig({
                            sideLeftEnabled: !(islandBackConfig.sideLeftEnabled !== false),
                          })
                        }
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          islandBackConfig.sideLeftEnabled !== false
                            ? isLight
                              ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold'
                              : 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                            : isLight
                              ? 'bg-white border-slate-300 text-slate-500'
                              : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <span>Lateral Izquierdo</span>
                        {islandBackConfig.sideLeftEnabled !== false && (
                          <Check size={13} className="text-orange-500" strokeWidth={3} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setIslandBackConfig({
                            sideRightEnabled: !(islandBackConfig.sideRightEnabled !== false),
                          })
                        }
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          islandBackConfig.sideRightEnabled !== false
                            ? isLight
                              ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold'
                              : 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                            : isLight
                              ? 'bg-white border-slate-300 text-slate-500'
                              : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <span>Lateral Derecho</span>
                        {islandBackConfig.sideRightEnabled !== false && (
                          <Check size={13} className="text-orange-500" strokeWidth={3} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Slider de profundidad del lateral con diseño de puntos y cota flotante */}
                  <DottedDepthSlider
                    min={minDepth}
                    max={maxDepth}
                    step={1}
                    value={currentSideDepth}
                    onChange={(val) => setIslandBackConfig({ sideDepthCm: val })}
                    label="Profundidad del Lateral"
                    overhangCm={overhang}
                    isLight={isLight}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
