/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Configurator } from '../components/Configurator';
import { Scene } from '../components/Scene';
import { Blueprint } from '../components/Blueprint';
import { ModuleContextMenu } from '../components/ModuleContextMenu';
import { SaveProjectModal } from '../components/common/SaveProjectModal';
import { useStore } from '../store';
import { QRCodeSVG } from 'qrcode.react';
import { ARView } from '../components/ARView';
import { Save, Undo2, Redo2 } from 'lucide-react';

export function ClosetConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [isAR, setIsAR] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const loadDesign = useStore(state => state.loadDesign);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const canUndo = useStore(state => state.canUndo);
  const canRedo = useStore(state => state.canRedo);
  const state = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (((e.key === 'z' || e.key === 'Z') && e.shiftKey) || e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const arMode = params.get('ar');
    const configStr = params.get('config');

    if (configStr) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(configStr)));
        loadDesign(decoded);
      } catch (e) {
        console.error("Failed to parse config from URL", e);
      }
    }

    if (arMode === 'true') {
      setIsAR(true);
    }
  }, []);

  if (isAR) {
    return <ARView />;
  }

  const generateARUrl = async () => {
    const minimalState = {
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      color: state.structureColor,
      backColor: state.backColor,
      doorColor: state.doorColor,
      showTopWall: state.showTopWall,
      showBottomWall: state.showBottomWall,
      showLeftWall: state.showLeftWall,
      showRightWall: state.showRightWall,
      showBackWall: state.showBackWall,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
      modules: state.modules
    };
    
    const configStr = encodeURIComponent(btoa(JSON.stringify(minimalState)));
    
    try {
      const res = await fetch('/ar-tunnel.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return `${data.url}/?ar=true&config=${configStr}`;
        }
      }
    } catch (e) {
      console.warn("Could not fetch AR tunnel URL, falling back to window location");
    }

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ar=true&config=${configStr}`;
  };

  const handleShowQR = async () => {
    const url = await generateARUrl();
    setQrUrl(url);
    setShowQR(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-slate-200 font-sans overflow-hidden">
      <Blueprint />
      <nav className="flex items-center justify-between px-4 sm:px-8 py-2.5 sm:py-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-20 relative print:hidden flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onNavigate} className="mr-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10" title="Volver al Inicio"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button>
          <span className="font-bellota text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">arquify</span>
          <span className="text-xs text-slate-500 uppercase tracking-widest border-l border-white/10 pl-3 hidden sm:inline">Clóset Modular</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botones Deshacer y Rehacer (Undo / Redo) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all shadow-sm ${
                canUndo()
                  ? 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/60 text-orange-400 hover:text-orange-300 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title={canUndo() ? 'Deshacer última acción (Ctrl+Z)' : 'Sin acciones para deshacer'}
              aria-label="Deshacer"
            >
              <Undo2 size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo()}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all shadow-sm ${
                canRedo()
                  ? 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/60 text-orange-400 hover:text-orange-300 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title={canRedo() ? 'Rehacer acción (Ctrl+Y / Ctrl+Shift+Z)' : 'Sin acciones para rehacer'}
              aria-label="Rehacer"
            >
              <Redo2 size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button 
            onClick={handleShowQR}
            className="px-2.5 sm:px-3.5 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border border-orange-500/50"
          >
            <span className="hidden sm:inline">Ver en </span>AR
          </button>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-600/20 cursor-pointer"
            title="Guardar diseño actual en el Backoffice"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </nav>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden" onClick={() => setShowQR(false)}>
          <div className="bg-[#111] border border-white/10 p-8 rounded-xl flex flex-col items-center gap-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold uppercase tracking-wider">Visualizar en AR</h2>
            <p className="text-sm text-slate-400 text-center">
              Escanea este código QR con la cámara de tu teléfono para ver tu diseño en Realidad Aumentada.
            </p>
            <div className="bg-white p-4 rounded-lg">
               {qrUrl ? <QRCodeSVG value={qrUrl} size={200} /> : <div className="w-[200px] h-[200px] flex items-center justify-center text-black">Generando...</div>}
            </div>
            <button 
              onClick={() => setShowQR(false)}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded uppercase text-xs tracking-wider transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a1a1a_0%,#000000_100%)] pointer-events-none"></div>
        <div className="relative w-full lg:flex-1 h-[45vh] sm:h-[48vh] lg:h-full shrink-0 flex flex-col">
          <Scene />
          <ModuleContextMenu />
        </div>
        <Configurator />
      </main>

      <footer className="h-12 bg-black flex items-center px-8 border-t border-white/5 justify-between z-20 relative">
        <div className="flex gap-6 text-[10px] uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> 3D Engine: Activo</span>
        </div>
        <div className="flex gap-4 text-[10px] uppercase text-slate-400">
          <span className="cursor-pointer hover:text-white transition-colors">Ayuda</span>
          <span className="cursor-pointer hover:text-white transition-colors">Atajos</span>
        </div>
      </footer>

      {/* Modal Guardar Proyecto */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        projectType="closet"
        defaultName="Proyecto Clóset Arquify"
        estimatedCost={1800000}
        projectData={{
          height: state.height,
          depth: state.depth,
          thickness: state.thickness,
          structureColor: state.structureColor,
          doorColor: state.doorColor,
          backColor: state.backColor,
          modules: state.modules,
          showSocle: state.showSocle,
          showLegs: state.showLegs,
        }}
        onSaved={(id) => {
          console.log('Proyecto de clóset guardado con ID:', id);
        }}
      />
    </div>
  );
}
