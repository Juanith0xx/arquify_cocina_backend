import React, { useState } from 'react';
import { Printer, Download, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useStore, ClosetModule } from '../store';
import { generatePartsList, Part, exportToPDF } from '../utils/manufacturing';
import { optimizeNesting, NestingPart, BoardResult } from '../utils/nesting';
import { exportBlueprintDomToPdf } from '../utils/blueprintPdfExport';

export function Blueprint() {
  const state = useStore();
  const [isExportingA3, setIsExportingA3] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  if (!state.isPrinting) return null;

  const handleExportA3 = async () => {
    setIsExportingA3(true);
    setGeneratedPdfUrl(null);
    try {
      const url = await exportBlueprintDomToPdf('planos_closet_completos_A3.pdf', (curr, tot) => {
        setExportProgress({ current: curr, total: tot });
      });
      if (url) {
        setGeneratedPdfUrl(url);
      } else {
        alert('No se pudieron compilar las láminas A3. Puedes usar el botón "Imprimir" (Guardar como PDF) o la "Ficha Técnica PDF".');
      }
    } catch (err) {
      console.error('Error al exportar planos A3 en PDF', err);
      alert('Ocurrió un detalle al generar el archivo. También puedes utilizar el botón "Imprimir / Guardar".');
    } finally {
      setIsExportingA3(false);
      setExportProgress(null);
    }
  };

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

      const mapPartToColor = (part: Part) => {
    if (part.material === 'Melamina Frente') return state.doorColor;
    if (part.material === 'Melamina Frente Cajón') return state.drawerFrontColor;
    if (part.material === 'Melamina Zócalo') return state.socleColor;
    if (part.material === 'Melamina Fondo') return state.backColor;
    return state.structureColor; 
  };

  
  const getColorName = (colorVal: string) => {
    if (colorVal.startsWith('#')) return colorVal;
    const found = state.customTextures?.find((t: any) => t.url === colorVal);
    if (found) return found.name;
    if (colorVal.startsWith('data:')) return 'TEXTURA PERSONALIZADA';
    const parts = colorVal.split('/');
    return parts[parts.length - 1].replace('.jpg', '').replace('.png', '');
  };

    type BoardGroup = { parts: NestingPart[], w: number, h: number, label: string, colorCode: string };
  const partsByBoard: Record<string, BoardGroup> = {};

  const addPartToBoard = (boardKey: string, label: string, colorCode: string, bw: number, bh: number, part: NestingPart) => {
    if (!partsByBoard[boardKey]) {
      partsByBoard[boardKey] = { parts: [], w: bw, h: bh, label, colorCode };
    }
    partsByBoard[boardKey].parts.push(part);
  };

  const hplOversize = 20;

  allParts.forEach((p, index) => {
    const color = mapPartToColor(p);
    let materialType = state.structureMaterial;
    if (p.material === 'Melamina Frente') materialType = state.doorMaterial;
    else if (p.material === 'Melamina Frente Cajón') materialType = state.drawerFrontMaterial;
    else if (p.material === 'Melamina Zócalo') materialType = state.socleMaterial;
    else if (p.material === 'Melamina Fondo') materialType = 'melamina';

    let finalW = p.width;
    let finalL = p.length;
    let allowRotation = true;
    
    // For colored/textured pieces, we default to no rotation to preserve grain.
    // If it's explicitly horizontal, we swap length and width.
    if (p.grainDirection === 'horizontal') {
      finalW = p.length;
      finalL = p.width;
      allowRotation = false;
    } else if (p.grainDirection === 'vertical' || materialType === 'hpl' || color.startsWith('/textures') || color.startsWith('http') || color.startsWith('data:')) {
      allowRotation = false; // keep vertical or preserve pattern
    }

    const isBack = p.material === 'Melamina Fondo' || p.thickness === 3 || p.name.startsWith('Trasera') || p.name.startsWith('Fondo Cajón');

    if (materialType === 'hpl') {
      addPartToBoard(`HPL_CARA_${color}`, `PLANCHA HPL - COLOR: ${getColorName(color)}`, color, 3050, 1300, {
        id: "part-hpl-cara-" + index, name: p.name + " (Cara)", width: finalW + hplOversize, length: finalL + hplOversize, qty: p.qty, color: color, edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2, allowRotation
      });
      addPartToBoard(`MDF_SUSTRATO`, `PLANCHA MDF DESNUDO 15MM (SUSTRATO HPL)`, "#e5e5e5", 2500, 1830, {
        id: "part-mdf-" + index, name: p.name + " (Sustrato)", width: finalW, length: finalL, qty: p.qty, color: "#e5e5e5", edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2, allowRotation: true // MDF substrate can be rotated freely
      });
      if (state.hplBalancer) {
        addPartToBoard(`HPL_BALANCER`, `PLANCHA HPL BLANCO 0.9MM (TRASCARA BALANCEADOR)`, "#ffffff", 3050, 1300, {
          id: "part-hpl-bal-" + index, name: p.name + " (Trascara)", width: finalW + hplOversize, length: finalL + hplOversize, qty: p.qty, color: "#ffffff", edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2, allowRotation
        });
      }
    } else if (isBack) {
      addPartToBoard(`DUROLAC_${color}`, `PLANCHA DUROLAC / MDF 3MM (FONDOS Y TRASERAS) - COLOR: ${getColorName(color)}`, color, 2440, 1830, {
        id: "part-durolac-" + index, name: p.name, width: finalW, length: finalL, qty: p.qty, color: color, edgeL1: false, edgeL2: false, edgeW1: false, edgeW2: false, allowRotation: true
      });
    } else {
      addPartToBoard(`MEL_${color}`, `PLANCHA MELAMINA ${state.thickness * 10}MM - COLOR: ${getColorName(color)}`, color, 2500, 1830, {
        id: "part-" + index, name: p.name, width: finalW, length: finalL, qty: p.qty, color: color, edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2, allowRotation
      });
    }
  });

  const allBoards: (BoardResult & { label?: string })[] = [];
  Object.keys(partsByBoard).forEach(key => {
    const group = partsByBoard[key];
    const b = optimizeNesting(group.parts, group.w, group.h, 3.2, 15);
    b.forEach(board => {
      allBoards.push({ ...board, label: group.label });
    });
  });

  const boardPages: BoardResult[][] = [];
  for(let i=0; i<allBoards.length; i+=1) {
    boardPages.push(allBoards.slice(i, i+1));
  }

  const totalPages = printPages.length + boardPages.length;

  const TitleBlock = ({ pageNum, title }: { pageNum: number, title: string }) => (
    <div className="absolute bottom-4 left-4 right-4 h-24 border-2 border-black flex text-[10px] bg-white z-10">
      <div className="w-1/4 border-r border-black p-2 flex flex-col justify-center">
        <div className="font-bold text-lg mb-1">{title}</div>
        <div>CLIENTE: PROYECTO WEB</div>
        <div>FECHA: {new Date().toLocaleDateString()}</div>
      </div>
      <div className="w-2/4 border-r border-black p-2 flex flex-col justify-center text-[10px] space-y-0.5">
        <div><span className="font-bold">Estructura:</span> {state.thickness}mm Laminado {getColorName(state.structureColor)}</div>
        <div><span className="font-bold">Trasera:</span> 3mm {getColorName(state.backColor)}</div>
        <div><span className="font-bold">Tapacantos:</span> PVC {(state.edgeBandingThicknessFronts || 2.0).toFixed(2)}mm en frentes, {(state.edgeBandingThicknessCabinets || 0.45).toFixed(2)}mm resto.</div>
        <div><span className="font-bold">Herrajes:</span> {state.assemblyType === 'minifix' ? 'Minifix + Tarugo' : 'Soberbio / Spax'}, Correderas {state.drawerHardware}.</div>
      </div>
      <div className="w-1/4 p-2 flex flex-col items-end justify-between">
        <div className="text-right">
          <div className="font-bold text-sm">FORMATO: A3</div>
          <div className="font-bold">HOJA {pageNum} DE {totalPages}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bellota font-bold text-2xl lowercase text-orange-600 tracking-tight select-none">arquify</span>
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
    <div className="fixed inset-0 z-[100] bg-neutral-800 text-black flex flex-col overflow-hidden">
      {/* Header Superior Fijo Integrado (Opción 1) */}
      <header className="sticky top-0 left-0 right-0 z-40 print:hidden w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Identificación y Título */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 border-r border-slate-700 pr-3">
            <FileText size={16} className="text-orange-500 shrink-0" />
            <span className="tracking-wider uppercase">PLANOS DE CLÓSET</span>
          </div>
          <span className="hidden xl:inline-block text-[11px] text-slate-400 font-medium">
            Láminas Técnicas A3 &middot; Despiece &middot; Cubicaciones
          </span>
        </div>

        {/* Acciones Técnicas y Exportaciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Principal: Descargar Planos Completos A3 en PDF */}
          <button 
            onClick={handleExportA3}
            disabled={isExportingA3}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 text-white px-3.5 py-1.5 rounded-lg font-bold uppercase text-[11px] tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Generar y descargar todos los planos y despieces de clóset en formato A3"
          >
            {isExportingA3 ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Generando ({exportProgress ? `${exportProgress.current}/${exportProgress.total}` : '...'})</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Planos PDF (A3)</span>
              </>
            )}
          </button>

          {generatedPdfUrl && (
            <a
              href={generatedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="planos_closet_completos_A3.pdf"
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold uppercase text-[11px] tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse cursor-pointer"
              title="Haz clic para abrir o descargar directamente el PDF generado"
            >
              <Download size={14} />
              <span>PDF Listo</span>
            </a>
          )}

          {/* Botón Secundario: Ficha Técnica PDF Directo */}
          <button 
            onClick={() => exportToPDF(state)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-1.5 rounded-lg font-bold uppercase text-[11px] tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Descargar archivo PDF estructurado con despiece y cubicación"
          >
            <FileText size={14} />
            <span>Ficha Técnica PDF</span>
          </button>
        </div>

        {/* Lado Derecho: Imprimir y Cerrar */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            title="Imprimir"
          >
            <Printer size={14} />
          </button>

          <button 
            onClick={() => state.setIsPrinting(false)}
            className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
            title="Cerrar vista de planos (Esc)"
          >
            <X size={15} />
            <span>Cerrar</span>
          </button>
        </div>
      </header>

      {/* Contenedor con Scroll para las Láminas A3 */}
      <div className="flex-1 overflow-auto bg-neutral-800 print-only-container">

      <style>{`
        @media screen { 
           .print-only-container { display: flex; flex-direction: column; background: #525252; padding: 2rem; align-items: center; gap: 2rem; } 
           .blueprint-page { 
             background: white; 
             width: 420mm; 
             min-width: 420mm; 
             max-width: 420mm; 
             height: 297mm; 
             min-height: 297mm; 
             max-height: 297mm; 
             flex-shrink: 0; 
             position: relative; 
             box-shadow: 0 4px 15px rgba(0,0,0,0.5); 
             box-sizing: border-box;
           }
        }
        @media print {
          body * { visibility: hidden; }
          .print-only-container, .print-only-container * { visibility: visible; }
          .print-only-container { position: absolute; left: 0; top: 0; width: 100%; height: auto; display: block; background: white !important; }
          .blueprint-page { 
            width: 420mm; 
            height: 297mm; 
            min-height: 297mm;
            max-height: 297mm;
            position: relative; 
            page-break-after: always; 
            page-break-inside: avoid;
            overflow: hidden; 
            box-sizing: border-box;
          }
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
                              
                              {/* Cotas Exteriores Modificadas (Nivel 2 Exterior) */}
                              <div className="absolute -bottom-11 left-0 w-full flex flex-col items-center pointer-events-none">
                                 <div className="w-full relative h-0">
                                     <div className="absolute -top-5 left-0 h-5 border-l border-zinc-400/60 border-dashed"></div>
                                     <div className="absolute -top-5 right-0 h-5 border-r border-zinc-400/60 border-dashed"></div>
                                 </div>
                                 <div className="w-full border-b border-zinc-500 relative">
                                     <div className="absolute -top-1 left-0 h-2 border-l border-zinc-500"></div>
                                     <div className="absolute -top-1 right-0 h-2 border-r border-zinc-500"></div>
                                 </div>
                                 <div className="text-[10px] mt-0.5 text-zinc-800 font-bold tracking-tight bg-white/90 px-1 rounded">{part.width.toFixed(1)}</div>
                              </div>

                              <div className="absolute top-0 -right-12 h-full flex items-center pointer-events-none">
                                 <div className="h-full relative w-0">
                                     <div className="absolute top-0 -left-6 w-6 border-t border-zinc-400/60 border-dashed"></div>
                                     <div className="absolute bottom-0 -left-6 w-6 border-b border-zinc-400/60 border-dashed"></div>
                                 </div>
                                 <div className="h-full border-r border-zinc-500 relative">
                                     <div className="absolute top-0 -left-1 w-2 border-t border-zinc-500"></div>
                                     <div className="absolute bottom-0 -left-1 w-2 border-b border-zinc-500"></div>
                                 </div>
                                 <div className="text-[10px] ml-1 -rotate-90 origin-center text-zinc-800 font-bold tracking-tight bg-white/90 px-1 rounded whitespace-nowrap">{part.length.toFixed(1)}</div>
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
      {boardPages.map((boards, bpIdx) => {
        const pageNum = printPages.length + bpIdx + 1;
        return (
          <div key={"nesting-page-" + bpIdx} className="blueprint-page border border-black/10 flex flex-col relative">
            <div className="flex-1 p-8 pb-32 flex flex-col w-full h-full overflow-hidden">
              <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-800">OPTIMIZACIÓN DE CORTE Y NESTING</h2>
                <div className="text-[10px] text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded border border-slate-200">
                  <span className="text-red-500 font-extrabold mr-1">---</span> Indica borde con tapacantos
                </div>
              </div>
              <div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">
                {boards.map((board, bIdx) => {
                  const label = (board as any).label || `PLANCHA ${board.id} - COLOR: ${getColorName(board.color)}`;
                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center w-full max-w-[1100px]" style={{ flexShrink: 1, minHeight: 0 }}>
                      <div className="w-full flex justify-between text-[11px] font-bold mb-1">
                        <span className="uppercase text-orange-600">{label} ({board.w}x{board.h}mm)</span>
                        <span>Aprovechamiento: {(100 - board.wastePercentage).toFixed(1)}% | Desperdicio: {board.wastePercentage.toFixed(1)}%</span>
                      </div>
                                            <div 
                        className="relative border-2 border-zinc-800 shadow-md bg-stone-100/50"
                        style={{ width: `${(board.w / 3050) * 100}%`, aspectRatio: `${board.w} / ${board.h}` }}
                      >
                        {board.placedParts.map((p, pIdx) => {
                          const px = (p.x / board.w) * 100 + "%";
                          const py = (p.y / board.h) * 100 + "%";
                          const pw = (p.w / board.w) * 100 + "%";
                          const ph = (p.h / board.h) * 100 + "%";
                          
                          return (
                            <div 
                              key={"placed-" + p.id + "-" + pIdx}
                              className="absolute border border-black flex flex-col items-center justify-center text-center overflow-hidden"
                              style={{
                                left: px,
                                top: py,
                                width: pw,
                                height: ph,
                                backgroundColor: board.color.startsWith('#') ? board.color : '#e2e8f0',
                                backgroundImage: (board.color.startsWith('http') || board.color.startsWith('/')) ? "url('" + board.color + "')" : 'none',
                                backgroundSize: 'cover'
                              }}
                            >
                                                            <div className="bg-white/90 px-1 py-0.5 rounded text-[8px] font-bold leading-tight flex flex-col items-center z-10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%]">
                                <div>{p.name.replace('Melamina ', '')}</div>
                                <div>{p.w.toFixed(0)}x{p.h.toFixed(0)}</div>
                              </div>
                              {p.edgeTop && <div className="absolute top-0.5 left-0.5 right-0.5 border-t-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeBottom && <div className="absolute bottom-0.5 left-0.5 right-0.5 border-b-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeLeft && <div className="absolute left-0.5 top-0.5 bottom-0.5 border-l-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeRight && <div className="absolute right-0.5 top-0.5 bottom-0.5 border-r-[1.5px] border-red-500 border-dashed" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <TitleBlock 
              pageNum={pageNum} 
              title="PLANOS DE CORTE Y OPTIMIZACIÓN" 
            />
          </div>
        );
      })}
      </div>

      {/* Modal de PDF Listo para Descargar */}
      {generatedPdfUrl && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">¡Planos A3 Generados con Éxito!</h3>
              <p className="text-slate-600 text-sm mt-2">Su documento PDF de fabricación está listo para descargar.</p>
            </div>
            <div className="space-y-3">
              <a
                href={generatedPdfUrl}
                download="planos_closet_completos_A3.pdf"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer text-base"
              >
                <Download size={20} />
                <span>Descargar Archivo PDF</span>
              </a>
              <button
                onClick={() => setGeneratedPdfUrl(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-2xl transition-all cursor-pointer text-sm"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
