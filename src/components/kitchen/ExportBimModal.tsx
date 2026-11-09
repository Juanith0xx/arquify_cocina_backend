import React, { useState } from 'react';
import { Box, Download, X, Layers, Cpu, FileText, CheckCircle2, Loader2, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';
import { useKitchenStore } from '../../store/kitchenStore';
import { useStore } from '../../store';
import { downloadKitchenBimZip, downloadKitchenIfcFile, downloadKitchenObjFile, downloadKitchen3dDxfFile, BimExportOptions } from '../../utils/cadBimExport';

interface ExportBimModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function ExportBimModal({ isOpen, onClose, isLight }: ExportBimModalProps) {
  const kState = useKitchenStore();
  const globalState = useStore();

  const [projectName, setProjectName] = useState(() => localStorage.getItem('arquify_project_name') || 'PROYECTO COCINA ARQUIFY');
  const [clientName, setClientName] = useState(() => localStorage.getItem('arquify_client_name') || 'CLIENTE PARTICULAR');
  const [includeWalls, setIncludeWalls] = useState(true);
  const [includeCountertop, setIncludeCountertop] = useState(true);
  const [includeSocle, setIncludeSocle] = useState(true);
  const [includeHandles, setIncludeHandles] = useState(true);
  const [unit, setUnit] = useState<'mm' | 'm'>('mm');

  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingFormat, setIsExportingFormat] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const realCabinets = kState.cabinets.filter(c => c.type !== 'decoration' && !c.variant?.startsWith('deco_'));

  const exportOptions: BimExportOptions = {
    projectName,
    clientName,
    includeWalls,
    includeCountertop,
    includeSocle,
    includeHandles,
    unit
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    setDownloadSuccess(false);
    try {
      await downloadKitchenBimZip(kState.cabinets, kState, exportOptions);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error al exportar pack BIM:', err);
      alert('Ocurrió un error al compilar el paquete ZIP 3D/BIM.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadIndividual = (format: 'ifc' | 'obj' | 'dxf') => {
    setIsExportingFormat(format);
    setDownloadSuccess(false);
    try {
      if (format === 'ifc') downloadKitchenIfcFile(kState.cabinets, kState, exportOptions);
      else if (format === 'obj') downloadKitchenObjFile(kState.cabinets, kState, exportOptions);
      else if (format === 'dxf') downloadKitchen3dDxfFile(kState.cabinets, kState, exportOptions);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(`Error al exportar archivo ${format}:`, err);
      alert(`Ocurrió un error al generar el archivo .${format.toUpperCase()}.`);
    } finally {
      setIsExportingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-900 border-white/10 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-zinc-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
              <Box size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Exportar Modelo 3D & OpenBIM</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30">
                  Universal CAD / BIM
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Descarga la cocina completa armada para Revit, Archicad, SketchUp, Blender o AutoCAD.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Banner de descarga recomendada: PACK COMPLETO .ZIP */}
          <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
            isLight
              ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border-orange-200 shadow-sm'
              : 'bg-gradient-to-r from-orange-950/30 via-zinc-900 to-amber-950/20 border-orange-500/30 shadow-lg'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderArchive className="text-orange-500" size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide text-orange-500">
                    📦 Paquete Completo 3D / BIM (.ZIP)
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Incluye <strong>.OBJ (+ .MTL)</strong>, <strong>.IFC (OpenBIM)</strong>, <strong>.DXF 3D</strong> y <strong>Memoria Técnica</strong> en un solo archivo comprimido listo para entregar.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono font-bold">
                    {realCabinets.length} Módulos Armados
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">
                    Escala 1:1 ({unit === 'mm' ? 'Milímetros' : 'Metros'})
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Comprimiendo...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Descargar Pack (.ZIP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatos Individuales */}
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              O descarga un formato específico:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tarjeta IFC */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 hover:border-orange-300' : 'bg-white/[0.03] border-white/10 hover:border-orange-500/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">.IFC</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      OpenBIM
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mb-1">Modelo BIM Paramétrico</h4>
                  <p className={`text-[11px] leading-snug mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Para <strong>Revit, Archicad, Allplan</strong> y visores IFC. Mantiene entidades y metadatos.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadIndividual('ifc')}
                  disabled={isExportingFormat === 'ifc'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-emerald-50 border-slate-300 hover:border-emerald-500 text-emerald-700'
                      : 'bg-white/5 hover:bg-emerald-500/20 border-white/10 hover:border-emerald-500 text-emerald-400'
                  }`}
                >
                  {isExportingFormat === 'ifc' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Bajar .IFC</span>
                </button>
              </div>

              {/* Tarjeta OBJ */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 hover:border-orange-300' : 'bg-white/[0.03] border-white/10 hover:border-orange-500/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">.OBJ + .MTL</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      3D Mesh
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mb-1">Geometría & Texturas 3D</h4>
                  <p className={`text-[11px] leading-snug mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Para <strong>SketchUp, Blender, 3ds Max, Lumion, Unreal</strong> y motores 3D.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadIndividual('obj')}
                  disabled={isExportingFormat === 'obj'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-blue-50 border-slate-300 hover:border-blue-500 text-blue-700'
                      : 'bg-white/5 hover:bg-blue-500/20 border-white/10 hover:border-blue-500 text-blue-400'
                  }`}
                >
                  {isExportingFormat === 'obj' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Bajar .OBJ</span>
                </button>
              </div>

              {/* Tarjeta DXF 3D */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 hover:border-orange-300' : 'bg-white/[0.03] border-white/10 hover:border-orange-500/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">.DXF 3D</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      AutoCAD
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mb-1">Malla CAD por Capas</h4>
                  <p className={`text-[11px] leading-snug mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Para <strong>AutoCAD, BricsCAD, ZWCAD</strong> con capas separadas (Bases, Aéreos, Cubiertas).
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadIndividual('dxf')}
                  disabled={isExportingFormat === 'dxf'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-purple-50 border-slate-300 hover:border-purple-500 text-purple-700'
                      : 'bg-white/5 hover:bg-purple-500/20 border-white/10 hover:border-purple-500 text-purple-400'
                  }`}
                >
                  {isExportingFormat === 'dxf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Bajar .DXF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Opciones de exportación */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opciones de Geometría
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Unidades:</span>
                <div className="flex rounded-lg border overflow-hidden border-slate-300 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setUnit('mm')}
                    className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      unit === 'mm'
                        ? 'bg-orange-500 text-black'
                        : isLight ? 'bg-white text-slate-700' : 'bg-black/40 text-slate-400'
                    }`}
                  >
                    mm (CAD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('m')}
                    className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      unit === 'm'
                        ? 'bg-orange-500 text-black'
                        : isLight ? 'bg-white text-slate-700' : 'bg-black/40 text-slate-400'
                    }`}
                  >
                    m (BIM)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCountertop}
                  onChange={(e) => setIncludeCountertop(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="font-semibold">Cubiertas Qstone</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSocle}
                  onChange={(e) => setIncludeSocle(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="font-semibold">Zócalos de Piso</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHandles}
                  onChange={(e) => setIncludeHandles(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="font-semibold">Tiradores 3D</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWalls}
                  onChange={(e) => setIncludeWalls(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="font-semibold">Muros de Estancia</span>
              </label>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} />
              <span>¡Archivo generado con éxito! Iniciando descarga en tu navegador.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-3.5 border-t text-xs ${
          isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/10 bg-zinc-950/60 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="font-bellota font-bold text-base text-orange-500">arquify</span>
            <span>CAD / BIM Interoperability</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
