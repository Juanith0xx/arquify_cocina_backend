import React, { useMemo } from 'react';
import { useConcreteHouseStore } from '../../store/concreteHouseStore';
import { calculateConcreteHouseBOM } from '../../utils/concreteManufacturing';

export function ConcreteBlueprint() {
  const {
    dimensions,
    wallThicknessMm,
    meshType,
    concreteGrade,
    concreteSlump,
    foundationType,
    slabType,
    rebarSteelQuality,
    meshDiameterMm,
    openings,
    interiorWalls,
    showPergola,
    pergolaWidthCm,
    pergolaLengthCm,
    showBarbecueCounter,
    hasCentralPatio,
    centralPatioOffsetCm,
    centralPatioLengthCm,
    roomBlocks = [],
  } = useConcreteHouseStore();

  const { width: wCm, length: lCm } = dimensions;
  const wallThickCm = wallThicknessMm / 10;

  const metrics = useMemo(
    () =>
      calculateConcreteHouseBOM(
        dimensions,
        wallThicknessMm,
        meshType,
        concreteGrade,
        concreteSlump,
        foundationType,
        slabType,
        rebarSteelQuality,
        meshDiameterMm,
        openings,
        interiorWalls
      ),
    [
      dimensions,
      wallThicknessMm,
      meshType,
      concreteGrade,
      concreteSlump,
      foundationType,
      slabType,
      rebarSteelQuality,
      meshDiameterMm,
      openings,
      interiorWalls,
    ]
  );

  // Dimensiones SVG con márgenes generosos para cotas y pérgola
  const extraRight = showPergola ? pergolaWidthCm + 40 : 0;
  const svgMargin = 140;
  const svgW = wCm + extraRight + svgMargin * 2;
  const svgH = lCm + svgMargin * 2;

  // Centro y origen
  const originX = svgMargin;
  const originY = svgMargin;

  // Ejes estructurales
  const axisOffset = 80;

  return (
    <div className="w-full h-full bg-[#0d131f] text-slate-100 p-6 flex flex-col items-center justify-between overflow-auto select-none">
      {/* Barra superior de información técnica */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-4 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Planta Arquitectónica & Estructuras • Hormigón Armado (NCh430)
          </h2>
          <p className="text-xs text-slate-400">
            Escala 1:50 • Espesor Muros: {wallThicknessMm} mm ({meshType === 'malla_central' ? 'Malla Central' : 'Doble Malla'}) • {concreteGrade.replace('_', ' / ')}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Sup. Cubierta: <span className="font-bold text-orange-400">{metrics.footprintAreaM2.toFixed(1)} m²</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Vol. Hormigón: <span className="font-bold text-sky-400">{metrics.totalConcreteM3.toFixed(1)} m³</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Acero Total: <span className="font-bold text-emerald-400">{metrics.totalSteelKg.toFixed(0)} kg</span>
          </div>
        </div>
      </div>

      {/* Canvas SVG del Plano */}
      <div className="flex-1 w-full max-w-5xl bg-[#0a0e17] border border-slate-800 rounded-2xl p-6 flex items-center justify-center overflow-auto shadow-2xl relative">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto max-h-[70vh] object-contain font-sans"
        >
          <defs>
            {/* Patrón de achurado de hormigón en corte */}
            <pattern id="concreteHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.2" />
            </pattern>
            {/* Patrón de losa/radier */}
            <pattern id="slabDots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="0.8" fill="#334155" />
            </pattern>
            {/* Patrón de pérgola / deck */}
            <pattern id="deckLines" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 3" />
            </pattern>
            {/* Patrón de jardín / patio tender */}
            <pattern id="gardenPattern" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="1.5" fill="#10b981" opacity="0.4" />
            </pattern>
          </defs>

          {/* 1. Ejes Estructurales */}
          {/* Eje A (Izquierda) */}
          <line x1={originX + wallThickCm / 2} y1={originY - axisOffset + 15} x2={originX + wallThickCm / 2} y2={originY + lCm + axisOffset - 15} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3 2 3" />
          <circle cx={originX + wallThickCm / 2} cy={originY - axisOffset} r="12" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
          <text x={originX + wallThickCm / 2} y={originY - axisOffset + 4} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">A</text>

          {/* Eje B (Derecha) */}
          <line x1={originX + wCm - wallThickCm / 2} y1={originY - axisOffset + 15} x2={originX + wCm - wallThickCm / 2} y2={originY + lCm + axisOffset - 15} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3 2 3" />
          <circle cx={originX + wCm - wallThickCm / 2} cy={originY - axisOffset} r="12" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
          <text x={originX + wCm - wallThickCm / 2} y={originY - axisOffset + 4} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">B</text>

          {/* Eje 1 (Fondo) */}
          <line x1={originX - axisOffset + 15} y1={originY + wallThickCm / 2} x2={originX + wCm + axisOffset - 15} y2={originY + wallThickCm / 2} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3 2 3" />
          <circle cx={originX - axisOffset} cy={originY + wallThickCm / 2} r="12" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
          <text x={originX - axisOffset} y={originY + wallThickCm / 2 + 4} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">1</text>

          {/* Eje 2 (Frente) */}
          <line x1={originX - axisOffset + 15} y1={originY + lCm - wallThickCm / 2} x2={originX + wCm + axisOffset - 15} y2={originY + lCm - wallThickCm / 2} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3 2 3" />
          <circle cx={originX - axisOffset} cy={originY + lCm - wallThickCm / 2} r="12" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
          <text x={originX - axisOffset} y={originY + lCm - wallThickCm / 2 + 4} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">2</text>

          {/* 2. Pérgola Exterior & Terraza (si está activa) */}
          {showPergola && (
            <g>
              <rect
                x={originX + wCm}
                y={originY + 100}
                width={pergolaWidthCm}
                height={pergolaLengthCm}
                fill="url(#deckLines)"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              {/* Columnas metálicas */}
              <rect x={originX + wCm + pergolaWidthCm - 12} y={originY + 100} width="12" height="12" fill="#38bdf8" />
              <rect x={originX + wCm + pergolaWidthCm - 12} y={originY + 100 + pergolaLengthCm / 2 - 6} width="12" height="12" fill="#38bdf8" />
              <rect x={originX + wCm + pergolaWidthCm - 12} y={originY + 100 + pergolaLengthCm - 12} width="12" height="12" fill="#38bdf8" />

              {/* Texto de Pérgola */}
              <text
                x={originX + wCm + pergolaWidthCm / 2}
                y={originY + 100 + pergolaLengthCm / 2 - 20}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
              >
                PÉRGOLA & QUINCHO
              </text>
              <text
                x={originX + wCm + pergolaWidthCm / 2}
                y={originY + 100 + pergolaLengthCm / 2}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                Estructura Metálica + Sombrado Madera
              </text>

              {/* Asador de hormigón */}
              {showBarbecueCounter && (
                <g transform={`translate(${originX + wCm + pergolaWidthCm - 70}, ${originY + 100 + pergolaLengthCm - 160})`}>
                  <rect x="0" y="0" width="60" height="140" fill="#1e293b" stroke="#f97316" strokeWidth="1.5" />
                  <text x="30" y="75" textAnchor="middle" fill="#f97316" fontSize="9" fontWeight="bold" transform="rotate(-90 30 75)">
                    ASADOR H.A.
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 3. Losa / Radier Interior */}
          <rect
            x={originX + wallThickCm}
            y={originY + wallThickCm}
            width={wCm - wallThickCm * 2}
            height={lCm - wallThickCm * 2}
            fill="url(#slabDots)"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Patio Tender Central si está activo */}
          {hasCentralPatio && (
            <g>
              <rect
                x={originX + wallThickCm}
                y={originY + centralPatioOffsetCm}
                width={wCm - wallThickCm * 2}
                height={centralPatioLengthCm}
                fill="url(#gardenPattern)"
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text
                x={originX + wCm / 2}
                y={originY + centralPatioOffsetCm + centralPatioLengthCm / 2 + 4}
                textAnchor="middle"
                fill="#10b981"
                fontSize="11"
                fontWeight="bold"
              >
                PATIO TENDER (CIELO ABIERTO)
              </text>
            </g>
          )}

          {/* Ambientes / Distribución */}
          {roomBlocks && roomBlocks.length > 0 ? (
            <g>
              {roomBlocks.map((rb) => {
                const isOutdoor = rb.category === 'patio' || rb.category === 'terrace';
                return (
                  <g key={rb.id}>
                    <rect
                      x={originX + rb.x}
                      y={originY + rb.z}
                      width={rb.width}
                      height={rb.length}
                      fill={isOutdoor ? 'url(#gardenPattern)' : 'url(#slabDots)'}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    <text
                      x={originX + rb.x + rb.width / 2}
                      y={originY + rb.z + rb.length / 2 - 4}
                      textAnchor="middle"
                      fill={isOutdoor ? '#10b981' : '#f8fafc'}
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {rb.name.toUpperCase()}
                    </text>
                    <text
                      x={originX + rb.x + rb.width / 2}
                      y={originY + rb.z + rb.length / 2 + 10}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8.5"
                    >
                      {( (rb.width * rb.length) / 10000 ).toFixed(1)} m²
                    </text>
                  </g>
                );
              })}
            </g>
          ) : hasCentralPatio ? (
            <g>
              {/* Pabellón 1: Estar - Comedor - Cocina */}
              <text x={originX + wCm / 2} y={originY + 350} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold">
                ESTAR - COMEDOR
              </text>
              <text x={originX + wCm / 2} y={originY + 370} textAnchor="middle" fill="#94a3b8" fontSize="10">
                Piso Hormigón Alisado • N.P.T. ±0.00
              </text>

              <text x={originX + wCm / 2} y={originY + 850} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold">
                COCINA / ISLA
              </text>

              {/* Pabellón 2: Dormitorios & Baños */}
              <text x={originX + wCm / 2} y={originY + 1800} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
                DORMITORIO 1
              </text>
              <text x={originX + wCm / 2} y={originY + 2200} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
                DORMITORIO PRINCIPAL EN SUITE
              </text>
              <text x={originX + wCm / 2} y={originY + 2520} textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                BAÑO PRINCIPAL & VESTIDOR
              </text>
            </g>
          ) : (
            <g transform={`translate(${originX + wCm / 2}, ${originY + lCm / 2})`}>
              <rect x="-85" y="-35" width="170" height="70" rx="8" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1" />
              <text x="0" y="-12" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold">ESPACIO HABITABLE HA</text>
              <text x="0" y="6" textAnchor="middle" fill="#94a3b8" fontSize="10">N.P.T. ±0.00 m</text>
              <text x="0" y="22" textAnchor="middle" fill="#f97316" fontSize="9" fontWeight="bold">
                {meshType === 'malla_central' ? 'Malla Central C-139' : 'Doble Malla AT56-50H'}
              </text>
            </g>
          )}

          {/* 4. Muros Exteriores de Hormigón Armado */}
          {/* Muro Frontal (Sur) */}
          <rect x={originX} y={originY + lCm - wallThickCm} width={wCm} height={wallThickCm} fill="url(#concreteHatch)" stroke="#94a3b8" strokeWidth="2" />
          {/* Muro Trasero (Norte) */}
          <rect x={originX} y={originY} width={wCm} height={wallThickCm} fill="url(#concreteHatch)" stroke="#94a3b8" strokeWidth="2" />
          {/* Muro Izquierdo (Oeste) */}
          <rect x={originX} y={originY} width={wallThickCm} height={lCm} fill="url(#concreteHatch)" stroke="#94a3b8" strokeWidth="2" />
          {/* Muro Derecho (Este) */}
          <rect x={originX + wCm - wallThickCm} y={originY} width={wallThickCm} height={lCm} fill="url(#concreteHatch)" stroke="#94a3b8" strokeWidth="2" />

          {/* Muros Interiores */}
          {interiorWalls.map((iw) => {
            const wThick = (iw.thicknessMm || 150) / 10;
            const minY = originY + wallThickCm;
            const maxY = originY + lCm - wallThickCm - wThick;
            const rawY = originY + iw.startZ - wThick / 2;
            const yPos = Math.max(minY, Math.min(maxY, rawY));
            return (
              <rect
                key={iw.id}
                x={originX + wallThickCm}
                y={yPos}
                width={wCm - wallThickCm * 2}
                height={wThick}
                fill="url(#concreteHatch)"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
            );
          })}

          {/* 5. Dibujo de Vanos */}
          {openings.map((op) => {
            if (op.wall === 'front') {
              const xPos = originX + op.offsetAlongWall;
              const yPos = originY + lCm - wallThickCm;
              return (
                <g key={op.id}>
                  <rect x={xPos} y={yPos - 1} width={op.width} height={wallThickCm + 2} fill="#0a0e17" stroke="#38bdf8" strokeWidth="1.5" />
                  {op.type === 'door' ? (
                    <path
                      d={`M ${xPos} ${yPos} A ${op.width} ${op.width} 0 0 1 ${xPos + op.width} ${yPos - op.width + wallThickCm} L ${xPos} ${yPos}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  ) : (
                    <g>
                      <line x1={xPos} y1={yPos + wallThickCm / 2} x2={xPos + op.width} y2={yPos + wallThickCm / 2} stroke="#38bdf8" strokeWidth="2" />
                      <line x1={xPos} y1={yPos + 2} x2={xPos + op.width} y2={yPos + 2} stroke="#64748b" strokeWidth="1" />
                      <line x1={xPos} y1={yPos + wallThickCm - 2} x2={xPos + op.width} y2={yPos + wallThickCm - 2} stroke="#64748b" strokeWidth="1" />
                    </g>
                  )}
                  <text x={xPos + op.width / 2} y={yPos + wallThickCm + 14} textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    {op.name} ({op.width}x{op.height})
                  </text>
                </g>
              );
            }

            if (op.wall === 'back') {
              const xPos = originX + op.offsetAlongWall;
              const yPos = originY;
              return (
                <g key={op.id}>
                  <rect x={xPos} y={yPos - 1} width={op.width} height={wallThickCm + 2} fill="#0a0e17" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={xPos} y1={yPos + wallThickCm / 2} x2={xPos + op.width} y2={yPos + wallThickCm / 2} stroke="#38bdf8" strokeWidth="2" />
                  <text x={xPos + op.width / 2} y={yPos - 8} textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    {op.name} ({op.width}x{op.height})
                  </text>
                </g>
              );
            }

            if (op.wall === 'left') {
              const xPos = originX;
              const yPos = originY + op.offsetAlongWall;
              return (
                <g key={op.id}>
                  <rect x={xPos - 1} y={yPos} width={wallThickCm + 2} height={op.width} fill="#0a0e17" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={xPos + wallThickCm / 2} y1={yPos} x2={xPos + wallThickCm / 2} y2={yPos + op.width} stroke="#38bdf8" strokeWidth="2" />
                  <text x={xPos - 8} y={yPos + op.width / 2 + 3} textAnchor="end" fill="#38bdf8" fontSize="8" fontWeight="bold">
                    {op.name}
                  </text>
                </g>
              );
            }

            if (op.wall === 'right') {
              const xPos = originX + wCm - wallThickCm;
              const yPos = originY + op.offsetAlongWall;
              return (
                <g key={op.id}>
                  <rect x={xPos - 1} y={yPos} width={wallThickCm + 2} height={op.width} fill="#0a0e17" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={xPos + wallThickCm / 2} y1={yPos} x2={xPos + wallThickCm / 2} y2={yPos + op.width} stroke="#38bdf8" strokeWidth="2" />
                  <text x={xPos + wallThickCm + 8} y={yPos + op.width / 2 + 3} textAnchor="start" fill="#38bdf8" fontSize="8" fontWeight="bold">
                    {op.name}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* 6. Cotas Generales Exteriores */}
          {/* Cota Superior (Ancho Total) */}
          <g transform={`translate(0, ${originY - 35})`}>
            <line x1={originX} y1="0" x2={originX + wCm} y2="0" stroke="#f97316" strokeWidth="1.5" />
            <line x1={originX} y1="-6" x2={originX} y2="6" stroke="#f97316" strokeWidth="1.5" />
            <line x1={originX + wCm} y1="-6" x2={originX + wCm} y2="6" stroke="#f97316" strokeWidth="1.5" />
            <rect x={originX + wCm / 2 - 35} y="-12" width="70" height="18" fill="#0a0e17" />
            <text x={originX + wCm / 2} y="1" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">
              {(wCm / 100).toFixed(2)} m
            </text>
          </g>

          {/* Cota Izquierda (Largo Total) */}
          <g transform={`translate(${originX - 35}, 0)`}>
            <line x1="0" y1={originY} x2="0" y2={originY + lCm} stroke="#f97316" strokeWidth="1.5" />
            <line x1="-6" y1={originY} x2="6" y2={originY} stroke="#f97316" strokeWidth="1.5" />
            <line x1="-6" y1={originY + lCm} x2="6" y2={originY + lCm} stroke="#f97316" strokeWidth="1.5" />
            <rect x="-10" y={originY + lCm / 2 - 15} width="20" height="30" fill="#0a0e17" />
            <text x="0" y={originY + lCm / 2 + 4} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold" transform={`rotate(-90 0 ${originY + lCm / 2})`}>
              {(lCm / 100).toFixed(2)} m
            </text>
          </g>

          {/* 7. Norte y Símbolo de Orientación */}
          <g transform={`translate(${originX + wCm - 30}, ${originY + 40})`}>
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
            <polygon points="0,-14 6,10 0,6 -6,10" fill="#f97316" />
            <text x="0" y="-18" textAnchor="middle" fill="#f97316" fontSize="9" fontWeight="bold">N</text>
          </g>
        </svg>
      </div>

      {/* Cuadro de Rotulación & Leyenda Normativa ICH */}
      <div className="w-full max-w-5xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300">
        <div>
          <span className="font-bold text-white block mb-1">ESPECIFICACIÓN ESTRUCTURAL (NCh430 / DS60)</span>
          <p>Muros perimetrales e={wallThicknessMm}mm con {meshType === 'malla_central' ? 'Malla central AT56-50H' : 'Doble Malla AT56-50H'}. Recubrimiento normativo r={wallThicknessMm <= 100 ? '20mm' : '25mm'}.</p>
        </div>
        <div>
          <span className="font-bold text-white block mb-1">REFUERZOS SÍSMICOS DE VANOS (ICH Lám. 42)</span>
          <p>Dinteles con 2 Ø12 pasados 50cm a cada jamba + 4 barras diagonales Ø10 a 45° en las esquinas de antepecho y dintel para control de fisuración.</p>
        </div>
        <div>
          <span className="font-bold text-white block mb-1">HORMIGONES & CURADO (NCh170:2016)</span>
          <p>{concreteGrade.replace('_', ' / ')} cono {concreteSlump === 'fluido_18cm' ? '≥18 cm (Fluido)' : '10-12 cm'}. Curado húmedo mínimo 7 días continuos.</p>
        </div>
      </div>
    </div>
  );
}
