import React, { useState } from 'react';
import { 
  Wrench, 
  DollarSign, 
  Layers, 
  HelpCircle, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  TrendingUp, 
  Box, 
  Calculator, 
  ShieldCheck, 
  Info,
  Sparkles
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export function ManufacturingRatesTab() {
  const { manufacturingRates, updateManufacturingRates, resetManufacturingRates, themeMode } = useAdminStore();
  const isLight = themeMode === 'light';

  const [pricePerM2, setPricePerM2] = useState(manufacturingRates.manufacturingPricePerM2);
  const [preAssemblyPrice, setPreAssemblyPrice] = useState(manufacturingRates.preAssemblyPricePerCabinet);
  const [enablePreAssembly, setEnablePreAssembly] = useState(manufacturingRates.enablePreAssembly);
  const [minifixPrice, setMinifixPrice] = useState(manufacturingRates.minifixMachiningPrice);
  const [designerMargin, setDesignerMargin] = useState(manufacturingRates.defaultDesignerMarginPercent);

  // Simulador rápido
  const [simM2, setSimM2] = useState(16.5);
  const [simCabinets, setSimCabinets] = useState(8);

  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = () => {
    updateManufacturingRates({
      manufacturingPricePerM2: Number(pricePerM2),
      preAssemblyPricePerCabinet: Number(preAssemblyPrice),
      enablePreAssembly: Boolean(enablePreAssembly),
      minifixMachiningPrice: Number(minifixPrice),
      defaultDesignerMarginPercent: Number(designerMargin),
    });
    showToast('Tarifas de manufactura y parámetros B2B guardados con éxito.');
  };

  const handleReset = () => {
    if (window.confirm('¿Restablecer las tarifas de manufactura a los valores predeterminados de fábrica?')) {
      resetManufacturingRates();
      const def = useAdminStore.getState().manufacturingRates;
      setPricePerM2(def.manufacturingPricePerM2);
      setPreAssemblyPrice(def.preAssemblyPricePerCabinet);
      setEnablePreAssembly(def.enablePreAssembly);
      setMinifixPrice(def.minifixMachiningPrice);
      setDesignerMargin(def.defaultDesignerMarginPercent);
      showToast('Tarifas de fábrica restauradas.');
    }
  };

  // Cálculos del simulador
  const simManufacturingCost = Math.round(simM2 * pricePerM2);
  const simAssemblyCost = enablePreAssembly ? Math.round(simCabinets * preAssemblyPrice) : 0;
  const simTotalService = simManufacturingCost + simAssemblyCost;

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-8 right-8 z-[200] bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Cabecera de la sección */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-bold uppercase tracking-wide ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Tarifas de Manufactura & Parámetros B2B
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuración de costos de procesamiento industrial para cotizaciones de diseñadores y arquitectos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isLight 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <RotateCcw size={14} />
            <span>Restablecer</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Nota Informativa del Modelo de Negocio */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
        isLight ? 'bg-sky-50/70 border-sky-200 text-sky-950' : 'bg-sky-950/20 border-sky-900/40 text-sky-200'
      }`}>
        <Info size={20} className="text-sky-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold uppercase tracking-wider text-sky-400">
            Regla de Cálculo: Paneles Netos Manufacturados (Sin Mermas)
          </p>
          <p className="text-slate-300">
            Los diseñadores y arquitectos utilizan el configurador de forma gratuita. En su vista de <strong>Costo de Fabricación (B2B)</strong>, se suma el valor de los materiales e insumos más este <strong>Costo de Manufactura</strong>, el cual se calcula multiplicando la tarifa fija por el total de m² de las piezas cortadas y canteadas, <em>sin incluir los sobrantes o mermas del tablero</em>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Parámetros de Tarifas */}
        <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-5 ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 border-zinc-800">
            <DollarSign size={18} className="text-orange-500" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Tarifas por Unidad de Producción
            </h3>
          </div>

          {/* 1. Tarifa por m² de Panel Manufacturado */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Layers size={14} />
                <span>Tarifa Manufactura por m² Neto</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">CLP / m² neto</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={pricePerM2}
                onChange={(e) => setPricePerM2(Number(e.target.value))}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border text-base font-bold font-mono transition-colors ${
                  isLight 
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-orange-500 focus:bg-white' 
                    : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Incluye optimización de corte en seccionadora computarizada, enchapado de cantos con cola PUR/EVA y perforaciones estándar.
            </p>
          </div>

          {/* 2. Servicio de Pre-ensamble / Armado en Fábrica */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>
                  <Box size={14} className="text-orange-500" />
                  <span>Servicio de Armado en Fábrica (Por Módulo)</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Armado y escuadrado en taller previo al despacho en obra.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePreAssembly}
                  onChange={(e) => setEnablePreAssembly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={preAssemblyPrice}
                onChange={(e) => setPreAssemblyPrice(Number(e.target.value))}
                disabled={!enablePreAssembly}
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-bold font-mono transition-colors ${
                  !enablePreAssembly ? 'opacity-40 cursor-not-allowed ' : ''
                } ${
                  isLight 
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-orange-500' 
                    : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                }`}
              />
            </div>
          </div>

          {/* 3. Margen Comercial Sugerido para Diseñadores */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between items-center">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>
                <TrendingUp size={14} className="text-emerald-500" />
                <span>Margen Comercial Sugerido al Diseñador</span>
              </label>
              <span className="text-xs font-bold font-mono text-emerald-500">{designerMargin}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="1"
              value={designerMargin}
              onChange={(e) => setDesignerMargin(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10% (Bajo)</span>
              <span>35% (Estándar B2B)</span>
              <span>70% (Premium)</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Simulador de Impacto en Tiempo Real */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-5 flex flex-col justify-between ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-zinc-800">
              <Calculator size={18} className="text-amber-500" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Simulador de Cotización B2B
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Prueba con valores representativos de un proyecto de cocina tipo:
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Paneles Netos a Procesar:</span>
                  <span className="font-mono text-amber-400 font-bold">{simM2.toFixed(1)} m²</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="0.5"
                  value={simM2}
                  onChange={(e) => setSimM2(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Cantidad de Módulos:</span>
                  <span className="font-mono text-amber-400 font-bold">{simCabinets} muebles</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={simCabinets}
                  onChange={(e) => setSimCabinets(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Tarjeta de Resumen del Simulador */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-white border-zinc-200' : 'bg-black/50 border-zinc-800'
            }`}>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Corte, Canteado & CNC ({simM2.toFixed(1)} m² × ${pricePerM2.toLocaleString('es-CL')}):</span>
                <span className="font-mono font-bold">${simManufacturingCost.toLocaleString('es-CL')} CLP</span>
              </div>
              
              {enablePreAssembly && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Pre-armado ({simCabinets} mód × ${preAssemblyPrice.toLocaleString('es-CL')}):</span>
                  <span className="font-mono font-bold">${simAssemblyCost.toLocaleString('es-CL')} CLP</span>
                </div>
              )}

              <div className="border-t border-zinc-700/60 pt-2 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">Total Servicio Manufactura:</span>
                <span className="text-lg font-black font-mono text-white">${simTotalService.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 flex items-center gap-2">
            <Sparkles size={16} className="shrink-0" />
            <span>Este valor se inyecta automáticamente en la cotización de los diseñadores registrados.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
