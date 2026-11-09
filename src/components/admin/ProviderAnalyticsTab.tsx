import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Layers,
  MapPin,
  TrendingUp,
  Leaf,
  ShieldCheck,
  Building,
  Calendar,
  Radio,
  Sliders,
  DollarSign,
  Download,
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { ExecutiveOverviewSheet } from './analytics/ExecutiveOverviewSheet';
import { MaterialAnalyticsSheet } from './analytics/MaterialAnalyticsSheet';
import { GreenMetricsCarbonSheet } from './analytics/GreenMetricsCarbonSheet';
import { GeographicDemandSheet } from './analytics/GeographicDemandSheet';
import { ForecastingSamplesSheet } from './analytics/ForecastingSamplesSheet';

interface ProviderAnalyticsTabProps {
  currentProviderId?: string;
  isSuperAdmin?: boolean;
}

export function ProviderAnalyticsTab({
  currentProviderId,
  isSuperAdmin = true
}: ProviderAnalyticsTabProps) {
  const { providers, projects, textures, themeMode } = useAdminStore();
  const isLight = themeMode === 'light';

  // Sub-tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<
    'resumen' | 'materiales' | 'huella_verde' | 'geografica' | 'prediccion'
  >('resumen');

  // Provider selector
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    currentProviderId || (providers[0]?.id ?? 'prov-masisa')
  );

  // Quick unit/currency toggle
  const [currency, setCurrency] = useState<'CLP' | 'UF' | 'USD'>('CLP');
  const [unitMetric, setUnitMetric] = useState<'m2' | 'planchas'>('m2');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const selectedProvider = useMemo(() => {
    if (!isSuperAdmin && currentProviderId) {
      const match = providers.find(
        (p) =>
          p.id === currentProviderId ||
          p.name.toLowerCase().includes(currentProviderId.toLowerCase()) ||
          currentProviderId.toLowerCase().includes(p.id.toLowerCase())
      );
      if (match) return match;
    }
    return providers.find((p) => p.id === selectedProviderId) || providers[0];
  }, [providers, selectedProviderId, isSuperAdmin, currentProviderId]);

  const providerName = selectedProvider ? selectedProvider.name : 'Arauco & Masisa Soluciones (Chile)';

  return (
    <div className="space-y-6">
      {/* 1. Global Navigation & Sub-Tab Bar */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-xl">
            <BarChart3 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>KitchStudio Supplier Intelligence</h2>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> Telemetría Verificada
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {providerName} • Hub Central Santiago (Plantas Quilicura, San Joaquín y Huechuraba)
            </p>
          </div>
        </div>

        {/* Global Controls: Time Range + Currency + Units + Provider */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1">
            <div
              className={`flex items-center p-0.5 rounded-xl text-xs font-semibold border ${
                isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <Calendar size={13} className="ml-2 text-orange-500 shrink-0" />
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'ytd', label: 'Año' },
                { id: 'custom', label: 'Rango' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id as any)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    timeRange === t.id
                      ? 'bg-orange-500 text-white font-bold'
                      : isLight
                      ? 'text-zinc-600 hover:text-zinc-900'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-1 text-xs animate-in fade-in duration-150">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`p-1 px-1.5 border rounded-lg text-xs font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                />
                <span className={isLight ? 'text-zinc-400' : 'text-zinc-600'}>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`p-1 px-1.5 border rounded-lg text-xs font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Currency Toggle */}
          <div
            className={`flex items-center p-0.5 rounded-xl text-xs font-bold font-mono border ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {(['CLP', 'UF', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === c
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {c === 'CLP' ? 'CLP ($)' : c}
              </button>
            ))}
          </div>

          {/* Unit Toggle */}
          <div
            className={`flex items-center p-0.5 rounded-xl text-xs font-bold font-mono border ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {(['m2', 'planchas'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnitMetric(u)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMetric === u
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Provider Selector */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className={`py-1.5 px-3 border rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-700 text-white'
                }`}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sub-Tab Pills Navigation */}
      <div
        className={`flex items-center gap-1.5 overflow-x-auto pb-1 p-1.5 border rounded-2xl transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950/80 border-zinc-800'
        }`}
      >
        <button
          onClick={() => setActiveSubTab('resumen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'resumen'
              ? 'bg-orange-500 text-white shadow-md'
              : isLight
              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <BarChart3 size={15} />
          <span>Resumen Ejecutivo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('materiales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'materiales'
              ? 'bg-orange-500 text-white shadow-md'
              : isLight
              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Layers size={15} />
          <span>Analítica de Materiales & Catálogo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('huella_verde')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'huella_verde'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : isLight
              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Leaf size={15} className="text-emerald-500" />
          <span>Huella de Carbono & ESG</span>
          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[9px] font-extrabold rounded uppercase">
            Scope 1-3
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('geografica')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'geografica'
              ? 'bg-orange-500 text-white shadow-md'
              : isLight
              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <MapPin size={15} />
          <span>Demanda Geográfica (Gran Santiago)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prediccion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'prediccion'
              ? 'bg-orange-500 text-white shadow-md'
              : isLight
              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <TrendingUp size={15} />
          <span>Predicción & Muestras Físicas</span>
        </button>
      </div>

      {/* 3. Sub-Tab Content Rendering */}
      <div>
        {activeSubTab === 'resumen' && (
          <ExecutiveOverviewSheet
            selectedProviderName={providerName}
            selectedProviderId={selectedProvider?.id || selectedProviderId}
            isSuperAdmin={isSuperAdmin}
            onNavigateToTab={(tab) => {
              if (tab === 'materiales') setActiveSubTab('materiales');
              if (tab === 'geografica') setActiveSubTab('geografica');
              if (tab === 'sku-viewer') setActiveSubTab('prediccion');
            }}
          />
        )}

        {activeSubTab === 'materiales' && (
          <MaterialAnalyticsSheet
            onPrescribePackage={(pack) => {
              alert(`Paquete "${pack}" añadido a la cola de prescripción 3D.`);
            }}
            onNavigateToTab={(tab) => {
              if (tab === 'sku-viewer') setActiveSubTab('prediccion');
            }}
          />
        )}

        {activeSubTab === 'huella_verde' && <GreenMetricsCarbonSheet />}

        {activeSubTab === 'geografica' && <GeographicDemandSheet />}

        {activeSubTab === 'prediccion' && <ForecastingSamplesSheet />}
      </div>
    </div>
  );
}
