import React from 'react';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { useKitchenStore } from '../../store/kitchenStore';

interface GolaRegruesoIncompatibilityModalProps {
  isLight?: boolean;
}

export function GolaRegruesoIncompatibilityModal({ isLight: isLightProp }: GolaRegruesoIncompatibilityModalProps = {}) {
  const { golaIncompatibilityAlert, setGolaIncompatibilityAlert, setGolaSystem, setCountertopConfig, golaSystem } = useKitchenStore();
  const isLight = isLightProp ?? (typeof window !== 'undefined' && localStorage.getItem('arquify_kitchen_theme') === 'light');

  if (!golaIncompatibilityAlert || !golaIncompatibilityAlert.isOpen) {
    return null;
  }

  const { regruesoCm, stoneThicknessCm, attemptedAction } = golaIncompatibilityAlert;
  const maxAllowedRegrueso = Number((stoneThicknessCm + 2.0).toFixed(1));
  const faldonDrop = Math.max(0, Number((regruesoCm - stoneThicknessCm).toFixed(1)));

  const handleClose = () => {
    setGolaIncompatibilityAlert(null);
  };

  const handleDisableGolaAndApplyRegrueso = () => {
    setGolaSystem('none');
    setCountertopConfig({ regruesoCm });
    setGolaIncompatibilityAlert(null);
  };

  const handleAdjustRegruesoAndActivateGola = () => {
    setCountertopConfig({ regruesoCm: Math.floor(maxAllowedRegrueso) });
    if (attemptedAction === 'gola') {
      setGolaSystem('aluminum');
    }
    setGolaIncompatibilityAlert(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative transition-colors ${
        isLight
          ? 'bg-white border-amber-400 text-slate-900 shadow-slate-900/10'
          : 'bg-slate-900 border-amber-500/40 text-slate-100 shadow-amber-950/40'
      }`}>
        {/* Botón cerrar esquina */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isLight
              ? 'bg-amber-100 border border-amber-300 text-amber-700'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
              isLight
                ? 'text-amber-800 bg-amber-100 border-amber-200'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              Restricción Técnica de Fabricación
            </span>
            <h3 className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Incompatibilidad: Regrueso y Riel Gola
            </h3>
          </div>
        </div>

        {/* Cuerpo informativo */}
        <div className={`space-y-3 text-xs leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          <p>
            {attemptedAction === 'regrueso' ? (
              <>
                Ha seleccionado un <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>regrueso de {regruesoCm} cm</strong> con una plancha de espesor <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{stoneThicknessCm} cm</strong> teniendo el <strong className={isLight ? 'text-amber-700 font-bold' : 'text-amber-300'}>Sistema Riel Gola activo</strong>.
              </>
            ) : (
              <>
                No es posible activar el <strong className={isLight ? 'text-amber-700 font-bold' : 'text-amber-300'}>Sistema Riel Gola</strong> porque la cubierta tiene actualmente un <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>regrueso de {regruesoCm} cm</strong> con plancha de <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{stoneThicknessCm} cm</strong>.
              </>
            )}
          </p>

          <div className={`rounded-xl p-3.5 space-y-2 border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Espesor de la plancha:</span>
              <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{stoneThicknessCm} cm</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Regrueso solicitado:</span>
              <span className={`font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>{regruesoCm} cm</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Descenso del faldón de cubierta:</span>
              <span className="font-mono font-bold text-red-600">{faldonDrop} cm por debajo del mueble</span>
            </div>
            <div className={`flex items-center justify-between border-t pt-2 ${
              isLight ? 'border-slate-200' : 'border-slate-700/60'
            }`}>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Regrueso máximo compatible con Gola:</span>
              <span className="font-mono font-bold text-emerald-600">Hasta {maxAllowedRegrueso} cm (Espesor + 2 cm)</span>
            </div>
          </div>

          <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
            <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Motivo de ingeniería:</strong> El canal superior de aluminio <em>Gola L</em> requiere una luz libre de 35 mm bajo la cubierta para el acceso ergonómico de los dedos. Un faldón que exceda en más de 2 cm el espesor de la piedra tapa físicamente el canal, imposibilitando abrir los cajones y puertas.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
          {attemptedAction === 'regrueso' ? (
            <>
              <button
                onClick={handleClose}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Mantener Gola (Cancelar regrueso)
              </button>
              <button
                onClick={handleDisableGolaAndApplyRegrueso}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Desactivar Gola y aplicar {regruesoCm} cm
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Entendido / Mantener Tiradores
              </button>
              <button
                onClick={handleAdjustRegruesoAndActivateGola}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Ajustar a {Math.floor(maxAllowedRegrueso)} cm y activar Gola
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
