import React from 'react';
import {
  useChairStore,
  CHAIR_LEGS_COLORS,
  ABET_LAMINATI_CATALOG,
  CHAIR_FIXED_DIMENSIONS,
} from '../../store/chairStore';

export function ChairBlueprint2D() {
  const legsColor = useChairStore((state) => state.legsColor);
  const seatLaminateId = useChairStore((state) => state.seatLaminateId);
  const backrestFrontLaminateId = useChairStore((state) => state.backrestFrontLaminateId);
  const backrestRearLaminateId = useChairStore((state) => state.backrestRearLaminateId);
  const backrestSameBothSides = useChairStore((state) => state.backrestSameBothSides);
  const chairQuantity = useChairStore((state) => state.chairQuantity);

  const legsConfig = CHAIR_LEGS_COLORS[legsColor];
  const seatLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === seatLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backFrontLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === backrestFrontLaminateId) || ABET_LAMINATI_CATALOG[0];
  const backRearLaminate = ABET_LAMINATI_CATALOG.find((c) => c.id === backrestRearLaminateId) || ABET_LAMINATI_CATALOG[0];

  return (
    <div className="w-full h-full bg-[#0A0D14] text-slate-200 overflow-y-auto p-6 flex flex-col items-center select-none font-sans">
      <div className="w-full max-w-5xl bg-[#0F1420] border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header Plano */}
        <div className="flex flex-wrap justify-between items-start border-b border-blue-500/20 pb-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[11px] font-bold uppercase rounded border border-blue-500/30">
                Plano Técnico de Fabricación
              </span>
              <span className="text-xs font-mono text-slate-400">Escala: 1:10 (Cotación en mm)</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1 tracking-wide">
              Silla Ergonómica Terciado Curvo & Fierro Tubular
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Revestimiento: Abet Laminati (130 × 305 cm) • Alma: Terciado 12mm prensado • Estructura: Tubo Ø 22.2 × 1.5mm
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            <div className="font-mono text-xs font-bold text-orange-400">PROYECTO: ARQUIFY-CHAIR-01</div>
            <div className="text-[11px] text-slate-400">EETT & Planos de Matricería Fija</div>
            <div className="mt-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
              ESTADO: APTO PARA PRODUCCIÓN
            </div>
          </div>
        </div>

        {/* SVG Orthographic Drawings (Frontal, Lateral, Planta) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Elevation Frontal & Lateral in SVG */}
          <div className="bg-[#0B0F19] border border-blue-900/40 rounded-xl p-4 flex flex-col items-center">
            <div className="text-xs font-mono font-bold text-blue-400 mb-2 self-start flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              VISTA FRONTAL & LATERAL
            </div>
            <svg viewBox="0 0 520 400" className="w-full max-w-[500px] h-auto text-slate-300">
              {/* Grid lines background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="520" height="400" fill="url(#grid)" opacity="0.5" />

              {/* Floor Line */}
              <line x1="20" y1="360" x2="500" y2="360" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="25" y="375" fill="#64748B" fontSize="10" fontFamily="monospace">N.P.T. ±0.00</text>

              {/* ----------------- VISTA FRONTAL (Left side of SVG) ----------------- */}
              <g transform="translate(40, 0)">
                <text x="100" y="30" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">
                  ELEVACIÓN FRONTAL
                </text>

                {/* Steel Legs */}
                <line x1="55" y1="360" x2="75" y2="200" stroke={legsConfig.hex} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="145" y1="360" x2="125" y2="200" stroke={legsConfig.hex} strokeWidth="3.5" strokeLinecap="round" />
                {/* Crossbar */}
                <line x1="72" y1="200" x2="128" y2="200" stroke={legsConfig.hex} strokeWidth="3" />
                {/* Backrest Uprights (342mm spacing) */}
                <line x1="74" y1="200" x2="74" y2="85" stroke={legsConfig.hex} strokeWidth="3" />
                <line x1="126" y1="200" x2="126" y2="85" stroke={legsConfig.hex} strokeWidth="3" />

                {/* Glides */}
                <rect x="49" y="356" width="12" height="6" rx="2" fill="#0F172A" stroke="#334155" />
                <rect x="139" y="356" width="12" height="6" rx="2" fill="#0F172A" stroke="#334155" />

                {/* Curved Seat (Terciado 12mm + Abet) */}
                <path d="M 48 195 Q 100 202 152 195 L 152 187 Q 100 194 48 187 Z" fill="#D4B996" stroke="#94A3B8" strokeWidth="1" />
                <path d="M 48 187 Q 100 194 152 187" stroke="#38BDF8" strokeWidth="2.5" fill="none" />

                {/* Curved Backrest (Terciado 12mm + Abet, 461x219mm R396) */}
                <path d="M 46 135 Q 100 142 154 135 L 154 85 Q 100 92 46 85 Z" fill="#D4B996" stroke="#94A3B8" strokeWidth="1" />
                <path d="M 46 85 Q 100 92 154 85" stroke="#F97316" strokeWidth="2.5" fill="none" />

                {/* 4 Rivets */}
                <circle cx="74" cy="100" r="2" fill="#FFFFFF" />
                <circle cx="74" cy="115" r="2" fill="#FFFFFF" />
                <circle cx="126" cy="100" r="2" fill="#FFFFFF" />
                <circle cx="126" cy="115" r="2" fill="#FFFFFF" />

                {/* Dimension Cota: Altura Asiento (450mm) */}
                <line x1="165" y1="360" x2="165" y2="190" stroke="#38BDF8" strokeWidth="1" />
                <line x1="160" y1="360" x2="170" y2="360" stroke="#38BDF8" strokeWidth="1" />
                <line x1="160" y1="190" x2="170" y2="190" stroke="#38BDF8" strokeWidth="1" />
                <text x="175" y="280" fill="#38BDF8" fontSize="10" fontFamily="monospace">450</text>

                {/* Dimension Cota: Ancho Asiento (446mm) */}
                <line x1="48" y1="215" x2="152" y2="215" stroke="#10B981" strokeWidth="1" />
                <line x1="48" y1="210" x2="48" y2="220" stroke="#10B981" strokeWidth="1" />
                <line x1="152" y1="210" x2="152" y2="220" stroke="#10B981" strokeWidth="1" />
                <text x="100" y="228" fill="#10B981" fontSize="10" fontFamily="monospace" textAnchor="middle">446</text>
              </g>

              {/* ----------------- VISTA LATERAL (Right side of SVG) ----------------- */}
              <g transform="translate(300, 0)">
                <text x="90" y="30" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">
                  ELEVACIÓN LATERAL
                </text>

                {/* Steel Legs */}
                <line x1="135" y1="360" x2="115" y2="200" stroke={legsConfig.hex} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="40" y1="360" x2="70" y2="200" stroke={legsConfig.hex} strokeWidth="3.5" strokeLinecap="round" />
                {/* Backrest Upright */}
                <line x1="68" y1="200" x2="52" y2="85" stroke={legsConfig.hex} strokeWidth="3" />

                {/* Glides */}
                <rect x="34" y="356" width="12" height="6" rx="2" fill="#0F172A" stroke="#334155" />
                <rect x="129" y="356" width="12" height="6" rx="2" fill="#0F172A" stroke="#334155" />

                {/* Seat Side Profile */}
                <path d="M 58 190 Q 95 194 135 190 Q 140 195 138 202 L 58 198 Z" fill="#D4B996" stroke="#94A3B8" strokeWidth="1" />

                {/* Backrest Side Profile */}
                <path d="M 48 135 L 51 135 L 58 85 L 55 85 Z" fill="#D4B996" stroke="#F97316" strokeWidth="1.5" />

                {/* Dimension Cota: Altura Total (775mm) */}
                <line x1="160" y1="360" x2="160" y2="85" stroke="#F97316" strokeWidth="1" />
                <line x1="155" y1="360" x2="165" y2="360" stroke="#F97316" strokeWidth="1" />
                <line x1="155" y1="85" x2="165" y2="85" stroke="#F97316" strokeWidth="1" />
                <text x="170" y="220" fill="#F97316" fontSize="10" fontFamily="monospace">775</text>

                {/* Dimension Cota: Profundidad Asiento (431mm) */}
                <line x1="58" y1="215" x2="138" y2="215" stroke="#A855F7" strokeWidth="1" />
                <line x1="58" y1="210" x2="58" y2="220" stroke="#A855F7" strokeWidth="1" />
                <line x1="138" y1="210" x2="138" y2="220" stroke="#A855F7" strokeWidth="1" />
                <text x="98" y="228" fill="#A855F7" fontSize="10" fontFamily="monospace" textAnchor="middle">431</text>
              </g>
            </svg>
          </div>

          {/* Plancha Abet Laminati 130x305 cm Nesting Diagram */}
          <div className="bg-[#0B0F19] border border-blue-900/40 rounded-xl p-4 flex flex-col items-center">
            <div className="text-xs font-mono font-bold text-amber-400 mb-2 self-start flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                APROVECHAMIENTO EN PLANCHA ABET LAMINATI (130 × 305 cm)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Área: 3.965 m²</span>
            </div>

            <div className="w-full bg-black/40 border border-amber-500/30 rounded-lg p-3 my-auto">
              <svg viewBox="0 0 460 220" className="w-full h-auto">
                {/* Plancha 1300x3050 representation (proportional ~ 430 x 180) */}
                <rect x="15" y="20" width="430" height="180" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="230" y="15" fill="#F59E0B" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  3050 mm (305 cm)
                </text>
                <text x="5" y="115" fill="#F59E0B" fontSize="10" fontFamily="monospace" transform="rotate(-90 8,115)">
                  1300 mm
                </text>

                {/* Pattern of cut parts for seats and backrests */}
                {/* Row 1: Seats (440x430mm) */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <g key={`seat-nest-${i}`} transform={`translate(${25 + i * 68}, 30)`}>
                    <rect width="62" height="60" rx="4" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" opacity="0.8" />
                    <text x="31" y="34" fill="#FFFFFF" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      ASIENTO
                    </text>
                  </g>
                ))}

                {/* Row 2: Seats */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <g key={`seat-nest-2-${i}`} transform={`translate(${25 + i * 68}, 96)`}>
                    <rect width="62" height="60" rx="4" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" opacity="0.8" />
                    <text x="31" y="34" fill="#FFFFFF" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      ASIENTO
                    </text>
                  </g>
                ))}

                {/* Row 3: Backrests (420x280mm) */}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <g key={`back-nest-${i}`} transform={`translate(${25 + i * 59}, 160)`}>
                    <rect width="55" height="34" rx="3" fill="#D97706" stroke="#FBBF24" strokeWidth="1" opacity="0.8" />
                    <text x="27" y="20" fill="#FFFFFF" fontSize="7" fontFamily="monospace" textAnchor="middle">
                      RESPALDO
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="w-full flex justify-between items-center text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-zinc-800">
              <div>Rendimiento: <strong className="text-white">~12 Asientos + 14 Respaldos / Plancha</strong></div>
              <div>Aprovechamiento: <strong className="text-emerald-400">89.4% (Bajo Desperdicio)</strong></div>
            </div>
          </div>
        </div>

        {/* Technical Specifications Matrix */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/30">
          <div className="bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-zinc-800 flex justify-between items-center">
            <span>Ficha de Materiales y Criterio de Fabricación Seleccionado</span>
            <span className="text-orange-400 font-mono">Cantidad: {chairQuantity} unidad{chairQuantity > 1 ? 'es' : ''}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 text-xs">
            {/* 1. Estructura Patas */}
            <div className="p-3.5 flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-mono uppercase">Estructura Metálica</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: legsConfig.hex }}
                ></span>
                <strong className="text-white">{legsConfig.name}</strong>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{legsConfig.ral} • Pintura Electrostática</span>
              <span className="text-[10px] text-slate-500">Tubo acero Ø 22.2 × 1.5mm + regatones</span>
            </div>

            {/* 2. Asiento HPL */}
            <div className="p-3.5 flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-mono uppercase">Asiento (Cara Superior)</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-4 h-4 rounded border border-white/30 shadow-sm"
                  style={{ backgroundColor: seatLaminate.hex }}
                ></span>
                <strong className="text-white truncate">{seatLaminate.name}</strong>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{seatLaminate.code} ({seatLaminate.sheetFormat})</span>
              <span className="text-[10px] text-amber-300/80">Inf: Terciado Natural • Canto: Multilaminar</span>
            </div>

            {/* 3. Respaldo Frente */}
            <div className="p-3.5 flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-mono uppercase">Respaldo (Frente)</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-4 h-4 rounded border border-white/30 shadow-sm"
                  style={{ backgroundColor: backFrontLaminate.hex }}
                ></span>
                <strong className="text-white truncate">{backFrontLaminate.name}</strong>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{backFrontLaminate.code}</span>
              <span className="text-[10px] text-slate-500">Curvatura ergonómica lumbar 12mm</span>
            </div>

            {/* 4. Respaldo Dorso */}
            <div className="p-3.5 flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-mono uppercase">Respaldo (Dorso Posterior)</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-4 h-4 rounded border border-white/30 shadow-sm"
                  style={{ backgroundColor: backRearLaminate.hex }}
                ></span>
                <strong className="text-white truncate">{backRearLaminate.name}</strong>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {backrestSameBothSides ? 'Idéntico al frente' : `${backRearLaminate.code} (Personalizado)`}
              </span>
              <span className="text-[10px] text-slate-500">4 pernos remache inox de anclaje</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
