import React, { useState } from 'react';
import { useHplBathroomStore } from '../../store/hplBathroomStore';
import { X, Check, LayoutGrid, Sparkles, Box, ShieldCheck, Compass } from 'lucide-react';

interface HplRoomPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HplRoomPlannerModal({ isOpen, onClose }: HplRoomPlannerModalProps) {
  const { room, updateRoom, batteryLayout, setBatteryLayout, cubicles, addCubicle, removeCubicle, urinalScreens, addUrinalScreen, removeUrinalScreen } = useHplBathroomStore();

  const [width, setWidth] = useState(room.roomWidth);
  const [length, setLength] = useState(room.roomLength);
  const [height, setHeight] = useState(room.roomHeight);
  const [showFixtures, setShowFixtures] = useState(room.showFixtures);

  if (!isOpen) return null;

  const handleApply = () => {
    updateRoom({
      roomWidth: width,
      roomLength: length,
      roomHeight: height,
      showFixtures,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Configurador de Área del Recinto</h2>
              <p className="text-xs text-slate-400">Dimensiones de la sala de baños y disposición de la batería sanitaria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Dimensiones de la Sala */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dimensiones de la Sala (mm)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ancho Sala (X)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2000}
                    max={12000}
                    step={100}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-mono">mm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Largo Sala (Z)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2000}
                    max={12000}
                    step={100}
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-mono">mm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Altura Muros (Y)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2200}
                    max={4000}
                    step={50}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-mono">mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tipo de Disposición de Batería */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Disposición de las Cabinas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBatteryLayout('inline_wall_left')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  batteryLayout === 'inline_wall_left'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-white mb-1">En Línea (Muro Posterior + Lateral)</div>
                <div className="text-xs text-slate-400">Apoyo en muro posterior y tabique de cierre en un lateral.</div>
              </button>

              <button
                type="button"
                onClick={() => setBatteryLayout('between_walls')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  batteryLayout === 'between_walls'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-white mb-1">Entre Muros (Nicho / Embutido)</div>
                <div className="text-xs text-slate-400">Encajado entre paramentos izquierdo y derecho.</div>
              </button>
            </div>
          </div>

          {/* Opciones de Visualización 3D */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showFixtures}
                onChange={(e) => setShowFixtures(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-950 border-slate-700"
              />
              <div>
                <span className="text-sm font-semibold text-white">Mostrar artefactos sanitarios en 3D</span>
                <p className="text-xs text-slate-400">Tazas de inodoro suspendidas con estanque embutido y urinarios cerámicos</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
          >
            <Check size={16} />
            <span>Aplicar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
}
