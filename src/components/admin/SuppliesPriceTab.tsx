import React, { useState, useRef } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Check,
  X,
  Layers,
  Wrench,
  Home,
  Trees,
  ShieldAlert,
  HelpCircle,
  Save,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Building,
  PackageCheck,
  Upload,
  Palette,
  Image as ImageIcon,
  Tag,
  Flame,
  Calendar,
  Percent,
  Clock
} from 'lucide-react';
import {
  useAdminStore,
  SupplyItem,
  SupplyCategory,
  isSupplyOfferValid,
  getEffectiveSupplyPrice
} from '../../store/adminStore';

interface SuppliesPriceTabProps {
  currentProviderId?: string;
  currentProviderName?: string;
  isSuperAdmin?: boolean;
}

function compressImageFile(file: File, maxDim = 800, quality = 0.85): Promise<string> {
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
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function SuppliesPriceTab({
  currentProviderId,
  currentProviderName,
  isSuperAdmin = true
}: SuppliesPriceTabProps) {
  const {
    supplies,
    updateSupplyPrice,
    updateSupply,
    updateTexture,
    addSupply,
    deleteSupply,
    resetSuppliesToDefault,
    themeMode
  } = useAdminStore();
  const isLight = themeMode === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SupplyCategory>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editSupplier, setEditSupplier] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal para Ofertas / Promociones
  const [offerItem, setOfferItem] = useState<SupplyItem | null>(null);
  const [offerActive, setOfferActive] = useState<boolean>(true);
  const [offerDiscount, setOfferDiscount] = useState<number>(30);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [offerStockLimit, setOfferStockLimit] = useState<number>(10);
  const [offerExpirationDate, setOfferExpirationDate] = useState<string>('');

  const isProvider = !isSuperAdmin && Boolean(currentProviderId || currentProviderName);

  // Modal para agregar nuevo insumo / material
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<SupplyCategory>('cubiertas_qstone');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newUnit, setNewUnit] = useState('m²');
  const [newPrice, setNewPrice] = useState<number>(180000);
  const [newStock, setNewStock] = useState<number>(50);
  const [newSupplier, setNewSupplier] = useState(
    isProvider ? (currentProviderName || 'Mi Empresa') : 'Qstone Chile'
  );
  const [newNotes, setNewNotes] = useState('');

  const [newUnitFormat, setNewUnitFormat] = useState<'caja' | 'galon' | 'tinaja' | 'rollo' | 'metro_lineal' | 'unidad'>('unidad');
  const [newCoverageM2, setNewCoverageM2] = useState<number>(1);
  const [newCommissionPercent, setNewCommissionPercent] = useState<number>(20);
  const [newProviderNetPrice, setNewProviderNetPrice] = useState<number>(10000);
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const categories: { id: 'all' | SupplyCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'Todos los Insumos', icon: Filter },
    { id: 'cubiertas_qstone', label: 'Cubiertas Qstone', icon: Sparkles },
    { id: 'melamina', label: 'Melaminas & Tableros', icon: Layers },
    { id: 'herrajes', label: 'Herrajes & Cantos', icon: Wrench },
    { id: 'madera', label: 'Madera & Enchapados', icon: Trees },
    { id: 'fijaciones_sellantes', label: 'Fijaciones & Sellos', icon: DollarSign },
    { id: 'pisos', label: 'Pisos', icon: Home },
    { id: 'muros', label: 'Muros / Papel Mural / Pintura', icon: Layers },
    { id: 'cortinas', label: 'Cortinas', icon: Home },
    { id: 'ventanas', label: 'Ventanas', icon: Building },
    { id: 'puertas', label: 'Puertas', icon: Home },
    { id: 'focos', label: 'Focos & Iluminación', icon: Sparkles },
    { id: 'rodones_burletes', label: 'Rodones & Burletes', icon: Wrench },
    { id: 'marqueteria', label: 'Marquetería de Muros y Cielo', icon: PackageCheck },
  ];

  const isMySupply = (s: SupplyItem) => {
    if (isSuperAdmin) return true;
    if (currentProviderId && s.providerId === currentProviderId) return true;

    const pId = (currentProviderId || '').toLowerCase();
    const pName = (currentProviderName || '').toLowerCase();
    const sup = (s.supplier || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    const code = (s.code || '').toLowerCase();

    // Caso específico Abet Laminati / HPL: aislar de herrajes ajenos (Rehau, DTC, Häfele)
    if (pId.includes('abet') || pName.includes('abet')) {
      if (
        sup.includes('rehau') ||
        sup.includes('dtc') ||
        sup.includes('häfele') ||
        sup.includes('hafele') ||
        s.category === 'herrajes'
      ) {
        return false;
      }
      return (
        sup.includes('abet') ||
        name.includes('abet') ||
        code.includes('abet') ||
        name.includes('totoy') ||
        code.includes('lam-hpl')
      );
    }

    if (pId.includes('masisa') || pName.includes('masisa')) {
      return sup.includes('masisa') || name.includes('masisa');
    }
    if (pId.includes('arauco') || pName.includes('arauco')) {
      return sup.includes('arauco') || sup.includes('vesto');
    }
    if (pId.includes('qstone') || pName.includes('qstone') || pId.includes('sysprotec') || pName.includes('sysprotec')) {
      return sup.includes('qstone') || sup.includes('sysprotec');
    }

    if (currentProviderName) {
      return sup.includes(pName) || pName.includes(sup);
    }
    return false;
  };

  const filteredSupplies = supplies.filter((s) => {
    if (!isMySupply(s)) return false;
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.spec.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleStartEdit = (item: SupplyItem) => {
    setEditingId(item.id);
    setEditPrice(item.priceClp);
    setEditStock(item.stockRef ?? 0);
    setEditSupplier(item.supplier);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    const updates = {
      priceClp: Number(editPrice),
      stockRef: Math.max(0, Number(editStock) || 0),
      ...(isSuperAdmin ? { supplier: editSupplier.trim() } : {}),
      notes: editNotes.trim(),
    };
    updateSupply(id, updates);
    if (id.startsWith('sup-')) {
      updateTexture(id.replace('sup-', ''), {
        priceSheetClp: Number(editPrice),
        priceM2Clp: Number(editPrice),
        stock: Math.max(0, Number(editStock) || 0),
      });
    }
    setEditingId(null);
    showToast('Precio, stock y especificación actualizados con éxito.');
  };

  const handleOpenOfferModal = (item: SupplyItem) => {
    setOfferItem(item);
    setOfferActive(item.isOfferActive ?? true);
    const disc = item.offerDiscountPercent ?? 30;
    setOfferDiscount(disc);
    const calculated = item.offerPriceClp ?? Math.round(item.priceClp * (1 - disc / 100));
    setOfferPrice(calculated);
    setOfferStockLimit(item.offerStockLimit ?? Math.min(item.stockRef ?? 20, 20));
    setOfferExpirationDate(item.offerExpirationDate || '');
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerItem) return;

    const updates = {
      isOfferActive: offerActive,
      offerDiscountPercent: Math.max(1, Math.min(99, Number(offerDiscount) || 30)),
      offerPriceClp: Math.max(1, Number(offerPrice) || Math.round(offerItem.priceClp * 0.7)),
      offerStockLimit: Math.max(0, Number(offerStockLimit) || 0),
      offerExpirationDate: offerExpirationDate.trim(),
    };

    updateSupply(offerItem.id, updates);
    if (offerItem.id.startsWith('sup-')) {
      updateTexture(offerItem.id.replace('sup-', ''), updates);
    }

    setOfferItem(null);
    showToast(`Oferta del producto "${offerItem.name}" guardada con éxito.`);
  };

  const handleQuickRemoveOffer = (item: SupplyItem) => {
    const updates = { isOfferActive: false };
    updateSupply(item.id, updates);
    if (item.id.startsWith('sup-')) {
      updateTexture(item.id.replace('sup-', ''), updates);
    }
    showToast(`Oferta desactivada para "${item.name}".`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Restablecer todos los precios y costos de insumos a valores predeterminados de fábrica?')) {
      resetSuppliesToDefault();
      showToast('Precios de fábrica restaurados.');
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar el insumo "${name}" del catálogo?`)) {
      deleteSupply(id);
      showToast(`Insumo "${name}" eliminado.`);
    }
  };

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImage(true);
      const dataUrl = await compressImageFile(file, 800, 0.85);
      if (dataUrl) {
        setNewImageUrl(dataUrl);
        showToast('Foto cargada con éxito.');
      }
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      alert('Error al leer el archivo de imagen.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      alert('Por favor ingrese al menos el nombre y código del insumo.');
      return;
    }

    const netPrice = Math.max(0, Number(newProviderNetPrice) || Number(newPrice));
    const commPct = Math.max(0, Number(newCommissionPercent) || 0);
    const calculatedFinalPrice = Math.round(netPrice * (1 + commPct / 100));

    addSupply({
      category: newCategory,
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      spec: newSpec.trim() || 'Especificación estándar',
      unit: newUnit.trim() || 'Unid.',
      priceClp: calculatedFinalPrice,
      providerNetPriceClp: netPrice,
      commissionPercentage: commPct,
      unitFormat: newUnitFormat,
      coveragePerUnitM2: Math.max(0.1, Number(newCoverageM2) || 1),
      imageUrl: newImageUrl.trim(),
      supplier: isProvider ? (currentProviderName || 'Mi Empresa') : (newSupplier.trim() || 'Proveedor General'),
      stockRef: Math.max(0, Number(newStock) || 0),
      providerId: currentProviderId,
      notes: newNotes.trim()
    });

    setIsAddModalOpen(false);
    // Limpiar campos
    setNewName('');
    setNewCode('');
    setNewSpec('');
    setNewPrice(180000);
    setNewStock(50);
    setNewNotes('');
    setNewImageUrl('');
    showToast(`Producto "${newName}" agregado al catálogo con éxito.`);
  };

  const getCategoryBadge = (cat: SupplyCategory) => {
    switch (cat) {
      case 'cubiertas_qstone':
        return <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold uppercase">Cubiertas Qstone</span>;
      case 'melamina':
        return <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[9px] font-bold uppercase">Melaminas</span>;
      case 'herrajes':
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold uppercase">Herrajes</span>;
      case 'madera':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">Madera</span>;
      case 'fijaciones_sellantes':
        return <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[9px] font-bold uppercase">Fijaciones/Sellos</span>;
      default:
        return <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[9px] font-bold uppercase">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          {feedback}
        </div>
      )}

      {/* Info Notice */}
      <div
        className={`p-4 border rounded-xl flex items-start justify-between gap-4 text-xs transition-colors ${
          isLight
            ? 'bg-orange-500/10 border-orange-200 text-zinc-900 shadow-sm'
            : 'bg-orange-500/10 border-orange-500/30 text-white'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {isProvider ? (
            <Building size={18} className="text-orange-500 shrink-0 mt-0.5" />
          ) : (
            <DollarSign size={18} className="text-orange-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {isProvider
                ? `Catálogo de Productos y Precios: ${currentProviderName || 'Mi Empresa'}`
                : 'Impacto en Presupuestos y Cubicaciones'}
            </p>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>
              {isProvider
                ? 'Gestiona directamente los valores de venta, disponibilidad de stock en bodega y especificaciones técnicas de tus insumos comercializados.'
                : 'Cualquier cambio de costo unitario impacta inmediatamente en las estimaciones de costo, planillas Excel de fabricación y reportes técnicos de todos los módulos.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (isProvider) {
                setNewSupplier(currentProviderName || 'Mi Empresa');
              } else {
                setNewCategory('cubiertas_qstone');
                setNewUnit('m²');
                setNewSupplier('Qstone Chile');
              }
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Agregar nuevo material o producto"
          >
            <Plus size={13} /> {isProvider ? 'Cargar Mi Producto' : 'Agregar Insumo / Material'}
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleResetDefaults}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300'
              }`}
              title="Restaurar precios iniciales"
            >
              <RotateCcw size={13} /> Restaurar Fábrica
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div
        className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
        }`}
      >
        <div className="relative flex-1">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-zinc-400' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre de insumo, proveedor o especificación..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg text-xs focus:outline-none focus:border-orange-500 ${
              isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
            }`}
          />
        </div>

        {/* Category Pills */}
        <div
          className={`flex items-center gap-1 p-1 rounded-lg border overflow-x-auto ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900'
                }`}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Supplies Table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900/90 border-zinc-800'}`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isLight ? 'text-zinc-800' : 'text-slate-300'}`}>
            <thead className={`border-b font-bold uppercase text-[10px] tracking-wider ${
              isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-950/80 border-zinc-800 text-slate-400'
            }`}>
              <tr>
                <th className="p-3.5 pl-4">Código & Insumo</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Especificación Técnica</th>
                <th className="p-3.5">Unidad</th>
                <th className="p-3.5">{isProvider ? 'Marca / Proveedor' : 'Proveedor'}</th>
                <th className="p-3.5 text-center">Stock Disponible</th>
                <th className="p-3.5 text-right">Precio Venta (CLP)</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
              {filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {isProvider
                      ? 'No tienes productos registrados en tu catálogo comercial aún. Haz clic en "Cargar Mi Producto" para añadir el primero.'
                      : 'No se encontraron insumos que coincidan con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                filteredSupplies.map((item) => {
                  const isEditing = editingId === item.id;
                  const itemStock = item.stockRef ?? 0;
                  const isLowStock = itemStock <= 10;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name & Code */}
                      <td className="p-3.5 pl-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            item.imageUrl.startsWith('#') ? (
                              <div
                                className="w-8 h-8 rounded-lg shrink-0 border border-white/20 shadow-sm flex items-center justify-center"
                                style={{ backgroundColor: item.imageUrl }}
                                title={`Color: ${item.imageUrl}`}
                              />
                            ) : (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/20 shadow-sm"
                              />
                            )
                          ) : (
                            <div className={`w-8 h-8 rounded-lg shrink-0 border flex items-center justify-center ${
                              isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-800/80 border-zinc-700/50 text-zinc-500'
                            }`}>
                              <ImageIcon size={14} className="opacity-60" />
                            </div>
                          )}
                          <div>
                            <div className="font-mono text-[10px] text-orange-500 font-bold">{item.code}</div>
                            <div className={`text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>{item.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 whitespace-nowrap">{getCategoryBadge(item.category)}</td>

                      {/* Spec */}
                      <td className={`p-3.5 text-xs max-w-xs ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>{item.spec}</td>

                      {/* Unit */}
                      <td className={`p-3.5 font-mono text-xs whitespace-nowrap ${isLight ? 'text-zinc-700' : 'text-slate-300'}`}>{item.unit}</td>

                      {/* Supplier */}
                      <td className="p-3.5 text-xs">
                        {isEditing && isSuperAdmin ? (
                          <input
                            type="text"
                            value={editSupplier}
                            onChange={(e) => setEditSupplier(e.target.value)}
                            className={`p-1.5 border-2 border-orange-500 rounded-lg text-xs font-bold w-full focus:outline-none ${
                              isLight ? 'bg-white text-zinc-900 shadow-sm' : 'bg-zinc-950 text-white'
                            }`}
                          />
                        ) : (
                          <span className={`font-medium ${isLight ? 'text-zinc-800' : 'text-slate-300'}`}>{item.supplier}</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className={`p-1.5 w-20 border-2 border-orange-500 rounded-lg text-xs text-center font-mono font-bold focus:outline-none ${
                                isLight ? 'bg-white text-zinc-900 shadow-sm' : 'bg-zinc-950 text-white'
                              }`}
                            />
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                              isLowStock
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}
                            title={isLowStock ? 'Stock bajo' : 'Stock en niveles óptimos'}
                          >
                            <PackageCheck size={12} />
                            {itemStock} {item.unit.includes('m²') ? 'm²' : 'unid.'}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-3.5 text-right font-mono font-bold whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className={isLight ? 'text-zinc-700 font-bold' : 'text-zinc-500'}>$</span>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className={`p-1.5 w-28 border-2 border-orange-500 rounded-lg text-xs text-right font-mono font-bold focus:outline-none ${
                                isLight ? 'bg-white text-orange-600 shadow-sm' : 'bg-zinc-950 text-orange-400'
                              }`}
                            />
                          </div>
                        ) : (() => {
                          const hasOffer = isSupplyOfferValid(item);
                          const effectivePrice = getEffectiveSupplyPrice(item);
                          return (
                            <div className="flex flex-col items-end">
                              {hasOffer ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="line-through text-[11px] text-zinc-500">
                                      ${item.priceClp.toLocaleString('es-CL')}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-extrabold uppercase flex items-center gap-1">
                                      <Flame size={11} className="fill-rose-400" />
                                      {item.offerDiscountPercent || 30}% OFF
                                    </span>
                                  </div>
                                  <span className="text-sm font-extrabold text-emerald-400">
                                    ${effectivePrice.toLocaleString('es-CL')} <span className="text-[10px] text-zinc-500">CLP</span>
                                  </span>
                                </>
                              ) : (
                                <span className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                                  ${item.priceClp.toLocaleString('es-CL')} <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>CLP</span>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg cursor-pointer"
                              title="Guardar precio y stock"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-zinc-800 text-slate-400 hover:bg-zinc-700 rounded-lg cursor-pointer"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenOfferModal(item)}
                              className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                isSupplyOfferValid(item)
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                  : isLight
                                  ? 'bg-amber-500/10 text-amber-700 border-amber-300 hover:bg-amber-500/20'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                              }`}
                              title="Poner en Oferta / Modificar Promoción"
                            >
                              <Tag size={12} />
                              {isSupplyOfferValid(item) ? 'Oferta Activa' : 'Poner Oferta'}
                            </button>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isLight
                                  ? 'bg-zinc-100 hover:bg-orange-500/10 text-zinc-800 hover:text-orange-600 border-zinc-300'
                                  : 'bg-zinc-800/80 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 border-zinc-700/60'
                              }`}
                            >
                              <Edit2 size={12} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Eliminar insumo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Agregar Insumo / Material */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isProvider ? `Nuevo Producto de ${currentProviderName || 'Proveedor'}` : 'Nuevo Insumo o Cubierta'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {isProvider
                      ? 'Carga un nuevo insumo con su valor venta y stock disponible en tu inventario'
                      : 'Incorpora materiales de marmolería Qstone, herrajes o tableros con costo unitario'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSupply} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as SupplyCategory;
                      setNewCategory(cat);
                      if (cat === 'cubiertas_qstone') {
                        setNewUnit('m²');
                        if (!isProvider) setNewSupplier('Qstone Chile');
                      } else if (cat === 'melamina') {
                        setNewUnit('Plancha (4.57 m²)');
                        if (!isProvider) setNewSupplier('Arauco / Masisa');
                      } else {
                        setNewUnit('Unid.');
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cubiertas_qstone">Cubiertas Qstone (Cuarzo / Sinterizado / MO)</option>
                    <option value="melamina">Melaminas & Tableros</option>
                    <option value="herrajes">Herrajes & Accesorios</option>
                    <option value="madera">Madera & Enchapados</option>
                    <option value="fijaciones_sellantes">Fijaciones & Sellos</option>
                    <option value="pisos">Pisos (Porcelanato, Flotante, Madera)</option>
                    <option value="muros">Muros (Pintura, Papel Mural, Revestimientos)</option>
                    <option value="cortinas">Cortinas</option>
                    <option value="ventanas">Ventanas</option>
                    <option value="puertas">Puertas</option>
                    <option value="focos">Focos & Iluminación</option>
                    <option value="rodones_burletes">Rodones & Burletes</option>
                    <option value="marqueteria">Marquetería de Muros y Cielo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Código SKU / Modelo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: QS-CUA-CALACAT-20"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nombre del Insumo / Material
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Qstone Cuarzo Calacatta Gold 20mm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Precio Neto Proveedor ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newProviderNetPrice}
                    onChange={(e) => {
                      const net = Number(e.target.value);
                      setNewProviderNetPrice(net);
                      setNewPrice(Math.round(net * (1 + newCommissionPercent / 100)));
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    % Ganancia Arquify
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    value={newCommissionPercent}
                    onChange={(e) => {
                      const comm = Number(e.target.value);
                      setNewCommissionPercent(comm);
                      setNewPrice(Math.round(newProviderNetPrice * (1 + comm / 100)));
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-orange-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Precio Venta Final ($ CLP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-emerald-400 font-extrabold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-sky-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Formato Comercial de Venta
                  </label>
                  <select
                    value={newUnitFormat}
                    onChange={(e) => setNewUnitFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="caja">Caja (Pisos / Porcelanato)</option>
                    <option value="tinaja">Tinaja (Pintura 5G)</option>
                    <option value="galon">Galón (Pintura / Sellos)</option>
                    <option value="rollo">Rollo (Papel Mural)</option>
                    <option value="metro_lineal">Metro Lineal (Rodones / Marquetería)</option>
                    <option value="unidad">Unidad (Cortinas / Focos / Ventanas / Puertas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Rendimiento por Formato (m²)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newCoverageM2}
                    onChange={(e) => setNewCoverageM2(Number(e.target.value))}
                    placeholder="Ej: 1.44 m²/caja o 5.3 m²/rollo"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Sección de Foto de Producto o Muestra de Color */}
              <div className="p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-amber-400" /> Foto de Producto o Tono / Muestra de Color
                  </label>
                  {newImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={11} /> Quitar Foto/Color
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Vista Previa */}
                  <div className="w-16 h-16 rounded-xl border border-zinc-700/80 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                    {newImageUrl ? (
                      newImageUrl.startsWith('#') ? (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-[9px] font-mono font-bold text-white p-1 text-center"
                          style={{ backgroundColor: newImageUrl }}
                        >
                          <span className="bg-black/60 px-1 py-0.5 rounded text-[8px] backdrop-blur-xs">
                            {newImageUrl}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={newImageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="text-center text-zinc-500 flex flex-col items-center">
                        <ImageIcon size={20} className="mb-0.5 opacity-60" />
                        <span className="text-[9px]">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones de carga */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload size={13} />
                        {isProcessingImage ? 'Procesando...' : 'Subir Foto / Archivo'}
                      </button>

                      <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer relative">
                        <Palette size={13} className="text-orange-400" />
                        <span>Elegir Tono Color</span>
                        <input
                          type="color"
                          value={newImageUrl.startsWith('#') ? newImageUrl : '#8FA2A6'}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="O escribe URL web de la imagen (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="m², Plancha, Unid."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Proveedor
                  </label>
                  {isProvider ? (
                    <div className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-orange-400 font-semibold truncate flex items-center gap-1.5">
                      <Building size={12} className="text-orange-500 shrink-0" />
                      <span className="truncate">{currentProviderName || 'Mi Empresa'}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Ej: Qstone Chile"
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Especificación Técnica / Formato
                </label>
                <input
                  type="text"
                  placeholder="Ej: Formato 3.20 x 1.60 m, espesor 20mm, acabado pulido brillante"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Notas de Taller / Criterio de Montaje
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Para cubiertas sinterizadas de 12mm requiere base de melamina completa 18mm como soporte continuo."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <Save size={14} /> Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurar Oferta Promocional */}
      {offerItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <Flame size={18} className="fill-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Configurar Oferta / Descuento Promocional
                  </h3>
                  <p className="text-[11px] text-rose-300/80 font-mono">
                    {offerItem.code} - {offerItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfferItem(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="p-6 space-y-4">
              {/* Toggle Activar Oferta */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Tag size={14} className="text-rose-400" />
                    Estado de la Oferta Promocional
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Activa la visibilidad con badge de descuento en el menú de diseño
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerActive}
                    onChange={(e) => setOfferActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {/* Precios y % Descuento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Precio Lista Normal
                  </label>
                  <div className="px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-zinc-400">
                    ${offerItem.priceClp.toLocaleString('es-CL')} CLP
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                    % Descuento Oferta
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={offerDiscount}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        setOfferDiscount(disc);
                        setOfferPrice(Math.round(offerItem.priceClp * (1 - disc / 100)));
                      }}
                      className="w-full pl-3 pr-7 py-2 bg-zinc-950 border border-rose-500/40 rounded-xl text-xs text-rose-400 font-extrabold font-mono focus:outline-none focus:border-rose-500"
                    />
                    <Percent size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400" />
                  </div>
                </div>
              </div>

              {/* Precio Promocional Final */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Precio Final en Oferta ($ CLP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={offerPrice}
                    onChange={(e) => {
                      const pr = Number(e.target.value);
                      setOfferPrice(pr);
                      if (offerItem.priceClp > 0) {
                        const pct = Math.round((1 - pr / offerItem.priceClp) * 100);
                        setOfferDiscount(Math.max(1, pct));
                      }
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-emerald-500/40 rounded-xl text-xs text-emerald-400 font-extrabold font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Condicionantes: Plazo y Stock */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-amber-400" /> Plazo Límite Oferta
                  </label>
                  <input
                    type="date"
                    value={offerExpirationDate}
                    onChange={(e) => setOfferExpirationDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Opcional (Dejar en blanco si dura hasta agotar stock)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <PackageCheck size={12} className="text-sky-400" /> Stock Asignado Oferta
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={offerItem.stockRef ?? 999}
                    value={offerStockLimit}
                    onChange={(e) => setOfferStockLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-sky-400 font-bold focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Cant. máx de unidades en promoción
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickRemoveOffer(offerItem)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <X size={13} /> Desactivar Oferta
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferItem(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                  >
                    <Save size={14} /> Guardar Oferta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
