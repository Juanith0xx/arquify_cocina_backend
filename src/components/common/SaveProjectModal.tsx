import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  X,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Cloud,
  HardDrive,
  FolderKanban,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { useAdminStore, ProjectType, ProjectItem } from '../../store/adminStore';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { useTenantDataStore } from '../../store/tenantDataStore';
import { exportKitchenCommercialPdf } from '../../utils/kitchenCommercialPdfGenerator';
import { useKitchenStore } from '../../store/kitchenStore';
import { useStore as useClosetStore } from '../../store';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectType: ProjectType;
  projectData: any;
  defaultProjectName?: string;
  defaultName?: string;
  defaultClientName?: string;
  estimatedCostClp?: number;
  estimatedCost?: number;
  onOpenBackoffice?: () => void;
  onSaved?: (id: string) => void;
}

export function SaveProjectModal({
  isOpen,
  onClose,
  projectType,
  projectData,
  defaultProjectName = '',
  defaultName = '',
  defaultClientName = '',
  estimatedCostClp = 0,
  estimatedCost = 0,
  onOpenBackoffice,
  onSaved,
}: SaveProjectModalProps) {
  const effectiveDefaultName = defaultProjectName || defaultName;
  const effectiveEstimatedCost = estimatedCostClp || estimatedCost || 0;
  const { saveProject, projects } = useAdminStore();
  const { user: supabaseUser, tenant: supabaseTenant } = useSupabaseAuthStore();
  const { saveProjectToCloud } = useTenantDataStore();

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [costClp, setCostClp] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [savedThumbnail, setSavedThumbnail] = useState<string | undefined>(undefined);

  // Al abrir, inicializar valores por defecto coherentes
  useEffect(() => {
    if (isOpen) {
      const typeLabel =
        projectType === 'kitchen'
          ? 'Cocina Integral'
          : projectType === 'closet'
          ? 'Clóset Modular'
          : projectType === 'special'
          ? 'Mueble Especial de Autor'
          : projectType === 'hpl-bathroom'
          ? 'Tabiquería Sanitaria HPL'
          : projectType === 'office'
          ? 'Mobiliario de Oficina'
          : 'Diseño de Sillas';

      const dateStr = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      setName(effectiveDefaultName || `${typeLabel} - ${dateStr}`);
      setClientName(defaultClientName || 'Cliente Particular');
      setClientEmail('');
      setClientPhone('');
      setDescription(
        `Proyecto paramétrico diseñado en configurador 3D (${typeLabel}) con cubicación industrial y despiece listo para fabricación.`
      );
      setCostClp(effectiveEstimatedCost || 1500000);
      setSavedSuccessId(null);
      setSavedThumbnail(undefined);
      setIsSaving(false);
    }
  }, [isOpen, projectType, effectiveDefaultName, defaultClientName, effectiveEstimatedCost]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);

    try {
      // Capturar vista 3D del canvas
      let thumbnail: string | undefined = undefined;
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          thumbnail = canvas.toDataURL('image/png');
          setSavedThumbnail(thumbnail);
        }
      } catch (e) {
        console.warn('No se pudo capturar miniatura 3D:', e);
      }

      // 1. Guardar en AdminStore (LocalStorage persistente)
      const localId = saveProject({
        name: name.trim(),
        client: clientName.trim() || 'Cliente General',
        type: projectType,
        description: description.trim() || 'Diseño paramétrico guardado',
        totalCostEstimateClp: costClp > 0 ? costClp : 1000000,
        data: projectData,
        thumbnail,
      });

      // 2. Si Supabase está autenticado, sincronizar a la nube
      if (supabaseUser && supabaseTenant) {
        try {
          const cloudTypeMap: Record<ProjectType, 'kitchen' | 'closet' | 'special_furniture'> = {
            kitchen: 'kitchen',
            closet: 'closet',
            special: 'special_furniture',
            'hpl-bathroom': 'special_furniture',
            office: 'special_furniture',
            chair: 'special_furniture',
          };

          await saveProjectToCloud({
            code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
            name: name.trim(),
            client_name: clientName.trim() || 'Cliente General',
            client_email: clientEmail.trim() || undefined,
            client_phone: clientPhone.trim() || undefined,
            project_type: cloudTypeMap[projectType],
            status: 'draft',
            total_area_m2: projectData?.totalFloorM2 || projectData?.currentAreaM2 || 0,
            total_sheets_count: projectData?.totalSheets || 0,
            material_cost: costClp * 0.6,
            hardware_cost: costClp * 0.15,
            total_price: costClp,
            config_json: projectData,
          });
        } catch (cloudErr) {
          console.warn('No se pudo sincronizar a Supabase, guardado en Local exitoso:', cloudErr);
        }
      }

      setSavedSuccessId(localId);
      onSaved?.(localId);
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
      alert('Hubo un error al guardar el proyecto. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCommercialPdfAfterSave = () => {
    try {
      const kState = useKitchenStore.getState();
      const gState = useClosetStore.getState();
      const cabinets = projectData?.cabinets || kState.cabinets || [];
      const countertopConfig = projectData?.countertopConfig || kState.countertopConfig;
      const qstoneCatalog = kState.qstoneCatalog;

      exportKitchenCommercialPdf({
        projectName: name.trim(),
        cabinets,
        state: {
          ...gState,
          structureColor: projectData?.structureColor || gState.structureColor,
          doorColor: projectData?.doorColor || gState.doorColor,
          drawerFrontColor: projectData?.drawerFrontColor || gState.drawerFrontColor,
          socleHeight: projectData?.socleHeight || kState.socleHeight,
          socleFinish: projectData?.socleFinish || kState.socleFinish,
          drawerHardware: projectData?.drawerHardware || gState.drawerHardware,
          golaSystem: projectData?.golaSystem || kState.golaSystem,
        },
        countertopConfig,
        qstoneCatalog,
        userInfo: {
          fullName: clientName.trim() || undefined,
          email: clientEmail.trim() || undefined,
          phone: clientPhone.trim() || undefined,
        },
        screenshotUrl: savedThumbnail,
        estimatedTotalClp: costClp,
      });
    } catch (err) {
      console.error('Error al generar PDF comercial desde modal:', err);
    }
  };

  const getTypeName = () => {
    switch (projectType) {
      case 'kitchen':
        return 'Cocina Integral 3D';
      case 'closet':
        return 'Clóset Modular';
      case 'special':
        return 'Muebles Especiales';
      case 'hpl-bathroom':
        return 'Tabiquería Sanitaria HPL';
      case 'office':
        return 'Mobiliario de Oficina';
      case 'chair':
        return 'Sillas y Estructuras';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Save size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Guardar Proyecto en Backoffice
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {getTypeName()}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Almacena el diseño 3D, despiece y cotización para recuperarlo o gestionarlo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {savedSuccessId ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">¡Proyecto Guardado con Éxito!</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  El proyecto <strong className="text-white font-semibold">"{name}"</strong> ya está registrado en el Backoffice y listo para cotizaciones, exportación de planos o edición continua.
                </p>
              </div>

              {/* Badges de almacenamiento */}
              <div className="flex items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 text-slate-300 rounded-lg text-xs font-medium">
                  <HardDrive size={14} className="text-orange-400" />
                  Almacenamiento Local Activo
                </span>
                {supabaseUser && supabaseTenant && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded-lg text-xs font-medium">
                    <Cloud size={14} className="text-sky-400" />
                    Sincronizado en Nube ({supabaseTenant.name})
                  </span>
                )}
              </div>

              {/* Botones de acción posterior */}
              <div className="w-full pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCommercialPdfAfterSave}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  <Download size={16} />
                  Descargar Cotización PDF (Vistas 3D & Precios)
                </button>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenBackoffice) onOpenBackoffice();
                    }}
                    className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700"
                  >
                    <FolderKanban size={15} className="text-orange-400" />
                    Ver en Mis Proyectos
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-zinc-800"
                  >
                    Seguir Diseñando
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Sincronización Indicator */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <HardDrive size={15} className="text-orange-400 shrink-0" />
                  <span>Base de datos: <strong className="text-white">Admin Backoffice</strong></span>
                </div>
                {supabaseUser && supabaseTenant ? (
                  <span className="text-sky-400 flex items-center gap-1 font-semibold text-[11px]">
                    <Cloud size={13} /> {supabaseTenant.name}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Local persistente</span>
                )}
              </div>

              {/* Nombre del Proyecto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre del Proyecto <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cocina Integral Roble & Grafito"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Cliente / Mandante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cliente / Mandante
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre del cliente o empresa"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Presupuesto Estimado (CLP)
                  </label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      value={costClp}
                      onChange={(e) => setCostClp(Number(e.target.value))}
                      placeholder="1500000"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Contacto Opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Teléfono Contacto (Opcional)
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@ejemplo.cl"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción / Notas */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Observaciones / Notas Técnicas
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre especificaciones, herrajes especiales o plazos de entrega..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-600/20"
                >
                  <Save size={15} />
                  {isSaving ? 'Guardando...' : 'Guardar en Backoffice'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
