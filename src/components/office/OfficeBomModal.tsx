import React from 'react';
import { X, FileSpreadsheet, FileText, DollarSign, Users, Briefcase, Presentation, Archive, Check } from 'lucide-react';
import { useOfficeStore, MELAMINE_FINISHES, METAL_FINISHES } from '../../store/officeStore';
import { exportOfficeProjectToExcel } from '../../utils/officeExcelGenerator';
import { exportOfficeProjectToPdf } from '../../utils/officePdfGenerator';
import { PlacedOfficeItem } from '../../types/office';

interface OfficeBomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficeBomModal({ isOpen, onClose }: OfficeBomModalProps) {
  const placedItems = useOfficeStore((state) => state.placedItems);
  const floorPlan = useOfficeStore((state) => state.floorPlan);
  const getProjectStats = useOfficeStore((state) => state.getProjectStats);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  if (!isOpen) return null;

  const stats = getProjectStats();

  // Agrupar items idénticos
  const groupedMap: { [key: string]: { item: PlacedOfficeItem; count: number; subtotal: number } } = {};
  placedItems.forEach((item) => {
    const key = `${item.type}-${item.dimensionsCm.width}-${item.melamineFinish}-${item.metalFinish}`;
    if (!groupedMap[key]) {
      groupedMap[key] = { item, count: 0, subtotal: 0 };
    }
    groupedMap[key].count += 1;
    groupedMap[key].subtotal += item.priceClp;
  });

  const handleExportExcel = () => {
    exportOfficeProjectToExcel(placedItems, stats, 'Proyecto_Mobiliario_Oficina');
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportOfficeProjectToPdf(placedItems, stats, floorPlan, 'Propuesta_Mobiliario_Oficina');
    } catch (e) {
      console.error('Error generando PDF de oficina:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Cubicación & Presupuesto de Mobiliario
              </h2>
              <p className="text-xs text-slate-400">
                Desglose técnico de módulos, sillería, electrificación y costos de fabricación.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Métricas de Capacidad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1">
                <Users size={15} /> Puestos Operativos
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stats.workstationsCount}</p>
              <p className="text-[10px] text-slate-500">Operadores Open Space</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Briefcase size={15} /> Gerencia / Privadas
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stats.executiveCount}</p>
              <p className="text-[10px] text-slate-500">Oficinas ejecutivas</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Presentation size={15} /> Salas de Reunión
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stats.meetingSeatsCount}</p>
              <p className="text-[10px] text-slate-500">Asientos directorio/salas</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold mb-1">
                <DollarSign size={15} /> Presupuesto Total
              </div>
              <p className="text-2xl font-bold text-orange-400 font-mono">
                ${stats.totalCostClp.toLocaleString('es-CL')}
              </p>
              <p className="text-[10px] text-orange-300/70">IVA 19% Incluido</p>
            </div>
          </div>

          {/* Tabla de Despiece */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-slate-400 font-bold uppercase text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Módulo de Mobiliario</th>
                  <th className="p-3">Dimensiones</th>
                  <th className="p-3">Cubierta MDP</th>
                  <th className="p-3">Estructura</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Unitario</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                {Object.values(groupedMap).map(({ item, count, subtotal }, idx) => {
                  const mel = MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish)?.name || 'Estándar';
                  const met = METAL_FINISHES.find((m) => m.id === item.metalFinish)?.name || 'Negro MT';
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{item.name}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {item.dimensionsCm.width}x{item.dimensionsCm.depth}x{item.dimensionsCm.height} cm
                      </td>
                      <td className="p-3 text-slate-300">{mel}</td>
                      <td className="p-3 text-slate-300">{met}</td>
                      <td className="p-3 text-center font-bold text-orange-400">{count}</td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        ${item.priceClp.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        ${subtotal.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Excel (XLSX)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <FileText size={15} />
              <span>{isExportingPdf ? 'Generando PDF...' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
