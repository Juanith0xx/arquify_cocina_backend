import React, { useState } from 'react';
import { AlertTriangle, X, Flame, Tag } from 'lucide-react';
import { useStore, PartType } from '../store';
import { useAdminStore, isSupplyOfferValid } from '../store/adminStore';
import { useKitchenStore } from '../store/kitchenStore';
import { isWhiteMelamine, generatePartsList } from '../utils/manufacturing';
import { generateKitchenPartsList } from '../utils/kitchenManufacturing';

const DEFAULT_TEXTURES = [
  { id: 'def_mas_blanco_15', name: 'Masisa Blanco', url: '#FFFFFF', thicknessMm: 15, brand: 'Masisa', stock: 50 },
  { id: 'def_mas_blanco_18', name: 'Masisa Blanco', url: '#FFFFFF', thicknessMm: 18, brand: 'Masisa', stock: 50 },
  { id: 'def_mas_negro_18', name: 'Masisa Negro', url: '#171717', thicknessMm: 18, brand: 'Masisa', stock: 50 }
];

export const TexturesSection = ({ 
  onSelectTexture,
  title = "Catálogo de Materiales",
  badgeText,
  isLight = false,
}: { 
  onSelectTexture?: (url: string, mat: 'hpl' | 'melamina' | 'durolac', thicknessMm?: number) => void;
  title?: string;
  badgeText?: string;
  isLight?: boolean;
}) => {
  const state = useStore();
  const adminTextures = useAdminStore((s) => s.textures);
  const [thicknessFilter, setThicknessFilter] = useState<'all' | 15 | 18>('all');
  const [stockAlert, setStockAlert] = useState<{
    textureName: string;
    stock: number;
    required: number;
  } | null>(null);

  const [offerStockAlert, setOfferStockAlert] = useState<{
    textureName: string;
    offerStock: number;
    required: number;
    discountPercent: number;
  } | null>(null);
  const hasIslands = useKitchenStore((s) => s.cabinets?.some((c) => c.type === 'island'));

  // Calcula la cantidad estimada de planchas que requiere el proyecto según la zona
  const calculateRequiredSheetsForTarget = (targetPart: PartType, sheetFormat?: string): number => {
    let sheetAreaM2 = 4.575; // Estándar 1.83 x 2.50 m
    if (sheetFormat) {
      const match = sheetFormat.match(/([0-9.]+)\s*x\s*([0-9.]+)/i);
      if (match) {
        const w = parseFloat(match[1]);
        const h = parseFloat(match[2]);
        if (w > 0 && h > 0) sheetAreaM2 = w * h;
      }
    }
    const usableSheetM2 = Math.max(0.5, sheetAreaM2 * 0.82);
    let totalAreaM2 = 0;

    const kitchenCabinets = useKitchenStore.getState().cabinets?.filter(c => c.type !== 'decoration' && !c.variant?.startsWith('deco_')) || [];
    if (kitchenCabinets.length > 0) {
      try {
        const parts = generateKitchenPartsList(kitchenCabinets);
        parts.forEach((p) => {
          const isFront = (p.name.includes('Puerta') || p.name.includes('Frente') || p.name.includes('Panel Ciego')) &&
                          !p.name.toLowerCase().includes('contrafrente') &&
                          !p.name.toLowerCase().includes('amarre') &&
                          !p.name.toLowerCase().includes('caja');
          const isDrawerInner = p.name.toLowerCase().includes('lateral caj') || p.name.toLowerCase().includes('contrafrente') || p.name.toLowerCase().includes('trasera caj');
          const isShelf = p.name.toLowerCase().includes('repisa');
          const isBack = p.name.toLowerCase().includes('fondo') || p.name.toLowerCase().includes('trasera');
          const isStructure = !isFront && !isDrawerInner && !isShelf && !isBack;

          let matchesTarget = false;
          if (targetPart === 'all') matchesTarget = true;
          else if (targetPart === 'doors' || targetPart === 'drawerFronts') matchesTarget = isFront;
          else if (targetPart === 'structure') matchesTarget = isStructure;
          else if (targetPart === 'drawerInner') matchesTarget = isDrawerInner;
          else if (targetPart === 'shelves') matchesTarget = isShelf;
          else if (targetPart === 'back') matchesTarget = isBack;
          else matchesTarget = true;

          if (matchesTarget) {
            totalAreaM2 += (p.length * p.width * p.qty) / 1000000;
          }
        });
      } catch (err) {
        totalAreaM2 = kitchenCabinets.reduce((acc, c) => acc + ((c.width * c.height * 3.5) / 10000), 0);
      }
    } else {
      const closetState = useStore.getState();
      if (closetState.modules && closetState.modules.length > 0) {
        try {
          const parts = generatePartsList({
            height: closetState.height,
            depth: closetState.depth,
            thickness: closetState.thickness,
            showTopWall: closetState.showTopWall,
            showBottomWall: closetState.showBottomWall,
            showLeftWall: closetState.showLeftWall,
            showRightWall: closetState.showRightWall,
            showBackWall: closetState.showBackWall,
            showSocle: closetState.showSocle,
            backColor: closetState.backColor,
            doorColor: closetState.doorColor,
            drawerHardware: closetState.drawerHardware,
            assemblyType: closetState.assemblyType,
            modules: closetState.modules
          });
          parts.forEach((p) => {
            const isDoor = p.name.toLowerCase().includes('puerta');
            const isDrawer = p.name.toLowerCase().includes('cajón');
            const isBack = p.name.toLowerCase().includes('fondo') || p.name.toLowerCase().includes('trasera');
            const isStructure = !isDoor && !isDrawer && !isBack;

            let matchesTarget = false;
            if (targetPart === 'all') matchesTarget = true;
            else if (targetPart === 'doors') matchesTarget = isDoor;
            else if (targetPart === 'drawerFronts' || targetPart === 'drawerInner') matchesTarget = isDrawer;
            else if (targetPart === 'back') matchesTarget = isBack;
            else if (targetPart === 'structure') matchesTarget = isStructure;
            else matchesTarget = true;

            if (matchesTarget) {
              totalAreaM2 += (p.length * p.width * p.qty) / 1000000;
            }
          });
        } catch (err) {
          totalAreaM2 = closetState.modules.reduce((acc, m) => acc + ((m.width * closetState.height * 3) / 10000), 0);
        }
      }
    }

    return Math.max(1, Math.ceil(totalAreaM2 / usableSheetM2));
  };

  const applyTexture = (url: string, name: string, specificThickness?: number, specificMat?: 'hpl' | 'melamina' | 'durolac') => {
    const nameLower = name.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Auto-detectar material por el nombre del archivo/textura
    const isHPL = nameLower.includes('abet') || nameLower.includes('hpl') || nameLower.includes('laminati') || urlLower.includes('abet') || urlLower.includes('fiore') || urlLower.includes('broccato');
    const isDurolac = specificMat === 'durolac' || nameLower.includes('durolac');
    const mat: 'melamina' | 'hpl' | 'durolac' = specificMat || (isDurolac ? 'durolac' : (isHPL ? 'hpl' : 'melamina'));
    
    if (onSelectTexture) {
      onSelectTexture(url, mat, specificThickness);
      return;
    }

    if (state.targetPart === 'islandBack') {
      useKitchenStore.getState().setIslandBackConfig({
        enabled: true,
        materialType: 'decorative',
        decorativeColor: url,
        decorativeMaterial: mat as any,
      });
      return;
    }

    state.applyTextureToTarget(url);
    switch(state.targetPart) {
      case 'structure': state.setStructureMaterial(mat as any); break;
      case 'doors': state.setDoorMaterial(mat as any); break;
      case 'drawerFronts': state.setDrawerFrontMaterial(mat as any); break;
      case 'drawerInner': state.setDrawerInnerMaterial(mat as any); break;
      case 'shelves': state.setShelfMaterial(mat as any); break;
      case 'back': 
        state.setBackMaterial?.(mat);
        if (specificThickness) state.setBackThickness?.(specificThickness);
        break;
      case 'socle': state.setSocleMaterial(mat as any); break;
    }
  };

  // Filtrar exclusivamente terminaciones aprobadas por el Superadministrador (VB) y activas
  // Las cubiertas de cuarzo/sinterizado (Qstone Sysprotec) se configuran exclusivamente en el modal de cubiertas
  const activeApprovedAdminTextures = (adminTextures || [])
    .filter(t => t.active && (t.approvalStatus === 'approved' || !t.approvalStatus))
    .filter(t => {
      const cat = t.category;
      const n = (t.name || '').toLowerCase();
      const b = (t.brand || t.providerName || '').toLowerCase();
      const isStone = cat === 'piedras_marmoles' || (cat as string) === 'cubiertas_hpl' || n.includes('qstone') || b.includes('qstone') || b.includes('sysprotec');
      const isCountertopHpl = t.thicknessMm === 8 || n.includes('cubierta') || (t.category as string) === 'cubiertas_hpl';
      return !isStone && !isCountertopHpl;
    })
    .map(t => ({
      id: t.id,
      name: t.name.toLowerCase().includes((t.brand || '').toLowerCase()) ? t.name : `${t.brand ? t.brand + ' ' : ''}${t.name}`,
      code: t.code,
      url: t.url || t.previewUrl || '#CCCCCC',
      category: t.category,
      brand: t.brand || t.providerName,
      providerName: t.providerName,
      thicknessMm: t.thicknessMm || (t.category === 'hpl_autor' ? 0.9 : (t.name.includes('15') ? 15 : 18)),
      sheetFormat: t.sheetFormat,
      stock: t.stock !== undefined ? t.stock : 30,
      isOfferActive: t.isOfferActive,
      offerDiscountPercent: t.offerDiscountPercent,
      offerPriceClp: t.offerPriceClp,
      offerStockLimit: t.offerStockLimit,
      offerExpirationDate: t.offerExpirationDate,
    }));

  // Solo usar defaults de emergencia si no hay ninguna textura en el gestor
  const allTextures = activeApprovedAdminTextures.length > 0 
    ? activeApprovedAdminTextures 
    : DEFAULT_TEXTURES.map(t => ({
        ...t,
        code: 'DEF',
        category: 'solidos' as const,
        providerName: t.brand,
        sheetFormat: '1.83 x 2.50 m',
        stock: t.stock ?? 50
      }));
  
  const isMasisaItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = (t.brand || '').toLowerCase();
    const p = (t.providerName || '').toLowerCase();
    return n.includes('masisa') || b.includes('masisa') || p.includes('masisa');
  };

  const isAraucoItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = (t.brand || '').toLowerCase();
    const p = (t.providerName || '').toLowerCase();
    return n.includes('arauco') || b.includes('arauco') || p.includes('arauco') || n.includes('vesto') || b.includes('vesto');
  };

  const isAbetItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = (t.brand || '').toLowerCase();
    const p = (t.providerName || '').toLowerCase();
    return n.includes('abet') || b.includes('abet') || p.includes('abet') || n.includes('laminati') || n.includes('hpl') || t.category === 'hpl_autor';
  };

  const isRehauItem = (t: any) => {
    const n = (t.name || '').toLowerCase();
    const b = (t.brand || '').toLowerCase();
    const p = (t.providerName || '').toLowerCase();
    return n.includes('rehau') || b.includes('rehau') || p.includes('rehau') || n.includes('rauvisio') || b.includes('rauvisio');
  };

  // Filtrado por espesor si aplica (solo afecta a melaminas / maderas / tableros)
  const matchesThickness = (t: any) => {
    if (thicknessFilter === 'all') return true;
    if (isAbetItem(t)) return true;
    return t.thicknessMm === thicknessFilter;
  };

  const masisaTextures = allTextures.filter(t => isMasisaItem(t) && matchesThickness(t));
  const araucoTextures = allTextures.filter(t => !isMasisaItem(t) && isAraucoItem(t) && matchesThickness(t));
  const rehauTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && isRehauItem(t) && matchesThickness(t));
  const abetTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && !isRehauItem(t) && isAbetItem(t));
  const otherTextures = allTextures.filter(t => !isMasisaItem(t) && !isAraucoItem(t) && !isRehauItem(t) && !isAbetItem(t) && matchesThickness(t));

  const renderTextureButton = (tex: any) => {
    const is15 = tex.thicknessMm === 15;
    const is18 = tex.thicknessMm === 18;
    const isOutOfStock = tex.stock !== undefined && tex.stock <= 0;
    const stockCount = tex.stock !== undefined ? tex.stock : 30;
    const isRehau = isRehauItem(tex);
    const finishLower = (tex.finish || '').toLowerCase();
    const isExtraMate = finishLower.includes('mate') || finishLower.includes('matt');
    const isExtraBrillo = finishLower.includes('brillo') || finishLower.includes('brilliant') || finishLower.includes('gloss');

    const handleButtonClick = () => {
      // 1. Si está sin stock / agotado, bloquear
      if (isOutOfStock) {
        setStockAlert({
          textureName: tex.name,
          stock: 0,
          required: calculateRequiredSheetsForTarget(state.targetPart, tex.sheetFormat),
        });
        return;
      }

      // 2. Si no alcanza el stock para el proyecto, bloquear y alertar
      const requiredSheets = calculateRequiredSheetsForTarget(state.targetPart, tex.sheetFormat);
      if (stockCount < requiredSheets) {
        setStockAlert({
          textureName: tex.name,
          stock: stockCount,
          required: requiredSheets,
        });
        return;
      }

      // 2b. Si el producto tiene oferta y las unidades requeridas superan el stock asignado a la oferta
      const offerLimit = tex.offerStockLimit;
      if (isSupplyOfferValid(tex) && offerLimit !== undefined && offerLimit > 0 && offerLimit < requiredSheets) {
        setOfferStockAlert({
          textureName: tex.name,
          offerStock: offerLimit,
          required: requiredSheets,
          discountPercent: tex.offerDiscountPercent || 30,
        });
      }

      // 3. Stock suficiente: aplicar normalmente
      const isBack = state.targetPart === 'back';
      const specificMat = isBack ? (tex.category === 'hpl_autor' ? 'hpl' : 'melamina') : undefined;
      applyTexture(tex.url, tex.name, tex.thicknessMm, specificMat);

      // Solo ajustar espesor global de la estructura si se está configurando la estructura o todo el mueble
      if (
        tex.thicknessMm &&
        tex.thicknessMm >= 12 &&
        (state.targetPart === 'structure' || state.targetPart === 'all') &&
        state.setThickness
      ) {
        state.setThickness(Number((tex.thicknessMm / 10).toFixed(2)));
      }
    };

    return (
      <div key={tex.id} className="relative group">
        <button 
          type="button"
          disabled={isOutOfStock}
          onClick={handleButtonClick}
          className={`flex flex-col items-center gap-1 p-1 rounded transition-all w-full relative ${
            isOutOfStock
              ? 'opacity-35 grayscale cursor-not-allowed bg-zinc-900/60 border border-dashed border-red-500/50 hover:border-red-500/50'
              : isLight 
                ? 'bg-white border border-slate-300 hover:border-orange-500 shadow-sm cursor-pointer' 
                : 'bg-white/5 border border-white/10 hover:border-orange-500/50 cursor-pointer'
          }`}
          title={
            isOutOfStock
              ? `${tex.name} - AGOTADO / SIN STOCK (0 planchas registradas)`
              : `${tex.name} ${tex.finish ? `[${tex.finish}]` : ''} ${tex.thicknessMm ? `[${tex.thicknessMm}mm]` : ''} [Stock: ${stockCount} planchas]`
          }
        >
          {/* Badge de Oferta Activa */}
          {isSupplyOfferValid(tex) ? (
            <span className="absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] font-mono font-black uppercase shadow-md z-20 bg-rose-600 text-white flex items-center gap-0.5 animate-pulse">
              <Flame size={9} className="fill-white" />
              {tex.offerDiscountPercent || 30}% OFF
            </span>
          ) : isOutOfStock ? (
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-extrabold uppercase shadow-sm z-10 bg-red-600 text-white">
              SIN STOCK
            </span>
          ) : stockCount <= 10 ? (
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold uppercase shadow-sm z-10 bg-amber-500/90 text-black">
              {stockCount} disp.
            </span>
          ) : null}

          {/* Badge de Acabado Específico (Extra Mate / Extra Brillo) */}
          {(isExtraMate || isExtraBrillo) && (
            <span className={`absolute top-1 left-1 px-1 py-0.2 rounded text-[6.5px] font-mono font-extrabold uppercase shadow-sm z-10 ${
              isExtraBrillo
                ? 'bg-cyan-400 text-black'
                : 'bg-purple-600 text-white'
            }`}>
              {isExtraBrillo ? 'EXTRA BRILLO' : 'EXTRA MATE'}
            </span>
          )}

          {/* Badge de Espesor visible en esquina superior derecha */}
          {tex.thicknessMm && (
            <span
              className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[7px] font-mono font-extrabold uppercase shadow-sm z-10 ${
                isOutOfStock
                  ? 'bg-zinc-800 text-zinc-500'
                  : is15
                  ? 'bg-blue-600 text-white'
                  : is18
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-700 text-zinc-200'
              }`}
            >
              {tex.thicknessMm}mm
            </span>
          )}

          <div 
            className={`w-full aspect-square rounded border bg-cover bg-center ${
              isOutOfStock 
                ? 'border-red-500/20' 
                : isLight ? 'border-slate-200 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/20 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]'
            }`}
            style={tex.url.startsWith('#') ? { backgroundColor: tex.url } : { backgroundImage: `url('${tex.url}')` }}
          />

          {/* Indicador de Tapacanto 1mm para Rehau Rauvisio */}
          {isRehau && (
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="text-[6.5px] font-mono font-bold text-purple-400 uppercase tracking-tighter">
                Canteado 1mm
              </span>
              <span className="text-[6.5px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                2800x1220
              </span>
            </div>
          )}

          <span className={`text-[8px] uppercase tracking-wider font-bold truncate w-full text-center ${
            isOutOfStock ? 'text-red-400/80 line-through' : isLight ? 'text-slate-800' : 'text-slate-400'
          }`}>
            {tex.name.length > 17 ? tex.name.substring(0, 17) + '...' : tex.name}
          </span>
        </button>
      </div>
    );
  };

  return (
    <section
      className={`rounded-2xl border p-4 space-y-4 shadow-xs ${
        isLight
          ? 'bg-white border-orange-200'
          : 'bg-zinc-900 border-orange-500/30'
      }`}
      data-purpose="kitchen-materials-section"
    >
      {/* Header of the module group */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isLight ? 'border-slate-100' : 'border-white/10'
      }`}>
        <div>
          <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider block">Acabados Principales</span>
          <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h2>
        </div>
        {badgeText && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            {badgeText}
          </span>
        )}
      </div>

      {/* Step 1: Zone Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-bold flex items-center gap-1.5 ${
            isLight ? 'text-slate-800' : 'text-slate-200'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-bold">1</span>
            Selecciona la zona a modificar:
          </label>
        </div>

        {/* 2-Column Ergonomic Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          {[
            { id: 'all' as PartType, label: 'Todo el mueble' },
            { id: 'doors' as PartType, label: 'Puertas' },
            { id: 'drawerFronts' as PartType, label: 'Frentes cajón' },
            { id: 'structure' as PartType, label: 'Paredes / Casco' },
            { id: 'coverPanels' as PartType, label: 'Tapas laterales' },
            { id: 'drawerInner' as PartType, label: 'Cajas cajón' },
            { id: 'shelves' as PartType, label: 'Repisas' },
            { id: 'back' as PartType, label: 'Trasera / Fondo' },
          ].map((part) => {
            const isSelected = state.targetPart === part.id;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => state.setTargetPart(part.id)}
                className={`py-2.5 px-3 rounded-xl border transition active:scale-[0.98] cursor-pointer text-left flex items-center justify-between ${
                  isSelected
                    ? 'border-2 border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                    : isLight
                      ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>{part.label}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

        {/* Opciones Especiales de Trasera / Fondo (Durolac Blanco 3mm vs Melamina 15/18mm) */}
        {state.targetPart === 'back' && (
          <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-orange-50/80 border-orange-200 shadow-xs' : 'bg-black/40 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isLight ? 'text-orange-950' : 'text-orange-400'
              }`}>
                Configuración Trasera / Fondo
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                Norma Fabricación
              </span>
            </div>
            <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              Elige <strong>Durolac Blanco 3 mm</strong> (único color oficial de Durolac para ranura/clavado) o cualquiera de los decorativos de <strong>Melamina o HPL</strong> (15 mm / 18 mm) del catálogo y backoffice.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {/* Opción Durolac 3 mm Blanco */}
              <button
                type="button"
                onClick={() => {
                  applyTexture('#FFFFFF', 'Durolac Blanco 3mm', 3, 'durolac');
                }}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  (state.backThickness === 3 || state.backMaterial === 'durolac' || (state.backColor === '#FFFFFF' && !state.backThickness))
                    ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-xs'
                    : isLight
                      ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:border-orange-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">Durolac Blanco</span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">3 mm</span>
                </div>
                <span className="text-[8px] opacity-80 leading-tight">MDF lacado blanco estándar</span>
              </button>

              {/* Opción Igualar al Casco / Paredes */}
              <button
                type="button"
                onClick={() => {
                  const structColor = state.structureColor || '#ffffff';
                  const thickMm = Math.round((state.thickness || 1.8) * 10);
                  const structMat = state.structureMaterial || 'melamina';
                  applyTexture(structColor, 'Melamina Casco', thickMm, structMat);
                }}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:border-orange-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">Igualar al Casco</span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">
                    {Math.round((state.thickness || 1.8) * 10)} mm
                  </span>
                </div>
                <span className="text-[8px] opacity-80 leading-tight">Mismo color del casco</span>
              </button>
            </div>
          </div>
        )}

        {/* Opciones Especiales de Cajas Cajón / Fondo de Cajón */}
        {state.targetPart === 'drawerInner' && (() => {
          const innerColor = state.drawerInnerColor || state.structureColor || '#ffffff';
          const isWhite = isWhiteMelamine(innerColor);
          const kitchenCabinets = useKitchenStore.getState().cabinets || [];
          const drawerCabinets = kitchenCabinets.filter(c => 
            c.variant === '4_drawers' || c.variant === '2_pot_drawers' || c.variant === '2_drawers_1_pot' || 
            c.variant === '1_door_1_drawer' || c.variant === 'sink_u_drawer' || c.variant === 'tall_inner_drawers' ||
            c.variant === 'spice_rack'
          );
          const hasCabinetsOver50 = drawerCabinets.some(c => c.width > 50);
          const currentBottomMat = state.drawerBottomMaterial || (isWhite && !hasCabinetsOver50 ? 'durolac' : 'melamina');
          const isDurolacActive = currentBottomMat === 'durolac' && isWhite && !hasCabinetsOver50;

          return (
            <div className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 shadow-sm transition-all ${
              isLight ? 'bg-orange-50/90 border-orange-200' : 'bg-black/40 border-orange-500/30'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] uppercase font-extrabold tracking-wider ${
                  isLight ? 'text-orange-950' : 'text-orange-400'
                }`}>
                  Configuración Fondo de Cajón
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  isDurolacActive
                    ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                    : (isLight ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30')
                }`}>
                  {isDurolacActive ? 'Durolac 3 mm' : 'Melamina 15/18 mm'}
                </span>
              </div>

              <p className={`text-[11px] leading-snug font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                {!isWhite
                  ? 'Cajas en melamina madera/color: Por estándar industrial, el fondo se fabrica en la misma melamina seleccionada (15/18 mm).'
                  : hasCabinetsOver50
                    ? 'Módulos > 50 cm detectados: Restricción estructural activa. Durolac 3 mm restringido para evitar pandeo o desfondamiento.'
                    : 'Melamina blanca (≤ 50 cm): Puedes alternar entre Durolac blanco 3 mm o Melamina.'}
              </p>

              <div className="flex flex-col gap-2 mt-1">
                {/* Opción Durolac 3 mm Blanco */}
                <button
                  type="button"
                  disabled={!isWhite || hasCabinetsOver50}
                  onClick={() => {
                    if (isWhite && !hasCabinetsOver50) {
                      state.setDrawerBottomMaterial?.('durolac');
                      const { cabinets, updateCabinet } = useKitchenStore.getState();
                      cabinets.forEach(c => {
                        if (c.width <= 50) {
                          updateCabinet(c.id, { drawerBottomMaterial: 'durolac', drawerBottomThickness: 3 });
                        }
                      });
                    }
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                    !isWhite || hasCabinetsOver50
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'
                      : isDurolacActive
                        ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm cursor-pointer ring-2 ring-orange-500/20'
                        : isLight
                          ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500 hover:bg-orange-50/40 cursor-pointer shadow-xs'
                          : 'bg-white/5 text-zinc-200 border-white/10 hover:border-orange-500/50 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold leading-snug">Durolac Blanco</span>
                    <span className={`text-[11px] leading-tight font-medium ${isDurolacActive ? 'text-black/80' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {!isWhite 
                        ? 'Solo disponible en melamina blanca' 
                        : hasCabinetsOver50 
                          ? 'Restringido (Módulos > 50 cm)' 
                          : 'MDF lacado 3 mm ranurado'}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                    isDurolacActive 
                      ? 'bg-black/15 text-black' 
                      : isLight 
                        ? 'bg-slate-100 text-slate-700' 
                        : 'bg-white/10 text-zinc-200'
                  }`}>
                    3 mm
                  </span>
                </button>

                {/* Opción Misma Melamina */}
                <button
                  type="button"
                  onClick={() => {
                    state.setDrawerBottomMaterial?.('melamina');
                    const { cabinets, updateCabinet } = useKitchenStore.getState();
                    cabinets.forEach(c => {
                      updateCabinet(c.id, { drawerBottomMaterial: 'melamina', drawerBottomThickness: 15 });
                    });
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    !isDurolacActive
                      ? 'bg-orange-500 text-black border-orange-600 font-extrabold shadow-sm ring-2 ring-orange-500/20'
                      : isLight
                        ? 'bg-white text-slate-800 border-slate-300 hover:border-orange-500 hover:bg-orange-50/40 shadow-xs'
                        : 'bg-white/5 text-zinc-200 border-white/10 hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold leading-snug">Misma Melamina Estructural</span>
                    <span className={`text-[11px] leading-tight font-medium ${!isDurolacActive ? 'text-black/80' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Mismo tono y espesor de la caja
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                    !isDurolacActive 
                      ? 'bg-black/15 text-black' 
                      : isLight 
                        ? 'bg-slate-100 text-slate-700' 
                        : 'bg-white/10 text-zinc-200'
                  }`}>
                    15/18 mm
                  </span>
                </button>
              </div>
            </div>
          );
        })()}

      {/* Filtro de Espesor de Melamina: Todos / 15 mm / 18 mm */}
      <div className={`flex items-center justify-between p-1.5 rounded-lg border mb-3.5 ${
        isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-white/10'
      }`}>
        <span className={`text-[9px] uppercase font-bold tracking-wider pl-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
          Filtro Calibre:
        </span>
        <div className="flex items-center gap-1">
          {[
            { id: 'all' as const, label: 'Todos' },
            { id: 15 as const, label: '15 mm' },
            { id: 18 as const, label: '18 mm' },
          ].map((f) => (
            <button
              key={String(f.id)}
              type="button"
              onClick={() => setThicknessFilter(f.id)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all cursor-pointer ${
                thicknessFilter === f.id
                  ? 'bg-orange-500 text-black font-extrabold shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {masisaTextures.length > 0 && (
        <div className="mb-4">
          <label className={`text-[10px] uppercase tracking-widest font-bold block mb-2 ${
            isLight ? 'text-slate-700' : 'text-slate-400'
          }`}>2. Masisa (Melaminas)</label>
          <div className="grid grid-cols-3 gap-2">
            {masisaTextures.map(t => renderTextureButton(t))}
          </div>
        </div>
      )}

      {araucoTextures.length > 0 && (
        <div className="mb-4">
          <label className={`text-[10px] uppercase tracking-widest font-bold block mb-2 ${
            isLight ? 'text-slate-700' : 'text-slate-400'
          }`}>3. Arauco / Vesto (Melaminas)</label>
          <div className="grid grid-cols-3 gap-2">
            {araucoTextures.map(t => renderTextureButton(t))}
          </div>
        </div>
      )}

      {rehauTextures.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-[10px] uppercase tracking-widest font-bold ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>4. Rehau Rauvisio (Superficies Poliméricas 2.80 x 1.22 m)</label>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Tapacanto Exclusivo 1 mm
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rehauTextures.map(t => renderTextureButton(t))}
          </div>
        </div>
      )}

      {abetTextures.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-[10px] uppercase tracking-widest font-bold ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>4. Abet Laminati (HPL)</label>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              Laminado de Alta Presión
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {abetTextures.map(t => renderTextureButton(t))}
          </div>

          {/* Trascara HPL Balancer Global 0.9 mm */}
          <div className={`mt-2.5 p-2.5 rounded-xl border flex flex-col gap-1.5 ${
            isLight ? 'bg-orange-50/80 border-orange-200' : 'bg-black/30 border-orange-500/25'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isLight ? 'text-orange-950' : 'text-orange-400'
              }`}>
                Trascara HPL de Compensación (Global)
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                0.9 mm
              </span>
            </div>
            <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              Balanceador blanco normalizado para evitar el alabeo de puertas y frentes laminados a una cara.
            </p>
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => state.setHplBalancer(true)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  state.hplBalancer
                    ? 'bg-orange-500 text-black shadow-xs font-extrabold'
                    : isLight
                      ? 'bg-white text-slate-700 border border-slate-300 hover:border-orange-400'
                      : 'bg-white/5 text-zinc-300 border border-white/10 hover:border-orange-500/50'
                }`}
              >
                <span>Balancer Blanco 0.9mm</span>
              </button>
              <button
                type="button"
                onClick={() => state.setHplBalancer(false)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !state.hplBalancer
                    ? 'bg-orange-500 text-black shadow-xs font-extrabold'
                    : isLight
                      ? 'bg-white text-slate-700 border border-slate-300 hover:border-orange-400'
                      : 'bg-white/5 text-zinc-300 border border-white/10 hover:border-orange-500/50'
                }`}
              >
                <span>Mismo HPL 2 Caras</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {otherTextures.length > 0 && (
        <div className="mb-4">
          <label className={`text-[10px] uppercase tracking-widest font-bold block mb-2 ${
            isLight ? 'text-slate-700' : 'text-slate-400'
          }`}>5. Otros Proveedores Homologados</label>
          <div className="grid grid-cols-3 gap-2">
            {otherTextures.map(t => renderTextureButton(t))}
          </div>
        </div>
      )}

      {/* Modal de Alerta de Stock Insuficiente / Agotado */}
      {stockAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-amber-300 text-slate-800' : 'bg-zinc-900 border-amber-500/50 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                    {stockAlert.stock <= 0 ? 'Material Agotado' : 'Stock Insuficiente'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStockAlert(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  {stockAlert.stock <= 0 ? (
                    <>
                      El decorativo <strong className="text-white">"{stockAlert.textureName}"</strong> se encuentra agotado y registra <strong className="text-red-400">0 planchas</strong> en el stock del proveedor. No es posible aplicarlo al proyecto.
                    </>
                  ) : (
                    <>
                      El proyecto requiere aproximadamente <strong className="text-amber-400">{stockAlert.required} plancha(s)</strong> de <strong className="text-white">"{stockAlert.textureName}"</strong>, pero el proveedor solo registra <strong className="text-red-400">{stockAlert.stock} plancha(s)</strong> en stock disponible.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Consumo estimado del proyecto:</span>
                <strong className="text-amber-400 font-mono font-bold text-xs">{stockAlert.required} plancha(s)</strong>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Stock registrado en Back Office:</span>
                <strong className={`font-mono font-bold text-xs ${stockAlert.stock <= 0 ? 'text-red-400' : 'text-amber-300'}`}>
                  {stockAlert.stock} plancha(s)
                </strong>
              </div>
              <div className="pt-1.5 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                * Contacte al proveedor o seleccione otra terminación con inventario suficiente.
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setStockAlert(null)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-orange-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta: Stock de Oferta Promocional Limitado */}
      {offerStockAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-rose-300 text-slate-800' : 'bg-zinc-900 border-rose-500/50 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl shrink-0 mt-0.5 border border-rose-500/30">
                <Flame size={24} className="fill-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    Stock de Oferta Insuficiente
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOfferStockAlert(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  El proyecto requiere <strong className="text-amber-400">{offerStockAlert.required} planchas/unidades</strong> de <strong className="text-white">"{offerStockAlert.textureName}"</strong>, pero la oferta del <strong className="text-rose-400">{offerStockAlert.discountPercent}% OFF</strong> solo cubre las primeras <strong className="text-rose-300">{offerStockAlert.offerStock} unidades</strong> restantes en stock promocional.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-rose-500/20 text-[11px] space-y-2 font-mono">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Total requerido por diseño:</span>
                <strong className="text-amber-400 font-bold text-xs">{offerStockAlert.required} planchas</strong>
              </div>
              <div className="flex justify-between items-center text-rose-300">
                <span>Disponibles con {offerStockAlert.discountPercent}% OFF:</span>
                <strong className="text-rose-400 font-bold text-xs">{offerStockAlert.offerStock} planchas</strong>
              </div>
              <div className="flex justify-between items-center text-zinc-400 pt-1.5 border-t border-zinc-800">
                <span>Excedente (Precio Lista Normal):</span>
                <strong className="text-zinc-200 font-bold text-xs">
                  {Math.max(0, offerStockAlert.required - offerStockAlert.offerStock)} planchas
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOfferStockAlert(null)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-rose-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
