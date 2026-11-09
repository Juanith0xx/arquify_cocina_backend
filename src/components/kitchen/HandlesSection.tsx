import React from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { 
  HANDLE_CATALOG, 
  FINISH_LABELS, 
  FINISH_HEX, 
  HandleModelId, 
  HandleFinish 
} from '../../types/handle';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';

interface HandlesSectionProps {
  isLight?: boolean;
}

export function HandlesSection({ isLight }: HandlesSectionProps) {
  const { handleConfig, setHandleConfig, golaSystem, setGolaSystem } = useKitchenStore();

  const selectedModelItem = HANDLE_CATALOG.find((m) => m.id === handleConfig.model) || HANDLE_CATALOG[0];

  const handleSelectModel = (modelId: HandleModelId) => {
    const item = HANDLE_CATALOG.find((m) => m.id === modelId);
    if (!item) return;

    // Check if current finish is supported, else pick first available
    const newFinish = item.finishes.includes(handleConfig.finish)
      ? handleConfig.finish
      : item.finishes[0] || 'negro';

    // Check if current length is supported, else pick middle or first
    const newLength = item.lengths.includes(handleConfig.lengthMm)
      ? handleConfig.lengthMm
      : item.lengths[0] || 0;

    // Al seleccionar un modelo de tirador, desactivar el riel Gola para mostrar los tiradores
    if (golaSystem !== 'none') {
      setGolaSystem('none');
    }

    setHandleConfig({
      model: modelId,
      finish: newFinish,
      lengthMm: newLength,
    });
  };

  const handleSelectFinish = (finish: HandleFinish) => {
    if (golaSystem !== 'none') {
      setGolaSystem('none');
    }
    setHandleConfig({ finish });
  };

  const handleSelectLength = (len: number) => {
    if (golaSystem !== 'none') {
      setGolaSystem('none');
    }
    setHandleConfig({ lengthMm: len });
  };

  const isGolaActive = golaSystem !== 'none';

  return (
    <div className="flex flex-col gap-4">
      {isGolaActive && (
        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
          isLight 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-amber-950/30 border-amber-700/50 text-amber-300'
        }`}>
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-snug text-[11px]">
              <strong>Perfil Gola activo:</strong> Selecciona cualquier tirador o pulsa el botón para desactivar Gola y mostrar tiradores en los muebles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGolaSystem('none')}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            Quitar Gola
          </button>
        </div>
      )}

      {/* Selector de Modelos */}
      <div>
        <label className={`text-[11px] uppercase tracking-wider font-bold mb-2 block ${
          isLight ? 'text-slate-700' : 'text-slate-300'
        }`}>
          Modelo de Tirador
        </label>
        <div className="grid grid-cols-2 gap-2">
          {HANDLE_CATALOG.map((item) => {
            const isSelected = handleConfig.model === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectModel(item.id)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? isLight
                      ? 'bg-orange-50 border-orange-500 shadow-sm'
                      : 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                    : isLight
                      ? 'bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${
                    isSelected 
                      ? isLight ? 'text-orange-950' : 'text-orange-400' 
                      : isLight ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    {item.name}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-black">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-75">
                  <span className={`capitalize ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.material}
                  </span>
                  {item.holeCount > 0 && (
                    <span className="text-orange-500 font-medium">
                      • {item.holeCount === 1 ? '1 Punto' : '2 Puntos'}
                    </span>
                  )}
                  {item.isRearMount && (
                    <span className="text-amber-500 font-medium">• Pestaña</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {handleConfig.model !== 'none' && (
        <>
          {/* Selector de Acabados / Colores */}
          {selectedModelItem.finishes.length > 0 && (
            <div>
              <label className={`text-[11px] uppercase tracking-wider font-bold mb-2 block ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Terminación / Acabado ({selectedModelItem.finishes.length})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedModelItem.finishes.map((finishKey) => {
                  const isSelected = handleConfig.finish === finishKey;
                  const hex = FINISH_HEX[finishKey];
                  const label = FINISH_LABELS[finishKey];
                  return (
                    <button
                      key={finishKey}
                      onClick={() => handleSelectFinish(finishKey)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                            : 'bg-orange-500/20 border-orange-500 ring-1 ring-orange-500'
                          : isLight
                            ? 'bg-white border-slate-200 hover:border-slate-300'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner"
                        style={{ backgroundColor: hex }}
                      />
                      <span className={`text-[11px] font-semibold truncate ${
                        isSelected 
                          ? isLight ? 'text-orange-950' : 'text-orange-400'
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

          {/* Selector de Medidas / Entrecentros */}
          {selectedModelItem.lengths.length > 0 && selectedModelItem.lengths[0] > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-[11px] uppercase tracking-wider font-bold ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {selectedModelItem.holeCount === 2 ? 'Entrecentros / Medida' : 'Dimensión'}
                </label>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {handleConfig.lengthMm} mm
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {selectedModelItem.lengths.map((len) => {
                  const isSelected = handleConfig.lengthMm === len;
                  return (
                    <button
                      key={len}
                      onClick={() => handleSelectLength(len)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                          : isLight
                            ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                            : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                      }`}
                    >
                      {len} mm
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Descripción Técnica / Ficha */}
          <div className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
            isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-orange-500" />
              {selectedModelItem.name} ({FINISH_LABELS[handleConfig.finish]})
            </p>
            <p>{selectedModelItem.description}</p>
            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Mecanizado: {selectedModelItem.holeCount === 2 ? `2 taladros Ø4.5mm (c-c ${handleConfig.lengthMm}mm)` : selectedModelItem.holeCount === 1 ? '1 taladro Ø4.5mm' : 'Fijación posterior sin taladro pasante'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
