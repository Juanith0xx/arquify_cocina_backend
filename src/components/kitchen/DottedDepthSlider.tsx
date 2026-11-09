import React, { useMemo } from 'react';
import { Sliders } from 'lucide-react';

interface DottedDepthSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  overhangCm?: number;
  isLight?: boolean;
}

export const DottedDepthSlider: React.FC<DottedDepthSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label = 'Profundidad Lateral Isla',
  unit = 'cm',
  overhangCm,
  isLight = true,
}) => {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const range = safeMax - safeMin || 1;
  const currentVal = Math.min(Math.max(value, safeMin), safeMax);
  const percent = ((currentVal - safeMin) / range) * 100;

  // Generar puntos nodales a lo largo de la regla
  const dots = useMemo(() => {
    // Si el rango es divisible limpiamente por 5 o 10, usar ese paso para los puntos
    let dotStep = 5;
    if (range <= 20) dotStep = 2.5;
    else if (range > 50) dotStep = 10;

    const count = Math.max(4, Math.min(10, Math.floor(range / dotStep)));
    const stepRatio = range / count;

    const points: { val: number; pct: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const val = Math.round(safeMin + i * stepRatio);
      const pct = ((val - safeMin) / range) * 100;
      points.push({ val, pct });
    }
    return points;
  }, [safeMin, safeMax, range]);

  const effectiveOverhang = overhangCm ?? (safeMax - safeMin);
  const remainingOverhang = safeMax - currentVal;

  const statusText = useMemo(() => {
    if (currentVal <= safeMin) {
      return `Cubierta en voladizo (${effectiveOverhang} ${unit} libres)`;
    }
    if (currentVal >= safeMax) {
      return 'Cubre voladizo de cubierta (0 cm)';
    }
    return `Voladizo parcial (${remainingOverhang} ${unit} libres)`;
  }, [currentVal, safeMin, safeMax, effectiveOverhang, remainingOverhang, unit]);

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col gap-3.5 transition-all ${
        isLight
          ? 'bg-orange-50/60 border-orange-200/90 shadow-xs'
          : 'bg-orange-500/10 border-orange-500/30'
      }`}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={16} className={isLight ? 'text-orange-600' : 'text-orange-400'} />
          <span
            className={`text-xs uppercase font-bold tracking-wider ${
              isLight ? 'text-slate-800' : 'text-zinc-100'
            }`}
          >
            {label}
          </span>
        </div>
        <span
          className={`text-xs font-black px-2.5 py-1 rounded-md border tracking-wide ${
            isLight
              ? 'bg-orange-100 border-orange-300 text-orange-950'
              : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
          }`}
        >
          {currentVal} {unit}
        </span>
      </div>

      {/* Control Slider Dotted con Indicador Flotante */}
      <div className="flex flex-col pt-4 pb-1 px-1">
        <div className="relative w-full h-8 flex items-center">
          {/* Indicador Flotante con Cota exacta sobre el punto activo */}
          <div
            className="absolute -top-3 -translate-x-1/2 pointer-events-none transition-all duration-75 flex flex-col items-center"
            style={{ left: `${percent}%` }}
          >
            <span className="text-[12px] font-extrabold text-orange-600 dark:text-orange-400 whitespace-nowrap leading-none tracking-tight">
              {currentVal}{unit}
            </span>
          </div>

          {/* Línea de Fondo Inactiva (Gris) */}
          <div className="absolute left-0 right-0 h-[3px] bg-slate-300 dark:bg-zinc-600 rounded-full" />

          {/* Línea de Fondo Activa (Naranja) */}
          <div
            className="absolute left-0 h-[3px] bg-orange-500 rounded-full transition-all duration-75"
            style={{ width: `${percent}%` }}
          />

          {/* Puntos / Nodos Intermedios */}
          {dots.map((d, idx) => {
            const isActive = d.pct <= percent;
            return (
              <div
                key={idx}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-colors duration-150"
                style={{ left: `${d.pct}%` }}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-orange-500 scale-100'
                      : isLight
                        ? 'bg-slate-300 scale-90'
                        : 'bg-zinc-600 scale-90'
                  }`}
                />
              </div>
            );
          })}

          {/* Puntero / Handle Circular con anillo */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-75"
            style={{ left: `${percent}%` }}
          >
            <div className="w-5 h-5 rounded-full border-[2.5px] border-orange-500 bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            </div>
          </div>

          {/* Input Range Nativo Invisible para interacción perfecta Touch y Mouse */}
          <input
            type="range"
            min={safeMin}
            max={safeMax}
            step={step}
            value={currentVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
            aria-label={label}
          />
        </div>

        {/* Textos descriptivos de cotas y estado */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-2">
          <span>A ras ({safeMin} {unit})</span>
          <span className="font-bold text-orange-600 dark:text-orange-400 text-center px-1">
            {statusText}
          </span>
          <span>Total ({safeMax} {unit})</span>
        </div>
      </div>

      {/* Botones de Acceso Rápido */}
      <div className="grid grid-cols-2 gap-2 mt-0.5">
        <button
          type="button"
          onClick={() => onChange(safeMin)}
          className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
            currentVal === safeMin
              ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm'
              : isLight
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          A ras ({safeMin} {unit})
        </button>
        <button
          type="button"
          onClick={() => onChange(safeMax)}
          className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
            currentVal === safeMax
              ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm'
              : isLight
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          Total ({safeMax} {unit})
        </button>
      </div>
    </div>
  );
};
