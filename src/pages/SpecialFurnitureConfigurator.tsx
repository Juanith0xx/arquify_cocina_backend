import React, { useState } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Compass,
  Image as ImageIcon
} from 'lucide-react';
import { SpecialScene } from '../components/special/SpecialScene';
import { SpecialBlueprint } from '../components/special/SpecialBlueprint';
import { SaveProjectModal } from '../components/common/SaveProjectModal';
import {
  useSpecialFurnitureStore,
  SPECIAL_COLORS,
  ABET_TEXTURES,
  SpecialColorId,
  AbetTextureId
} from '../store/specialFurnitureStore';
import {
  exportSpecialFurnitureExcel,
  exportSpecialFurniturePDF,
  generateSpecialPartsList,
  generateSpecialHardwareList
} from '../utils/specialFurnitureManufacturing';
import { Save } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';

export function SpecialFurnitureConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const state = useSpecialFurnitureStore();
  const adminTextures = useAdminStore((s) => s.textures);
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint' | 'bom'>('3d');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Terminaciones aprobadas del catálogo oficial de Backoffice
  const approvedBackofficeTextures = adminTextures.filter(
    (t) => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus)
  );

  const extColor = SPECIAL_COLORS.find(c => c.id === state.exteriorColor) || SPECIAL_COLORS[0];
  const abetTex = ABET_TEXTURES.find(t => t.id === state.backTexture) || ABET_TEXTURES[0];

  const parts = generateSpecialPartsList(state);
  const hardware = generateSpecialHardwareList(state);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-slate-200 font-sans overflow-hidden">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-black/40 backdrop-blur-md z-20 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigate}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 text-slate-300 hover:text-white"
            title="Volver al Inicio"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bellota text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">
              arquify
            </span>
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded border border-orange-500/30">
              Muebles Especiales
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              viewMode === '3d' ? 'bg-orange-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visor 3D
          </button>
          <button
            onClick={() => setViewMode('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              viewMode === 'blueprint' ? 'bg-orange-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plano 2D
          </button>
          <button
            onClick={() => setViewMode('bom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              viewMode === 'bom' ? 'bg-orange-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Despiece & BoM
          </button>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-600/20 cursor-pointer"
            title="Guardar diseño de Mueble Especial en el Backoffice"
          >
            <Save size={14} /> Guardar Proyecto
          </button>
          <button
            onClick={() => exportSpecialFurnitureExcel(state)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border border-emerald-500/40"
          >
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </button>
          <button
            onClick={() => exportSpecialFurniturePDF(state)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border border-red-500/40"
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        {/* Left/Center Viewport */}
        <div className="w-full lg:flex-1 h-[45vh] sm:h-[48vh] lg:h-full relative shrink-0">
          {viewMode === '3d' && <SpecialScene />}
          {viewMode === 'blueprint' && <SpecialBlueprint />}
          {viewMode === 'bom' && (
            <div className="w-full h-full bg-[#0E1117] p-6 overflow-y-auto font-sans">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-orange-400">Listado de Piezas de Corte y Herrajes (BoM)</h2>
                    <p className="text-xs text-slate-400">Cálculo paramétrico de fabricación para producción directa</p>
                  </div>
                </div>

                {/* Table of Parts */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/5 font-bold text-xs uppercase tracking-wider text-slate-300">
                    Piezas de Tablero & Vidrios ({parts.length} ítems)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-black/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="p-3">Pieza</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3 text-right">Largo x Ancho (mm)</th>
                          <th className="p-3 text-right">Espesor</th>
                          <th className="p-3">Material / Acabado</th>
                          <th className="p-3">Cantos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parts.map((p) => (
                          <tr key={p.id} className="hover:bg-white/5">
                            <td className="p-3 font-medium text-white">{p.name}</td>
                            <td className="p-3 text-slate-400">{p.category}</td>
                            <td className="p-3 text-center font-bold text-orange-400">{p.qty}</td>
                            <td className="p-3 text-right font-mono text-slate-300">{p.lengthMm} x {p.widthMm}</td>
                            <td className="p-3 text-right font-mono text-slate-300">{p.thicknessMm} mm</td>
                            <td className="p-3 text-slate-300">{p.material}</td>
                            <td className="p-3 text-slate-400">
                              {[p.edgeL1, p.edgeL2, p.edgeW1, p.edgeW2].filter(Boolean).length > 0 ? 'PVC' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table of Hardware */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/5 font-bold text-xs uppercase tracking-wider text-slate-300">
                    Herrajes y Accesorios de Montaje ({hardware.length} ítems)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-black/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="p-3">Herraje</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Especificación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {hardware.map((h) => (
                          <tr key={h.id} className="hover:bg-white/5">
                            <td className="p-3 font-medium text-white">{h.name}</td>
                            <td className="p-3 font-mono text-slate-400">{h.sku}</td>
                            <td className="p-3 text-center font-bold text-orange-400">{h.qty} {h.unit}</td>
                            <td className="p-3 text-slate-400">{h.category}</td>
                            <td className="p-3 text-slate-300">{h.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating 3D Interaction Toolbar */}
          {viewMode === '3d' && (
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-2xl z-10">
              <button
                onClick={state.toggleDoorOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  state.doorOpen ? 'bg-orange-500 text-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {state.doorOpen ? 'Cerrar Puertas' : 'Abrir Puertas'}
              </button>
              <button
                onClick={state.toggleDrawerOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  state.drawerOpen ? 'bg-orange-500 text-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {state.drawerOpen ? 'Cerrar Cajón' : 'Abrir Cajón'}
              </button>
              <div className="w-[1px] h-5 bg-white/20 mx-1"></div>
              <button
                onClick={() => state.setShowDimensions(!state.showDimensions)}
                className={`p-2 rounded-lg text-xs transition-all ${
                  state.showDimensions ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/5 text-slate-400'
                }`}
                title="Alternar Cotas 3D"
              >
                <Compass size={16} />
              </button>
              <button
                onClick={() => state.setIsTransparent(!state.isTransparent)}
                className={`p-2 rounded-lg text-xs transition-all ${
                  state.isTransparent ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/5 text-slate-400'
                }`}
                title="Modo Rayos X (Ver Ensambles)"
              >
                <Layers size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar Configurator Panel */}
        <div className="w-full lg:w-96 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-white/10 p-4 sm:p-6 overflow-y-auto flex-1 lg:flex-none flex flex-col gap-6 shrink-0 z-10 shadow-2xl min-h-0 h-auto lg:h-full">
          {/* Header */}
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Configurar Aparador</h2>
            <p className="text-xs text-slate-400">Ajuste de medidas, acabados Abet Laminati y color exterior.</p>
          </div>

          {/* 1. SECCIÓN DIMENSIONES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <Sliders size={14} /> Dimensiones Principales
              </span>
              <button
                onClick={state.resetToDefaults}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider"
              >
                <RotateCcw size={10} /> Restablecer
              </button>
            </div>

            {/* Ancho */}
            <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Ancho Total</span>
                <span className="font-bold text-white font-mono">{state.width} cm</span>
              </div>
              <input
                type="range"
                min={60}
                max={120}
                step={5}
                value={state.width}
                onChange={(e) => state.setWidth(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>60 cm</span>
                <span>120 cm (máx 60cm/puerta)</span>
              </div>
            </div>

            {/* Alto */}
            <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Alto Total</span>
                <span className="font-bold text-white font-mono">{state.height} cm</span>
              </div>
              <input
                type="range"
                min={120}
                max={220}
                step={5}
                value={state.height}
                onChange={(e) => state.setHeight(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>120 cm</span>
                <span>220 cm</span>
              </div>
            </div>

            {/* Profundidad */}
            <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Profundidad</span>
                <span className="font-bold text-white font-mono">{state.depth} cm</span>
              </div>
              <input
                type="range"
                min={35}
                max={60}
                step={2}
                value={state.depth}
                onChange={(e) => state.setDepth(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>35 cm</span>
                <span>60 cm</span>
              </div>
            </div>

            {/* Altura de Patas Metálicas */}
            <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Elevación Base (Patas Acero)</span>
                <span className="font-bold text-white font-mono">{state.legHeight} cm</span>
              </div>
              <input
                type="range"
                min={15}
                max={35}
                step={2}
                value={state.legHeight}
                onChange={(e) => state.setLegHeight(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>15 cm</span>
                <span>35 cm</span>
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN COLORES DE ESTRUCTURA (5 COLORES EXCLUSIVOS) */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">
              Color Estructura Exterior (5 Tonos)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {SPECIAL_COLORS.map((col) => {
                const isSelected = state.exteriorColor === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => state.setExteriorColor(col.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-white/10 border-orange-500 shadow-md shadow-orange-500/10'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full shrink-0 border border-white/20 shadow-inner"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{col.name}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-orange-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight truncate">{col.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SECCIÓN FONDO INTERIOR ABET LAMINATI */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">
                Fondo Interior (Abet Laminati HPL)
              </span>
              <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                130×305 cm
              </span>
            </div>

            {/* Catálogo Predefinido Abet Laminati */}
            <div className="grid grid-cols-1 gap-2.5">
              {ABET_TEXTURES.map((tex) => {
                const isSelected = !state.customBackTextureUrl && state.backTexture === tex.id;
                return (
                  <button
                    key={tex.id}
                    onClick={() => {
                      state.setBackTexture(tex.id);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-lg border border-white/20 shrink-0 bg-cover bg-center shadow-inner"
                      style={{ backgroundImage: `url('${tex.previewUrl}')` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{tex.name}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-orange-500 shrink-0" />}
                      </div>
                      <span className="text-[9px] text-orange-400 font-mono block">{tex.code} • {tex.finish}</span>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{tex.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Otras Texturas Oficiales Aprobadas desde Backoffice */}
            {approvedBackofficeTextures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  Terminaciones de Proveedores Aprobados
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {approvedBackofficeTextures.map((tex) => {
                    const isSelected = state.customBackTextureUrl === tex.url;
                    return (
                      <button
                        key={tex.id}
                        onClick={() => state.setCustomBackTextureUrl(tex.url)}
                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg border border-white/20 shrink-0 bg-cover bg-center"
                          style={tex.url?.startsWith('#') ? { backgroundColor: tex.url } : { backgroundImage: `url('${tex.url}')` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">{tex.name}</span>
                            {isSelected && <CheckCircle2 size={14} className="text-orange-500 shrink-0" />}
                          </div>
                          <span className="text-[9px] text-orange-400 font-mono block">
                            {tex.brand || tex.providerName || 'Proveedor'} • {tex.code || 'STD'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. ESPECIFICACIÓN DE FRENTES Y ENSAMBLES */}
          <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Detalle Constructivo y Ensambles
            </span>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Puertas Batientes:</span>
                <span className="font-semibold text-white">Marco Esbelto 35mm + Vidrio</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Módulo Cajón:</span>
                <span className="font-semibold text-white">Cajón + Tapa Superior Repisa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Repisas Interiores:</span>
                <span className="font-semibold text-white">Cristal Templado 6mm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fondo Decorativo:</span>
                <span className="font-semibold text-orange-400 font-mono">Abet 130x305 cm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Patas y Base:</span>
                <span className="font-semibold text-white">Acero Negro + Regatones M8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Guardar Proyecto */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        projectType="special"
        defaultName="Proyecto Mueble Especial Arquify"
        estimatedCost={1450000}
        projectData={{
          width: state.width,
          height: state.height,
          depth: state.depth,
          thickness: state.thickness,
          legHeight: state.legHeight,
          exteriorColor: state.exteriorColor,
          backTexture: state.backTexture,
          doorGlassType: state.doorGlassType,
          assemblyType: state.assemblyType,
          hardwareBrand: state.hardwareBrand,
        }}
        onSaved={(id) => {
          console.log('Proyecto especial guardado con ID:', id);
        }}
      />
    </div>
  );
}
