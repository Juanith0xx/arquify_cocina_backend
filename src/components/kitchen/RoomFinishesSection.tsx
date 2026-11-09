import React, { useState } from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { WALL_COLOR_OPTIONS, FLOOR_TYPE_OPTIONS } from '../../utils/kitchenMaterials';
import { Palette, Check, Layers } from 'lucide-react';

const sectionTitle = "text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-3 mt-6 first:mt-0";

export function RoomFinishesSection({ isLight = false }: { isLight?: boolean }) {
  const { wallColor, setWallColor, floorType, setFloorType } = useKitchenStore();
  const [activeTab, setActiveTab] = useState<'walls' | 'floors'>('walls');

  return (
    <section className="space-y-3 my-4" data-purpose="room-finishes">
      <div className="flex items-center justify-between">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>Acabados de Estancia</h2>

        {/* Segmented Filter Control */}
        <div className={`inline-flex p-1 rounded-xl text-xs font-medium border ${
          isLight ? 'bg-slate-200/80 border-slate-300/60' : 'bg-zinc-800/80 border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('walls')}
            className={`px-3 py-1.5 rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'walls'
                ? 'bg-orange-500 text-white font-bold shadow-orange-500/30'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
            }`}
          >
            <Palette size={13} />
            <span>Muros <span className="opacity-90 font-normal">({WALL_COLOR_OPTIONS.length})</span></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`px-3 py-1.5 rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'floors'
                ? 'bg-orange-500 text-white font-bold shadow-orange-500/30'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Pisos <span className="opacity-90 font-normal">({FLOOR_TYPE_OPTIONS.length})</span></span>
          </button>
        </div>
      </div>

      {activeTab === 'walls' && (
        <div className={`grid grid-cols-5 gap-2.5 p-3 rounded-2xl border shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-zinc-900/90 border-white/10'
        }`}>
          {WALL_COLOR_OPTIONS.map((opt) => {
            const isSelected = (wallColor || '').toLowerCase() === opt.hex.toLowerCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWallColor(opt.hex)}
                title={`${opt.name} (${opt.category}): ${opt.description}`}
                className={`group flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-orange-50/80 ring-2 ring-orange-500 ring-offset-1'
                      : 'bg-orange-950/40 ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-900'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full border-2 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center ${
                    isSelected ? 'border-orange-400' : isLight ? 'border-slate-200' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                >
                  {isSelected && (
                    <Check
                      size={15}
                      strokeWidth={3}
                      className={
                        ['#FFFFFF', '#F6F3EC', '#E2E8F0', '#CBD5E1', '#E7DEC8', '#9CAF88'].includes(opt.hex)
                          ? 'text-black'
                          : 'text-white'
                      }
                    />
                  )}
                </div>
                <span className={`text-[10px] text-center truncate max-w-full font-medium ${
                  isSelected
                    ? isLight ? 'font-bold text-orange-700' : 'font-bold text-orange-400'
                    : isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  {opt.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'floors' && (
        <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border max-h-56 overflow-y-auto no-scrollbar ${
          isLight ? 'bg-white border-slate-200' : 'bg-zinc-900/90 border-white/10'
        }`}>
          {FLOOR_TYPE_OPTIONS.map((opt) => {
            const isSelected = floorType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFloorType(opt.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/15 shadow-xs font-bold'
                    : isLight
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 shrink-0 shadow-xs relative overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: opt.primaryColor }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-30"
                    style={{ backgroundColor: opt.accentColor }}
                  />
                  {isSelected && <Check size={14} strokeWidth={3} className="relative z-10 text-orange-500 drop-shadow" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[11px] font-bold truncate leading-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>{opt.name}</span>
                  <span className={`text-[9px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-orange-600' : 'text-orange-400'
                  }`}>{opt.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

