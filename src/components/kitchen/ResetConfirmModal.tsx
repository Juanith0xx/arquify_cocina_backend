import React from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetConfirmModal({ isOpen, onClose }: ResetConfirmModalProps) {
  const { resetKitchen } = useKitchenStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetKitchen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                ¿Eliminar y partir de cero?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Restablecer configuración de cocina completa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description Body */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3.5 mb-6 text-xs text-slate-300 leading-relaxed">
          Esta acción <span className="text-red-400 font-semibold">eliminará todos los muebles colocados</span>, borrará muros personalizados y restablecerá el plano al área de cocina rectangular inicial y acabados estándar.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw size={15} />
            <span>Sí, borrar y reiniciar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
