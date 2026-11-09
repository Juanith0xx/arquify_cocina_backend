import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Send,
  Sliders,
  DollarSign,
  Sun,
  Eye,
  Camera,
  RotateCw,
  QrCode,
  Download,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

import { useAdminStore } from '../../../store/adminStore';

export function ForecastingSamplesSheet() {
  const { themeMode } = useAdminStore();
  const isLight = themeMode === 'light';

  const [lightMode, setLightMode] = useState<'3000k' | '5000k' | 'showroom'>('3000k');
  const [rotated, setRotated] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [skuPaused, setSkuPaused] = useState(false);
  const [sampleFilter, setSampleFilter] = useState('all');

  const sampleOrders = [
    {
      id: 'samp-1',
      name: 'Arq. Marcos Benítez',
      avatar: 'MB',
      studio: 'Estudio Las Condes (Santiago)',
      materials: ['Melamina Roble Cendra 18mm', 'Silestone Blanco Norte'],
      project: 'Depto San Damián (Isla 3.80m)',
      date: '18 Sep 2024 • 11:42 CLT',
      status: 'Entregado Chilexpress',
      statusColor: 'emerald',
      probability: '92% Prob.',
      amount: '$38.500.000 CLP'
    },
    {
      id: 'samp-2',
      name: 'Lucía Domínguez',
      avatar: 'LD',
      studio: 'Interiorismo Providencia',
      materials: ['Masisa Carvalho 18mm', 'Silestone Blanco Norte'],
      project: 'Remodelación Pocuro',
      date: '19 Sep 2024 • 09:15 CLT',
      status: 'En Tránsito Starken',
      statusColor: 'sky',
      probability: '78% Prob.',
      amount: '$22.400.000 CLP'
    },
    {
      id: 'samp-3',
      name: 'Carlos Santoro',
      avatar: 'CS',
      studio: 'Chicureo, Colina (Santiago)',
      materials: ['Vesto Roble Cendra 18mm'],
      project: 'Casa Piedra Roja',
      date: '20 Sep 2024 • 16:50 CLT',
      status: 'Envío Express RM (24h)',
      statusColor: 'amber',
      probability: '65% Prob.',
      amount: '$16.200.000 CLP'
    },
    {
      id: 'samp-4',
      name: 'Estudio Arq9 (David R.)',
      avatar: 'A9',
      studio: 'Estudio Vitacura',
      materials: ['Masisa Carvalho 18mm', 'Silestone Blanco Norte'],
      project: 'Penthouse Lo Curro',
      date: '17 Sep 2024 • 18:04 CLT',
      status: 'Proyecto Aprobado',
      statusColor: 'emerald',
      probability: '100% Cerrado',
      amount: '$44.800.000 CLP'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border p-5 rounded-2xl transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-orange-500">Inteligencia de Materiales & Conversión B2B</span>
            <span className={isLight ? 'text-zinc-400' : 'text-zinc-600'}>•</span>
            <span className="text-amber-500 font-mono font-bold">Ciclo Activo Q3-Q4</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Previsión de Demanda y Pipeline de Muestras Físicas
          </h2>
          <p className={`text-xs sm:text-sm max-w-3xl ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Anticipación de inventario según cocinas guardadas en configurador y gestión de envíos de muestrarios a arquitectos y prescriptores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Lote masivo de 45 kits Signature despachado a Starken Hub Pudahuel.')}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Send size={15} />
            <span>Programar Envío Masivo Q4</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm hover:border-orange-500/40' : 'bg-zinc-900/80 border-zinc-800 hover:border-orange-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Eficacia de Muestrarios</span>
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="my-2">
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>73%</div>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>De peticiones físicas convertidas en orden de compra.</p>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '73%' }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm hover:border-amber-500/40' : 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Retorno / Muestra</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">$1.480.000</div>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Retorno promedio por kit físico entregado (98x ROI).</p>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm hover:border-sky-500/40' : 'bg-zinc-900/80 border-zinc-800 hover:border-sky-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Volumen 3D Comprometido</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Layers size={16} />
            </span>
          </div>
          <div className="my-2">
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>26.500 m²</div>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>142 proyectos en modelado final esta semana.</p>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
          isLight ? 'bg-white border-zinc-200 shadow-sm hover:border-emerald-500/40' : 'bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Merma Global en Tableros</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">8,2%</div>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Aprovechamiento de Plancha 18mm: 91,8%.</p>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91.8%' }} />
          </div>
        </div>
      </div>

      {/* Forecast Curves & AI Forecast */}
      <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Curvas de Demanda: Real vs. Modelo Predictivo AI</h3>
            <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Correlación histórica entre configuraciones 3D guardadas y compras consolidadas a 45 días</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-500 rounded" />
              <span className={isLight ? 'text-zinc-700 font-medium' : 'text-zinc-300'}>Consumo Real (m²)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-orange-500 rounded border-t border-dashed" />
              <span className={isLight ? 'text-zinc-700 font-medium' : 'text-zinc-300'}>Previsión AI 3D (m²)</span>
            </div>
          </div>
        </div>

        {/* SVG Graphic Curve */}
        <div className={`border rounded-xl p-4 overflow-x-auto ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="min-w-[650px] h-44 flex flex-col justify-between relative">
            <svg className="w-full h-36 overflow-visible" preserveAspectRatio="none" viewBox="0 0 900 160">
              <defs>
                <linearGradient id="forecastArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0,110 L 150,95 L 300,80 L 450,60 L 600,35 L 750,20 L 900,10 L 900,160 L 0,160 Z" fill="url(#forecastArea)" />
              <path d="M 0,115 L 150,100 L 300,75 L 450,65" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="115" r="4" fill="#0284c7" />
              <circle cx="150" cy="100" r="4" fill="#0284c7" />
              <circle cx="300" cy="75" r="4" fill="#0284c7" />
              <circle cx="450" cy="65" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 450,65 L 600,35 L 750,20 L 900,10" fill="none" stroke="#f97316" strokeDasharray="6,4" strokeWidth="3" strokeLinecap="round" />
              <circle cx="680" cy="27" r="6" fill="#ef4444" className="animate-ping" opacity="0.7" />
              <circle cx="680" cy="27" r="4" fill="#ef4444" />
              <line x1="450" y1="0" x2="450" y2="160" stroke={isLight ? '#cbd5e1' : '#52525b'} strokeDasharray="2,2" strokeWidth="1" />
              <text x="455" y="15" fill={isLight ? '#64748b' : '#a1a1aa'} fontSize="10" fontFamily="sans-serif">HOY (SEM 38)</text>
              <text x="685" y="44" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Pico Demanda Roble Cendra (+6.300 m²)
              </text>
            </svg>
            <div className={`flex justify-between text-[11px] font-mono pt-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
              <span>Julio (Sem 27)</span>
              <span>Agosto (Sem 31)</span>
              <span>Septiembre (Sem 35)</span>
              <span className="text-orange-500 font-bold">Octubre (Sem 40)</span>
              <span>Noviembre (Sem 44)</span>
              <span>Diciembre (Sem 48)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Material SKU & 3D Lighting Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Material PBR & Lighting Simulator */}
        <div className={`lg:col-span-7 border rounded-2xl p-5 space-y-4 transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Visor Táctil de SKU & PBR</span>
              <h3 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Nogal Canaletto 19mm Barniz Mate</h3>
            </div>
            {/* Lighting Controls */}
            <div className={`flex items-center gap-1 border p-1 rounded-xl text-xs font-bold ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <button
                onClick={() => setLightMode('3000k')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lightMode === '3000k'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                3000K Cálida
              </button>
              <button
                onClick={() => setLightMode('5000k')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lightMode === '5000k'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                5000K Día
              </button>
              <button
                onClick={() => setLightMode('showroom')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lightMode === 'showroom'
                    ? 'bg-orange-500 text-white'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Showroom
              </button>
            </div>
          </div>

          {/* Render Preview Frame */}
          <div className={`relative h-64 rounded-xl overflow-hidden border flex items-center justify-center group ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <div
              className={`w-full h-full bg-cover bg-center transition-all duration-500 ${
                lightMode === '3000k'
                  ? 'brightness-105 sepia-[0.15] contrast-105'
                  : lightMode === '5000k'
                  ? 'brightness-110 hue-rotate-[-5deg] contrast-105'
                  : 'brightness-95 contrast-110'
              } ${rotated ? 'scale-105 rotate-1' : 'scale-100 rotate-0'} ${zoomed ? 'scale-150' : ''}`}
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDhle7wu5-Vm0RNxTHV9zcqYomievuP9KQSVcevOBX53NW747-kXkdL2WOdoVRjLylbvfY_0zqIy0e_ntj13-nVgUjETbbJXaKmH18YEj1Nc0IghuU5MFrcbdQo72d2Q5EEo8RKSwSIxiWxtGcTjwFMnl6c5xg-UY9Bikg7OEjXDutVtFrJsN33zyUoD9MGLmuodx_bqrnRThP-VyLVcxzbabDYLmVQ8K6aSLOpmViNtkVklrnLLjKp8w')`
              }}
            />

            {/* Hotspot */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 rounded-full bg-orange-500/30 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500" />
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 backdrop-blur-md border px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs ${
              isLight ? 'bg-white/90 border-zinc-300 text-zinc-900 shadow-sm' : 'bg-zinc-900/90 border-zinc-700 text-white'
            }`}>
              <button
                onClick={() => setRotated(!rotated)}
                className="hover:text-orange-500 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RotateCw size={13} /> Rotar 360°
              </button>
              <span className={isLight ? 'text-zinc-300' : 'text-zinc-600'}>|</span>
              <button
                onClick={() => setZoomed(!zoomed)}
                className="hover:text-orange-500 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Eye size={13} /> Zoom Veta
              </button>
            </div>
          </div>

          {/* PBR Channel Cards */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded-lg border text-center ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Albedo</div>
              <div className={`font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>RGB 8-bit</div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Roughness</div>
              <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">15% GL</div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Normal Map</div>
              <div className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">OpenGL 16b</div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Displacement</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">0.35 mm</div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Sample Experience & Actions */}
        <div className={`lg:col-span-5 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Kit Signature & Experiencia Háptica</h3>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 font-bold text-[10px] rounded">
                QR Directo CAD
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
              Las cocinas cuyos clientes reciben el kit físico de muestras en menos de 48 horas tienen una tasa de cierre un{' '}
              <strong className="text-orange-500">38% superior</strong> respecto al canal tradicional.
            </p>

            <div className={`p-3 border rounded-xl space-y-2 text-xs ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className={`flex justify-between items-center ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Stock Físico Inmediato en Almacén:</span>
                <strong className={`font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>8.200 m²</strong>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '58%' }} />
              </div>
              <div className={`flex justify-between text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <span>Punto de reorden: 4.000 m²</span>
                <span>Capacidad máxima: 14.000 m²</span>
              </div>
            </div>
          </div>

          <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <button
              onClick={() => setSkuPaused(!skuPaused)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                skuPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-amber-700 border border-amber-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/20'
              }`}
            >
              {skuPaused ? 'Reactivar en Catálogo 3D' : 'Pausar en Catálogo 3D'}
            </button>
            <button
              onClick={() => alert('Mapas PBR (4K) descargados en formato ZIP.')}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={15} /> Descargar Mapas PBR (4K)
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline de Solicitudes de Muestras Físicas Table */}
      <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              <Package size={18} className="text-orange-500" />
              Solicitudes de Muestras Físicas desde el Configurador 3D
            </h3>
            <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Trazabilidad de muestras táctiles enviadas tras sesiones interactivas de diseño 3D por profesionales.
            </p>
          </div>
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>Valor pipeline: $412.900.000 CLP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`uppercase tracking-wider text-[10px] font-bold ${
                isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-950/60 text-zinc-400'
              }`}>
                <th className="py-2.5 px-3 rounded-l-lg">Solicitante</th>
                <th className="py-2.5 px-3">Materiales Solicitados</th>
                <th className="py-2.5 px-3">Proyecto 3D</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Estado Envío</th>
                <th className="py-2.5 px-3 text-right">Presupuesto</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Acción</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/50'}`}>
              {sampleOrders.map((s) => (
                <tr key={s.id} className={`transition-colors ${isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/40'}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs text-orange-500 shrink-0 ${
                        isLight ? 'bg-orange-50 border-orange-200' : 'bg-zinc-800 border-zinc-700'
                      }`}>
                        {s.avatar}
                      </div>
                      <div>
                        <div className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{s.name}</div>
                        <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{s.studio}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {s.materials.map((m, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          isLight ? 'bg-zinc-100 border border-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className={`font-medium ${isLight ? 'text-zinc-900' : 'text-white'}`}>{s.project}</div>
                  </td>
                  <td className={`py-3 px-3 font-mono ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{s.date}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className={`font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{s.amount}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{s.probability}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => alert(`Abriendo ficha 3D y despiece de corte para ${s.name}`)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        isLight
                          ? 'bg-zinc-100 hover:bg-orange-500 hover:text-white border-zinc-200 text-zinc-800'
                          : 'bg-zinc-800 hover:bg-orange-500 hover:text-white border-transparent text-zinc-300'
                      }`}
                    >
                      Ver Proyecto
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
