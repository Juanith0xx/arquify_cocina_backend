import React, { useState } from 'react';
import {
  MapPin,
  TrendingUp,
  Building,
  Factory,
  CheckCircle,
  MessageSquare,
  Upload,
  ArrowRight,
  Filter,
  Layers,
  Send,
  Sparkles,
  Search,
  Maximize2
} from 'lucide-react';

import { useAdminStore } from '../../../store/adminStore';

export function GeographicDemandSheet() {
  const { themeMode } = useAdminStore();
  const isLight = themeMode === 'light';
  const [activeMapView, setActiveMapView] = useState<'termico' | 'talleres' | 'm2'>('termico');
  const [selectedZone, setSelectedZone] = useState<string>('oriente');
  const [filterType, setFilterType] = useState<'all' | 'factory' | 'studio'>('all');

  const workshopsData = [
    {
      id: 'ws-1',
      name: 'Estudio Arq. Vitacura SpA',
      code: 'EST-VIT-102',
      type: 'studio',
      location: 'Vitacura (Alonso de Córdova)',
      projects: 84,
      volumeClp: '$385M en Tableros',
      topMaterial: 'Arauco Roble Cava 18mm',
      scrap: '7.9% merma CNC',
      status: 'Estudio Preferente',
      statusColor: 'amber'
    },
    {
      id: 'ws-2',
      name: 'Mueblería Modular San Joaquín',
      code: 'FAB-STGO-208',
      type: 'factory',
      location: 'San Joaquín / Vicuña Mackenna',
      projects: 68,
      volumeClp: '$294M en Tableros',
      topMaterial: 'Masisa Nogal Terracota',
      scrap: '8.4% merma CNC',
      status: 'Taller Homologado',
      statusColor: 'sky'
    },
    {
      id: 'ws-3',
      name: 'Diseño & Cocinas Chicureo',
      code: 'EST-COL-044',
      type: 'studio',
      location: 'Colina (Piedra Roja / Chicureo)',
      projects: 54,
      volumeClp: '$260M en Tableros',
      topMaterial: 'Masisa Grafito Mate 18mm',
      scrap: '8.1% merma CNC',
      status: 'Estudio Prescriptor',
      statusColor: 'zinc'
    },
    {
      id: 'ws-4',
      name: 'Carpintería CNC Quilicura',
      code: 'TALL-QLC-310',
      type: 'factory',
      location: 'Parque Industrial Quilicura',
      projects: 48,
      volumeClp: '$210M en Tableros',
      topMaterial: 'Arauco Coigüe Natural',
      scrap: '7.8% merma CNC',
      status: 'Maquila CNC Directa',
      statusColor: 'orange'
    }
  ];

  const filteredWorkshops = workshopsData.filter(
    (w) => filterType === 'all' || w.type === filterType
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border p-5 rounded-2xl transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-500">
              Intelligence Geo-Logistics • Región Metropolitana v2.4
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Distribución Geográfica de la Demanda — Gran Santiago & RM
          </h2>
          <p className={`text-xs sm:text-sm max-w-3xl ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Mapeo de proyectos configurados por comunas de Santiago y red de talleres de fabricación / seccionado CNC homologados.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Informe Regional Geográfico exportado en PDF.')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
          >
            Informe Regional (PDF)
          </button>
        </div>
      </div>

      {/* Top Regional Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/40 transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Comuna Líder en m²</span>
              <h4 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>Las Condes</h4>
            </div>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <MapPin size={18} />
            </div>
          </div>
          <div className={`pt-3 border-t flex justify-between items-center text-xs mt-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <span className="font-mono font-bold text-orange-500 text-sm">14.200 m²</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isLight ? 'bg-zinc-100 text-zinc-800 border border-zinc-200' : 'bg-zinc-800 text-zinc-300'
            }`}>34% del total RM</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Mayor Crecimiento</span>
              <h4 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>Colina / Chicureo</h4>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={`pt-3 border-t flex justify-between items-center text-xs mt-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">+48.0% MoM</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isLight ? 'bg-zinc-100 text-zinc-800 border border-zinc-200' : 'bg-zinc-800 text-zinc-300'
            }`}>5.200 m² Nuevos</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between hover:border-sky-500/40 transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Talleres Conectados</span>
              <h4 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>142 Activos en RM</h4>
            </div>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Factory size={18} />
            </div>
          </div>
          <div className={`pt-3 border-t flex justify-between items-center text-xs mt-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> Quilicura, San Joaquín
            </span>
            <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>Conchalí, Huechuraba</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Merma Media Red</span>
              <h4 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>8,6% Merma</h4>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles size={18} />
            </div>
          </div>
          <div className={`pt-3 border-t flex justify-between items-center text-xs mt-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">Ahorro $184M CLP</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isLight ? 'bg-zinc-100 text-zinc-800 border border-zinc-200' : 'bg-zinc-800 text-zinc-300'
            }`}>Tableros 18mm</span>
          </div>
        </div>
      </div>

      {/* Main Analytical Section: Santiago Map & Volume Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (7 cols): Santiago Interactive Topographic SVG Canvas */}
        <div className={`lg:col-span-7 border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[480px] transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          {/* Top HUD */}
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 pb-2">
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs ${
              isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-zinc-950/90 border-zinc-800 text-zinc-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="font-bold">Renders de Cocinas en Tiempo Real</span>
            </div>

            <div className={`flex items-center gap-1 border p-1 rounded-xl text-xs ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <button
                onClick={() => setActiveMapView('termico')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMapView === 'termico'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Térmico
              </button>
              <button
                onClick={() => setActiveMapView('talleres')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMapView === 'talleres'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Talleres CNC
              </button>
              <button
                onClick={() => setActiveMapView('m2')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMapView === 'm2'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Densidad m²
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full h-[320px] my-auto flex items-center justify-center">
            <svg className="w-full h-full max-h-[340px] select-none" fill="none" viewBox="0 0 700 440">
              <defs>
                <radialGradient id="heatLasCondes" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#ea580c" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatBarnechea" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatChicureo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#b45309" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Gran Santiago Topographic Outline */}
              <path
                d="M140,80 L280,50 L420,40 L530,90 L610,180 L590,290 L510,380 L380,420 L230,410 L150,340 L120,230 L110,140 Z"
                fill={isLight ? '#f4f4f5' : '#18181b'}
                stroke={isLight ? '#cbd5e1' : '#3f3f46'}
                strokeWidth="2"
              />

              {/* Autopistas Urbanas */}
              <path d="M130,220 L330,230 L480,200 L580,180" stroke={isLight ? '#e2e8f0' : '#27272a'} strokeDasharray="4 4" strokeWidth="2" />
              <path d="M330,60 L330,230 L340,390" stroke={isLight ? '#e2e8f0' : '#27272a'} strokeDasharray="4 4" strokeWidth="2" />

              {/* Heat Glow Areas */}
              {activeMapView === 'termico' && (
                <>
                  <circle cx="460" cy="200" r="65" fill="url(#heatLasCondes)" />
                  <circle cx="520" cy="140" r="50" fill="url(#heatBarnechea)" />
                  <circle cx="310" cy="110" r="55" fill="url(#heatChicureo)" />
                  <circle cx="360" cy="240" r="45" fill="url(#heatLasCondes)" opacity="0.6" />
                </>
              )}

              {/* Node Pins */}
              {/* Las Condes */}
              <g className="cursor-pointer" onClick={() => setSelectedZone('las_condes')}>
                <circle cx="460" cy="200" r="14" fill="#f97316" fillOpacity="0.25" className="animate-ping" />
                <circle cx="460" cy="200" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                <text x="472" y="196" fill={isLight ? '#c2410c' : '#fdba74'} fontSize="12" fontWeight="700" fontFamily="sans-serif">
                  LAS CONDES
                </text>
                <text x="472" y="210" fill={isLight ? '#64748b' : '#a1a1aa'} fontSize="9" fontFamily="sans-serif">
                  620 Proyectos • 14.2k m²
                </text>
              </g>

              {/* Lo Barnechea */}
              <g className="cursor-pointer" onClick={() => setSelectedZone('lo_barnechea')}>
                <circle cx="520" cy="140" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <text x="532" y="138" fill={isLight ? '#0369a1' : '#7dd3fc'} fontSize="11" fontWeight="600" fontFamily="sans-serif">
                  LO BARNECHEA / LA DEHESA
                </text>
                <text x="532" y="150" fill={isLight ? '#64748b' : '#a1a1aa'} fontSize="9" fontFamily="sans-serif">
                  410 Proyectos • $980M CLP
                </text>
              </g>

              {/* Chicureo */}
              <g className="cursor-pointer" onClick={() => setSelectedZone('chicureo')}>
                <circle cx="310" cy="110" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <text x="210" y="108" fill={isLight ? '#b45309' : '#fde68a'} fontSize="11" fontWeight="600" fontFamily="sans-serif">
                  COLINA / CHICUREO
                </text>
                <text x="210" y="120" fill={isLight ? '#64748b' : '#a1a1aa'} fontSize="9" fontFamily="sans-serif">
                  +48% Crecimiento • 5.2k m²
                </text>
              </g>

              {/* Vitacura */}
              <g className="cursor-pointer" onClick={() => setSelectedZone('vitacura')}>
                <circle cx="420" cy="170" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <text x="432" y="168" fill={isLight ? '#0369a1' : '#bae6fd'} fontSize="10" fontWeight="600" fontFamily="sans-serif">
                  VITACURA
                </text>
              </g>

              {/* Quilicura Hub */}
              <g className="cursor-pointer" onClick={() => setSelectedZone('quilicura')}>
                <circle cx="270" cy="160" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x="175" y="165" fill={isLight ? '#047857' : '#a7f3d0'} fontSize="10" fontWeight="700" fontFamily="sans-serif">
                  QUILICURA (HUB CNC)
                </text>
                <line x1="270" y1="160" x2="460" y2="200" stroke="#f97316" strokeDasharray="3 3" strokeWidth="1.5" />
              </g>
            </svg>
          </div>

          {/* Bottom Floating Legend */}
          <div className={`relative z-10 pt-2 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-800 text-zinc-400'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Muy Alta (&gt;30%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Media-Alta (20-30%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>En Expansión (+40% MoM)</span>
              </div>
            </div>
            <span className={`text-[11px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>Actualizado hace 4 min</span>
          </div>
        </div>

        {/* Right Column (5 cols): Ranking de Demanda RM */}
        <div className={`lg:col-span-5 border rounded-2xl p-5 flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Ranking de Demanda por Comunas (RM)</h3>
                <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Porcentaje sobre volumen global presupuestado</p>
              </div>
              <span className="text-xs font-mono text-orange-500 font-bold">Q3 2024</span>
            </div>

            {/* Rank 1 */}
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Las Condes</span>
                  <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[9px] font-extrabold rounded">Core</span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>$1.420M CLP</span>
                  <span className="text-orange-500 font-bold">34.2%</span>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '34.2%' }} />
              </div>
              <div className={`flex justify-between text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span>14.200 m² transformados</span>
                <span>46 talleres activos</span>
              </div>
            </div>

            {/* Rank 2 */}
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center ${
                    isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                  }`}>2</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Lo Barnechea / La Dehesa</span>
                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[9px] font-extrabold rounded">Premium</span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>$980M CLP</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">23.6%</span>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '23.6%' }} />
              </div>
              <div className={`flex justify-between text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span>9.850 m² transformados</span>
                <span>34 talleres activos</span>
              </div>
            </div>

            {/* Rank 3 */}
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center ${
                    isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                  }`}>3</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Vitacura</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold rounded">Alta Gama</span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>$740M CLP</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">17.8%</span>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '17.8%' }} />
              </div>
              <div className={`flex justify-between text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span>7.120 m² transformados</span>
                <span>28 talleres activos</span>
              </div>
            </div>

            {/* Rank 4 */}
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center ${
                    isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                  }`}>4</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Providencia / Ñuñoa</span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>$590M CLP</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>14.2%</span>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div className="bg-orange-500/70 h-full rounded-full" style={{ width: '14.2%' }} />
              </div>
              <div className={`flex justify-between text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span>5.800 m² transformados</span>
                <span>24 talleres activos</span>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 border rounded-xl flex items-center justify-between ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <div>
              <div className={`text-xs font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Índice Presupuesto → Fábrica</div>
              <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Conversión automática a corte CNC</div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">78.4%</div>
              <div className="text-[10px] text-orange-500 font-bold">+6.1% YoY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: B2B Studio & Fabricator Intelligence */}
      <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Top Estudios de Diseño y Fabricantes de Mueble</h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                142 Activos en RM
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Talleres, prescriptores y estudios de interiorismo que generan mayor tracción de tus superficies en el software 3D.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center border px-3 py-1.5 rounded-xl text-xs ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <Filter size={13} className={`mr-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={`bg-transparent font-bold outline-none cursor-pointer ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                <option value="all" className={isLight ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}>Todos los Tipos</option>
                <option value="factory" className={isLight ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}>Fábricas de Muebles</option>
                <option value="studio" className={isLight ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}>Estudios de Arquitectura</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`uppercase tracking-wider text-[10px] font-bold ${
                isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-950/60 text-zinc-400'
              }`}>
                <th className="py-2.5 px-3 rounded-l-lg">Estudio / Fabricante</th>
                <th className="py-2.5 px-3">Ubicación & Hub</th>
                <th className="py-2.5 px-3">Cocinas Diseñadas</th>
                <th className="py-2.5 px-3">Material Estrella</th>
                <th className="py-2.5 px-3">Nivel de Alianza</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Acción Comercial</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/50'}`}>
              {filteredWorkshops.map((ws) => (
                <tr key={ws.id} className={`transition-colors ${isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/40'}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs text-orange-500 ${
                        isLight ? 'bg-orange-50 border-orange-200' : 'bg-zinc-800 border-zinc-700'
                      }`}>
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{ws.name}</div>
                        <div className={`text-[11px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>{ws.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-3 flex items-center gap-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    <MapPin size={13} className={`shrink-0 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <span>{ws.location}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className={`font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>{ws.projects} cocinas</div>
                    <div className="text-[11px] text-orange-500 font-mono">{ws.volumeClp}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className={`font-medium ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{ws.topMaterial}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{ws.scrap}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                      {ws.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => alert(`Enviando propuesta B2B y muestras prioritarias a ${ws.name}`)}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      Oferta Cubicación (-9%)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
