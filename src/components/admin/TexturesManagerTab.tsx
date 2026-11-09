import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  RotateCcw,
  Palette,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  DollarSign,
  Percent,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { useAdminStore, CustomTextureItem, ProviderItem } from '../../store/adminStore';
import { useStore as useClosetStore } from '../../store';
import { useKitchenStore } from '../../store/kitchenStore';

interface TexturesManagerTabProps {
  currentProviderId?: string; // Si se encuentra en sesión de proveedor
  currentProviderName?: string;
  isSuperAdmin?: boolean;
}

function compressImageFile(file: File, maxDim = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
}

export function TexturesManagerTab({ currentProviderId, currentProviderName, isSuperAdmin = true }: TexturesManagerTabProps) {
  const {
    textures,
    providers,
    addTexture,
    updateTexture,
    toggleTextureActive,
    approveTexture,
    rejectTexture,
    deleteTexture,
    resetTexturesToDefault,
    themeMode
  } = useAdminStore();
  const isLight = themeMode === 'light';

  const matchedProvider = useMemo(() => {
    if (!currentProviderId && !currentProviderName) return undefined;
    return providers.find(
      (p) =>
        (currentProviderId && p.id === currentProviderId) ||
        (currentProviderName && p.name.toLowerCase().includes(currentProviderName.toLowerCase())) ||
        (currentProviderName && currentProviderName.toLowerCase().includes(p.name.toLowerCase()))
    );
  }, [providers, currentProviderId, currentProviderName]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<'all' | 'maderas' | 'solidos' | 'hpl_autor' | 'piedras_marmoles'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>(
    matchedProvider?.id || currentProviderId || 'all'
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const [approvalMode, setApprovalMode] = useState<'approved' | 'pending'>(isSuperAdmin ? 'approved' : 'pending');

  // Form State para nueva terminación
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    matchedProvider?.id || currentProviderId || (providers[0]?.id ?? 'prov-masisa')
  );
  const [category, setCategory] = useState<'maderas' | 'solidos' | 'hpl_autor' | 'piedras_marmoles'>('maderas');
  const [finish, setFinish] = useState('Poro Sincronizado');
  const [thicknessMm, setThicknessMm] = useState<number>(18);
  const [sheetWidthM, setSheetWidthM] = useState<number>(1.83);
  const [sheetHeightM, setSheetHeightM] = useState<number>(2.50);
  const [sheetFormat, setSheetFormat] = useState('1.83 x 2.50 m');
  const [priceSheetClp, setPriceSheetClp] = useState(48000); // Valor de venta final
  const [stock, setStock] = useState<number>(30); // Stock disponible en planchas
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener proveedor activo del formulario
  const currentSelectedProvider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) || matchedProvider || providers[0] || {
      id: currentProviderId || 'prov-default',
      name: currentProviderName || 'Proveedor General',
      commissionPercentage: 15
    };
  }, [providers, selectedProviderId, matchedProvider, currentProviderId, currentProviderName]);

  const commissionPct = currentSelectedProvider.commissionPercentage ?? 15;
  const arquifyRetainedClp = Math.round((priceSheetClp * commissionPct) / 100);
  const providerNetPayoutClp = priceSheetClp - arquifyRetainedClp;

  // Formato m² según ancho y largo métricos
  const calculatedM2 = useMemo(() => {
    const w = Number(sheetWidthM) || 1.83;
    const h = Number(sheetHeightM) || 2.50;
    return Math.max(0.1, Math.round(w * h * 1000) / 1000);
  }, [sheetWidthM, sheetHeightM]);

  const priceM2Clp = Math.round(priceSheetClp / calculatedM2);

  const isMyTexture = (t: CustomTextureItem) => {
    if (isSuperAdmin) return true;
    const targetId = matchedProvider?.id || currentProviderId;
    const targetName = matchedProvider?.name || currentProviderName;
    if (targetId && t.providerId === targetId) return true;
    if (targetName) {
      const tn = targetName.toLowerCase();
      const brand = (t.brand || '').toLowerCase();
      const pName = (t.providerName || '').toLowerCase();
      if (brand.includes(tn) || tn.includes(brand) || pName.includes(tn) || tn.includes(pName)) return true;
    }
    return false;
  };

  // Conteo de pendientes de VB
  const pendingCount = useMemo(() => {
    return textures.filter((t) => isMyTexture(t) && t.approvalStatus === 'pending').length;
  }, [textures, isSuperAdmin, matchedProvider, currentProviderId, currentProviderName]);

  const approvedCount = useMemo(() => {
    return textures.filter((t) => isMyTexture(t) && (t.approvalStatus === 'approved' || !t.approvalStatus)).length;
  }, [textures, isSuperAdmin, matchedProvider, currentProviderId, currentProviderName]);

  // Filtrado de texturas
  const filteredTextures = textures.filter((t) => {
    // Aislamiento RBAC estricto si es sesión de proveedor
    if (!isMyTexture(t)) return false;

    // Filtro por proveedor si aplica (Superadmin)
    if (selectedProviderFilter !== 'all') {
      const p = providers.find((pr) => pr.id === selectedProviderFilter);
      const matchesProvider =
        t.providerId === selectedProviderFilter ||
        (p && t.providerName?.toLowerCase().includes(p.name.toLowerCase())) ||
        (p && t.brand.toLowerCase().includes(p.name.toLowerCase()));
      if (!matchesProvider) return false;
    }

    // Filtro por estado de aprobación
    const currentApproval = t.approvalStatus || 'approved';
    if (statusFilter !== 'all' && currentApproval !== statusFilter) {
      return false;
    }

    // Filtro por categoría
    if (selectedCat !== 'all' && t.category !== selectedCat) {
      return false;
    }

    // Filtro por texto
    if (searchTerm.trim()) {
      const st = searchTerm.toLowerCase();
      const match =
        t.name.toLowerCase().includes(st) ||
        t.code.toLowerCase().includes(st) ||
        t.brand.toLowerCase().includes(st) ||
        (t.providerName && t.providerName.toLowerCase().includes(st)) ||
        t.finish.toLowerCase().includes(st);
      if (!match) return false;
    }

    return true;
  });

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
        alert('Por favor seleccione un archivo de imagen (.jpg, .png, .svg, .webp)');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 800, 0.82);
        setPreviewUrl(compressed);
      } catch (err) {
        console.error('Error al procesar la imagen:', err);
      }
    }
  };

  const handleCreateTexture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !previewUrl) {
      alert('Por favor ingrese un nombre y cargue una imagen o textura para el renderizado.');
      return;
    }

    // Si quien crea es un proveedor o superadmin especificando flujo de aprobación:
    const initialApprovalStatus = isSuperAdmin ? approvalMode : 'pending';

    const formattedFormat = `${sheetWidthM} x ${sheetHeightM} m`;

    const newId = addTexture({
      name: name.trim(),
      code: code.trim() || `PRV-${Math.floor(Math.random() * 9000 + 1000)}`,
      brand: currentSelectedProvider.name,
      category,
      finish,
      sheetFormat: formattedFormat,
      thicknessMm: Number(thicknessMm) || 18,
      sheetWidthM: Number(sheetWidthM),
      sheetHeightM: Number(sheetHeightM),
      priceSheetClp: Number(priceSheetClp),
      priceM2Clp,
      url: previewUrl,
      previewUrl: previewUrl,
      active: initialApprovalStatus === 'approved',
      providerId: currentSelectedProvider.id,
      providerName: currentSelectedProvider.name,
      commissionPercentage: commissionPct,
      providerNetPriceClp: providerNetPayoutClp,
      approvalStatus: initialApprovalStatus,
      stock: Math.max(0, Number(stock) || 0)
    });

    // Inyectar en el store de Clóset / TexturesSection sólo si está aprobado Y NO es piedra
    const isStoneNew =
      category === 'piedras_marmoles' ||
      currentSelectedProvider.name.toLowerCase().includes('qstone') ||
      currentSelectedProvider.name.toLowerCase().includes('sysprotec') ||
      name.toLowerCase().includes('qstone');

    if (initialApprovalStatus === 'approved') {
      if (!isStoneNew) {
        const closetStore = useClosetStore.getState();
        if (closetStore.customTextures) {
          closetStore.setCustomTextures([
            ...closetStore.customTextures,
            { id: newId, name: name.trim(), url: previewUrl },
          ]);
        }
      } else {
        const isSintered = name.toLowerCase().includes('sinteriz') || category === 'piedras_marmoles';
        useKitchenStore.getState().addQstoneCatalogItem({
          id: newId,
          code: code.trim() || 'QS-CUSTOM',
          name: name.trim(),
          materialType: isSintered ? 'sinterizado' : 'quarzo',
          thicknessMm: name.includes('20') ? 20 : (name.includes('18') ? 18 : 12),
          priceM2Clp: priceM2Clp || Math.round(priceSheetClp / 3.965) || 280000,
          sheetWidthMm: 3200,
          sheetHeightMm: 1600,
          colorHex: previewUrl.startsWith('#') ? previewUrl : '#F5F5F7',
          textureUrl: previewUrl,
          finish: finish || 'Pulido Seda',
          description: `${currentSelectedProvider.name} - Formato Placa`,
          active: true,
        });
      }
      showToast(`Terminación "${name}" creada y aprobada de inmediato.`, 'success');
    } else {
      showToast(`Terminación "${name}" enviada a revisión. Queda PENDIENTE de VB del Superadministrador.`, 'warning');
    }

    setIsFormOpen(false);
    setName('');
    setCode('');
    setPreviewUrl('');
  };

  const handleApprove = (id: string, texName: string) => {
    approveTexture(id);
    // Inyectar al catálogo 3D activo
    const target = textures.find((t) => t.id === id);
    if (target) {
      const isStone = 
        target.category === 'piedras_marmoles' ||
        target.brand?.toLowerCase().includes('qstone') ||
        target.brand?.toLowerCase().includes('sysprotec') ||
        target.name.toLowerCase().includes('qstone') ||
        target.providerName?.toLowerCase().includes('qstone') ||
        target.providerName?.toLowerCase().includes('sysprotec');

      const closetStore = useClosetStore.getState();
      if (closetStore.customTextures) {
        if (!isStone) {
          closetStore.setCustomTextures([
            ...closetStore.customTextures.filter((t) => t.id !== target.id),
            { id: target.id, name: target.name, url: target.url },
          ]);
        } else {
          closetStore.setCustomTextures(
            closetStore.customTextures.filter((t) => t.id !== target.id)
          );
        }
      }

      // Sincronizar catálogo Cocina Qstone si es piedra / qstone
      if (isStone) {
        const isSintered =
          target.name.toLowerCase().includes('sinteriz') ||
          target.finish?.toLowerCase().includes('sinteriz') ||
          target.category === 'piedras_marmoles';

        const priceM2 = target.priceM2Clp || Math.round((target.priceSheetClp || 280000) / 3.965) || 280000;

        useKitchenStore.getState().addQstoneCatalogItem({
          id: target.id,
          code: target.code || 'QS-CUSTOM',
          name: target.name,
          materialType: isSintered ? 'sinterizado' : 'quarzo',
          thicknessMm: target.name.includes('20') ? 20 : (target.name.includes('18') ? 18 : 12),
          priceM2Clp: priceM2,
          sheetWidthMm: 3200,
          sheetHeightMm: 1600,
          colorHex: target.url && target.url.startsWith('#') ? target.url : '#F5F5F7',
          textureUrl: target.url || target.previewUrl,
          finish: target.finish || 'Pulido Seda',
          description: `${target.brand || 'SYSPROTEC (QSTONE)'} - ${target.finish || 'Formato Placa'}`,
          active: true,
        });
      }
    }
    showToast(`¡VB otorgado con éxito! "${texName}" ya está activo en el configurador 3D y catálogo de cubiertas.`, 'success');
  };

  const handleReject = (id: string, texName: string) => {
    const reason = window.prompt(`Indique motivo de rechazo para "${texName}" (opcional):`, 'Ajustar resolución de textura o valor final');
    rejectTexture(id, reason || 'No cumple con las especificaciones técnicas requeridas.');
    showToast(`Terminación "${texName}" rechazada.`, 'warning');
  };

  const handleToggle = (id: string, texName: string) => {
    toggleTextureActive(id);
    showToast(`Visibilidad de "${texName}" actualizada.`);
  };

  const handleDelete = (id: string, texName: string) => {
    if (window.confirm(`¿Eliminar la textura "${texName}" del catálogo?`)) {
      deleteTexture(id);
      showToast(`Textura eliminada del catálogo.`, 'info');
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Restaurar catálogo de texturas y decorativos de fábrica?')) {
      resetTexturesToDefault();
      showToast('Catálogo de texturas restaurado de fábrica.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : toastMsg.type === 'warning'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : toastMsg.type === 'warning' ? (
              <Clock size={16} />
            ) : (
              <Info size={16} />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Banner Informativo del Flujo de Proveedores */}
      <div
        className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isLight
            ? 'bg-amber-500/10 border-amber-300 text-zinc-900 shadow-sm'
            : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-amber-500/30 text-white'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl mt-0.5 border border-amber-500/40">
            <Building size={20} />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Gestión de Catálogo y Terminaciones por Proveedor
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-black font-extrabold text-[10px] rounded-full animate-pulse">
                  {pendingCount} Pendiente{pendingCount > 1 ? 's' : ''} de VB
                </span>
              )}
            </h3>
            <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Los proveedores cargan sus valores de venta final y formatos. Todo nuevo diseño o cambio de precio queda{' '}
              <strong className="text-amber-600 dark:text-amber-300 font-bold">Pendiente de VB</strong> del Superadministrador antes de publicarse en los configuradores 3D.
            </p>
          </div>
        </div>

        {/* Botones de Estado de Aprobación */}
        <div
          className={`flex items-center gap-2 p-1.5 rounded-xl border shrink-0 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
          }`}
        >
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? isLight
                  ? 'bg-zinc-900 text-white shadow'
                  : 'bg-zinc-800 text-white shadow'
                : isLight
                ? 'text-zinc-600 hover:text-zinc-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({textures.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black shadow font-extrabold'
                : 'text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            <Clock size={13} />
            Pendientes VB ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-500 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 size={13} />
            Aprobados ({approvedCount})
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div
        className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-zinc-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar terminación o código..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
              }`}
            />
          </div>

          {/* Filtro por Proveedor (Solo Superadmin) o Badge Proveedor */}
          <div className="w-full sm:w-56">
            {isSuperAdmin ? (
              <select
                value={selectedProviderFilter}
                onChange={(e) => setSelectedProviderFilter(e.target.value)}
                className={`w-full py-2 px-3 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-800' : 'bg-zinc-950 border-zinc-800 text-slate-200'
                }`}
              >
                <option value="all">Todos los Proveedores</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.commissionPercentage}% Com.)
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-500 font-semibold">
                <Building size={14} className="text-orange-500 shrink-0" />
                <span className="truncate">{matchedProvider?.name || currentProviderName || 'Mi Catálogo'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtro por Categorías */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}
        >
          {[
            { id: 'all', label: 'Todas' },
            { id: 'maderas', label: 'Melaminas Madera' },
            { id: 'solidos', label: 'Sólidos & Soft' },
            { id: 'hpl_autor', label: 'HPL Abet Laminati' },
            { id: 'piedras_marmoles', label: 'Piedras & Mármol' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCat(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                selectedCat === tab.id
                  ? 'bg-orange-500 text-white shadow font-bold'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0 transition-all cursor-pointer"
          >
            <Plus size={16} /> Cargar Terminación
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleReset}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-white'
              }`}
              title="Restaurar catálogo de fábrica"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modal / Formulario de Carga de Terminación */}
      {isFormOpen && (
        <form
          onSubmit={handleCreateTexture}
          className="p-5 bg-zinc-900 border border-orange-500/40 rounded-2xl space-y-4 shadow-xl animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
                <Palette size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isSuperAdmin ? 'Cargar Nueva Terminación / Producto' : `Cargar Producto a Mi Catálogo (${matchedProvider?.name || currentProviderName || 'Proveedor'})`}
              </h3>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campos de texto e información comercial */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1">Proveedor *</label>
                {isSuperAdmin ? (
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Comisión Arquify: {p.commissionPercentage}%)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full p-2.5 bg-zinc-950/80 border border-zinc-700 rounded-xl text-xs text-orange-400 font-semibold flex items-center gap-2">
                    <Building size={14} className="text-orange-500 shrink-0" />
                    <span>{currentSelectedProvider.name} (Comisión: {commissionPct}%)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1">Nombre del Diseño / Terminación *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roble Cava Seda"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1">Código de Catálogo / SKU / SAP</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej. SAP-2831 / MAS-401"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as any;
                    setCategory(newCat);
                    if (newCat === 'hpl_autor') {
                      setThicknessMm(0.9);
                      setSheetWidthM(1.30);
                      setSheetHeightM(3.05);
                    } else if (newCat === 'piedras_marmoles') {
                      setThicknessMm(20);
                      setSheetWidthM(1.60);
                      setSheetHeightM(3.20);
                    } else {
                      setThicknessMm(18);
                      setSheetWidthM(1.83);
                      setSheetHeightM(2.50);
                    }
                  }}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="maderas">Melaminas & Maderas</option>
                  <option value="solidos">Sólidos & Soft Unicolores</option>
                  <option value="hpl_autor">HPL De Autor / Abet Laminati</option>
                  <option value="piedras_marmoles">Piedras, Mármol & Cementos</option>
                </select>
              </div>

              {/* Espesor de Plancha (15mm, 18mm, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] uppercase font-bold text-zinc-400">
                    Espesor Técnico
                  </label>
                  <span className="text-[10px] font-mono font-bold text-orange-400">
                    {thicknessMm} mm
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setThicknessMm(15)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                      thicknessMm === 15
                        ? 'bg-orange-500 text-black border-orange-500 font-extrabold shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    15 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setThicknessMm(18)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                      thicknessMm === 18
                        ? 'bg-orange-500 text-black border-orange-500 font-extrabold shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    18 mm
                  </button>
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="50"
                      value={thicknessMm}
                      onChange={(e) => setThicknessMm(Number(e.target.value) || 18)}
                      className="w-full pl-2 pr-7 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono focus:border-orange-500 focus:outline-none text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                      mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Formato de Plancha Flexible (Ancho x Largo) */}
              <div className="sm:col-span-2 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] uppercase font-bold text-zinc-400">
                    Formato de Plancha (Dimensiones Métricas)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Superficie neta:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold font-mono">
                      {calculatedM2.toFixed(3)} m² / plancha
                    </span>
                  </div>
                </div>

                {/* Presets rápidos */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-500 font-semibold uppercase text-[9px] mr-1">Presets:</span>
                  {[
                    { label: '2.80 x 1.22 m (Rehau Rauvisio)', w: 2.80, h: 1.22 },
                    { label: '1.83 x 2.50 m (Masisa/Arauco)', w: 1.83, h: 2.50 },
                    { label: '1.83 x 2.75 m (Faplac/Egger)', w: 1.83, h: 2.75 },
                    { label: '1.22 x 2.44 m (Tablero 4x8)', w: 1.22, h: 2.44 },
                    { label: '1.30 x 3.05 m (HPL Abet)', w: 1.30, h: 3.05 },
                    { label: '1.60 x 3.20 m (Qstone Jumbo)', w: 1.60, h: 3.20 },
                  ].map((p) => {
                    const isSelected = sheetWidthM === p.w && sheetHeightM === p.h;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setSheetWidthM(p.w);
                          setSheetHeightM(p.h);
                        }}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer font-mono ${
                          isSelected
                            ? 'bg-orange-500 text-black font-extrabold shadow-xs'
                            : 'bg-zinc-900 text-zinc-300 border border-zinc-700/80 hover:border-orange-500/50'
                        }`}
                      >
                        {p.w}x{p.h}m
                      </button>
                    );
                  })}
                </div>

                {/* Campos numéricos directos de Ancho x Largo */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-semibold">
                      Ancho Plancha (metros)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        max="6.0"
                        value={sheetWidthM}
                        onChange={(e) => setSheetWidthM(Number(e.target.value) || 1.83)}
                        className="w-full pl-3 pr-7 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white font-mono font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                        m
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-semibold">
                      Largo Plancha (metros)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        max="6.0"
                        value={sheetHeightM}
                        onChange={(e) => setSheetHeightM(Number(e.target.value) || 2.50)}
                        className="w-full pl-3 pr-7 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white font-mono font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                        m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1">Acabado / Textura Superficial</label>
                <input
                  type="text"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  placeholder="Ej. Extra Mate, Extra Brillo, Poro Sincronizado, Silk"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none mb-1.5"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {['Extra Mate', 'Extra Brillo', 'Poro Sincronizado', 'Silk / Soft'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFinish(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                        finish === preset
                          ? 'bg-orange-500 text-black border-orange-500 font-extrabold'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock disponible cargado por el proveedor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] uppercase font-bold text-zinc-400">
                    Stock Disponible *
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${Number(stock) <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {Number(stock) <= 0 ? 'Agotado (0)' : `${stock} planchas`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="Ej. 30"
                    className="w-full pl-3 pr-16 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white font-mono font-bold focus:border-orange-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                    planchas
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {Number(stock) <= 0
                    ? '⚠️ Al registrar 0, se apagará automáticamente en el front office.'
                    : 'Inventario de planchas. Si el proyecto excede este stock, se bloqueará su uso.'}
                </p>
              </div>

              {/* Valor de Venta Final y Desglose de Comisión Arquify */}
              <div className="sm:col-span-2 p-4 bg-zinc-950/80 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs uppercase font-bold text-amber-300">
                      Valor de Venta Final Publicado en Configurador (CLP) *
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Precio de venta al público por plancha entera.
                    </p>
                  </div>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={priceSheetClp}
                      onChange={(e) => setPriceSheetClp(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-amber-500/50 rounded-xl text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Desglose de Liquidación */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
                  <div className="p-2 bg-zinc-900/60 rounded-lg">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Precio / m²</span>
                    <strong className="text-white font-mono text-xs">${priceM2Clp.toLocaleString('es-CL')}</strong>
                  </div>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-[10px] text-amber-400 uppercase block font-semibold">Comisión Arquify ({commissionPct}%)</span>
                    <strong className="text-amber-300 font-mono text-xs">-${arquifyRetainedClp.toLocaleString('es-CL')}</strong>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-[10px] text-emerald-400 uppercase block font-semibold">Liquidación Neta Proveedor</span>
                    <strong className="text-emerald-300 font-mono text-xs">${providerNetPayoutClp.toLocaleString('es-CL')}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Carga de Imagen y Previsualización */}
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
              <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-2 text-center">
                Muestrario / Imagen de Textura 3D *
              </label>

              {previewUrl ? (
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-orange-500/40 relative group mb-3">
                  {previewUrl.startsWith('#') ? (
                    <div className="w-full h-full" style={{ backgroundColor: previewUrl }} />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold"
                    >
                      Cambiar Imagen
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-xl flex flex-col items-center justify-center cursor-pointer p-4 text-center mb-3 transition-colors bg-zinc-900/40"
                >
                  <Upload size={28} className="text-zinc-500 mb-2" />
                  <p className="text-xs font-bold text-slate-200">Cargar Imagen de Terminación</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Formatos JPG, PNG, SVG o WebP de alta resolución</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Colores Sólidos de Ejemplo */}
              <div className="w-full pt-2 border-t border-zinc-800 flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-zinc-500">Color liso:</span>
                {['#FFFFFF', '#373E44', '#1C1C1C', '#D4A373', '#7AAFA6', '#C85A48', '#2C3E50'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPreviewUrl(c)}
                    className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            {isSuperAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Estado inicial:</span>
                <select
                  value={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.value as any)}
                  className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="approved">✓ Aprobado 3D (Publicar de inmediato)</option>
                  <option value="pending">⏳ Pendiente de VB (Para revisar y dar VB)</option>
                </select>
              </div>
            ) : (
              <span className="text-xs text-zinc-400">
                Esta terminación quedará pendiente de VB del Superadministrador antes de publicarse.
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                {isSuperAdmin ? 'Guardar y Publicar en 3D' : 'Enviar a Revisión (VB)'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grid de Diseños y Terminaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTextures.map((tex) => {
          const isColor = tex.url.startsWith('#');
          const isPending = tex.approvalStatus === 'pending';
          const isRejected = tex.approvalStatus === 'rejected';
          const isApproved = tex.approvalStatus === 'approved' || !tex.approvalStatus;

          const prov = providers.find((p) => p.id === tex.providerId || p.name === tex.brand || p.name === tex.providerName);
          const comm = tex.commissionPercentage ?? prov?.commissionPercentage ?? 15;
          const net = tex.providerNetPriceClp ?? Math.round(tex.priceSheetClp * (1 - comm / 100));

          return (
            <div
              key={tex.id}
              className={`group border rounded-2xl overflow-hidden transition-all shadow-sm flex flex-col ${
                isPending
                  ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                  : isRejected
                  ? 'border-red-500/40 opacity-70'
                  : tex.active
                  ? isLight
                    ? 'bg-white border-zinc-200 hover:border-orange-400'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-orange-500/50'
                  : isLight
                  ? 'bg-zinc-100 border-zinc-200 opacity-60'
                  : 'bg-zinc-900/40 border-zinc-800/40 opacity-60'
              }`}
            >
              {/* Preview 3D / Swatch */}
              <div className={`h-40 w-full relative overflow-hidden flex items-center justify-center ${isLight ? 'bg-zinc-100' : 'bg-zinc-950'}`}>
                {isColor ? (
                  <div className="w-full h-full" style={{ backgroundColor: tex.url }} />
                ) : (
                  <img
                    src={tex.previewUrl || tex.url}
                    alt={tex.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Badge de Marca / Proveedor */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  {tex.providerName || tex.brand}
                </div>

                {/* Badge de Estado VB */}
                <div className="absolute top-2.5 right-2.5">
                  {isPending ? (
                    <span className="px-2.5 py-1 bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
                      <Clock size={12} />
                      Pendiente VB
                    </span>
                  ) : isRejected ? (
                    <span className="px-2.5 py-1 bg-red-500/80 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-lg">
                      Rechazado
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/90 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {tex.active ? 'Aprobado 3D' : 'Inactivo'}
                    </span>
                  )}
                </div>
              </div>

              {/* Detalles y Precios */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-orange-500 font-bold">{tex.code}</span>
                      {tex.thicknessMm && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 border border-orange-500/30 font-mono font-bold text-[9px]">
                          {tex.thicknessMm} mm
                        </span>
                      )}
                    </div>
                    <span className={`font-mono text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{tex.sheetFormat}</span>
                  </div>
                  <h4 className={`text-sm font-bold tracking-tight mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>{tex.name}</h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{tex.finish}</p>
                </div>

                {/* Tarifa y Liquidación */}
                <div className={`p-2.5 rounded-xl space-y-1.5 border text-[11px] ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Valor Final Venta:</span>
                    <strong className={`font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>${tex.priceSheetClp.toLocaleString('es-CL')}</strong>
                  </div>
                  <div className={`flex items-center justify-between ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Comisión Arquify ({comm}%):</span>
                    <span className="text-amber-500 font-mono">-${Math.round((tex.priceSheetClp * comm) / 100).toLocaleString('es-CL')}</span>
                  </div>
                  <div className={`pt-1 border-t flex items-center justify-between font-bold ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                    <span className="text-emerald-600 dark:text-emerald-400">Neto Proveedor:</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-mono">${net.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                {/* Control de Stock Disponible */}
                <div className="p-2.5 bg-zinc-950/80 rounded-xl space-y-1.5 border border-zinc-800/80 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-semibold">Stock en Almacén:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      (tex.stock ?? 30) <= 0 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : (tex.stock ?? 30) < 10 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {(tex.stock ?? 30) <= 0 ? 'AGOTADO (0)' : `${tex.stock ?? 30} planchas`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500">Ajuste rápido:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const current = tex.stock ?? 30;
                          const next = Math.max(0, current - 5);
                          updateTexture(tex.id, { stock: next });
                          showToast(`Stock de "${tex.name}" actualizado a ${next} planchas.`);
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                        title="Restar 5"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = tex.stock ?? 30;
                          const next = Math.max(0, current - 1);
                          updateTexture(tex.id, { stock: next });
                          showToast(`Stock de "${tex.name}" actualizado a ${next} planchas.`);
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                        title="Restar 1"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={tex.stock ?? 30}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          updateTexture(tex.id, { stock: val });
                        }}
                        className="w-14 px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-center font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = tex.stock ?? 30;
                          const next = current + 1;
                          updateTexture(tex.id, { stock: next });
                          showToast(`Stock de "${tex.name}" actualizado a ${next} planchas.`);
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                        title="Sumar 1"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = tex.stock ?? 30;
                          const next = current + 10;
                          updateTexture(tex.id, { stock: next });
                          showToast(`Stock de "${tex.name}" actualizado a ${next} planchas.`);
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                        title="Sumar 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barra de Acciones y Superadmin VB */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                  {isPending && isSuperAdmin ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleApprove(tex.id, tex.name)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
                        title="Aprobar y publicar en configurador"
                      >
                        <Check size={14} /> Dar VB
                      </button>
                      <button
                        onClick={() => handleReject(tex.id, tex.name)}
                        className="py-1.5 px-2.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        title="Rechazar terminación"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggle(tex.id, tex.name)}
                        className={`text-[11px] font-semibold transition-colors ${
                          tex.active ? 'text-zinc-400 hover:text-white' : 'text-emerald-400 hover:underline'
                        }`}
                      >
                        {tex.active ? 'Pausar' : 'Activar'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isSuperAdmin && !isPending && (
                          <button
                            onClick={() => {
                              updateTexture(tex.id, { approvalStatus: 'pending', active: false });
                              showToast(`Terminación "${tex.name}" cambiada a Pendiente de VB.`, 'warning');
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Pasar a Pendiente de VB para revisar o volver a dar VB"
                          >
                            <Clock size={11} /> Reabrir VB
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tex.id, tex.name)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar decorativo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTextures.length === 0 && (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 space-y-2">
          <Palette size={32} className="mx-auto text-zinc-600 mb-2" />
          <h4 className="text-sm font-bold text-white">No se encontraron terminaciones</h4>
          <p className="text-xs text-zinc-500">
            Intente cambiando los filtros de búsqueda, categoría o estado de aprobación.
          </p>
        </div>
      )}
    </div>
  );
}
