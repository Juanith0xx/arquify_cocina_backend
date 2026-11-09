#!/bin/bash
cat << 'INNER_EOF' > src/components/Blueprint.tsx
import React, { useEffect } from 'react';
import { useStore, ClosetModule } from '../store';
import { generatePartsList, Part } from '../utils/manufacturing';

const A3_WIDTH = 420;
const A3_HEIGHT = 297;

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
  
  // Agrupar piezas por módulo
  const modulePages = state.modules.map((mod, index) => {
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

    return { mod, index, parts: uniqueParts };
  });

  const totalPages = modulePages.length;

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

  const renderDrillingDetails = (part: Part, mod: ClosetModule) => {
    // Determinar qué perforaciones mostrar según el nombre de la pieza
    const isLateral = part.name.includes("Lateral") && !part.name.includes("Cajón");
    const isPuerta = part.name.includes("Puerta");
    const isFrente = part.name.includes("Frente Cajón");
    const isDrawers = mod.drawers > 0;
    
    if (isLateral) {
      return (
        <>
          {/* Perforaciones Minifix / Tornillo en extremos (50mm del borde y 9mm de la cara) */}
          <div className="absolute top-0 left-0 w-full h-[15px] border-b border-blue-500 border-dashed flex justify-between px-[50px] text-[4px] text-blue-500">
            <span className="mt-1">50mm (Fijación Base/Techo)</span>
            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1"></div>
            <span className="mt-1">50mm</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[15px] border-t border-blue-500 border-dashed flex justify-between px-[50px] text-[4px] text-blue-500">
            <span className="mt-1">50mm (Fijación Base/Techo)</span>
            <div className="w-1 h-1 rounded-full bg-blue-500 -mt-2"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500 -mt-2"></div>
          </div>
          
          {/* Rieles Cajones */}
          {isDrawers && (
            <div className="absolute bottom-10 left-0 w-full h-[37px] border-l-2 border-green-500 border-dashed pl-1 flex flex-col justify-end text-[4px] text-green-700">
              <span>Línea Rieles: 37mm desde borde frontal</span>
            </div>
          )}
          
          {/* Bisagras (Bases) */}
          {mod.doors && (
             <div className="absolute top-[100px] left-0 w-[37px] border-r-2 border-orange-500 border-dashed flex flex-col justify-end items-end pr-1 text-[4px] text-orange-700">
                <span>Base Bisagra: 37mm</span>
             </div>
          )}
        </>
      );
    }
    
    if (isPuerta) {
      return (
        <div className="absolute top-[100px] right-0 w-[22.5px] border-l-2 border-orange-500 border-dashed h-8 flex flex-col justify-center items-start pl-1 text-[4px] text-orange-700">
          <div className="w-4 h-4 rounded-full border border-orange-700 bg-orange-100 flex items-center justify-center -ml-2 mb-1">Ø35</div>
          <span>22.5mm</span>
          <span className="absolute -top-4 right-0 w-[100px] text-right">100mm borde</span>
        </div>
      );
    }
    
    if (part.name.includes("Cajón") && (part.name.includes("Lateral") || part.name.includes("Tr/Fr"))) {
        return (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[15px] border-b border-blue-500 border-dashed flex justify-between px-[15px] text-[4px] text-blue-500">
              <span className="-mt-3">15mm Armado Cajón</span>
              <div className="w-1 h-1 rounded-full bg-blue-500 -mt-1"></div>
              <div className="w-1 h-1 rounded-full bg-blue-500 -mt-1"></div>
            </div>
        )
    }

    return null;
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

      {modulePages.map((page, pIdx) => (
        <div key={pIdx} className="blueprint-page border border-black/10 flex flex-col">
          
          <div className="flex-1 p-8 grid grid-cols-12 gap-6 h-full pb-32">
            
            {/* IZQUIERDA: Vistas del Módulo (4 columnas) */}
            <div className="col-span-4 border-r-2 border-black/20 pr-6 flex flex-col gap-6">
               <div className="text-xl font-bold uppercase border-b-2 border-black pb-2 mb-2">
                 Módulo {page.index + 1}
               </div>
               
               <div className="flex justify-between text-sm mb-4">
                 <div>Ancho: {page.mod.width.toFixed(1)} cm</div>
                 <div>Alto: {state.height.toFixed(1)} cm</div>
                 <div>Fondo: {state.depth.toFixed(1)} cm</div>
               </div>

               {/* PLANTA */}
               <div className="flex flex-col items-center flex-1 justify-center relative">
                  <div className="text-xs font-bold mb-2 absolute top-0 left-0">VISTA PLANTA</div>
                  <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: page.mod.width * 2.5 + 'px', height: state.depth * 2.5 + 'px' }}>
                     <div className="absolute -top-5 w-full text-center text-[10px]">{page.mod.width.toFixed(1)}</div>
                     <div className="absolute -right-8 h-full flex items-center text-[10px]"><span className="-rotate-90">{state.depth.toFixed(1)}</span></div>
                     <svg className="absolute inset-0 w-full h-full"><line x1="0" y1="0" x2="100%" y2="100%" stroke="#1e3a8a" strokeWidth="0.5"/><line x1="0" y1="100%" x2="100%" y2="0" stroke="#1e3a8a" strokeWidth="0.5"/></svg>
                  </div>
               </div>

               <div className="flex gap-4 flex-1 items-end justify-center">
                   {/* ELEVACIÓN FRONTAL */}
                   <div className="flex flex-col items-center relative">
                      <div className="text-xs font-bold mb-2 absolute -top-6 left-0">VISTA FRONTAL</div>
                      <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: page.mod.width * 2 + 'px', height: state.height * 2 + 'px' }}>
                          <div className="absolute -top-5 w-full text-center text-[10px]">{page.mod.width.toFixed(1)}</div>
                          <div className="absolute -left-8 h-full flex items-center text-[10px]"><span className="-rotate-90">{state.height.toFixed(1)}</span></div>
                          
                          {/* Elementos interiores */}
                          {page.mod.drawers > 0 && <div className="absolute bottom-0 w-full border-t-2 border-blue-900 bg-blue-100/50" style={{height: (page.mod.drawers * 27)*2 + 'px'}} />}
                          {page.mod.doors && <div className="absolute top-0 w-full h-full border-2 border-fuchsia-600 flex items-center justify-center opacity-50 bg-fuchsia-50/20"><svg className="absolute inset-0 w-full h-full"><line x1="0" y1="50%" x2="100%" y2="100%" stroke="#c026d3" strokeWidth="1"/><line x1="0" y1="50%" x2="100%" y2="0" stroke="#c026d3" strokeWidth="1"/></svg></div>}
                          {page.mod.shelves > 0 && Array.from({length: page.mod.shelves}).map((_, i) => (
                             <div key={i} className="absolute w-full h-[2px] bg-blue-900/50" style={{ top: `${(i+1) * (100/(page.mod.shelves+1))}%`}}></div>
                          ))}
                      </div>
                   </div>

                   {/* CORTE LATERAL */}
                   <div className="flex flex-col items-center relative">
                      <div className="text-xs font-bold mb-2 absolute -top-6 left-0">VISTA LATERAL</div>
                      <div className="relative border-2 border-blue-900 bg-blue-50/30" style={{ width: state.depth * 2 + 'px', height: state.height * 2 + 'px' }}>
                          <div className="absolute -top-5 w-full text-center text-[10px]">{state.depth.toFixed(1)}</div>
                          <div className="absolute -right-8 h-full flex items-center text-[10px]"><span className="-rotate-90">{state.height.toFixed(1)}</span></div>
                          <div className="absolute left-0 top-0 h-full w-[2px] bg-red-500"></div>
                          {page.mod.doors && <div className="absolute right-0 top-0 h-full w-[4px] bg-amber-700/50"></div>}
                          {page.mod.drawers > 0 && <div className="absolute right-0 bottom-0 h-[108px] w-[4px] bg-amber-700/50"></div>}
                      </div>
                   </div>
               </div>

            </div>

            {/* DERECHA: Despiece y Detalles (8 columnas) */}
            <div className="col-span-8 flex flex-col">
                <div className="text-sm font-bold bg-slate-100 p-2 border-b-2 border-black mb-4 flex justify-between">
                   <span>DESPIECE DEL MÓDULO (MEDIDAS EXACTAS DE CORTE)</span>
                   <span className="text-red-600 flex gap-4">
                      <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500"></div> Tapacanto Largo</span>
                      <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-300"></div> Tapacanto Ancho</span>
                   </span>
                </div>
                
                <div className="grid grid-cols-4 gap-x-6 gap-y-10 overflow-y-auto pr-2 pb-10">
                  {page.parts.map((part, pIdx) => {
                     const maxDim = Math.max(part.length, part.width);
                     const scale = 140 / maxDim; // Max 140px
                     const drawW = Math.max(part.width * scale, 20); // Min width to be visible
                     const drawH = Math.max(part.length * scale, 20);

                     return (
                      <div key={pIdx} className="flex flex-col items-center relative group">
                        <div className="text-[9px] text-black font-bold mb-1 uppercase tracking-wider text-center w-full truncate" title={part.name}>{part.name}</div>
                        <div className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold mb-2">{part.qty} UN</div>
                        <div className="text-[7px] text-slate-700 mb-2">{part.material} {part.thickness}mm</div>
                        
                        <div className="relative mt-2" style={{ width: drawW, height: drawH }}>
                          {/* Caja del tablero */}
                          <div className="absolute inset-0 bg-[#f8f5eb] border border-zinc-500 shadow-sm"></div>
                          
                          {/* Cantos */}
                          {part.edgeL1 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" title="Canto Largo 1"></div>}
                          {part.edgeL2 && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500" title="Canto Largo 2"></div>}
                          {part.edgeW1 && <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-300" title="Canto Ancho 1"></div>}
                          {part.edgeW2 && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-300" title="Canto Ancho 2"></div>}
                          
                          {/* Dimensiones */}
                          <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-[8px] -rotate-90 font-bold bg-white/80 px-1">{part.length.toFixed(1)}</div>
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-white/80 px-1">{part.width.toFixed(1)}</div>

                          {/* Cotas de Perforación dinámicas */}
                          {renderDrillingDetails(part, page.mod)}
                        </div>

                      </div>
                     );
                  })}
                </div>
            </div>

          </div>
          
          <TitleBlock pageNum={pIdx + 1} title={`PLANOS DE FABRICACIÓN: MÓDULO ${page.index + 1}`} />
        </div>
      ))}
    </div>
  );
}
INNER_EOF
