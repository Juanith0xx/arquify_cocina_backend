const fs = require('fs');

const kitchenBlueprint = `import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useKitchenStore } from '../store/kitchenStore';
import { Part } from '../utils/manufacturing';
import { generateKitchenPartsList } from '../utils/kitchenManufacturing';
import { optimizeNesting, NestingPart, BoardResult } from '../utils/nesting';

export function KitchenBlueprint() {
  const state = useStore();
  const kState = useKitchenStore();
  
  useEffect(() => {
    if (state.isPrinting) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isPrinting]);

  if (!state.isPrinting) return null;

  const allParts = generateKitchenPartsList(kState.cabinets);
  
  // Agrupar piezas por gabinete y PAGINAR
  const printPages: { cab: any, index: number, parts: Part[], isContinuation: boolean, pageSubIndex: number, totalModPages: number }[] = [];
  
  kState.cabinets.forEach((cab, index) => {
    const cabParts = allParts.filter(p => p.moduleId === cab.id);
    
    // Agrupar piezas únicas
    const uniqueParts: Part[] = [];
    cabParts.forEach(p => {
      const existing = uniqueParts.find(up => up.name === p.name && up.length === p.length && up.width === p.width && up.material === p.material);
      if (existing) {
        existing.qty += p.qty;
      } else {
        uniqueParts.push({ ...p });
      }
    });

    const partsPerPage = 8;
    const totalPages = Math.ceil(uniqueParts.length / partsPerPage);
    
    for (let i = 0; i < totalPages; i++) {
      printPages.push({
        cab,
        index,
        parts: uniqueParts.slice(i * partsPerPage, (i + 1) * partsPerPage),
        isContinuation: i > 0,
        pageSubIndex: i + 1,
        totalModPages: totalPages
      });
    }
  });

  // Nesting (Optimización de corte)
  const nestingParts: NestingPart[] = allParts.map(p => ({
    id: Math.random().toString(),
    width: p.width,
    length: p.length,
    material: p.material,
    name: p.name,
    qty: p.qty,
    rotated: false
  }));

  const boardResults: BoardResult[] = optimizeNesting(nestingParts, 2440, 1830);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto text-black hidden print:block">
      {/* 1. PORTADA */}
      <div className="w-[297mm] h-[210mm] mx-auto p-12 flex flex-col justify-center items-center bg-slate-50 border-b-8 border-orange-500 print:break-after-page">
        <h1 className="text-5xl font-bold uppercase tracking-tighter mb-4 text-slate-900">
          Planos de Fabricación
        </h1>
        <h2 className="text-3xl font-light text-orange-500 mb-12 uppercase tracking-widest">
          Proyecto Cocina Modular
        </h2>
        <div className="flex flex-col gap-4 text-center mb-16">
          <p className="text-xl text-slate-600 font-medium">Cliente: Proyecto MuebleStudio</p>
          <p className="text-lg text-slate-500">Fecha: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-12 w-full max-w-4xl mt-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Especificaciones Globales</h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Espesor Melamina:</span> <span className="font-mono">{state.thickness} cm</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Total Módulos:</span> <span className="font-mono">{kState.cabinets.length}</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Total Piezas:</span> <span className="font-mono">{allParts.reduce((acc, p) => acc + p.qty, 0)}</span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ingeniería & Herrajes</h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Tapacanto Gabinetes:</span> <span className="font-mono">{state.edgeBandingThicknessCabinets.toFixed(1)} mm</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Tapacanto Frentes:</span> <span className="font-mono">{state.edgeBandingThicknessFronts.toFixed(1)} mm</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Ensamblaje:</span> <span className="font-mono uppercase">{state.assemblyType}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. LISTADO DE PIEZAS POR GABINETE */}
      {printPages.map((page, i) => (
        <div key={'page-'+i} className="w-[297mm] h-[210mm] mx-auto p-12 bg-white print:break-after-page relative">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">Gabinete {page.index + 1} <span className="text-orange-500">({page.cab.type})</span></h2>
              {page.totalModPages > 1 && (
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Hoja {page.pageSubIndex} de {page.totalModPages}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Dimensiones Módulo</p>
              <p className="font-mono text-lg font-bold">{page.cab.width} x {page.cab.height} x {page.cab.depth} cm</p>
            </div>
          </div>

          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
                <th className="p-3 border-b-2 border-slate-300">Pieza</th>
                <th className="p-3 border-b-2 border-slate-300 text-center">Cant.</th>
                <th className="p-3 border-b-2 border-slate-300">Dimensiones (mm)</th>
                <th className="p-3 border-b-2 border-slate-300 text-center">Espesor</th>
                <th className="p-3 border-b-2 border-slate-300">Tapacantos (L1, L2, W1, W2)</th>
              </tr>
            </thead>
            <tbody>
              {page.parts.map((part, j) => (
                <tr key={j} className="border-b border-slate-200 even:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-800">{part.name}</td>
                  <td className="p-3 text-center font-mono font-bold">{part.qty}</td>
                  <td className="p-3 font-mono">
                    <span className="text-slate-900 font-bold">{part.length.toFixed(1)}</span>
                    <span className="text-slate-400 mx-1">x</span>
                    <span className="text-slate-900 font-bold">{part.width.toFixed(1)}</span>
                  </td>
                  <td className="p-3 text-center font-mono">{part.thickness.toFixed(1)}</td>
                  <td className="p-3 text-xs text-slate-500">
                    <div className="flex gap-2">
                      <span className={part.edgeL1 ? "text-orange-600 font-bold" : "text-slate-300"}>L1</span>
                      <span className={part.edgeL2 ? "text-orange-600 font-bold" : "text-slate-300"}>L2</span>
                      <span className={part.edgeW1 ? "text-orange-600 font-bold" : "text-slate-300"}>W1</span>
                      <span className={part.edgeW2 ? "text-orange-600 font-bold" : "text-slate-300"}>W2</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="absolute bottom-12 left-12 right-12 flex justify-between text-xs text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4">
            <span>MuebleStudio Kitchen Builder</span>
            <span>Página {i + 2}</span>
          </div>
        </div>
      ))}

      {/* 3. OPTIMIZACIÓN DE CORTES (NESTING) */}
      {boardResults.map((board, bIndex) => (
        <div key={'board-'+bIndex} className="w-[297mm] h-[210mm] mx-auto p-12 bg-white print:break-after-page relative flex flex-col">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6 shrink-0">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">Esquema de Corte <span className="text-orange-500">#{bIndex + 1}</span></h2>
              <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Material: {board.material}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Rendimiento</p>
              <p className="font-mono text-lg font-bold text-emerald-600">{(board.efficiency * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-100 border-2 border-slate-300 rounded-lg relative overflow-hidden shrink-0" style={{ height: '500px' }}>
            {board.placedParts.map((bp, pi) => {
              const scaleX = 100 / board.width;
              const scaleY = 100 / board.length;
              return (
                <div 
                  key={pi}
                  className="absolute border border-slate-800 bg-white shadow-sm flex items-center justify-center overflow-hidden"
                  style={{
                    left: \`\${bp.x * scaleX}%\`,
                    top: \`\${bp.y * scaleY}%\`,
                    width: \`\${bp.w * scaleX}%\`,
                    height: \`\${bp.h * scaleY}%\`,
                  }}
                >
                  <span className="text-[8px] font-mono font-bold text-slate-700 text-center leading-tight">
                    {bp.part.name}<br/>
                    <span className="text-orange-600">{bp.w}x{bp.h}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-8 text-sm shrink-0">
            <p><span className="text-slate-500 uppercase tracking-widest mr-2">Formato Placa:</span> <span className="font-mono font-bold">2440 x 1830 mm</span></p>
            <p><span className="text-slate-500 uppercase tracking-widest mr-2">Espesor Hoja Sierra:</span> <span className="font-mono font-bold">3.2 mm</span></p>
          </div>

          <div className="absolute bottom-12 left-12 right-12 flex justify-between text-xs text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4">
            <span>MuebleStudio Nesting Engine</span>
            <span>Página {printPages.length + bIndex + 2}</span>
          </div>
        </div>
      ))}
      
      {/* 4. HERRAJES E INSUMOS */}
      <div className="w-[297mm] h-[210mm] mx-auto p-12 bg-white relative">
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">Listado de <span className="text-orange-500">Herrajes e Insumos</span></h2>
          </div>
        </div>
        <table className="w-full text-left text-sm border-collapse max-w-2xl">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
              <th className="p-3 border-b-2 border-slate-300">Ítem / Componente</th>
              <th className="p-3 border-b-2 border-slate-300 text-center">Cantidad</th>
              <th className="p-3 border-b-2 border-slate-300 text-center">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {generateKitchenHardwareList(kState.cabinets).map((hw, idx) => (
              <tr key={idx} className="border-b border-slate-200 even:bg-slate-50/50">
                <td className="p-3 font-medium text-slate-800">{hw.Item}</td>
                <td className="p-3 text-center font-mono font-bold">{hw.Cantidad}</td>
                <td className="p-3 text-center text-slate-500">{hw.Unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="absolute bottom-12 left-12 right-12 flex justify-between text-xs text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4">
          <span>MuebleStudio BOM Generator</span>
          <span>Página {printPages.length + boardResults.length + 2}</span>
        </div>
      </div>

    </div>
  );
}
`;

fs.writeFileSync('src/components/KitchenBlueprint.tsx', kitchenBlueprint);

console.log("KitchenBlueprint component created.");
