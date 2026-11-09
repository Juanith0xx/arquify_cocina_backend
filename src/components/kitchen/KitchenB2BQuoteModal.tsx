import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Briefcase,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  X,
  Layers,
  Wrench,
  Sparkles,
  Info,
  CheckCircle2,
  Box,
  Eye,
  Lock,
  Download,
  ShieldCheck,
  Sliders,
  Building
} from 'lucide-react';
import { useKitchenStore } from '../../store/kitchenStore';
import { useAdminStore } from '../../store/adminStore';
import { calculateKitchenDualQuote, DualQuoteCalculation } from '../../utils/kitchenB2BPricing';
import { exportClientQuotePdf, exportB2BQuoteExcel, QuoteExportMetadata } from '../../utils/kitchenQuoteExporter';

interface KitchenB2BQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KitchenB2BQuoteModal({ isOpen, onClose }: KitchenB2BQuoteModalProps) {
  const [activeTab, setActiveTab] = useState<'b2b' | 'pvp'>('b2b');
  const { manufacturingRates, adminEmail, themeMode } = useAdminStore();
  const isLight = themeMode === 'light';

  // Controles comerciales del diseñador
  const [designerMargin, setDesignerMargin] = useState<number>(
    manufacturingRates.defaultDesignerMarginPercent || 35
  );
  const [additionalFee, setAdditionalFee] = useState<number>(0);

  // Metadatos de la cotización comercial
  const [clientName, setClientName] = useState('Cliente Particular');
  const [projectName, setProjectName] = useState('Cocina Integral de Autor');
  const [projectAddress, setProjectAddress] = useState('Las Condes, Santiago');
  const [designerName, setDesignerName] = useState('Estudio de Arquitectura');
  const [designerEmail, setDesignerEmail] = useState(adminEmail || 'contacto@estudio.cl');
  const [designerPhone, setDesignerPhone] = useState('+56 9 1234 5678');
  const [validityDays, setValidityDays] = useState(15);

  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Cálculo en tiempo real
  const quote: DualQuoteCalculation = useMemo(() => {
    return calculateKitchenDualQuote(designerMargin, additionalFee);
  }, [designerMargin, additionalFee, manufacturingRates]);

  if (!isOpen) return null;

  const metadata: QuoteExportMetadata = {
    clientName,
    projectName,
    projectAddress,
    designerName,
    designerEmail,
    designerPhone,
    validityDays,
  };

  const recordQuoteInAdminStore = () => {
    try {
      const { saveProject, projects, updateProject } = useAdminStore.getState();
      const kitchenState = useKitchenStore.getState();
      const pName = projectName.trim() || 'Cocina Integral de Autor';
      const cName = clientName.trim() || 'Cliente Particular';

      const existing = projects.find((p) => p.name.toLowerCase() === pName.toLowerCase());
      const projectData = {
        cabinets: kitchenState.cabinets,
        countertopConfig: kitchenState.countertopConfig,
        roomConfig: kitchenState.roomConfig,
        structureColor: kitchenState.structureColor,
        doorColor: kitchenState.doorColor,
        drawerFrontColor: kitchenState.drawerFrontColor,
        socleHeight: kitchenState.socleHeight,
        socleFinish: kitchenState.socleFinish,
        golaSystem: kitchenState.golaSystem,
        totalFloorM2: quote.netPanelsAreaM2,
      };

      if (existing) {
        updateProject(existing.id, {
          status: 'quoted',
          soldDate: new Date().toISOString().split('T')[0],
          finalSalePriceClp: quote.totalPvpBrutoClp,
          client: cName,
          data: { ...(existing.data || {}), ...projectData },
        });
      } else {
        saveProject({
          name: pName,
          client: cName,
          type: 'kitchen',
          description: `Cotización comercial B2B/PVP (${quote.netPanelsAreaM2.toFixed(1)} m² procesados)`,
          totalCostEstimateClp: quote.totalPvpBrutoClp,
          data: projectData,
          status: 'quoted',
        });
      }
    } catch (e) {
      console.warn('Error registrando cotización en adminStore:', e);
    }
  };

  const handleExportPdf = () => {
    try {
      exportClientQuotePdf(quote, metadata);
      recordQuoteInAdminStore();
      showToast('PDF de Cotización Cliente generado y registrado en analíticas.');
    } catch (err) {
      console.error(err);
      alert('Error generando PDF comercial.');
    }
  };

  const handleExportExcel = () => {
    try {
      exportB2BQuoteExcel(quote, metadata);
      recordQuoteInAdminStore();
      showToast('Planilla Excel generada y registrada en analíticas.');
    } catch (err) {
      console.error(err);
      alert('Error exportando Excel.');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div className={`relative w-full max-w-5xl h-[92vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-slate-200'
      }`}>
        
        {/* Toast Feedback */}
        {feedback && (
          <div className="fixed top-8 right-8 z-[200] bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Header con Conmutador Dual */}
        <header className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-500">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wide ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Cotización Comercial Dual
                </h2>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-mono font-bold rounded-full uppercase">
                  B2B Platform
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Plataforma para diseñadores y arquitectos: costo de fábrica vs. venta al cliente final.
              </p>
            </div>
          </div>

          {/* Selector de Modo: B2B (Fabricación) vs PVP (Venta) */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-700/80 rounded-xl">
            <button
              onClick={() => setActiveTab('b2b')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'b2b'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock size={13} />
              <span>1. Costo Fabricación B2B</span>
            </button>
            <button
              onClick={() => setActiveTab('pvp')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pvp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={13} />
              <span>2. Venta Cliente Final (PVP)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-zinc-600 hover:bg-zinc-200' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </header>

        {/* Resumen Superior Rápido (KPIs) */}
        <div className={`px-5 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shrink-0 ${
          isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Paneles Netos a Procesar</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className={`text-base font-black font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {quote.netPanelsAreaM2.toFixed(1)} m²
              </strong>
              <span className="text-[10px] text-amber-500 font-bold">(Sin mermas)</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Manufactura Industrial</span>
            <strong className="text-base font-black font-mono text-amber-500 mt-0.5 block">
              ${quote.subtotalManufacturingClp.toLocaleString('es-CL')} CLP
            </strong>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Costo Neto B2B (Fábrica)</span>
            <strong className={`text-base font-black font-mono ${isLight ? 'text-zinc-900' : 'text-slate-200'} mt-0.5 block`}>
              ${quote.totalB2BNetoClp.toLocaleString('es-CL')} CLP
            </strong>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-500 block">Propuesta Venta (PVP + IVA)</span>
            <strong className="text-base font-black font-mono text-emerald-500 mt-0.5 block">
              ${quote.totalPvpBrutoClp.toLocaleString('es-CL')} CLP
            </strong>
          </div>
        </div>

        {/* Área Principal de Contenido */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* VISTA 1: COSTO FABRICACIÓN B2B (CONFIDENCIAL) */}
          {activeTab === 'b2b' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Banner Informativo B2B */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
              }`}>
                <ShieldCheck size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold uppercase tracking-wider text-amber-400">
                    Costo Confidencial de Fábrica para el Diseñador / Arquitecto
                  </p>
                  <p className="text-slate-300">
                    Este es el valor neto que pagas a fábrica por materiales, herrajes y el <strong>Servicio de Manufactura</strong> ({quote.netPanelsAreaM2.toFixed(1)} m² de paneles netos × ${quote.manufacturingRatePerM2.toLocaleString('es-CL')}/m²). No incluye mermas del tablero ni tu margen de venta.
                  </p>
                </div>
              </div>

              {/* Tabla de Desglose B2B */}
              <div className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-amber-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      Desglose de Partidas para Orden de Fabricación
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {quote.cabinetsCount} módulos / {quote.partsCount} piezas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${isLight ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-zinc-950 text-slate-400 border-zinc-800'}`}>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Categoría</th>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Concepto</th>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Detalle Técnico</th>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-center">Cantidad</th>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Unitario</th>
                        <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Subtotal CLP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {quote.b2bItems.map((item, idx) => (
                        <tr 
                          key={idx}
                          className={`transition-colors ${
                            item.category === 'manufactura' 
                              ? isLight ? 'bg-amber-50/60 font-semibold' : 'bg-amber-500/10 font-semibold'
                              : isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              item.category === 'manufactura'
                                ? 'bg-amber-500 text-black'
                                : item.category === 'cubierta'
                                ? 'bg-sky-500/20 text-sky-400'
                                : item.category === 'herrajes'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-700/40 text-slate-300'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">{item.detail}</td>
                          <td className="py-3 px-4 text-center font-mono">{item.qty} {item.unit}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            ${item.unitCostClp.toLocaleString('es-CL')}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${
                            item.category === 'manufactura' ? 'text-amber-400' : ''
                          }`}>
                            ${item.totalCostClp.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales B2B */}
                <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-zinc-800'
                }`}>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>• Precios calculados en base a tarifas vigentes de fábrica.</p>
                    <p>• La manufactura considera corte, canteado y mecanizado CNC estándar.</p>
                  </div>

                  <div className="w-full sm:w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal B2B Neto:</span>
                      <span className="font-mono font-bold">${quote.totalB2BNetoClp.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>I.V.A. (19%):</span>
                      <span className="font-mono">${quote.ivaB2BClp.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="border-t border-zinc-700/60 pt-1.5 flex justify-between items-baseline">
                      <span className="font-bold text-white uppercase text-xs">Total Costo Fábrica:</span>
                      <span className="font-mono font-black text-amber-500 text-base">
                        ${quote.totalB2BBrutoClp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: COTIZACIÓN CLIENTE FINAL (PVP) */}
          {activeTab === 'pvp' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Panel de Controles Comerciales para el Diseñador */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-emerald-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      Fijación de Margen Comercial & Honorarios
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-500 font-bold">
                    Margen: {designerMargin}%  |  Utilidad: +${quote.designerProfitClp.toLocaleString('es-CL')} CLP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Slider de Margen */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Margen de Venta Diseñador:</span>
                      <span className="text-emerald-400 font-mono">{designerMargin}%</span>
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
                      <span>10% Mínimo</span>
                      <span>35% Recomendado</span>
                      <span>70% Premium</span>
                    </div>
                  </div>

                  {/* Fee Adicional de Montaje / Diseño */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Honorarios Adicionales / Montaje (CLP):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={additionalFee}
                        onChange={(e) => setAdditionalFee(Number(e.target.value))}
                        className={`w-full pl-7 pr-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                          isLight 
                            ? 'bg-zinc-50 border-zinc-300 text-zinc-900' 
                            : 'bg-zinc-950 border-zinc-700 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Resumen de Ganancia */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                    isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/40'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                      Tu Utilidad Estimada en este Proyecto:
                    </span>
                    <strong className="text-base font-black font-mono text-emerald-400 mt-0.5">
                      +${quote.designerProfitClp.toLocaleString('es-CL')} CLP
                    </strong>
                  </div>
                </div>
              </div>

              {/* Formulario de Datos del Mandante / Obra */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider text-slate-400`}>
                  Datos de la Oferta para el Cliente Final
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nombre del Cliente:</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Proyecto:</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Dirección / Obra:</label>
                    <input
                      type="text"
                      value={projectAddress}
                      onChange={(e) => setProjectAddress(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tu Nombre o Estudio:</label>
                    <input
                      type="text"
                      value={designerName}
                      onChange={(e) => setDesignerName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Email de Contacto:</label>
                    <input
                      type="email"
                      value={designerEmail}
                      onChange={(e) => setDesignerEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Validez de la Oferta:</label>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Previsualización de Partidas Comerciales (PVP) */}
              <div className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-emerald-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      Partidas del Presupuesto Comercial (Vista Cliente)
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    Oculta costos internos de manufactura
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/60">
                  {quote.clientItems.map((item, idx) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-slate-300 rounded font-bold">
                            0{idx + 1}
                          </span>
                          <h5 className="font-bold text-xs text-white">{item.title}</h5>
                          <span className="text-[10px] text-orange-400 font-mono">({item.category})</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="text-right sm:shrink-0 font-mono font-black text-sm text-emerald-400">
                        ${item.totalClp.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totales PVP */}
                <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-zinc-800'
                }`}>
                  <div className="text-xs text-slate-400">
                    Propuesta formal con especificación técnica para presentación a cliente.
                  </div>

                  <div className="w-full sm:w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono font-bold">${quote.totalPvpNetoClp.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>I.V.A. (19%):</span>
                      <span className="font-mono">${quote.ivaPvpClp.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="border-t border-zinc-700/60 pt-1.5 flex justify-between items-baseline">
                      <span className="font-bold text-emerald-500 uppercase text-xs">Total Presupuesto Cliente:</span>
                      <span className="font-mono font-black text-emerald-400 text-lg">
                        ${quote.totalPvpBrutoClp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer con Acciones de Exportación */}
        <footer className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={16} className="text-orange-500" />
            <span>Módulo 5: Cotización Dual B2B & Retail</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Excel Completo</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
            >
              <FileText size={15} />
              <span>Descargar PDF Cotización Cliente</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
