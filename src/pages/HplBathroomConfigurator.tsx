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
  Image as ImageIcon,
  Scissors,
  DollarSign,
  Plus,
  LayoutGrid,
  ShieldCheck,
  Package,
  Save,
  Trash2,
} from 'lucide-react';
import {
  useHplBathroomStore,
  ABET_SHEET_FORMATS,
  HPL_STANDARD_COLORS,
  JNF_FINISHES,
  HplThickness,
  JnfHardwareFinish,
  UpperStabilizerSystem,
  FootModel,
  HingeModel,
  LockModel,
  HandleModel,
  HookModel,
  WallFixingModel,
} from '../store/hplBathroomStore';
import { useAdminStore } from '../store/adminStore';
import { HplBathroomScene } from '../components/hpl/HplBathroomScene';
import { HplBlueprint } from '../components/hpl/HplBlueprint';
import { HplRoomPlannerModal } from '../components/hpl/HplRoomPlannerModal';
import { SaveProjectModal } from '../components/common/SaveProjectModal';
import { calculateHplManufacturingBOM } from '../utils/hplManufacturing';
import { exportHplBathroomExcel } from '../utils/hplExcelGenerator';
import { exportHplBathroomPDF } from '../utils/hplPdfGenerator';

export function HplBathroomConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const state = useHplBathroomStore();
  const adminTextures = useAdminStore((s) => s.textures);
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint' | 'bom'>('3d');
  const [activeTab, setActiveTab] = useState<'layout' | 'thickness' | 'colors' | 'hardware' | 'summary'>('layout');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Terminaciones HPL aprobadas desde el Backoffice
  const approvedHplTextures = adminTextures.filter(
    (t) => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus) && (t.category === 'hpl_autor' || t.name.toLowerCase().includes('abet') || t.name.toLowerCase().includes('hpl'))
  );

  const bom = calculateHplManufacturingBOM(state);
  const finishInfo = JNF_FINISHES[state.hardwareFinish];
  const colorObj = HPL_STANDARD_COLORS.find((c) => c.id === state.selectedColorId);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070A12] text-slate-200 overflow-hidden font-sans">
      {/* 1. HEADER SUPERIOR */}
      <header className="h-16 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigate}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>Inicio</span>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <span className="font-bellota text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">
            arquify
          </span>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-sm">
                Separador de Baños HPL
              </span>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                Abet Laminati & JNF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Cubículos fenólicos autoportantes, optimización de cortes 2D y quincallería en acero inox / PVD
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              viewMode === '3d'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye size={14} />
            <span>Estudio 3D</span>
          </button>

          <button
            onClick={() => setViewMode('blueprint')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              viewMode === 'blueprint'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass size={14} />
            <span>Planos & Nesting</span>
          </button>

          <button
            onClick={() => setViewMode('bom')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              viewMode === 'bom'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign size={14} />
            <span>Presupuesto & BOM</span>
          </button>
        </div>

        {/* Action Buttons: Save, Export PDF & Excel */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
            title="Guardar diseño de Baños HPL en el Backoffice"
          >
            <Save size={15} />
            <span className="hidden sm:inline">Guardar Proyecto</span>
          </button>

          <button
            onClick={() => exportHplBathroomExcel(state)}
            className="px-3.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/40 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
            title="Descargar Planilla Excel con Despiece, Nesting y Quincallería JNF"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden md:inline">Descargar Excel</span>
          </button>

          <button
            onClick={() => exportHplBathroomPDF(state)}
            className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 border border-rose-500/40 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-rose-600/10 transition-all cursor-pointer"
            title="Descargar Ficha Técnica y Planos en Formato PDF"
          >
            <FileText size={15} />
            <span className="hidden md:inline">Descargar PDF</span>
          </button>
        </div>
      </header>

      {/* 2. BODY PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEWPORT PRINCIPAL (3D / BLUEPRINT / BOM) */}
        <main className="flex-1 relative h-full overflow-hidden bg-slate-950">
          {viewMode === '3d' && <HplBathroomScene />}
          {viewMode === 'blueprint' && <HplBlueprint />}
          {viewMode === 'bom' && (
            <div className="w-full h-full p-8 overflow-y-auto bg-slate-950">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <DollarSign size={20} className="text-emerald-400" />
                    <span>Presupuesto y Resumen de Fabricación</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-6">
                    Cubiculación automática de paneles fenólicos Abet Laminati y herrajes JNF según modulación actual
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400 block mb-1">Subtotal Neto</span>
                      <span className="text-2xl font-bold text-white font-mono">
                        ${bom.costs.subtotalNetoClp.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400 block mb-1">IVA (19%)</span>
                      <span className="text-2xl font-bold text-slate-300 font-mono">
                        ${bom.costs.iva19Clp.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <span className="text-xs text-emerald-400 block mb-1">Total General (IVA Incluido)</span>
                      <span className="text-2xl font-bold text-emerald-400 font-mono">
                        ${bom.costs.totalBrutoClp.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Partidas */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3">Partida</th>
                          <th className="p-3">Descripción</th>
                          <th className="p-3 text-right">Monto Neto (CLP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        <tr>
                          <td className="p-3 font-sans font-bold text-white">1. Paneles HPL Abet Laminati</td>
                          <td className="p-3 font-sans text-slate-400">{bom.metrics.totalSheetsCount} placas (Formato {bom.nesting.selectedFormat.name})</td>
                          <td className="p-3 text-right">${bom.costs.hplMaterialClp.toLocaleString('es-CL')}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-bold text-white">2. Quincallería JNF Inox/PVD</td>
                          <td className="p-3 font-sans text-slate-400">{bom.metrics.hardwarePiecesCount} piezas de herrajes JNF (Acabado {finishInfo.name})</td>
                          <td className="p-3 text-right">${bom.costs.hardwareClp.toLocaleString('es-CL')}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-bold text-white">3. Mecanizado y Corte CNC</td>
                          <td className="p-3 font-sans text-slate-400">Corte diamantado, canteado y perforaciones pasantes antivandálicas</td>
                          <td className="p-3 text-right">${bom.costs.machiningAndCncClp.toLocaleString('es-CL')}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-bold text-white">4. Instalación en Obra</td>
                          <td className="p-3 font-sans text-slate-400">Montaje para {bom.metrics.totalCubicles} cabinas + {bom.metrics.urinalScreensCount} urinarios</td>
                          <td className="p-3 text-right">${bom.costs.assemblyLaborClp.toLocaleString('es-CL')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tabla de Quincallería Detallada */}
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Listado Detallado de Quincallería JNF</h3>
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3">Código</th>
                          <th className="p-3">Nombre Herraje</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3">Acabado</th>
                          <th className="p-3 text-right">P. Unitario</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {bom.hardware.map((item, idx) => (
                          <tr key={`hw_row_${idx}`} className="hover:bg-slate-800/40">
                            <td className="p-3 text-sky-400 font-bold">{item.code}</td>
                            <td className="p-3 font-sans text-slate-200">{item.name}</td>
                            <td className="p-3 text-center text-white font-bold">{item.qty}</td>
                            <td className="p-3 font-sans text-slate-400">{item.finish}</td>
                            <td className="p-3 text-right">${item.unitPriceClp.toLocaleString('es-CL')}</td>
                            <td className="p-3 text-right text-emerald-400 font-bold">${item.totalPriceClp.toLocaleString('es-CL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 3. SIDEBAR PARAMÉTRICO */}
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-10 shrink-0">
          {/* Tabs del Sidebar */}
          <div className="grid grid-cols-4 bg-slate-950 p-1 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('layout')}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'layout' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cabinas
            </button>
            <button
              onClick={() => setActiveTab('thickness')}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'thickness' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Espesores
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'colors' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Colores
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'hardware' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Herrajes
            </button>
          </div>

          {/* Contenido scrolleable del Sidebar */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: MODULACIÓN DE CABINAS Y RECINTO */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                {/* Botón Abrir Planificador de Recinto */}
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500/50 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-sky-300 flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <LayoutGrid size={16} className="text-sky-400" />
                  <span>Configurar Área de la Sala</span>
                </button>

                {/* Altura de Paneles y Patas */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alturas y Despeje</h4>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Altura de Paneles Frontales</span>
                      <span className="text-sky-400 font-mono font-bold">{state.panelHeight} mm</span>
                    </div>
                    <input
                      type="range"
                      min={1600}
                      max={2000}
                      step={50}
                      value={state.panelHeight}
                      onChange={(e) => state.setPanelHeight(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Altura Separadores Laterales (Nivel superior fijo)</span>
                      <span className="text-emerald-400 font-mono font-bold">{state.dividerHeight || 1800} mm</span>
                    </div>
                    <input
                      type="range"
                      min={1500}
                      max={2100}
                      step={50}
                      value={state.dividerHeight || 1800}
                      onChange={(e) => state.setDividerHeight(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Mantiene enrasada la cota superior; el ajuste de altura compensa el despeje inferior con patas JNF.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Despeje de Suelo (Pata SM.017)</span>
                      <span className="text-sky-400 font-mono font-bold">{state.footHeight} mm</span>
                    </div>
                    <input
                      type="range"
                      min={120}
                      max={180}
                      step={10}
                      value={state.footHeight}
                      onChange={(e) => state.setFootHeight(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>

                {/* Lista de Cubículos */}
                <div className="space-y-3">
                  {(() => {
                    const currentTotalW = state.cubicles.reduce((sum, c) => sum + c.cubicleWidth, 0);
                    const maxAllowedW = state.room.roomWidth - 100;
                    const canAddStandard = currentTotalW + 1000 <= maxAllowedW;
                    const canAddPmr = currentTotalW + 1500 <= maxAllowedW;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Cubículos WC ({state.cubicles.length})
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Ocupado: {currentTotalW} mm / {state.room.roomWidth} mm
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              disabled={!canAddStandard}
                              onClick={() => {
                                if (canAddStandard) {
                                  state.addCubicle(false);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all ${
                                canAddStandard
                                  ? 'bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border-sky-500/30 cursor-pointer'
                                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                              }`}
                              title={canAddStandard ? 'Agregar Cabina Estándar' : 'Área insuficiente: agranda la sala para agregar'}
                            >
                              <Plus size={12} />
                              <span>Estándar</span>
                            </button>
                            <button
                              disabled={!canAddPmr}
                              onClick={() => {
                                if (canAddPmr) {
                                  state.addCubicle(true);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all ${
                                canAddPmr
                                  ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border-amber-500/30 cursor-pointer'
                                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                              }`}
                              title={canAddPmr ? 'Agregar Cabina PMR' : 'Área insuficiente: agranda la sala para agregar'}
                            >
                              <Plus size={12} />
                              <span>PMR</span>
                            </button>
                          </div>
                        </div>

                        {!canAddStandard && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">⚠️</span>
                            <div>
                              <strong className="block font-semibold">Límite de espacio alcanzado</strong>
                              Los cubículos ({currentTotalW} mm) ocupan el total de la sala ({state.room.roomWidth} mm). Agranda el área en <strong>"CONFIGURAR ÁREA DE LA SALA"</strong> para agregar más cabinas.
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {state.cubicles.map((cab, idx) => (
                    <div
                      key={cab.id}
                      className={`p-3.5 bg-slate-950 rounded-xl border transition-all ${
                        cab.isPmr ? 'border-amber-500/40' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{cab.name}</span>
                          {cab.isPmr && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
                              PMR
                            </span>
                          )}
                        </div>
                        {state.cubicles.length > 1 && (
                          <button
                            onClick={() => state.removeCubicle(cab.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Ancho Cubículo</label>
                          <input
                            type="number"
                            min={800}
                            max={2000}
                            step={50}
                            value={cab.cubicleWidth}
                            onChange={(e) => state.updateCubicle(cab.id, { cubicleWidth: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Fondo Cubículo (100 - 180 cm)</label>
                          <input
                            type="number"
                            min={1000}
                            max={1800}
                            step={50}
                            value={cab.cubicleDepth}
                            onChange={(e) => state.updateCubicle(cab.id, { cubicleDepth: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Ancho Puerta</label>
                          <input
                            type="number"
                            min={550}
                            max={950}
                            step={10}
                            value={cab.doorWidth}
                            onChange={(e) => state.updateCubicle(cab.id, { doorWidth: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Apertura</label>
                          <select
                            value={cab.doorOpening}
                            onChange={(e) => state.updateCubicle(cab.id, { doorOpening: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                          >
                            <option value="left_in">Izq. Interior</option>
                            <option value="right_in">Der. Interior</option>
                            <option value="left_out">Izq. Exterior</option>
                            <option value="right_out">Der. Exterior</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lista de Urinarios Independientes (Drag & Drop en área de baño) */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={13} />
                        <span>Separadores Urinarios ({state.urinalScreens.length})</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">Arrastra en 3D / 2D para ubicar en el baño</p>
                    </div>
                    <button
                      onClick={() => state.addUrinalScreen('right_wall')}
                      className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-teal-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus size={12} />
                      <span>Añadir</span>
                    </button>
                  </div>

                  {state.urinalScreens.map((u, idx) => (
                    <div key={u.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                          {u.name}
                        </span>
                        <button
                          onClick={() => state.removeUrinalScreen(u.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Selector de pared y coordenadas */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Pared Fijación</label>
                          <select
                            value={u.wallAttachment || 'right_wall'}
                            onChange={(e) => {
                              const wall = e.target.value as any;
                              let newPosX = u.posX;
                              let newPosZ = u.posZ;
                              let rot = u.rotationY;
                              if (wall === 'right_wall') {
                                newPosX = state.room.roomWidth - 300;
                                rot = Math.PI / 2;
                              } else if (wall === 'back_wall') {
                                newPosZ = 300;
                                rot = 0;
                              } else if (wall === 'front_wall') {
                                newPosZ = state.room.roomLength - 300;
                                rot = Math.PI;
                              } else if (wall === 'left_wall') {
                                newPosX = 300;
                                rot = -Math.PI / 2;
                              }
                              state.updateUrinalScreen(u.id, {
                                wallAttachment: wall,
                                posX: newPosX,
                                posZ: newPosZ,
                                rotationY: rot,
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                          >
                            <option value="right_wall">Muro Derecho</option>
                            <option value="back_wall">Muro Posterior</option>
                            <option value="front_wall">Muro Frontal</option>
                            <option value="left_wall">Muro Izquierdo</option>
                            <option value="free">Libre / Flotante</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Ubicación X, Z (mm)</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={Math.round(u.posX ?? 3800)}
                              onChange={(e) => state.updateUrinalScreen(u.id, { posX: Number(e.target.value) })}
                              className="w-1/2 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white font-mono text-[10px]"
                              title="Posición X en sala"
                            />
                            <input
                              type="number"
                              value={Math.round(u.posZ ?? 1400)}
                              onChange={(e) => state.updateUrinalScreen(u.id, { posZ: Number(e.target.value) })}
                              className="w-1/2 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white font-mono text-[10px]"
                              title="Posición Z en sala"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dimensiones Ancho y Alto */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Ancho (mm)</label>
                          <input
                            type="number"
                            min={350}
                            max={600}
                            step={25}
                            value={u.width}
                            onChange={(e) => state.updateUrinalScreen(u.id, { width: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Alto (mm)</label>
                          <input
                            type="number"
                            min={800}
                            max={1400}
                            step={50}
                            value={u.height}
                            onChange={(e) => state.updateUrinalScreen(u.id, { height: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ESPESORES INDEPENDIENTES & FORMATOS ABET */}
            {activeTab === 'thickness' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Espesores Independientes HPL (Abet)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Modifica el espesor fenólico para cada elemento estructural de forma individual.
                  </p>

                  {/* Espesor Puertas */}
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Espesor Puertas</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([10, 12, 15, 19] as HplThickness[]).map((t) => (
                        <button
                          key={`door_th_${t}`}
                          onClick={() => state.setThicknessDoor(t)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            state.thicknessDoor === t
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t} mm
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Espesor Pilastras */}
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Espesor Pilastras Frontales</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([10, 12, 15, 19] as HplThickness[]).map((t) => (
                        <button
                          key={`pil_th_${t}`}
                          onClick={() => state.setThicknessPilaster(t)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            state.thicknessPilaster === t
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t} mm
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Espesor Separadores Divisorios */}
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Espesor Separadores Laterales</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([10, 12, 15, 19] as HplThickness[]).map((t) => (
                        <button
                          key={`div_th_${t}`}
                          onClick={() => state.setThicknessDivider(t)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            state.thicknessDivider === t
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t} mm
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Espesor Urinarios */}
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Espesor Pantallas Urinarios</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([10, 12, 15, 19] as HplThickness[]).map((t) => (
                        <button
                          key={`urin_th_${t}`}
                          onClick={() => state.setThicknessUrinal(t)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            state.thicknessUrinal === t
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t} mm
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formatos de Placa Abet Laminati */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Formatos Abet Laminati
                    </h4>
                    <label className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.autoOptimizeFormat}
                        onChange={(e) => state.setAutoOptimizeFormat(e.target.checked)}
                        className="rounded text-emerald-500 bg-slate-900 border-slate-700"
                      />
                      <span>Auto Optimizar</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    {ABET_SHEET_FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => {
                          state.setSelectedFormatId(fmt.id);
                          state.setAutoOptimizeFormat(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                          bom.nesting.selectedFormat.id === fmt.id
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-white flex justify-between">
                          <span>{fmt.name}</span>
                          <span>{fmt.areaM2} m²</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COLORES Y DECORATIVOS ABET */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Colores Estándar Abet Laminati
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {HPL_STANDARD_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => state.setSelectedColorId(c.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          state.selectedColorId === c.id
                            ? 'bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg border border-white/20 shadow-inner"
                          style={{
                            backgroundColor: c.hex,
                            backgroundImage: c.textureUrl ? `url(${c.textureUrl})` : undefined,
                            backgroundSize: 'cover',
                          }}
                        />
                        <span className="text-[10px] text-center font-bold text-white leading-tight">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terminaciones Oficiales Aprobadas desde Backoffice */}
                {approvedHplTextures.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Terminaciones Proveedores Oficiales (Abet / HPL)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Materiales con Visto Bueno del Superadministrador cargados desde Backoffice.
                    </p>

                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {approvedHplTextures.map((tex) => (
                        <div
                          key={tex.id}
                          onClick={() => state.setCustomTexture(tex.url, tex.name)}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            state.customTextureUrl === tex.url
                              ? 'bg-sky-500/20 border-sky-500 ring-1 ring-sky-500/30'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div
                              className="w-7 h-7 rounded shrink-0 bg-cover bg-center border border-slate-700"
                              style={{ backgroundImage: `url(${tex.url})` }}
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-white block truncate">{tex.name}</span>
                              <span className="text-[8px] text-sky-400 font-mono block">
                                {tex.brand || 'Abet'} • {tex.code || 'HPL'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: QUINCALLERÍA Y HERRAJES JNF (ABSTRACTA) */}
            {activeTab === 'hardware' && (
              <div className="space-y-6">
                {/* Acabado PVD Titanium / Inox Satinado */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Acabado de Quincallería JNF
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(JNF_FINISHES).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => state.setHardwareFinish(f.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                          state.hardwareFinish === f.id
                            ? 'bg-sky-500/10 border-sky-500 shadow-md'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: f.colorHex }}
                        />
                        <div className="text-left overflow-hidden">
                          <span className="text-xs font-bold text-white block truncate">{f.name}</span>
                          <span className="text-[9px] text-slate-400">{f.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sistema de Rigidización Superior */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Estructura Aérea Superior
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => state.setStabilizerSystem('round_19')}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                        state.stabilizerSystem === 'round_19'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white">Tubo Redondo Ø19 mm (SM.010.A.19)</div>
                      <div className="text-[10px] text-slate-400">Diseño tradicional ligero con abrazaderas SM.002.19</div>
                    </button>

                    <button
                      onClick={() => state.setStabilizerSystem('square_20')}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                        state.stabilizerSystem === 'square_20'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white">Tubo Cuadrado 20x20 mm (SM.010.Q.20)</div>
                      <div className="text-[10px] text-slate-400">Sistema "Clean" con herrajes superiores ocultos</div>
                    </button>
                  </div>
                </div>

                {/* Modelos de Bisagras */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bisagras JNF
                  </h4>
                  <select
                    value={state.hingeModel}
                    onChange={(e) => state.setHingeModel(e.target.value as HingeModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sm_005_c_spring">SM.005.C - Bisagra con Muelle Autocierre Ajustable</option>
                    <option value="sm_005_e_spring_cover">SM.005.E - Bisagra con Muelle y Fijaciones Ocultas</option>
                    <option value="sm_006_b">SM.006.B - Bisagra Plana Heavy Duty Inox</option>
                    <option value="sm_005_b_free">SM.005.B - Bisagra Plana Libre</option>
                  </select>
                </div>

                {/* Modelos de Cierre */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cerrojo con Indicador
                  </h4>
                  <select
                    value={state.lockModel}
                    onChange={(e) => state.setLockModel(e.target.value as LockModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sm_031_easyfix">SM.031 - Cierre con Indicador "Easy Fix" (Rojo/Verde)</option>
                    <option value="sm_060_two_in_one">SM.060 - Two in One (Pomo y Cierre Integrado)</option>
                    <option value="sm_030_indicator">SM.030 - Cierre con Ranura Moneda / Llave Triangular</option>
                    <option value="sm_035_slide">SM.035 - Pasador Corredero Slide to Lock</option>
                  </select>
                </div>

                {/* Modelos de Patas Regulables */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pata Regulable al Suelo
                  </h4>
                  <select
                    value={state.footModel}
                    onChange={(e) => state.setFootModel(e.target.value as FootModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sm_017">SM.017 - Pata Cilíndrica Ø20mm Regulable (Inox AISI 304)</option>
                    <option value="sm_017_xl">SM.017.XL - Pata Alta Ø22mm Regulable Reforzada</option>
                    <option value="sm_070">SM.070 - Pata Cuadrada 20x20mm Minimalista</option>
                  </select>
                </div>

                {/* Modelos de Tiradores */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tirador de Puerta
                  </h4>
                  <select
                    value={state.handleModel}
                    onChange={(e) => state.setHandleModel(e.target.value as HandleModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="in_75_050_d">IN.75.050.D - Tirador Doble Tubular en D</option>
                    <option value="in_75_051_d">IN.75.051.D - Tirador Embutido Flush</option>
                    <option value="in_75_040">IN.75.040 - Tirador Barra Cuadrada</option>
                    <option value="in_75_041">IN.75.041 - Pomo Cilíndrico Macizo</option>
                  </select>
                </div>

                {/* Percheros y Colgadores */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Colgador / Percha Interior
                  </h4>
                  <select
                    value={state.hookModel}
                    onChange={(e) => state.setHookModel(e.target.value as HookModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sm_008_stopper">SM.008 - Percha con Tope de Goma Amortiguador</option>
                    <option value="in_14_010">IN.14.010 - Percha Simple Cilindro Inox</option>
                    <option value="in_14_020">IN.14.020 - Percha Cuadrada Minimalista</option>
                    <option value="in_14_546">IN.14.546 - Percha Curva Doble</option>
                  </select>
                </div>

                {/* Fijación a Muro Posterior */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Fijaciones a Muro Posterior
                  </h4>
                  <select
                    value={state.wallFixingModel}
                    onChange={(e) => state.setWallFixingModel(e.target.value as WallFixingModel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sm_024_clamp">SM.024 - Pinzas Rectangulares Abrazaderas (3 por panel)</option>
                    <option value="sm_004_bracket">SM.004 - Escuadras Angulares Inox Reforzadas</option>
                    <option value="sm_065_clamp">SM.065 - Abrazaderas Redondeadas Heavy Duty</option>
                    <option value="u_profile_continuous">Perfil en U Continuo Aluminio / Inox</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Mini Footer con Resumen de Costo y Placas */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                {bom.metrics.totalSheetsCount} Placas Abet ({bom.nesting.globalEfficiencyPct}% Rend.)
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ${bom.costs.totalBrutoClp.toLocaleString('es-CL')} (IVA Inc.)
              </span>
            </div>
            <button
              onClick={() => setViewMode('bom')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
            >
              Ver Desglose
            </button>
          </div>
        </aside>
      </div>

      {/* Modal de Configuración de Recinto */}
      <HplRoomPlannerModal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} />

      {/* Modal Guardar Proyecto */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        projectType="hpl-bathroom"
        defaultName="Proyecto Tabiquería Sanitaria HPL Arquify"
        estimatedCost={bom.costs.totalBrutoClp}
        projectData={{
          cubicles: state.cubicles,
          urinalScreens: state.urinalScreens,
          room: state.room,
          thicknessDoor: state.thicknessDoor,
          thicknessPilaster: state.thicknessPilaster,
          thicknessDivider: state.thicknessDivider,
          thicknessUrinal: state.thicknessUrinal,
          selectedColorId: state.selectedColorId,
          customTextureUrl: state.customTextureUrl,
          customTextureName: state.customTextureName,
          hardwareFinish: state.hardwareFinish,
          stabilizerSystem: state.stabilizerSystem,
          footModel: state.footModel,
          hingeModel: state.hingeModel,
          lockModel: state.lockModel,
          handleModel: state.handleModel,
          hookModel: state.hookModel,
          wallFixingModel: state.wallFixingModel,
        }}
        onSaved={(id) => {
          console.log('Proyecto HPL guardado con ID:', id);
        }}
      />
    </div>
  );
}
