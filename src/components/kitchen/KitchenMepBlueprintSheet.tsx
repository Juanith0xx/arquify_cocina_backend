import React from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { MEP_TYPE_CONFIGS } from '../../types/mep';
import { detectMepClashes } from '../../utils/mepClashDetection';

interface KitchenMepBlueprintSheetProps {
  pageNum: number;
}

export const KitchenMepBlueprintSheet: React.FC<KitchenMepBlueprintSheetProps> = ({ pageNum }) => {
  const { walls, mepPoints, cabinets, countertopConfig } = useKitchenStore();

  const clashes = detectMepClashes(mepPoints, cabinets, countertopConfig);

  // Muros con instalaciones MEP
  const effectiveWalls = walls && walls.length > 0 ? walls : [];

  return (
    <div className="blueprint-page border border-black/10 flex flex-col justify-between p-8 bg-white relative">
      {/* Encabezado Lámina */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
            Plano de Instalaciones MEP <span className="text-cyan-600">(Agua, Desagüe, Gas y Electricidad)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">
            Cotas a eje de salidas sobre NPT (+Nivel de Piso Terminado) y referencias a plomo de muros para obra gruesa.
          </p>
        </div>

        {/* Resumen de Interferencias */}
        <div className="flex items-center gap-2">
          {clashes.length === 0 ? (
            <span className="px-3 py-1 bg-emerald-100 border border-emerald-500 text-emerald-800 font-bold text-xs rounded uppercase tracking-wider">
              ✓ 0 Interferencias (Aprobado SEC / Sanitario)
            </span>
          ) : (
            <span className="px-3 py-1 bg-rose-100 border border-rose-500 text-rose-800 font-bold text-xs rounded uppercase tracking-wider">
              ⚠️ {clashes.length} Interferencia{clashes.length > 1 ? 's' : ''} en Proyecto
            </span>
          )}
        </div>
      </div>

      {/* Contenido Principal: Elevaciones Técnicas MEP de cada Muro */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {effectiveWalls.slice(0, 2).map((wall, wIdx) => {
          const [x1, z1] = wall.start;
          const [x2, z2] = wall.end;
          const wallLenCm = Math.round(Math.hypot(x2 - x1, z2 - z1));
          const wallLenMm = wallLenCm * 10;
          const wallHeightMm = (wall.height || 250) * 10;

          // Puntos MEP pertenecientes a este muro
          const wallPoints = mepPoints.filter((p) => p.wallId === wall.id);

          // Escala gráfica SVG
          const svgW = 850;
          const svgH = 190;
          const marginL = 60;
          const marginR = 40;
          const marginB = 40;
          const marginT = 25;
          const drawW = svgW - marginL - marginR;
          const drawH = svgH - marginT - marginB;
          const scaleX = drawW / wallLenMm;
          const scaleY = drawH / wallHeightMm;

          const groundY = svgH - marginB;

          return (
            <div key={wall.id} className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
              <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                <span>ELEVACIÓN TÉCNICA MEP — MURO {wIdx + 1} (Longitud: {wallLenMm} mm)</span>
                <span className="text-[10px] text-slate-500 font-mono">Escala esquemática 1:25</span>
              </div>

              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-[155px]">
                {/* Fondo del muro */}
                <rect
                  x={marginL}
                  y={groundY - wallHeightMm * scaleY}
                  width={drawW}
                  height={wallHeightMm * scaleY}
                  fill="#f1f5f9"
                  stroke="#64748b"
                  strokeWidth="1.2"
                />

                {/* Línea de NPT (Suelo) */}
                <line
                  x1={marginL - 20}
                  y1={groundY}
                  x2={marginL + drawW + 20}
                  y2={groundY}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <text x={marginL - 45} y={groundY + 3} fontSize="8" fontWeight="bold" fill="#0f172a">
                  NPT ±0.00
                </text>

                {/* Línea de referencia cubierta estándar (+900mm) */}
                <line
                  x1={marginL}
                  y1={groundY - 900 * scaleY}
                  x2={marginL + drawW}
                  y2={groundY - 900 * scaleY}
                  stroke="#f97316"
                  strokeWidth="0.8"
                  strokeDasharray="4,3"
                />
                <text x={marginL + drawW + 4} y={groundY - 900 * scaleY + 3} fontSize="7" fill="#ea580c" fontWeight="bold">
                  Cubierta +900
                </text>

                {/* Puntos MEP dibujados a escala */}
                {wallPoints.map((pt) => {
                  const cfg = MEP_TYPE_CONFIGS[pt.type];
                  const ptOffsetMm = (pt.wallOffset || 0) * 10;
                  const ptElevMm = pt.elevation * 10;
                  const px = marginL + ptOffsetMm * scaleX;
                  const py = groundY - ptElevMm * scaleY;

                  return (
                    <g key={pt.id}>
                      {/* Línea de proyección vertical hasta el suelo (cota a NPT) */}
                      <line
                        x1={px}
                        y1={py}
                        x2={px}
                        y2={groundY}
                        stroke={cfg.colorHex}
                        strokeWidth="0.7"
                        strokeDasharray="2,2"
                      />

                      {/* Marcador del punto técnico */}
                      <circle cx={px} cy={py} r="4.5" fill={cfg.colorHex} stroke="#0f172a" strokeWidth="1" />
                      <circle cx={px} cy={py} r="1.5" fill="#ffffff" />

                      {/* Etiqueta con abreviación */}
                      <rect
                        x={px - 14}
                        y={py - 16}
                        width="28"
                        height="10"
                        rx="2"
                        fill={cfg.colorHex}
                      />
                      <text
                        x={px}
                        y={py - 9}
                        fontSize="6.5"
                        fill="#ffffff"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {cfg.shortLabel}
                      </text>

                      {/* Cota de Altura (sobre NPT) */}
                      <text
                        x={px + 6}
                        y={groundY - (ptElevMm * scaleY) / 2}
                        fontSize="6"
                        fill={cfg.colorHex}
                        fontWeight="bold"
                      >
                        +{ptElevMm}
                      </text>

                      {/* Cota Horizontal desde esquina izquierda */}
                      <g stroke="#2563eb" strokeWidth="0.6">
                        <line x1={marginL} y1={groundY + 12} x2={px} y2={groundY + 12} />
                        <line x1={marginL} y1={groundY + 8} x2={marginL} y2={groundY + 16} />
                        <line x1={px} y1={groundY + 8} x2={px} y2={groundY + 16} />
                        <text
                          x={marginL + (ptOffsetMm * scaleX) / 2}
                          y={groundY + 20}
                          fontSize="6.5"
                          fill="#2563eb"
                          fontWeight="bold"
                          stroke="none"
                          textAnchor="middle"
                        >
                          {Math.round(ptOffsetMm)}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Cota de Longitud Total del Muro */}
                <g stroke="#000000" strokeWidth="0.8">
                  <line x1={marginL} y1={groundY + 28} x2={marginL + drawW} y2={groundY + 28} />
                  <line x1={marginL} y1={groundY + 24} x2={marginL} y2={groundY + 32} />
                  <line x1={marginL + drawW} y1={groundY + 24} x2={marginL + drawW} y2={groundY + 32} />
                  <text
                    x={marginL + drawW / 2}
                    y={groundY + 36}
                    fontSize="7.5"
                    fill="#000000"
                    fontWeight="bold"
                    stroke="none"
                    textAnchor="middle"
                  >
                    {wallLenMm} mm (LONGITUD MURO)
                  </text>
                </g>
              </svg>
            </div>
          );
        })}

        {/* Cuadro de Simbología y Especificaciones Técnicas */}
        <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 bg-white">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">
              Simbología y Convenciones Técnicas MEP
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-600 shrink-0"></span>
                <span><strong>AF:</strong> Agua Fría Ø1/2" HE (h=+550)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
                <span><strong>AC:</strong> Agua Caliente Ø1/2" HE (h=+550)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-600 shrink-0"></span>
                <span><strong>DES:</strong> Desagüe PVC Ø50 (h=+450)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                <span><strong>220V:</strong> Enchufe Cubierta 10/16A (h=+1100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
                <span><strong>PWR:</strong> Fuerza Horno/Placa 16A (h=+350)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-600 shrink-0"></span>
                <span><strong>GAS:</strong> Llave Corte Gas 1/2" (h=+750)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">
              Checklist de Instalación en Obra y Seguridad SEC
            </h4>
            <ul className="text-[10px] text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Distancia mínima entre llave de gas y tomacorrientes: ≥ 500 mm.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Salida de desagüe con campana de goma para sifón en P extensible.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Vacío sanitario de 60 mm en módulos base lavaplatos para tuberías.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Líneas de fuerza para horno y lavavajillas con circuito independiente.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Viñeta Inferior */}
      <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-center text-[10px] text-slate-600">
        <div>
          <span className="font-bold text-slate-900">PROYECTO COCINA MODULAR ARQUIFY</span>
          <span className="mx-2">•</span>
          <span>INGENIERÍA DE DETALLE & INSTALACIONES MEP</span>
        </div>
        <div className="font-bold text-slate-900">
          LÁMINA {pageNum} — IDENT: PL-MEP
        </div>
      </div>
    </div>
  );
};
