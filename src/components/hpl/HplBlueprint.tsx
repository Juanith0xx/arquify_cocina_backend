import React, { useState } from 'react';
import {
  useHplBathroomStore,
  HPL_STANDARD_COLORS,
  JNF_FINISHES,
} from '../../store/hplBathroomStore';
import { calculateHplManufacturingBOM } from '../../utils/hplManufacturing';
import { LayoutGrid, Layers, Maximize2, Eye, Compass, Scissors, Sparkles, CheckCircle2 } from 'lucide-react';

export function HplBlueprint() {
  const state = useHplBathroomStore();
  const [subView, setSubView] = useState<'floor_plan' | 'elevation_front' | 'elevation_side' | 'nesting'>('floor_plan');
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  const bom = calculateHplManufacturingBOM(state);
  const colorObj = HPL_STANDARD_COLORS.find((c) => c.id === state.selectedColorId);
  const colorName = state.customTextureName || colorObj?.name || 'Abet HPL';
  const finishInfo = JNF_FINISHES[state.hardwareFinish];

  const totalBatteryW = state.cubicles.reduce((acc, c) => acc + c.cubicleWidth, 0);
  const maxDepth = Math.max(...state.cubicles.map((c) => c.cubicleDepth), 1400);
  const totalHeight = state.panelHeight + state.footHeight;

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0F19] text-slate-200 overflow-hidden select-none">
      {/* Sub-navigation Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubView('floor_plan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              subView === 'floor_plan'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Compass size={14} />
            <span>Planta Técnica 2D</span>
          </button>

          <button
            onClick={() => setSubView('elevation_front')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              subView === 'elevation_front'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Layers size={14} />
            <span>Elevación Frontal</span>
          </button>

          <button
            onClick={() => setSubView('elevation_side')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              subView === 'elevation_side'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Maximize2 size={14} />
            <span>Corte / Elevación Lateral</span>
          </button>

          <button
            onClick={() => setSubView('nesting')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              subView === 'nesting'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Scissors size={14} />
            <span>Optimización de Placas (Nesting)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded text-[10px]">
              {bom.nesting.totalSheets} Placas
            </span>
          </button>
        </div>

        {/* Info Badges */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
          <span>Formato: <strong className="text-slate-200">{bom.nesting.selectedFormat.name}</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>Aprovechamiento: <strong className="text-emerald-400">{bom.nesting.globalEfficiencyPct}%</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>Herrajes: <strong className="text-sky-400">{finishInfo.name}</strong></span>
        </div>
      </div>

      {/* Main Drawing Area */}
      <div className="flex-1 relative overflow-auto p-6 flex items-center justify-center">
        {/* ============================================================== */}
        {/* VISTA 1: PLANTA TÉCNICA 2D */}
        {/* ============================================================== */}
        {subView === 'floor_plan' && (
          <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Plano de Planta - Distribución y Radios de Giro</h3>
                <p className="text-xs text-slate-400">Cuadrícula cerámica de piso 60x60 cm. Modulación en milímetros (mm).</p>
              </div>
              <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 text-xs font-bold">
                Largo Total: {totalBatteryW} mm | Fondo Máx: {maxDepth} mm
              </div>
            </div>

            {/* SVG PLANTA */}
            <svg
              viewBox={`-100 -100 ${totalBatteryW + 300} ${maxDepth + 350}`}
              className="w-full h-auto max-h-[600px] bg-[#070A12] border border-slate-800 rounded-xl"
            >
              <defs>
                {/* Patrón de cerámicas 60x60 cm */}
                <pattern id="tilePattern" width="600" height="600" patternUnits="userSpaceOnUse">
                  <rect width="600" height="600" fill="#0C1222" stroke="#1E293B" strokeWidth="2" />
                </pattern>
              </defs>

              {/* Suelo cerámico */}
              <rect x="-80" y="-80" width={totalBatteryW + 260} height={maxDepth + 300} fill="url(#tilePattern)" />

              {/* Muro posterior de apoyo */}
              <rect x="-40" y="-30" width={totalBatteryW + 80} height="30" fill="#334155" stroke="#475569" strokeWidth="2" />
              <text x={totalBatteryW / 2} y="-10" fill="#94A3B8" fontSize="18" textAnchor="middle" fontWeight="bold">
                MURO POSTERIOR (CERÁMICA 60x60)
              </text>

              {/* Cubículos Sanitarios */}
              {(() => {
                let currX = 0;
                return state.cubicles.map((cab, idx) => {
                  const cabW = cab.cubicleWidth;
                  const cabD = cab.cubicleDepth;
                  const doorW = cab.doorWidth;
                  const startX = currX;
                  currX += cabW;

                  const isLeft = cab.doorOpening.startsWith('left');
                  const opensOut = cab.doorOpening.endsWith('out');
                  const arcAngle = opensOut ? -1 : 1;

                  const pilasterW = Math.max(80, cabW - doorW);
                  const pilasterStartX = isLeft ? startX + doorW : startX;
                  const doorStartX = isLeft ? startX : startX + pilasterW;
                  const pilasterCenterX = pilasterStartX + pilasterW / 2;

                  return (
                    <g key={`cab_svg_${cab.id}`}>
                      {/* Área interior del cubículo */}
                      <rect
                        x={startX}
                        y={0}
                        width={cabW}
                        height={cabD}
                        fill={cab.isPmr ? 'rgba(56, 189, 248, 0.07)' : 'rgba(255, 255, 255, 0.03)'}
                        stroke="#0284C7"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />

                      {/* Taza Inodoro 2D */}
                      <ellipse cx={startX + cabW / 2} cy={cabD - 450} rx="180" ry="240" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                      <rect x={startX + cabW / 2 - 180} y={cabD - 160} width="360" height="150" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" rx="10" />

                      {/* Espacio de Transferencia / Giro PMR Ø1500mm */}
                      {cab.isPmr && (
                        <g>
                          <circle cx={startX + cabW / 2} cy={cabD / 2} r="600" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="6 6" />
                          <text x={startX + cabW / 2} y={cabD / 2 + 5} fill="#38BDF8" fontSize="20" textAnchor="middle" fontWeight="bold">
                            GIRO PMR Ø1500 mm
                          </text>
                        </g>
                      )}

                      {/* Separadores divisorios laterales fijados al centro de la pilastra */}
                      <rect x={pilasterCenterX - state.thicknessDivider / 2} y={0} width={state.thicknessDivider} height={cabD} fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
                      {idx === state.cubicles.length - 1 && (
                        <rect x={startX + cabW} y={0} width={state.thicknessDivider} height={cabD} fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
                      )}

                      {/* Escuadras 90° JNF SM.004 de unión al centro de la pilastra */}
                      <rect x={pilasterCenterX - 18} y={cabD - 18} width="16" height="16" fill="#F59E0B" opacity="0.8" />
                      <rect x={pilasterCenterX + 2} y={cabD - 18} width="16" height="16" fill="#F59E0B" opacity="0.8" />

                      {/* Pilastra frontal (Gris Oscuro HPL) */}
                      <rect
                        x={pilasterStartX}
                        y={cabD - state.thicknessPilaster}
                        width={pilasterW}
                        height={state.thicknessPilaster}
                        fill="#0284C7"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                      <text x={pilasterStartX + pilasterW / 2} y={cabD - 12} fill="#FFFFFF" fontSize="11" textAnchor="middle" fontWeight="bold">
                        Pilastra {pilasterW}mm
                      </text>

                      {/* Arco de Apertura de Puerta */}
                      <path
                        d={`M ${doorStartX + (isLeft ? 0 : doorW)} ${cabD} A ${doorW} ${doorW} 0 0 ${isLeft ? 1 : 0} ${
                          doorStartX + (isLeft ? 0 : doorW) + (isLeft ? doorW : -doorW)
                        } ${cabD - doorW * arcAngle}`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />

                      {/* Hoja de Puerta abierta */}
                      <line
                        x1={doorStartX + (isLeft ? 0 : doorW)}
                        y1={cabD}
                        x2={doorStartX + (isLeft ? 0 : doorW) + (isLeft ? doorW : -doorW)}
                        y2={cabD - doorW * arcAngle}
                        stroke="#F59E0B"
                        strokeWidth="4"
                      />

                      {/* Etiqueta de Cabina */}
                      <text x={startX + cabW / 2} y={cabD / 2 - 80} fill="#FFFFFF" fontSize="24" textAnchor="middle" fontWeight="bold">
                        {cab.name}
                      </text>
                      <text x={startX + cabW / 2} y={cabD / 2 - 45} fill="#94A3B8" fontSize="18" textAnchor="middle">
                        {cabW} x {cabD} mm | Puerta {doorW} mm | Pilastra {pilasterW} mm
                      </text>

                      {/* Cotas de ancho frontal */}
                      <line x1={startX} y1={cabD + 50} x2={startX + cabW} y2={cabD + 50} stroke="#94A3B8" strokeWidth="2" />
                      <line x1={startX} y1={cabD + 40} x2={startX} y2={cabD + 60} stroke="#94A3B8" strokeWidth="2" />
                      <line x1={startX + cabW} y1={cabD + 40} x2={startX + cabW} y2={cabD + 60} stroke="#94A3B8" strokeWidth="2" />
                      <text x={startX + cabW / 2} y={cabD + 42} fill="#38BDF8" fontSize="20" textAnchor="middle" fontWeight="bold">
                        {cabW} mm
                      </text>
                    </g>
                  );
                });
              })()}

              {/* SEPARADORES DE URINARIOS (DRAGGABLE EN EL ÁREA DEL BAÑO) */}
              {state.urinalScreens.map((u, uIdx) => {
                const uX = (u.posX ?? 3800) - 2200; // Normalizado para visualización
                const uY = (u.posZ ?? 1400) - 800;
                const uW = u.width;

                return (
                  <g key={`blueprint_urinal_${u.id}`}>
                    {/* Pantalla HPL */}
                    <rect
                      x={uX}
                      y={uY}
                      width={state.thicknessUrinal + 4}
                      height={uW}
                      fill="#38BDF8"
                      stroke="#0284C7"
                      strokeWidth="2"
                      rx="2"
                    />
                    {/* Urinario cerámico 2D */}
                    <rect
                      x={uX - 180}
                      y={uY + 50}
                      width="160"
                      height="260"
                      fill="#FFFFFF"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      rx="8"
                    />
                    <text x={uX - 100} y={uY + 180} fill="#64748B" fontSize="14" textAnchor="middle" fontWeight="bold">
                      Urinario
                    </text>
                    <text x={uX} y={uY - 10} fill="#38BDF8" fontSize="14" textAnchor="middle" fontWeight="bold">
                      {u.name}
                    </text>
                  </g>
                );
              })}

              {/* Cota General de Longitud Batería */}
              <line x1={0} y1={maxDepth + 120} x2={totalBatteryW} y2={maxDepth + 120} stroke="#38BDF8" strokeWidth="3" />
              <line x1={0} y1={maxDepth + 105} x2={0} y2={maxDepth + 135} stroke="#38BDF8" strokeWidth="3" />
              <line x1={totalBatteryW} y1={maxDepth + 105} x2={totalBatteryW} y2={maxDepth + 135} stroke="#38BDF8" strokeWidth="3" />
              <text x={totalBatteryW / 2} y={maxDepth + 110} fill="#38BDF8" fontSize="26" textAnchor="middle" fontWeight="bold">
                LONGITUD TOTAL BATERÍA: {totalBatteryW} mm
              </text>
            </svg>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 2: ELEVACIÓN FRONTAL */}
        {/* ============================================================== */}
        {subView === 'elevation_front' && (
          <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Plano de Elevación Frontal</h3>
                <p className="text-xs text-slate-400">Herrajes JNF: Pies regulables SM.017, Cierres con indicador SM.031, Tubo superior Ø19mm.</p>
              </div>
              <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 text-xs font-bold">
                Altura Total: {totalHeight} mm (Panel {state.panelHeight} + Pie {state.footHeight} mm)
              </div>
            </div>

            <svg
              viewBox={`-80 -80 ${totalBatteryW + 200} ${totalHeight + 200}`}
              className="w-full h-auto max-h-[600px] bg-[#070A12] border border-slate-800 rounded-xl"
            >
              {/* Nivel de Suelo */}
              <line x1="-40" y1={totalHeight} x2={totalBatteryW + 40} y2={totalHeight} stroke="#64748B" strokeWidth="4" />
              <text x="-30" y={totalHeight + 35} fill="#94A3B8" fontSize="20" fontWeight="bold">
                N.P.T. ±0.00
              </text>

              {/* Tubo Estabilizador Superior JNF */}
              <rect
                x="-10"
                y="-15"
                width={totalBatteryW + 20}
                height="15"
                fill={finishInfo.colorHex}
                stroke="#0F172A"
                strokeWidth="2"
                rx="4"
              />
              <text x={totalBatteryW / 2} y="-25" fill="#38BDF8" fontSize="18" textAnchor="middle" fontWeight="bold">
                TUBO ESTABILIZADOR JNF Ø19mm INOX
              </text>

              {/* Cabinas, Pilastras y Puertas */}
              {(() => {
                let currX = 0;
                return state.cubicles.map((cab, idx) => {
                  const cabW = cab.cubicleWidth;
                  const doorW = cab.doorWidth;
                  const startX = currX;
                  currX += cabW;

                  const isLeft = cab.doorOpening.startsWith('left');
                  const doorX = isLeft ? startX : startX + (cabW - doorW);
                  const pilasterW = cabW - doorW;
                  const pilasterX = isLeft ? startX + doorW : startX;

                  return (
                    <g key={`elev_cab_${cab.id}`}>
                      {/* Hoja de Puerta */}
                      <rect
                        x={doorX + 2}
                        y={totalHeight - state.panelHeight - state.footHeight + 10}
                        width={doorW - 4}
                        height={state.panelHeight - 20}
                        fill="#1E293B"
                        stroke="#38BDF8"
                        strokeWidth="2"
                        rx="2"
                      />

                      {/* Bisagras JNF SM.005.C */}
                      {[180, state.panelHeight / 2, state.panelHeight - 220].map((yOff, bIdx) => (
                        <rect
                          key={`b_${bIdx}`}
                          x={isLeft ? doorX : doorX + doorW - 14}
                          y={totalHeight - state.footHeight - yOff}
                          width="14"
                          height="40"
                          fill={finishInfo.colorHex}
                          stroke="#000000"
                          strokeWidth="1"
                          rx="2"
                        />
                      ))}

                      {/* Indicador Rojo/Verde y Cerrojo SM.031 */}
                      <circle
                        cx={isLeft ? doorX + doorW - 40 : doorX + 40}
                        cy={totalHeight - state.footHeight - state.panelHeight / 2}
                        r="18"
                        fill="#EF4444"
                        stroke={finishInfo.colorHex}
                        strokeWidth="3"
                      />

                      {/* Tirador Doble JNF IN.75.050.D */}
                      <rect
                        x={isLeft ? doorX + doorW - 45 : doorX + 35}
                        y={totalHeight - state.footHeight - state.panelHeight / 2 + 35}
                        width="10"
                        height="80"
                        fill={finishInfo.colorHex}
                        stroke="#000000"
                        strokeWidth="1"
                        rx="2"
                      />

                      {/* Pilastra Frontal */}
                      {pilasterW > 0 && (
                        <rect
                          x={pilasterX}
                          y={totalHeight - state.panelHeight - state.footHeight}
                          width={pilasterW}
                          height={state.panelHeight}
                          fill="#0F172A"
                          stroke="#0284C7"
                          strokeWidth="2"
                        />
                      )}

                      {/* Patas Regulables JNF SM.017 */}
                      <rect
                        x={startX + 20}
                        y={totalHeight - state.footHeight}
                        width="16"
                        height={state.footHeight}
                        fill={finishInfo.colorHex}
                        stroke="#000000"
                        strokeWidth="1"
                      />
                      <rect
                        x={startX + 12}
                        y={totalHeight - 6}
                        width="32"
                        height="6"
                        fill={finishInfo.colorHex}
                        stroke="#000000"
                        strokeWidth="1"
                        rx="2"
                      />

                      {/* Textos y Etiquetas */}
                      <text
                        x={doorX + doorW / 2}
                        y={totalHeight - state.footHeight - state.panelHeight / 2 - 80}
                        fill="#FFFFFF"
                        fontSize="20"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {cab.name}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Cotas Verticales */}
              <line x1="-30" y1={0} x2="-30" y2={totalHeight} stroke="#38BDF8" strokeWidth="2" />
              <line x1="-40" y1={0} x2="-20" y2={0} stroke="#38BDF8" strokeWidth="2" />
              <line x1="-40" y1={totalHeight - state.footHeight} x2="-20" y2={totalHeight - state.footHeight} stroke="#38BDF8" strokeWidth="2" />
              <line x1="-40" y1={totalHeight} x2="-20" y2={totalHeight} stroke="#38BDF8" strokeWidth="2" />
              <text x="-45" y={totalHeight / 2} fill="#38BDF8" fontSize="20" textAnchor="end" fontWeight="bold">
                {totalHeight} mm
              </text>
            </svg>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 3: CORTE / ELEVACIÓN LATERAL */}
        {/* ============================================================== */}
        {subView === 'elevation_side' && (
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Plano de Corte / Elevación Lateral</h3>
                <p className="text-xs text-slate-400">Fijación de separador lateral con escuadras SM.024 y 2 patas regulables SM.017.</p>
              </div>
              <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 text-xs font-bold">
                Profundidad: {maxDepth} mm
              </div>
            </div>

            <svg
              viewBox={`-80 -80 ${maxDepth + 200} ${totalHeight + 200}`}
              className="w-full h-auto max-h-[600px] bg-[#070A12] border border-slate-800 rounded-xl"
            >
              {/* Muro posterior */}
              <rect x="-30" y="-30" width="30" height={totalHeight + 30} fill="#334155" stroke="#475569" strokeWidth="2" />
              {/* Nivel de suelo */}
              <line x1="-30" y1={totalHeight} x2={maxDepth + 40} y2={totalHeight} stroke="#64748B" strokeWidth="4" />

              {/* Panel Separador Lateral HPL */}
              {(() => {
                const divH = state.dividerHeight || state.panelHeight;
                const divFootH = Math.max(10, totalHeight - divH);
                return (
                  <>
                    <rect
                      x="0"
                      y={0}
                      width={maxDepth}
                      height={divH}
                      fill="#1E293B"
                      stroke="#38BDF8"
                      strokeWidth="3"
                      rx="4"
                    />

                    {/* Texto informativo de panel */}
                    <text
                      x={maxDepth / 2}
                      y={divH / 2}
                      fill="#38BDF8"
                      fontSize="20"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      SEPARADOR LATERAL (e = {state.thicknessDivider} mm, H = {divH} mm)
                    </text>

                    {/* 3 Pinzas a muro posterior */}
                    {[150, divH / 2, divH - 150].map((yOff, bIdx) => (
                      <rect
                        key={`wall_b_${bIdx}`}
                        x="-5"
                        y={divH - yOff - 20}
                        width="20"
                        height="40"
                        fill={finishInfo.colorHex}
                        stroke="#000000"
                        strokeWidth="1"
                        rx="2"
                      />
                    ))}

                    {/* 2 Patas regulables al suelo JNF */}
                    {[maxDepth / 4, (maxDepth * 3) / 4].map((xOff, pIdx) => (
                      <g key={`leg_${pIdx}`}>
                        <rect
                          x={xOff - 8}
                          y={divH}
                          width="16"
                          height={divFootH}
                          fill={finishInfo.colorHex}
                          stroke="#000000"
                          strokeWidth="1"
                        />
                        <rect
                          x={xOff - 16}
                          y={totalHeight - 6}
                          width="32"
                          height="6"
                          fill={finishInfo.colorHex}
                          stroke="#000000"
                          strokeWidth="1"
                          rx="2"
                        />
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* Cota de Profundidad */}
              <line x1="0" y1={totalHeight + 40} x2={maxDepth} y2={totalHeight + 40} stroke="#38BDF8" strokeWidth="2" />
              <text x={maxDepth / 2} y={totalHeight + 65} fill="#38BDF8" fontSize="22" textAnchor="middle" fontWeight="bold">
                FONDO CUBÍCULO: {maxDepth} mm
              </text>
            </svg>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 4: OPTIMIZACIÓN DE CORTES (NESTING 2D) */}
        {/* ============================================================== */}
        {subView === 'nesting' && (
          <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Scissors size={18} className="text-emerald-400" />
                  <span>Optimización de Placas Abet Laminati (Nesting)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Formato: {bom.nesting.selectedFormat.name} | Total Planchas: {bom.nesting.totalSheets}
                </p>
              </div>

              {/* Selector de Placa */}
              <div className="flex items-center gap-2">
                {bom.nesting.sheets.map((s, sIdx) => (
                  <button
                    key={`sheet_btn_${s.sheetIndex}`}
                    onClick={() => setSelectedSheetIndex(sIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedSheetIndex === sIdx
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Placa #{s.sheetIndex} ({s.thickness}mm)
                  </button>
                ))}
              </div>
            </div>

            {/* Visualización de la Placa Seleccionada */}
            {bom.nesting.sheets[selectedSheetIndex] && (
              <div className="w-full flex flex-col items-center">
                {(() => {
                  const currSheet = bom.nesting.sheets[selectedSheetIndex];
                  const sheetW = currSheet.format.length; // Largo placa (ej. 3660)
                  const sheetH = currSheet.format.width;  // Ancho placa (ej. 1610)

                  return (
                    <div className="w-full">
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-2 px-1">
                        <span>Placa: <strong className="text-white">{currSheet.sheetId}</strong></span>
                        <span>Espesor: <strong className="text-emerald-400">{currSheet.thickness} mm</strong></span>
                        <span>Eficiencia: <strong className="text-emerald-400">{currSheet.efficiencyPercentage}%</strong></span>
                        <span>Merma: <strong className="text-amber-400">{currSheet.wastePercentage}%</strong></span>
                      </div>

                      {/* SVG DE CORTE DE LA PLACA */}
                      <svg
                        viewBox={`-50 -50 ${sheetW + 100} ${sheetH + 100}`}
                        className="w-full h-auto max-h-[500px] bg-[#0A0F1D] border-2 border-emerald-500/40 rounded-xl"
                      >
                        {/* Placa Completa (Fondo Merma) */}
                        <rect x="0" y="0" width={sheetW} height={sheetH} fill="#1E293B" stroke="#334155" strokeWidth="4" rx="6" />

                        {/* Piezas cortadas ubicadas */}
                        {currSheet.placedParts.map((p, pIdx) => {
                          const isDoor = p.pieceType === 'door';
                          const isPilaster = p.pieceType === 'pilaster';
                          const isUrinal = p.pieceType === 'urinal';

                          const partColor = isDoor ? '#0284C7' : isPilaster ? '#0369A1' : isUrinal ? '#0D9488' : '#075985';

                          return (
                            <g key={`p_${p.id}`}>
                              <rect
                                x={p.x}
                                y={p.y}
                                width={p.w}
                                height={p.h}
                                fill={partColor}
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                rx="3"
                              />
                              <text
                                x={p.x + p.w / 2}
                                y={p.y + p.h / 2 - 15}
                                fill="#FFFFFF"
                                fontSize={Math.min(36, p.w / 12, p.h / 6)}
                                textAnchor="middle"
                                fontWeight="bold"
                              >
                                {p.name}
                              </text>
                              <text
                                x={p.x + p.w / 2}
                                y={p.y + p.h / 2 + 25}
                                fill="#BAE6FD"
                                fontSize={Math.min(28, p.w / 16, p.h / 8)}
                                textAnchor="middle"
                              >
                                {p.w} x {p.h} mm (e={p.thickness}mm)
                              </text>
                            </g>
                          );
                        })}

                        {/* Cota Largo y Ancho de la Plancha */}
                        <text x={sheetW / 2} y="-15" fill="#38BDF8" fontSize="32" textAnchor="middle" fontWeight="bold">
                          LARGO PLACA: {sheetW} mm
                        </text>
                        <text x="-15" y={sheetH / 2} fill="#38BDF8" fontSize="32" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 -15 ${sheetH / 2})`}>
                          ANCHO: {sheetH} mm
                        </text>
                      </svg>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
