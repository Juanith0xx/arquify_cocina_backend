import React, { useState } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  Box,
  RotateCcw,
} from 'lucide-react';
import { useChairStore } from '../store/chairStore';
import { Chair3DViewer } from '../components/chair/Chair3DViewer';
import { ChairBlueprint2D } from '../components/chair/ChairBlueprint2D';
import { ChairSidebar } from '../components/chair/ChairSidebar';
import { exportChairPDF } from '../utils/chairPdfGenerator';
import { exportChairExcel } from '../utils/chairExcelGenerator';

export function ChairConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint'>('3d');
  const fullState = useChairStore();
  const resetConfig = useChairStore((state) => state.resetConfig);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-[#111318] border-b border-zinc-800 flex items-center justify-between px-4 z-40 select-none">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigate}
            className="p-2 hover:bg-zinc-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer border border-transparent hover:border-zinc-700"
            title="Volver al inicio"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bellota text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">
              arquify
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
              Sillas Terciado & Fierro
            </span>
          </div>
        </div>

        {/* Center: View Switcher (3D vs 2D Plano) */}
        <div className="flex bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '3d'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Box size={14} />
            <span>3D Interactivo</span>
          </button>

          <button
            onClick={() => setViewMode('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'blueprint'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers size={14} />
            <span>Plano 2D & Planchas</span>
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetConfig}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
            title="Restablecer configuración original"
          >
            <RotateCcw size={13} />
            <span>Reiniciar</span>
          </button>

          <button
            onClick={() => exportChairPDF(fullState)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            title="Exportar Ficha Técnica PDF"
          >
            <FileText size={14} />
            <span className="hidden md:inline">Ficha PDF</span>
          </button>

          <button
            onClick={() => exportChairExcel(fullState)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            title="Exportar Cubicación Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel BOM</span>
          </button>
        </div>
      </header>

      {/* Body: Main Viewport + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Canvas / Blueprint View */}
        <main className="w-full lg:flex-1 relative h-[45vh] sm:h-[48vh] lg:h-full shrink-0 overflow-hidden">
          {viewMode === '3d' ? <Chair3DViewer /> : <ChairBlueprint2D />}
        </main>

        {/* Side Configuration Panel */}
        <ChairSidebar />
      </div>
    </div>
  );
}
