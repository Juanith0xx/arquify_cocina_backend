#!/bin/bash
cat << 'INNER_EOF' > src/components/Blueprint.tsx
import React, { useEffect } from 'react';
import { useStore, ClosetModule } from '../store';
import { generatePartsList, Part } from '../utils/manufacturing';

export function Blueprint() {
  const state = useStore();
  
  useEffect(() => {
    if (state.isPrinting) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isPrinting]);

  if (!state.isPrinting) return null;

  const allParts = generatePartsList(state);
  
  // Agrupar piezas por módulo y PAGINAR (máximo 8 piezas por hoja para no rebasar el A3)
  const printPages: { mod: ClosetModule, index: number, parts: Part[], isContinuation: boolean, pageSubIndex: number, totalModPages: number }[] = [];
  
  state.modules.forEach((mod, index) => {
    const modParts = allParts.filter(p => p.moduleId === mod.id);
    
    // Agrupar piezas únicas dentro del módulo
    const uniqueParts: Part[] = [];
    modParts.forEach(p => {
      const existing = uniqueParts.find(up => up.name === p.name && up.length === p.length && up.width === p.width && up.material === p.material);
      if (existing) {
        existing.qty += p.qty;
      } else {
        uniqueParts.push({ ...p });
      }
    });

    const PARTS_PER_PAGE = 8;
    const totalModPages = Math.ceil(uniqueParts.length / PARTS_PER_PAGE);
    
    for (let i = 0; i < uniqueParts.length; i += PARTS_PER_PAGE) {
      printPages.push({
        mod,
        index,
        parts: uniqueParts.slice(i, i + PARTS_PER_PAGE),
        isContinuation: i > 0,
        pageSubIndex: Math.floor(i / PARTS_PER_PAGE) + 1,
        totalModPages
      });
    }
  });

  const totalPages = printPages.length;

  const TitleBlock = ({ pageNum, title }: { pageNum: number, title: string }) => (
    <div className="absolute bottom-4 left-4 right-4 h-24 border-2 border-black flex text-[10px] bg-white z-10">
      <div className="w-1/4 border-r border-black p-2 flex flex-col justify-center">
        <div className="font-bold text-lg mb-1">{title}</div>
        <div>CLIENTE: PROYECTO WEB</div>
        <div>FECHA: {new Date().toLocaleDateString()}</div>
      </div>
      <div className="w-2/4 border-r border-black p-2 flex flex-col justify-center text-xs space-y-1">
        <div><span className="font-bold">Estructura:</span> {state.thickness}mm Laminado {state.color}</div>
        <div><span className="font-bold">Trasera:</span> 3mm {state.backColor}</div>
        <div><span className="font-bold">Tapacantos:</span> PVC 2mm en frentes, 0.45mm resto.</div>
        <div><span className="font-bold">Herrajes:</span> {state.assemblyType === 'minifix' ? 'Minifix + Tarugo' : 'Soberbio / Spax'}, Bisagras Cierre Suave, Correderas {state.drawerHardware}.</div>
      </div>
      <div className="w-1/4 p-2 flex flex-col items-end justify-between">
        <div className="text-right">
          <div className="font-bold text-sm">FORMATO: A3</div>
          <div className="font-bold">HOJA {pageNum} DE {totalPages}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg"><span className="text-slate-800">Mueble</span><span className="text-orange-600">Studio</span></span>
        </div>
      </div>
    </div>
  );

  const renderDrillingDetailsSVG = (part: Part, mod: ClosetModule, drawW: number, drawH: number, scale: number) => {
    const isLateral = part.name.includes("Lateral") && !part.name.includes("Cajón");
    const isPuerta = part.name.includes("Puerta");
    const isDrawers = mod.drawers > 0;
    const isBaseOrTecho = part.name.includes("Techo") || part.name.includes("Base") || part.name.includes("Repisa");
    const isCajonStruct = part.name.includes("Cajón") && (part.name.includes("Lateral") || part.name.includes("Tr/Fr"));

    const elements = [];

    if (isLateral || isBaseOrTecho) {
        const fixLeft = 50 * scale;
        const fixRight = drawW - (50 * scale);
        const margin = 9 * scale;
        const safeTextOffsetLeft = Math.max(-10, fixLeft/2);
        const safeTextOffsetRight = Math.min(drawW + 10, fixRight + (drawW - fixRight)/2);

        if (!isBaseOrTecho) {
            elements.push(
                <circle key="f1" cx={fixLeft} cy={margin} r={2} fill="#3b82f6" />,
                <circle key="f2" cx={fixRight} cy={margin} r={2} fill="#3b82f6" />,
                <line key="fl1" x1="0" y1={-8} x2={fixLeft} y2={-8} stroke="#3b82f6" strokeWidth="0.5" />,
                <line key="fl2" x1={fixLeft} y1={-11} x2={fixLeft} y2={margin} stroke="#3b82f6" strokeWidth="0.5" />,
                <text key="ft1" x={safeTextOffsetLeft} y={-10} fontSize="7" fill="#3b82f6" textAnchor="middle">50</text>
            );
        }

        if (!isBaseOrTecho) {
            elements.push(
                <circle key="f3" cx={fixLeft} cy={drawH - margin} r={2} fill="#3b82f6" />,
                <circle key="f4" cx={fixRight} cy={drawH - margin} r={2} fill="#3b82f6" />,
                <line key="fl3" x1="0" y1={drawH + 8} x2={fixLeft} y2={drawH + 8} stroke="#3b82f6" strokeWidth="0.5" />,
                <line key="fl4" x1={fixLeft} y1={drawH + 11} x2={fixLeft} y2={drawH - margin} stroke="#3b82f6" strokeWidth="0.5" />,
                <text key="ft2" x={safeTextOffsetLeft} y={drawH + 15} fontSize="7" fill="#3b82f6" textAnchor="middle">50</text>
            );
        }
    }

    if (isLateral) {
        if (isDrawers) {
            const railX = 37 * scale;
            elements.push(
                <line key="r1" x1={railX} y1="0" x2={railX} y2={drawH} stroke="#16a34a" strokeWidth="0.8" strokeDasharray="3,3" />,
                <text key="rt1" x={railX - 4} y={drawH / 2} fontSize="7" fill="#16a34a" transform={`rotate(-90 ${railX - 4} ${drawH / 2})`} textAnchor="middle">Eje 37mm</text>
            );
        }

        if (mod.doors) {
            const topHoleY = 100 * scale;
            const bottomHoleY = drawH - (100 * scale);
            const hingeX = 37 * scale;

            elements.push(
                <line key="h1" x1={hingeX} y1="0" x2={hingeX} y2={drawH} stroke="#ea580c" strokeWidth="0.8" strokeDasharray="3,3" />,
                <circle key="hc1" cx={hingeX} cy={topHoleY} r={2} fill="#ea580c" />,
                <circle key="hc2" cx={hingeX} cy={bottomHoleY} r={2} fill="#ea580c" />,
                <text key="ht1" x={hingeX + 4} y={topHoleY + 3} fontSize="7" fill="#ea580c">Base</text>,
                <text key="ht2" x={hingeX + 4} y={bottomHoleY + 3} fontSize="7" fill="#ea580c">Base</text>
            );
        }
    }

    if (isPuerta) {
        const topHoleY = 100 * scale;
        const bottomHoleY = drawH - (100 * scale);
        const holeXLeft = 22.5 * scale;
        
        elements.push(
            <line key="pl1" x1={holeXLeft} y1="0" x2={holeXLeft} y2={drawH} stroke="#ea580c" strokeWidth="0.8" strokeDasharray="3,3" />,
            <circle key="pc1" cx={holeXLeft} cy={topHoleY} r={17.5 * scale} fill="none" stroke="#ea580c" strokeWidth="0.8" strokeDasharray="2,2" />,
            <circle key="pc2" cx={holeXLeft} cy={topHoleY} r={2} fill="#ea580c" />,
            <circle key="pc3" cx={holeXLeft} cy={bottomHoleY} r={17.5 * scale} fill="none" stroke="#ea580c" strokeWidth="0.8" strokeDasharray="2,2" />,
            <circle key="pc4" cx={holeXLeft} cy={bottomHoleY} r={2} fill="#ea580c" />,
            <text key="pt1" x={holeXLeft + 8} y={topHoleY + 2} fontSize="7" fill="#ea580c">Ø35</text>,
            <text key="pt2" x={holeXLeft + 8} y={bottomHoleY + 2} fontSize="7" fill="#ea580c">Ø35</text>,

            <line key="pd1" x1={-12} y1="0" x2="0" y2="0" stroke="#ea580c" strokeWidth="0.5" />,
            <line key="pd2" x1={-12} y1={topHoleY} x2={holeXLeft} y2={topHoleY} stroke="#ea580c" strokeWidth="0.5" />,
            <line key="pd3" x1={-9} y1="0" x2={-9} y2={topHoleY} stroke="#ea580c" strokeWidth="0.5" />,
            <text key="pt3" x={-14} y={topHoleY/2} fontSize="7" fill="#ea580c" transform={`rotate(-90 -14 ${topHoleY/2})`} textAnchor="middle">100</text>,

            <line key="pd4" x1="0" y1={topHoleY - 18} x2="0" y2={topHoleY} stroke="#ea580c" strokeWidth="0.5" />,
            <line key="pd5" x1={holeXLeft} y1={topHoleY - 18} x2={holeXLeft} y2={topHoleY} stroke="#ea580c" strokeWidth="0.5" />,
            <line key="pd6" x1="0" y1={topHoleY - 15} x2={holeXLeft} y2={topHoleY - 15} stroke="#ea580c" strokeWidth="0.5" />,
            <text key="pt4" x={holeXLeft/2} y={topHoleY - 20} fontSize="7" fill="#ea580c" textAnchor="middle">22.5</text>
        );
    }

    if (isCajonStruct) {
        const edgeOffset = 15 * scale;
        elements.push(
            <line key="cl1" x1={edgeOffset} y1="0" x2={edgeOffset} y2={drawH} stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="2,2" />,
            <line key="cl2" x1={drawW - edgeOffset} y1="0" x2={drawW - edgeOffset} y2={drawH} stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="2,2" />,
            <text key="ct1" x={edgeOffset + 4} y={drawH/2} fontSize="7" fill="#3b82f6" transform={`rotate(-90 ${edgeOffset + 4} ${drawH/2})`} textAnchor="middle">15</text>,
            <text key="ct2" x={drawW - edgeOffset + 4} y={drawH/2} fontSize="7" fill="#3b82f6" transform={`rotate(-90 ${drawW - edgeOffset + 4} ${drawH/2})`} textAnchor="middle">15</text>
        );
    }

    return (
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20">
            {elements}
        </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white text-black overflow-y-auto print-only-container">
      <button 
        onClick={() => state.setIsPrinting(false)}
        className="fixed top-6 right-6 z-[200] bg-red-600 text-white px-6 py-3 rounded-lg font-bold uppercase text-xs tracking-widest print:hidden shadow-xl hover:bg-red-700 hover:scale-105 transition-all"
      >
        Cerrar Vista de Impresión
      </button>

      <style>{`
        @media screen { 
           .print-only-container { display: flex; flex-direction: column; background: #525252; padding: 2rem; align-items: center; gap: 2rem; } 
           .blueprint-page { background: white; width: 420mm; height: 297mm; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        }
        @media print {
          body * { visibility: hidden; }
          .print-only-container, .print-only-container * { visibility: visible; }
          .print-only-container { position: absolute; left: 0; top: 0; width: 100%; height: auto; display: block; background: white !important; }
          .blueprint-page { width: 100%; height: 100vh; position: relative; page-break-after: always; overflow: hidden; }
          @page { size: A3 landscape; margin: 0; }
        }
      `}</style>

      {printPages.map((page, pIdx) => {
        // Encontrar el tamaño máximo de la pieza en EL MÓDULO ENTERO para mantener consistencia de escala
        const allModuleParts = allParts.filter(p => p.moduleId === page.mod.id);
        const maxDimInModule = Math.max(...allModuleParts.map(p => Math.max(p.length, p.width)));
        
        // Escala segura (máximo 210px) para las piezas
        const scale = 210 / maxDimInModule;

        // Escala dinámica para vistas arquitectónicas
        const totalW = page.mod.width + state.depth;
        const totalH = state.depth + state.height;
        const viewScaleWidth = 320 / totalW;
        const viewScaleHeight = 520 / totalH;
        const viewScale = Math.min(viewScaleWidth, viewScaleHeight, 3.0);

        return (
            <div key={pIdx} className="blueprint-page border border-black/10 flex flex-col">
              
              <div className="flex-1 p-8 grid grid-cols-12 gap-8 h-full pb-32">
                
                {/* IZQUIERDA: Vistas del Módulo */}
                <div className="col-span-4 border-r-2 border-black/20 pr-6 flex flex-col items-center">
                   <div className="text-xl font-bold uppercase border-b-2 border-black w-full text-left pb-2 mb-2">
                     Módulo {page.index + 1}
                   </div>
                   
                   <div className="flex justify-between w-full text-[11px] mb-8">
                     <div>Ancho: {page.mod.width.toFixed(1)} cm</div>
                     <div>Alto: {state.height.toFixed(1)} cm</div>
                     <div>Fondo: {state.depth.toFixed(1)} cm</div>
                   </div>

                   {/* PLANTA */}
                   <div className="flex flex-col items-center w-full mb-12 relative z-10">
                      <div className="text-[11px] font-bold mb-5 tracking-widest">VISTA PLANTA</div>
                      <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: page.mod.width * viewScale + 'px', height: state.depth * viewScale + 'px' }}>
                         <div className="absolute -top-6 w-full text-center text-[10px] font-bold">{page.mod.width.toFixed(1)}</div>
                         <div className="absolute -right-10 h-full flex items-center text-[10px] font-bold"><span className="-rotate-90">{state.depth.toFixed(1)}</span></div>
                         <svg className="absolute inset-0 w-full h-full"><line x1="0" y1="0" x2="100%" y2="100%" stroke="#1e3a8a" strokeWidth="0.5"/><line x1="0" y1="100%" x2="100%" y2="0" stroke="#1e3a8a" strokeWidth="0.5"/></svg>
                      </div>
                   </div>

                   {/* ELEVACIONES */}
                   <div className="flex gap-16 w-full justify-center items-end relative z-10">
                       <div className="flex flex-col items-center">
                          <div className="text-[11px] font-bold mb-5 tracking-widest">VISTA FRONTAL</div>
                          <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: page.mod.width * viewScale + 'px', height: state.height * viewScale + 'px' }}>
                              <div className="absolute -top-6 w-full text-center text-[10px] font-bold">{page.mod.width.toFixed(1)}</div>
                              <div className="absolute -left-10 h-full flex items-center text-[10px] font-bold"><span className="-rotate-90">{state.height.toFixed(1)}</span></div>
                              
                              {page.mod.drawers > 0 && <div className="absolute bottom-0 w-full border-t-2 border-blue-900 bg-blue-100/50" style={{height: (page.mod.drawers * 27) * viewScale + 'px'}} />}
                              {page.mod.doors && <div className="absolute top-0 w-full h-full border-2 border-fuchsia-600 flex items-center justify-center opacity-50 bg-fuchsia-50/20"><svg className="absolute inset-0 w-full h-full"><line x1="0" y1="50%" x2="100%" y2="100%" stroke="#c026d3" strokeWidth="1"/><line x1="0" y1="50%" x2="100%" y2="0" stroke="#c026d3" strokeWidth="1"/></svg></div>}
                              {page.mod.shelves > 0 && Array.from({length: page.mod.shelves}).map((_, i) => (
                                 <div key={i} className="absolute w-full h-[2px] bg-blue-900/50" style={{ top: `${(i+1) * (100/(page.mod.shelves+1))}%`}}></div>
                              ))}
                          </div>
                       </div>

                       <div className="flex flex-col items-center">
                          <div className="text-[11px] font-bold mb-5 tracking-widest">VISTA LATERAL</div>
                          <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: state.depth * viewScale + 'px', height: state.height * viewScale + 'px' }}>
                              <div className="absolute -top-6 w-full text-center text-[10px] font-bold">{state.depth.toFixed(1)}</div>
                              <div className="absolute -right-10 h-full flex items-center text-[10px] font-bold"><span className="-rotate-90">{state.height.toFixed(1)}</span></div>
                              <div className="absolute left-0 top-0 h-full w-[3px] bg-red-500"></div>
                              {page.mod.doors && <div className="absolute right-0 top-0 h-full w-[5px] bg-amber-700/50"></div>}
                              {page.mod.drawers > 0 && <div className="absolute right-0 bottom-0 w-[5px] bg-amber-700/50" style={{ height: (page.mod.drawers * 27) * viewScale + 'px' }}></div>}
                          </div>
                       </div>
                   </div>

                </div>

                {/* DERECHA: Despiece y Detalles */}
                <div className="col-span-8 flex flex-col">
                    <div className="text-base font-bold bg-slate-100 p-3 border-b-2 border-black mb-8 flex justify-between items-center">
                       <span>DESPIECE DEL MÓDULO (A ESCALA PROPORCIONAL)</span>
                       <span className="text-sm flex gap-6 items-center">
                          <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rotate-45 bg-red-500 shadow-sm border border-white"></div> Tapacanto Largo</span>
                          <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rotate-45 bg-blue-500 shadow-sm border border-white"></div> Tapacanto Ancho</span>
                       </span>
                    </div>
                    
                    {/* Grid ajustado: items-start y gap mayor */}
                    <div className="grid grid-cols-4 gap-x-12 gap-y-16 pr-2 items-end pb-8">
                      {page.parts.map((part, pIdx) => {
                         // Evitar que las piezas muy pequeñas desaparezcan o aplasten los SVG
                         const drawW = Math.max(part.width * scale, 18);
                         const drawH = Math.max(part.length * scale, 18);

                         return (
                          <div key={pIdx} className="flex flex-col items-center relative pb-8">
                            
                            <div className="flex flex-col items-center mb-6 h-16 justify-end">
                                <div className="text-[11px] text-black font-bold mb-1 uppercase tracking-wider text-center" title={part.name}>{part.name}</div>
                                <div className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold mb-1">{part.qty} UN</div>
                                <div className="text-[9px] text-slate-700">{part.material} {part.thickness}mm</div>
                            </div>
                            
                            <div className="relative z-10" style={{ width: drawW, height: drawH }}>
                              
                              <div className="absolute inset-0 bg-[#f8f5eb] border-2 border-zinc-600 shadow-sm"></div>
                              
                              {/* Rombos reposicionados hacia dentro si la pieza es muy chica */}
                              {part.edgeL1 && <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 bg-red-500 border-2 border-white shadow-sm z-30" title="Canto Largo 1"></div>}
                              {part.edgeL2 && <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 bg-red-500 border-2 border-white shadow-sm z-30" title="Canto Largo 2"></div>}
                              {part.edgeW1 && <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-blue-500 border-2 border-white shadow-sm z-30" title="Canto Ancho 1"></div>}
                              {part.edgeW2 && <div className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-blue-500 border-2 border-white shadow-sm z-30" title="Canto Ancho 2"></div>}
                              
                              {/* Cotas Exteriores Modificadas */}
                              <div className="absolute -bottom-8 left-0 w-full flex flex-col items-center">
                                 <div className="w-full border-b border-zinc-400 relative">
                                     <div className="absolute -top-1 left-0 h-2 border-l border-zinc-400"></div>
                                     <div className="absolute -top-1 right-0 h-2 border-r border-zinc-400"></div>
                                 </div>
                                 <div className="text-[11px] mt-1 text-zinc-800 font-bold tracking-tight">{part.width.toFixed(1)}</div>
                              </div>

                              <div className="absolute top-0 -right-8 h-full flex items-center">
                                 <div className="h-full border-r border-zinc-400 relative">
                                     <div className="absolute top-0 -left-1 w-2 border-t border-zinc-400"></div>
                                     <div className="absolute bottom-0 -left-1 w-2 border-b border-zinc-400"></div>
                                 </div>
                                 <div className="text-[11px] ml-1.5 -rotate-90 origin-left translate-x-2.5 text-zinc-800 font-bold tracking-tight">{part.length.toFixed(1)}</div>
                              </div>

                              {renderDrillingDetailsSVG(part, page.mod, drawW, drawH, scale)}
                            </div>

                          </div>
                         );
                      })}
                    </div>
                </div>

              </div>
              
              <TitleBlock 
                pageNum={pIdx + 1} 
                title={`PLANOS DE FABRICACIÓN: MÓDULO ${page.index + 1} ${page.totalModPages > 1 ? `(PARTE ${page.pageSubIndex} DE ${page.totalModPages})` : ''}`} 
              />
            </div>
        );
      })}
    </div>
  );
}
INNER_EOF
