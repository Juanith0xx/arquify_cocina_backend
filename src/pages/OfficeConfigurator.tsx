import React, { useState } from 'react';
import {
  ArrowLeft,
  Box,
  Layers,
  FileText,
  DollarSign,
  Save,
  RotateCcw,
  Compass,
  Upload,
  Eye,
  Camera,
  Grid,
  Sparkles,
} from 'lucide-react';
import { useOfficeStore } from '../store/officeStore';
import { OfficeCatalogSidebar } from '../components/office/OfficeCatalogSidebar';
import { OfficeFloorPlanner2D } from '../components/office/OfficeFloorPlanner2D';
import { OfficeScene3D } from '../components/office/OfficeScene3D';
import { PDFPlanLoaderModal } from '../components/office/PDFPlanLoaderModal';
import { OfficeBomModal } from '../components/office/OfficeBomModal';
import { SaveProjectModal } from '../components/common/SaveProjectModal';

interface OfficeConfiguratorProps {
  onNavigate?: () => void;
}

export default function OfficeConfigurator({ onNavigate }: OfficeConfiguratorProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const viewMode = useOfficeStore((state) => state.viewMode);
  const setViewMode = useOfficeStore((state) => state.setViewMode);
  const cameraAngle = useOfficeStore((state) => state.cameraAngle);
  const setCameraAngle = useOfficeStore((state) => state.setCameraAngle);
  const floorPlan = useOfficeStore((state) => state.floorPlan);
  const placedItems = useOfficeStore((state) => state.placedItems);
  const clearAllItems = useOfficeStore((state) => state.clearAllItems);
  const getProjectStats = useOfficeStore((state) => state.getProjectStats);

  const stats = getProjectStats();

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-white overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate ? onNavigate() : window.history.back()}
            className="p-2 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Volver al Menú Principal"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />

          <span className="font-bellota text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">
            arquify
          </span>

          <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">
                CONFIGURADOR DE OFICINA
              </span>
              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 text-slate-300 text-[9px] font-mono font-bold rounded">
                SPACE PLANNING 2D / 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Amoblamiento sobre planos de arquitectura PDF & renderizado paramétrico
            </p>
          </div>
        </div>

        {/* Center: 2D vs 3D View Switcher */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode('2d-plan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === '2d-plan'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers size={14} />
            <span>Planta 2D</span>
          </button>

          <button
            onClick={() => setViewMode('3d')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Box size={14} />
            <span>Render 3D</span>
          </button>
        </div>

        {/* Right: Actions (Cargar PDF, Cubicación, Guardar) */}
        <div className="flex items-center gap-2">
          {/* Cargar PDF / Plano */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              floorPlan.fileUrl
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-slate-200'
            }`}
          >
            <Upload size={14} />
            <span className="hidden md:inline">
              {floorPlan.fileUrl ? 'Plano PDF Cargado' : 'Cargar Plano PDF'}
            </span>
          </button>

          {/* Cubicación & Presupuesto */}
          <button
            onClick={() => setIsBomModalOpen(true)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <DollarSign size={14} className="text-orange-400" />
            <span className="hidden md:inline">Cubicación</span>
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-[10px] font-mono">
              {stats.totalItems}
            </span>
          </button>

          {/* Guardar Proyecto */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
          >
            <Save size={14} />
            <span className="hidden md:inline">Guardar</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Catalog */}
        <OfficeCatalogSidebar />

        {/* Center View Area (2D Floor Planner or 3D Scene) */}
        <main className="flex-1 relative h-full w-full overflow-hidden bg-zinc-950">
          {viewMode === '2d-plan' ? <OfficeFloorPlanner2D /> : <OfficeScene3D />}

          {/* Sub-barra de controles de cámara 3D si está en modo 3D */}
          {viewMode === '3d' && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-1.5 rounded-xl shadow-xl text-xs text-white">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
                <Camera size={12} className="text-orange-400" /> Vistas:
              </span>
              <button
                onClick={() => setCameraAngle('iso-ne')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraAngle === 'iso-ne'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-zinc-800'
                }`}
              >
                Isométrica NE
              </button>
              <button
                onClick={() => setCameraAngle('iso-nw')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraAngle === 'iso-nw'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-zinc-800'
                }`}
              >
                Isométrica NW
              </button>
              <button
                onClick={() => setCameraAngle('top')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraAngle === 'top'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-zinc-800'
                }`}
              >
                Planta Cenital
              </button>
              <button
                onClick={() => setCameraAngle('perspective')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraAngle === 'perspective'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-zinc-800'
                }`}
              >
                Perspectiva
              </button>
            </div>
          )}

          {/* Resumen flotante de capacidad en esquina inferior izquierda */}
          <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-4 text-slate-300 shadow-xl pointer-events-none">
            <div>
              <span className="text-[10px] text-slate-500 block">Capacidad Operativa</span>
              <span className="font-bold text-white font-mono">{stats.workstationsCount} puestos</span>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-slate-500 block">Gerencia / Privadas</span>
              <span className="font-bold text-white font-mono">{stats.executiveCount} oficinas</span>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-slate-500 block">Salas de Reunión</span>
              <span className="font-bold text-white font-mono">{stats.meetingSeatsCount} personas</span>
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      <PDFPlanLoaderModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />

      <OfficeBomModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
      />

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        projectType="office"
        projectData={{ placedItems, floorPlan }}
        estimatedCostClp={stats.totalCostClp}
        defaultProjectName="Proyecto Mobiliario Corporativo"
      />
    </div>
  );
}
