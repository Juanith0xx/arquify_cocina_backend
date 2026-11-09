import React, { useState, useEffect, useMemo } from 'react';
import { useKitchenStore, CabinetType, getCabinetLabel } from '../store/kitchenStore';
import { useStore } from '../store';
import { TexturesSection } from '../components/TexturesSection';
import { KitchenBlueprint } from '../components/KitchenBlueprint';
import { exportKitchenToExcel } from '../utils/kitchenExcelGenerator';
import { exportKitchenLabelsPDF } from '../utils/kitchenLabelsPdfGenerator';
import { FileSpreadsheet, FileText, RotateCcw, QrCode, Loader2 } from 'lucide-react';
import { KitchenScene } from '../components/kitchen/KitchenScene';
import { RoomPlannerModal } from '../components/kitchen/RoomPlannerModal';
import { ResetConfirmModal } from '../components/kitchen/ResetConfirmModal';
import { RoomFinishesSection } from '../components/kitchen/RoomFinishesSection';
import { IslandBackPanelConfigSection } from '../components/kitchen/IslandBackPanelConfigSection';
import { KitchenModuleContextMenu } from '../components/kitchen/KitchenModuleContextMenu';
import { SaveProjectModal } from '../components/common/SaveProjectModal';
import { CountertopConfigModal } from '../components/kitchen/CountertopConfigModal';
import { GolaRegruesoIncompatibilityModal } from '../components/kitchen/GolaRegruesoIncompatibilityModal';
import { KitchenB2BQuoteModal } from '../components/kitchen/KitchenB2BQuoteModal';
import { ExportBimModal } from '../components/kitchen/ExportBimModal';
import { calculatePolygonArea } from '../utils/roomGeometry';
import { KitchenMepPanel } from '../components/kitchen/KitchenMepPanel';
import { detectMepClashes } from '../utils/mepClashDetection';
import { resolvePlacement, getCabinetSpecsFromTool, findSmartWallPlacement } from '../utils/kitchenCollision';
import { ArrowLeft, Box, Square, Move3D, PenTool, LayoutGrid, Trash2, RotateCw, Undo2, Redo2, Flame, Refrigerator, Flower2, Utensils, Info, Sparkles, Maximize2, Layers, Palette, ListOrdered, Save, Columns, Sliders, Sun, Moon, Wine, Wrench, DollarSign, ChevronDown, ChevronRight, Globe, Ruler, Menu, X, MoreVertical, Download, Camera } from 'lucide-react';
import { HandlesSection } from '../components/kitchen/HandlesSection';
import { useAdminStore } from '../store/adminStore';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { exportKitchenCommercialPdf } from '../utils/kitchenCommercialPdfGenerator';
import { HANDLE_CATALOG } from '../types/handle';

import { DecorationSection } from '../components/kitchen/DecorationSection';
import { NanoBananaRenderModal } from '../components/common/NanoBananaRenderModal';
import { StudioRenderModal } from '../components/common/StudioRenderModal';
import { StudioRenderProvider } from '../components/common/StudioRenderContext';

const sectionTitle = "text-xs uppercase tracking-wider text-orange-400 font-bold mb-3 mt-4 first:mt-0";
const labelClass = "text-xs uppercase tracking-wider text-slate-300 font-semibold";
const btnClass = "w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-center cursor-pointer hover:border-orange-500/50 hover:bg-white/10 transition-colors text-xs font-medium text-slate-300";
const activeBtnClass = "w-full py-2 px-3 bg-orange-500/20 border border-orange-500 rounded-lg text-center cursor-pointer text-orange-400 transition-colors text-xs font-bold shadow-[0_0_10px_rgba(249,115,22,0.15)]";

export const DIMENSION_LEVEL_DATA: Record<number, { title: string; desc: string }> = {
  1: { title: '1. Cotas Generales', desc: 'Largo total de corrida, alto, prof. y dist. Cubierta-Aéreo' },
  2: { title: '2. Módulos', desc: 'Ancho individual de cada cuerpo' },
  3: { title: '3. Frentes', desc: 'Puertas y frentes ciegos' },
  4: { title: '4. Cajoneras e Interiores', desc: 'Alturas de frentes de cajón y repisas' },
  5: { title: '5. Identificación Módulos', desc: 'N° y nombre de muebles (MOD • Nombre)' },
  6: { title: '6. Medidas Espaciales', desc: 'Muros, vanos, pilares, distancia Cubierta-Aéreo y paso Isla-Base' },
};

const ToggleBtn = ({ active, onClick, label, isLight }: { active: boolean, onClick: () => void, label: string, isLight?: boolean }) => (
  <button 
    onClick={onClick} 
    className={
      active 
        ? isLight
          ? "w-full py-2 px-3 bg-orange-500 text-black border border-orange-600 rounded-lg text-center cursor-pointer transition-colors text-xs font-bold shadow-sm"
          : activeBtnClass 
        : isLight 
          ? "w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-center cursor-pointer hover:border-orange-500 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 shadow-sm"
          : btnClass
    }
  >
    {label}
  </button>
);

const SliderControl = ({ label, value, min, max, step = 1, unit = "", onChange, isLight }: { label: string, value: number, min: number, max: number, step?: number, unit?: string, onChange: (val: number) => void, isLight?: boolean }) => (
  <div className="flex flex-col gap-1.5 mb-3">
    <div className={`flex justify-between items-center text-xs tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
      <span className={isLight ? "font-bold text-slate-900" : "font-semibold"}>{label}</span>
      <span className={`font-mono font-bold text-xs ${isLight ? 'text-orange-600' : 'text-orange-500'}`}>{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value || 0} 
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all ${
        isLight ? 'bg-slate-300' : 'bg-white/10'
      }`}
    />
  </div>
);

export function KitchenConfigurator({ onNavigate }: { onNavigate: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('arquify_kitchen_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('arquify_kitchen_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  const isLight = theme === 'light';

  const { viewMode, setViewMode, toolMode, setToolMode, cabinets, addCabinet, activeCabinetId, updateCabinet, removeCabinet, setActiveCabinet, applyGlobalTexture, showSocle, setShowSocle, socleFinish, setSocleFinish, socleHeight, setSocleHeight, roomConfig, setRoomPlannerOpen, walls, architecturalElements, activeArchElementId, addArchitecturalElement, updateArchitecturalElement, removeArchitecturalElement, setActiveArchElement, activeWallId, updateWall, removeWall, setActiveWall, golaSystem, setGolaSystem, countertopConfig, setCountertopConfig, qstoneCatalog, islandBackConfig, setIslandBackConfig, mepPoints, handleConfig, undo, redo, canUndo, canRedo } = useKitchenStore();

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
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    gola: false,
    socle: false,
    handles: false,
    tapacantos: false,
    assembly: false,
    view: false,
  });

  const effectiveWalls = useMemo(() => {
    return walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
      const next = arr[(i + 1) % arr.length];
      return { id: `wall_v_${i}`, start: [v.x, v.y] as [number, number], end: [next.x, next.y] as [number, number], thickness: 20, height: 240 };
    }) : []);
  }, [walls, roomConfig]);

  const handleInsertModule = (tool: string) => {
    setViewMode('3d');

    if (tool.startsWith('place_arch_')) {
      setToolMode(tool as any);
      return;
    }

    const state = useKitchenStore.getState();
    const currentCabinets = state.cabinets;
    const effectiveWalls = state.walls && state.walls.length > 0 ? state.walls : (state.roomConfig?.vertices && state.roomConfig.vertices.length >= 3 ? state.roomConfig.vertices.map((v, i, arr) => {
      const next = arr[(i + 1) % arr.length];
      return { id: `wall_v_${i}`, start: [v.x, v.y] as [number, number], end: [next.x, next.y] as [number, number], thickness: 20, height: 240 };
    }) : []);

    const specs = getCabinetSpecsFromTool(tool, currentCabinets);
    const newId = `cab_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const placement = findSmartWallPlacement(
      specs,
      currentCabinets,
      effectiveWalls,
      state.roomConfig?.vertices,
      state.architecturalElements
    );

    state.addCabinet({
      id: newId,
      name: specs.name,
      type: specs.type,
      variant: specs.variant,
      width: specs.width,
      height: specs.height,
      depth: specs.depth,
      position: placement.position,
      rotation: placement.rotation,
      material: currentCabinets[0]?.material || 'melamina_blanco',
      shelvesCount: specs.shelvesCount !== undefined ? specs.shelvesCount : (specs.type === 'wall' ? 2 : (specs.type === 'tall' ? 4 : (specs.type === 'closet' ? 2 : 1))),
      drawersCount: specs.drawersCount,
      hasHanger: specs.hasHanger,
      hasDoors: specs.hasDoors,
      innerDrawers: specs.innerDrawers,
      openAction: false,
    });

    state.setActiveCabinet(newId);
    state.setToolMode('select');
  };

  const [moduleAccordions, setModuleAccordions] = useState<Record<string, boolean>>({
    bases: false,
    torres: false,
    murales: false,
    isla: false,
    closets: false,
    arch: false,
    deco: false,
  });

  const toggleModuleAccordion = (key: string) => {
    setModuleAccordions(prev => {
      const isCurrentlyOpen = !!prev[key];
      return {
        bases: false,
        torres: false,
        murales: false,
        isla: false,
        closets: false,
        arch: false,
        deco: false,
        [key]: !isCurrentlyOpen,
      };
    });
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const isCurrentlyOpen = !!prev[key];
      return {
        gola: false,
        socle: false,
        handles: false,
        tapacantos: false,
        assembly: false,
        view: false,
        [key]: !isCurrentlyOpen,
      };
    });
  };
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCountertopModalOpen, setIsCountertopModalOpen] = useState(false);
  const [isB2BQuoteOpen, setIsB2BQuoteOpen] = useState(false);
  const [isBimModalOpen, setIsBimModalOpen] = useState(false);
  const [isNanoBananaModalOpen, setIsNanoBananaModalOpen] = useState(false);
  const [isStudioRenderModalOpen, setIsStudioRenderModalOpen] = useState(false);
  const [isExportingLabels, setIsExportingLabels] = useState(false);
  const [leftTab, setLeftTab] = useState<'modules' | 'placed'>('modules');
  const [rightTab, setRightTab] = useState<'module' | 'materials' | 'engineering' | 'mep' | 'decoration'>('module');
  const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'module' | 'materials' | 'engineering' | 'mep' | 'scene' | 'decoration'>('catalog');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showIndividualMaterial, setShowIndividualMaterial] = useState(false);
  const globalState = useStore();
  const currentAreaM2 = calculatePolygonArea(roomConfig?.vertices || []);
  const activeArchElement = architecturalElements.find(el => el.id === activeArchElementId);
  const activeWall = walls.find(w => w.id === activeWallId && Boolean(w.isInterior || (!w.id.startsWith('wall_v_') && !/^wall_\d+_/.test(w.id))));

  const mepClashes = React.useMemo(() => {
    return detectMepClashes(mepPoints, cabinets, countertopConfig);
  }, [mepPoints, cabinets, countertopConfig]);

  const handleExportLabels = async () => {
    setIsExportingLabels(true);
    try {
      await exportKitchenLabelsPDF(cabinets, globalState);
    } catch (err) {
      console.error('Error al exportar etiquetas', err);
      alert('Error al generar las etiquetas de producción.');
    } finally {
      setIsExportingLabels(false);
    }
  };

  const { currentUser, isAuthenticated: isLocalAuth, logAccess } = useAdminStore();
  const supabaseUser = useSupabaseAuthStore((state) => state.user);
  const isAuthenticated = Boolean(isLocalAuth || supabaseUser);
  const effectiveRole = currentUser?.role || supabaseUser?.role || 'designer';
  const isSuperAdmin = Boolean(effectiveRole === 'superadmin');
  const canAccessIndustrialOutputs = Boolean(
    effectiveRole === 'superadmin' || effectiveRole === 'tenant_admin' || effectiveRole === 'operator'
  );

  // Control de Acceso y Trazabilidad en Auditoría del Superadmin
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate();
      return;
    }

    logAccess({
      userId: currentUser?.id || supabaseUser?.id || 'guest',
      userName: currentUser?.full_name || supabaseUser?.full_name || 'Usuario',
      userEmail: currentUser?.email || supabaseUser?.email || 'usuario@sistema.cl',
      userPhone: currentUser?.phone,
      userRubro: currentUser?.rubro,
      userCity: currentUser?.city,
      userCommune: currentUser?.commune,
      module: 'Configurador de Cocinas 3D',
    });
  }, [isAuthenticated, currentUser, supabaseUser, logAccess, onNavigate]);

  // Descarga directa de Cotización y Ficha Comercial en PDF sin salir al Backoffice
  const handleDirectCommercialPdfDownload = () => {
    try {
      const state = useStore.getState();
      let screenshotUrl: string | undefined = undefined;
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          screenshotUrl = canvas.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('No se pudo capturar imagen del canvas 3D:', e);
      }

      exportKitchenCommercialPdf({
        projectName: 'Proyecto Cocina Integral 3D',
        cabinets,
        state,
        countertopConfig,
        qstoneCatalog,
        userInfo: {
          fullName: currentUser?.full_name || 'Cliente Particular',
          email: currentUser?.email,
          phone: currentUser?.phone,
          rubro: currentUser?.rubro,
          city: currentUser?.city,
          commune: currentUser?.commune,
          address: currentUser?.address,
        },
        screenshotUrl,
      });
    } catch (err) {
      console.error('Error al generar cotización comercial directa:', err);
      alert('Hubo un error al generar la cotización PDF.');
    }
  };

  // Requisito: Cuando se carguen los muebles, las cotas deben iniciar apagadas
  useEffect(() => {
    useStore.setState({ showDimensions: false });
  }, []);

  // Auto-switch right tab to 'module' and mobile tab when an item is selected
  useEffect(() => {
    if (activeCabinetId || activeArchElementId || activeWallId) {
      setRightTab((prev) => (prev !== 'module' ? 'module' : prev));
      setActiveMobileTab('module');
    }
  }, [activeCabinetId, activeArchElementId, activeWallId]);

  // Keyboard shortcut listener: Delete or Backspace to delete individual active cabinet, arch element, or wall
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeCabinetId) {
        e.preventDefault();
        removeCabinet(activeCabinetId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeArchElementId) {
        e.preventDefault();
        removeArchitecturalElement(activeArchElementId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeWallId) {
        e.preventDefault();
        removeWall(activeWallId);
      } else if (e.key === 'Escape') {
        setActiveCabinet(null);
        setActiveArchElement(null);
        setActiveWall(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCabinetId, activeArchElementId, activeWallId, removeCabinet, removeArchitecturalElement, removeWall, setActiveCabinet, setActiveArchElement, setActiveWall]);

  const handleTextureSelect = (url: string, mat: string, thicknessMm?: number) => {
    // Protección estricta: Piedras y cuarzos Qstone aplican ÚNICAMENTE a cubiertas
    const isExplicitCabinetMat = mat === 'melamina' || mat === 'hpl' || mat === 'durolac';
    const isStone =
      !isExplicitCabinetMat &&
      (mat === 'cuarzo' ||
      mat === 'sinterizado' ||
      mat === 'granito' ||
      mat === 'marmol' ||
      qstoneCatalog.some((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)));

    if (isStone) {
      const matchedProd =
        qstoneCatalog.find((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)) || qstoneCatalog[0];
      if (matchedProd) {
        setCountertopConfig({ selectedProductId: matchedProd.id, enabled: true });
      }
      return;
    }

    if (!activeCabinetId) return;
    const part = globalState.targetPart;
    const activeCabinet = cabinets.find((c) => c.id === activeCabinetId);
    const urlLower = url.toLowerCase();
    const effectiveMat: 'melamina' | 'hpl' = (mat === 'hpl' || urlLower.includes('abet') || urlLower.includes('laminati') || urlLower.includes('fiore') || urlLower.includes('broccato')) ? 'hpl' : (mat as any);

    if (part === 'all') {
      updateCabinet(activeCabinetId, {
        structureColor: url, structureMaterial: effectiveMat,
        doorColor: url, doorMaterial: effectiveMat,
        drawerFrontColor: url, drawerFrontMaterial: effectiveMat,
        drawerInnerColor: url, drawerInnerMaterial: effectiveMat,
        shelfColor: url, shelfMaterial: effectiveMat,
        backColor: url, backMaterial: effectiveMat,
        socleColor: url, socleMaterial: effectiveMat,
        leftCoverPanel: activeCabinet?.leftCoverPanel?.enabled ? { ...activeCabinet.leftCoverPanel, color: url, material: effectiveMat } : undefined,
        rightCoverPanel: activeCabinet?.rightCoverPanel?.enabled ? { ...activeCabinet.rightCoverPanel, color: url, material: effectiveMat } : undefined,
      });
    } else if (part === 'structure') {
      updateCabinet(activeCabinetId, { structureColor: url, structureMaterial: effectiveMat });
    } else if (part === 'doors') {
      updateCabinet(activeCabinetId, { doorColor: url, doorMaterial: effectiveMat });
    } else if (part === 'drawerFronts') {
      updateCabinet(activeCabinetId, { drawerFrontColor: url, drawerFrontMaterial: effectiveMat });
    } else if (part === 'drawerInner') updateCabinet(activeCabinetId, { drawerInnerColor: url, drawerInnerMaterial: effectiveMat });
    else if (part === 'shelves') updateCabinet(activeCabinetId, { shelfColor: url, shelfMaterial: effectiveMat });
    else if (part === 'back') {
      const isDuro = mat === 'durolac' || thicknessMm === 3;
      updateCabinet(activeCabinetId, { 
        backColor: url, 
        backMaterial: (isDuro ? 'durolac' : effectiveMat) as any,
        backThickness: thicknessMm || (isDuro ? 3 : 15)
      });
    }
    else if (part === 'socle') updateCabinet(activeCabinetId, { socleColor: url, socleMaterial: effectiveMat });
    else if (part === 'coverPanels') {
      updateCabinet(activeCabinetId, {
        leftCoverPanel: activeCabinet?.leftCoverPanel?.enabled ? { ...activeCabinet.leftCoverPanel, color: url, material: mat as any } : undefined,
        rightCoverPanel: activeCabinet?.rightCoverPanel?.enabled ? { ...activeCabinet.rightCoverPanel, color: url, material: mat as any } : undefined,
      });
    } else if (part === 'leftCoverPanel') {
      updateCabinet(activeCabinetId, {
        leftCoverPanel: {
          enabled: true,
          extendToFloor: activeCabinet?.leftCoverPanel?.extendToFloor ?? false,
          color: url,
          material: mat as any,
          thickness: activeCabinet?.leftCoverPanel?.thickness,
        }
      });
    } else if (part === 'rightCoverPanel') {
      updateCabinet(activeCabinetId, {
        rightCoverPanel: {
          enabled: true,
          extendToFloor: activeCabinet?.rightCoverPanel?.extendToFloor ?? false,
          color: url,
          material: mat as any,
          thickness: activeCabinet?.rightCoverPanel?.thickness,
        }
      });
    }
  };

  const handleGlobalTextureSelect = (url: string, mat: string, thicknessMm?: number) => {
    // Protección estricta: Piedras y cuarzos Qstone aplican ÚNICAMENTE a cubiertas
    const isExplicitCabinetMat = mat === 'melamina' || mat === 'hpl' || mat === 'durolac';
    const isStone =
      !isExplicitCabinetMat &&
      (mat === 'cuarzo' ||
      mat === 'sinterizado' ||
      mat === 'granito' ||
      mat === 'marmol' ||
      qstoneCatalog.some((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)));

    if (isStone) {
      const matchedProd =
        qstoneCatalog.find((p) => p.id === url || (Boolean(p.textureUrl) && !p.textureUrl?.startsWith('#') && !url.startsWith('#') && p.textureUrl === url)) || qstoneCatalog[0];
      if (matchedProd) {
        setCountertopConfig({ selectedProductId: matchedProd.id, enabled: true });
      }
      return;
    }

    const part = globalState.targetPart;
    const urlLower = url.toLowerCase();
    const effectiveMat: 'melamina' | 'hpl' | 'durolac' = mat === 'durolac' ? 'durolac' : ((mat === 'hpl' || urlLower.includes('abet') || urlLower.includes('laminati') || urlLower.includes('fiore') || urlLower.includes('broccato')) ? 'hpl' : (mat as any));

    if (part === 'islandBack') {
      setIslandBackConfig({
        enabled: true,
        materialType: 'decorative',
        decorativeColor: url,
        decorativeMaterial: effectiveMat as any,
      });
      return;
    }
    applyGlobalTexture(part, url, effectiveMat, thicknessMm);
    if (part === 'structure' || part === 'all') {
      globalState.setStructureColor(url);
      globalState.setStructureMaterial(effectiveMat as any);
    }
    if (part === 'doors' || part === 'all') {
      globalState.setDoorColor(url);
      globalState.setDoorMaterial(effectiveMat as any);
    }
    if (part === 'drawerFronts' || part === 'all') {
      globalState.setDrawerFrontColor(url);
      globalState.setDrawerFrontMaterial(effectiveMat as any);
    }
    if (part === 'drawerInner' || part === 'all') {
      globalState.setDrawerInnerColor(url);
      globalState.setDrawerInnerMaterial(mat as any);
    }
    if (part === 'shelves' || part === 'all') {
      globalState.setShelfColor(url);
      globalState.setShelfMaterial(mat as any);
    }
    if (part === 'back' || part === 'all') {
      globalState.setBackColor(url);
      if (globalState.setBackMaterial) globalState.setBackMaterial(effectiveMat);
      if (globalState.setBackThickness && thicknessMm) globalState.setBackThickness(thicknessMm);
    }
    if (part === 'socle' || part === 'all') {
      globalState.setSocleColor(url);
      globalState.setSocleMaterial(mat as any);
    }
  };

  const activeCabinet = cabinets.find(c => c.id === activeCabinetId);

  return (
    <StudioRenderProvider>
      <div className={`flex flex-col h-screen w-screen font-sans overflow-hidden transition-colors ${isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0A0A0A] text-slate-200'}`}>
      {/* Planos de Fabricación y Despiece CAD/CAM */}
      <KitchenBlueprint />

      {/* Modal de Configuración y Dibujo de Estancia */}
      <RoomPlannerModal />

      {/* Modal de Confirmación para Reiniciar y Partir de Cero */}
      <ResetConfirmModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />

      <nav className={`flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3.5 border-b backdrop-blur-md z-30 transition-colors shrink-0 ${
        isLight ? 'border-slate-200 bg-white/90 shadow-sm' : 'border-white/10 bg-black/60'
      }`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onNavigate} 
            className={`p-1.5 sm:p-2 rounded-lg transition-colors border cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`} 
            title="Volver al Inicio"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bellota text-xl sm:text-2xl font-bold lowercase text-orange-500 tracking-tight select-none">arquify</span>
            <span className={`text-[10px] sm:text-xs uppercase tracking-widest border-l pl-2 sm:pl-3 hidden md:inline ${
              isLight ? 'text-slate-400 border-slate-200' : 'text-slate-500 border-white/10'
            }`}>Cocinas</span>
          </div>
        </div>

        {/* Acciones para Móvil / Tablet (< lg) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          {/* Toggle 2D / 3D */}
          <div className={`flex p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/50 border-white/10'}`}>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${viewMode === '2d' ? 'bg-orange-500 text-black' : isLight ? 'text-slate-600' : 'text-slate-400'}`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${viewMode === '3d' ? 'bg-orange-500 text-black' : isLight ? 'text-slate-600' : 'text-slate-400'}`}
            >
              3D
            </button>
          </div>


          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`p-1.5 rounded-lg border transition-all ${
                canUndo()
                  ? isLight ? 'bg-orange-50 border-orange-300 text-orange-600 cursor-pointer' : 'bg-orange-500/15 border-orange-500/60 text-orange-400 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed border-transparent text-slate-500'
              }`}
              title="Deshacer"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={`p-1.5 rounded-lg border transition-all ${
                canRedo()
                  ? isLight ? 'bg-orange-50 border-orange-300 text-orange-600 cursor-pointer' : 'bg-orange-500/15 border-orange-500/60 text-orange-400 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed border-transparent text-slate-500'
              }`}
              title="Rehacer"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Botón Menú Secundario "Más" */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isMobileMenuOpen
                ? 'bg-orange-500 text-black border-orange-600 shadow-sm'
                : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
            }`}
            title="Menú y opciones del proyecto"
          >
            {isMobileMenuOpen ? <X size={14} /> : <MoreVertical size={14} />}
            <span className="hidden sm:inline">Menú</span>
          </button>
        </div>

        {/* Acceso directo a Área de Cocina, Vistas y Reinicio (Desktop >= lg) */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => {
              if (activeCabinetId) setActiveCabinet(null);
              if (activeArchElementId) setActiveArchElement(null);
              setRoomPlannerOpen(true);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-sm group ${
              isLight
                ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-600 hover:text-orange-700'
                : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500 text-orange-400 hover:text-orange-300'
            }`}
          >
            <Maximize2 size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <span>Área de cocina: <span className={`font-mono underline decoration-orange-500/50 underline-offset-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{roomConfig.type === 'rectangular' ? 'Rectangular' : roomConfig.type === 'l_shape' ? 'Forma L' : roomConfig.type === 'five_corners' ? '5 Esquinas' : roomConfig.type === 'u_shape' ? 'Forma U' : 'Diseño Libre'}</span> ({currentAreaM2.toFixed(2)} m²)</span>
          </button>

          <div className={`flex p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/50 border-white/10'}`}>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === '2d' ? 'bg-orange-500 text-black' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              Plano 2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === '3d' ? 'bg-orange-500 text-black' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              Vista 3D
            </button>
          </div>


          {/* Botones Deshacer y Rehacer (Undo / Redo) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all shadow-sm ${
                canUndo()
                  ? isLight
                    ? 'bg-orange-50 hover:bg-orange-100 border-orange-400 text-orange-600 cursor-pointer active:scale-95 shadow-orange-500/10'
                    : 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/60 text-orange-400 hover:text-orange-300 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                  : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
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
                  ? isLight
                    ? 'bg-orange-50 hover:bg-orange-100 border-orange-400 text-orange-600 cursor-pointer active:scale-95 shadow-orange-500/10'
                    : 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/60 text-orange-400 hover:text-orange-300 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                  : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                    : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title={canRedo() ? 'Rehacer acción (Ctrl+Y / Ctrl+Shift+Z)' : 'Sin acciones para rehacer'}
              aria-label="Rehacer"
            >
              <Redo2 size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Botón selector de Modo Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400 hover:text-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>

          {canAccessIndustrialOutputs && (
            <button
              onClick={() => setIsB2BQuoteOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-400 hover:text-amber-300'
              }`}
              title="Cotización Comercial Dual (Costo Fábrica B2B vs Venta Cliente Final)"
            >
              <DollarSign size={14} className="text-amber-500" />
              <span>Cotización B2B</span>
            </button>
          )}

          {/* Descarga directa de Cotización Comercial PDF con Vistas 3D sin tener que salir */}
          <button
            onClick={handleDirectCommercialPdfDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer"
            title="Descargar Cotización y Ficha Comercial en PDF con Vistas 3D"
          >
            <Download size={14} />
            <span>Cotización PDF</span>
          </button>

          {canAccessIndustrialOutputs && (
            <button
              onClick={() => setIsBimModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/40 text-indigo-400 hover:text-indigo-300'
              }`}
              title="Descargar paquete de modelado 3D y OpenBIM (.OBJ, .IFC, .DXF 3D, .ZIP) para Revit, SketchUp, Archicad y Blender"
            >
              <Box size={14} className="text-indigo-500" />
              <span>Exportar 3D / BIM</span>
            </button>
          )}

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-600/20 cursor-pointer"
            title="Guardar diseño actual en el Backoffice"
          >
            <Save size={14} />
            <span>Guardar Proyecto</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
            title="Borrar todo y partir de cero"
          >
            <RotateCcw size={14} />
            <span>Partir de Cero</span>
          </button>
        </div>
      </nav>

      {/* Drawer / Popover de Acciones Secundarias en Móvil */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-3 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-2xl border p-4 shadow-2xl flex flex-col gap-2 max-h-[85vh] overflow-y-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-500">Acciones del Proyecto</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <button
              onClick={() => { setIsMobileMenuOpen(false); handleDirectCommercialPdfDownload(); }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Download size={16} />
              <span>Descargar Cotización PDF (3D y Precios)</span>
            </button>

            <button
              onClick={() => { setIsMobileMenuOpen(false); setRoomPlannerOpen(true); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Maximize2 size={16} />
              <span>Área de Cocina ({currentAreaM2.toFixed(2)} m²)</span>
            </button>

            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsCountertopModalOpen(true); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Cubiertas Qstone {countertopConfig.enabled ? '(Activada)' : ''}</span>
            </button>

            {canAccessIndustrialOutputs && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); globalState.setIsPrinting(true); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
              >
                <FileText size={16} />
                <span>Planos y Despiece de Fabricación</span>
              </button>
            )}

            {canAccessIndustrialOutputs && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsB2BQuoteOpen(true); }}
                className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <DollarSign size={16} />
                <span>Cotización Comercial B2B</span>
              </button>
            )}

            {canAccessIndustrialOutputs && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsBimModalOpen(true); }}
                className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Box size={16} />
                <span>Exportar 3D / BIM (.OBJ, .IFC, .DXF)</span>
              </button>
            )}

            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsSaveModalOpen(true); }}
              className="flex items-center gap-3 p-3 rounded-xl bg-orange-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Save size={16} />
              <span>Guardar Proyecto</span>
            </button>

            <button
              onClick={() => { toggleTheme(); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-white/5 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-400" />}
              <span>{theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
            </button>

            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsResetModalOpen(true); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Partir de Cero (Borrar Todo)</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
         <div className={`${(activeMobileTab === 'catalog' || activeMobileTab === 'scene') ? 'flex' : 'hidden lg:flex'} flex-col z-10 transition-colors shadow-2xl order-3 lg:order-1 flex-1 lg:flex-none w-full lg:w-72 min-h-0 h-auto lg:h-full border-t lg:border-t-0 lg:border-r ${isLight ? 'bg-white border-slate-200 shadow-slate-200' : 'bg-zinc-900 border-white/10'}`}>
            <div className={`p-4 border-b hidden lg:block ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
               <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Herramientas</h3>
               <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (activeCabinetId) setActiveCabinet(null);
                      if (activeArchElementId) setActiveArchElement(null);
                      setRoomPlannerOpen(true);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all bg-[#FACC15] text-black hover:bg-[#eab308] shadow-[0_0_15px_rgba(250,204,21,0.25)]"
                  >
                    <Layers size={16} />
                    <div className="flex flex-col text-left">
                      <span>Área de Cocina</span>
                      <span className="text-[9px] text-zinc-800 font-normal font-mono">{currentAreaM2.toFixed(2)} m² • Muros y Cotas</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (activeCabinetId) setActiveCabinet(null);
                      if (activeArchElementId) setActiveArchElement(null);
                      setIsCountertopModalOpen(true);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                      countertopConfig.enabled
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles size={16} className="text-amber-400 shrink-0" />
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span>Cubiertas</span>
                        {countertopConfig.enabled && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (activeCabinetId) setActiveCabinet(null);
                      if (activeArchElementId) setActiveArchElement(null);
                      setIsNanoBananaModalOpen(true);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black shadow-md shadow-orange-500/20`}
                  >
                    <Camera size={16} className="shrink-0" />
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 font-black">
                        <span>Render NanoBanana</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-black/20 text-black rounded font-mono uppercase">AI</span>
                      </div>
                      <span className="text-[9px] text-zinc-900 font-semibold">Fotorrealismo & Personas</span>
                    </div>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        if (activeCabinetId) setActiveCabinet(null);
                        if (activeArchElementId) setActiveArchElement(null);
                        setIsStudioRenderModalOpen(true);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 shadow-sm'
                          : 'bg-zinc-800/90 hover:bg-zinc-800 border-white/10 text-white shadow-md'
                      }`}
                      title="Generar render fotográfico nítido en alta resolución (FHD, 2K, 4K) usando Three.js puro sin IA"
                    >
                      <Camera size={16} className="text-orange-500 shrink-0" />
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5 font-black">
                          <span>Render Estudio 3D</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-mono uppercase border border-emerald-500/30">GPU</span>
                        </div>
                        <span className={`text-[9px] font-semibold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Three.js HD • Ollas & Escala</span>
                      </div>
                    </button>
                  )}

                  <ToolButton isLight={isLight} active={toolMode === 'draw_wall'} onClick={() => { if (activeCabinetId) setActiveCabinet(null); if (activeArchElementId) setActiveArchElement(null); setToolMode('draw_wall'); setViewMode('2d'); }} icon={<PenTool size={16}/>} label="Dibujar Tramo Muro" />
               </div>
            </div>

            {/* En móvil: Acceso a Dibujar Tramo Muro directo cuando se está en pestaña Catálogo */}
            {activeMobileTab === 'catalog' && (
              <div className="lg:hidden p-3 border-b border-white/10 bg-white/5">
                <ToolButton isLight={isLight} active={toolMode === 'draw_wall'} onClick={() => { if (activeCabinetId) setActiveCabinet(null); if (activeArchElementId) setActiveArchElement(null); setToolMode('draw_wall'); setViewMode('2d'); }} icon={<PenTool size={16}/>} label="Dibujar Tramo Muro (2D)" />
              </div>
            )}

            {/* Pestañas Catálogo Módulos / En Escena (Desktop >= lg) */}
            <div className={`hidden lg:grid grid-cols-2 border-b p-2 gap-1.5 transition-colors ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/50'}`}>
              <button
                onClick={() => setLeftTab('modules')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  leftTab === 'modules'
                    ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Box size={13} />
                <span>Módulos</span>
              </button>
              <button
                onClick={() => setLeftTab('placed')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  leftTab === 'placed'
                    ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListOrdered size={13} />
                <span>Escena</span>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
               {leftTab === 'modules' ? (
                 <div className="flex flex-col gap-2">
                    {/* 1. Bases */}
                    <ModuleCategoryAccordion
                      id="bases"
                      title="1. Bases"
                      count={10}
                      icon={<Box size={14} />}
                      isOpen={!!moduleAccordions.bases}
                      onToggle={() => toggleModuleAccordion('bases')}
                      hasActiveTool={['place_base_1_door', 'place_base_1_door_1_drawer', 'place_base_2_doors', 'place_base_4_drawers', 'place_base_2_pot_drawers', 'place_base_sink_u_drawer', 'place_base_spice_rack', 'place_base_wine_rack', 'place_base_corner_blind', 'place_base_corner_l'].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_1_door'} onClick={() => handleInsertModule('place_base_1_door')} icon={<Box size={14}/>} label="1 Puerta" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_1_door_1_drawer'} onClick={() => handleInsertModule('place_base_1_door_1_drawer')} icon={<Box size={14}/>} label="1 Pta + 1 Cajón" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_2_doors'} onClick={() => handleInsertModule('place_base_2_doors')} icon={<Box size={14}/>} label="2 Puertas" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_4_drawers'} onClick={() => handleInsertModule('place_base_4_drawers')} icon={<Box size={14}/>} label="4 Cajones" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_2_pot_drawers'} onClick={() => handleInsertModule('place_base_2_pot_drawers')} icon={<Box size={14}/>} label="2 Olleros" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_sink_u_drawer'} onClick={() => handleInsertModule('place_base_sink_u_drawer')} icon={<Box size={14}/>} label="Fregadero Cajón en U" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_spice_rack'} onClick={() => handleInsertModule('place_base_spice_rack')} icon={<Box size={14}/>} label="Especiero" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_wine_rack'} onClick={() => handleInsertModule('place_base_wine_rack')} icon={<Wine size={14}/>} label="Botellero Base" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_corner_blind'} onClick={() => handleInsertModule('place_base_corner_blind')} icon={<Box size={14}/>} label="Esquinero Ciego" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_base_corner_l'} onClick={() => handleInsertModule('place_base_corner_l')} icon={<Box size={14}/>} label="Esquinero en L (90x90)" />
                    </ModuleCategoryAccordion>

                    {/* 2. Torres & Despensas */}
                    <ModuleCategoryAccordion
                      id="torres"
                      title="2. Torres & Despensas"
                      count={10}
                      icon={<LayoutGrid size={14} />}
                      isOpen={!!moduleAccordions.torres}
                      onToggle={() => toggleModuleAccordion('torres')}
                      hasActiveTool={['place_tall_1_door', 'place_tall_split_2_doors', 'place_tall_oven_micro', 'place_tall_oven_vent', 'place_tall_inner_drawers', 'place_tall_microwave_niche', 'place_tall_open', 'place_tall_wine_rack', 'place_tall_2_doors', 'place_tall_terminal_shelves'].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_1_door'} onClick={() => handleInsertModule('place_tall_1_door')} icon={<LayoutGrid size={14}/>} label="1 Pta Larga (Repisas)" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_split_2_doors'} onClick={() => handleInsertModule('place_tall_split_2_doors')} icon={<LayoutGrid size={14}/>} label="2 Ptas (Línea Base + Alta)" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_oven_micro'} onClick={() => handleInsertModule('place_tall_oven_micro')} icon={<LayoutGrid size={14}/>} label="Torre Horno + Micro Empotrado" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_oven_vent'} onClick={() => handleInsertModule('place_tall_oven_vent')} icon={<LayoutGrid size={14}/>} label="Torre Hornos Vent. Técnica" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_inner_drawers'} onClick={() => handleInsertModule('place_tall_inner_drawers')} icon={<LayoutGrid size={14}/>} label="Despensa Cajones Interiores" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_microwave_niche'} onClick={() => handleInsertModule('place_tall_microwave_niche')} icon={<LayoutGrid size={14}/>} label="Nicho Micro Portátil" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_open'} onClick={() => handleInsertModule('place_tall_open')} icon={<LayoutGrid size={14}/>} label="Repisas a la Vista" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_terminal_shelves'} onClick={() => handleInsertModule('place_tall_terminal_shelves')} icon={<LayoutGrid size={14}/>} label="Torre Repisas Terminales" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_wine_rack'} onClick={() => handleInsertModule('place_tall_wine_rack')} icon={<Wine size={14}/>} label="Botellero Despensa" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_tall_2_doors'} onClick={() => handleInsertModule('place_tall_2_doors')} icon={<LayoutGrid size={14}/>} label="Despensa 2 Puertas" />
                    </ModuleCategoryAccordion>

                    {/* 3. Murales & Aéreos */}
                    <ModuleCategoryAccordion
                      id="murales"
                      title="3. Murales & Aéreos"
                      count={8}
                      icon={<Square size={14} />}
                      isOpen={!!moduleAccordions.murales}
                      onToggle={() => toggleModuleAccordion('murales')}
                      hasActiveTool={['place_wall_1_door', 'place_wall_2_doors', 'place_wall_lift_up', 'place_wall_lift_up_double', 'place_wall_microwave_niche', 'place_wall_open', 'place_wall_corner_blind', 'place_wall_wine_rack'].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_1_door'} onClick={() => handleInsertModule('place_wall_1_door')} icon={<Square size={14}/>} label="1. Aéreo 1 Puerta" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_2_doors'} onClick={() => handleInsertModule('place_wall_2_doors')} icon={<Square size={14}/>} label="2. Aéreo 2 Puertas" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_lift_up'} onClick={() => handleInsertModule('place_wall_lift_up')} icon={<Square size={14}/>} label="3. Pta Elevable Aventos" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_lift_up_double'} onClick={() => handleInsertModule('place_wall_lift_up_double')} icon={<Square size={14}/>} label="4. Doble Pta Elevable" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_microwave_niche'} onClick={() => handleInsertModule('place_wall_microwave_niche')} icon={<Square size={14}/>} label="5. Nicho Micro + Pta Sup" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_open'} onClick={() => handleInsertModule('place_wall_open')} icon={<Square size={14}/>} label="6. Repisas a la Vista" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_corner_blind'} onClick={() => handleInsertModule('place_wall_corner_blind')} icon={<Square size={14}/>} label="7. Aéreo Esquinero Ciego" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_wall_wine_rack'} onClick={() => handleInsertModule('place_wall_wine_rack')} icon={<Wine size={14}/>} label="8. Botellero Aéreo" />
                    </ModuleCategoryAccordion>

                    {/* 4. Isla */}
                    <ModuleCategoryAccordion
                      id="isla"
                      title="4. Muebles Isla"
                      count={6}
                      icon={<Layers size={14} />}
                      isOpen={!!moduleAccordions.isla}
                      onToggle={() => toggleModuleAccordion('isla')}
                      hasActiveTool={[
                        'place_island',
                        'place_island_4_drawers',
                        'place_island_2_drawers_1_pot',
                        'place_island_1_door',
                        'place_island_2_doors',
                        'place_island_wine_rack'
                      ].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_island'} onClick={() => handleInsertModule('place_island')} icon={<Box size={14}/>} label="Isla 2 Olleros" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_island_4_drawers'} onClick={() => handleInsertModule('place_island_4_drawers')} icon={<LayoutGrid size={14}/>} label="Isla 4 Cajones" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_island_2_drawers_1_pot'} onClick={() => handleInsertModule('place_island_2_drawers_1_pot')} icon={<LayoutGrid size={14}/>} label="Isla 2 Caj. + 1 Ollero" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_island_1_door'} onClick={() => handleInsertModule('place_island_1_door')} icon={<Square size={14}/>} label="Isla 1 Puerta" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_island_2_doors'} onClick={() => handleInsertModule('place_island_2_doors')} icon={<Columns size={14}/>} label="Isla 2 Puertas" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_island_wine_rack'} onClick={() => handleInsertModule('place_island_wine_rack')} icon={<Wine size={14}/>} label="Botellero Isla" />
                    </ModuleCategoryAccordion>

                    {/* 5. Clósets & Roperos */}
                    <ModuleCategoryAccordion
                      id="closets"
                      title="5. Clósets & Roperos"
                      count={7}
                      icon={<Box size={14} />}
                      isOpen={!!moduleAccordions.closets}
                      onToggle={() => toggleModuleAccordion('closets')}
                      hasActiveTool={[
                        'place_closet_hanger',
                        'place_closet_mixed',
                        'place_closet_shelves',
                        'place_closet_drawers',
                        'place_closet_2_doors',
                        'place_closet_walkin',
                        'place_closet_inner_drawers'
                      ].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_hanger'} onClick={() => handleInsertModule('place_closet_hanger')} icon={<Box size={14}/>} label="1. Barra + Maletero" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_mixed'} onClick={() => handleInsertModule('place_closet_mixed')} icon={<LayoutGrid size={14}/>} label="2. Mixto (Barra + Cajones)" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_shelves'} onClick={() => handleInsertModule('place_closet_shelves')} icon={<Square size={14}/>} label="3. Lencero (Repisas)" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_drawers'} onClick={() => handleInsertModule('place_closet_drawers')} icon={<LayoutGrid size={14}/>} label="4. Cajonera 4 Cajones" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_2_doors'} onClick={() => handleInsertModule('place_closet_2_doors')} icon={<Columns size={14}/>} label="5. Clóset 2 Puertas" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_walkin'} onClick={() => handleInsertModule('place_closet_walkin')} icon={<Layers size={14}/>} label="6. Walk-in Abierto" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_closet_inner_drawers'} onClick={() => handleInsertModule('place_closet_inner_drawers')} icon={<LayoutGrid size={14}/>} label="7. Cajones Ocultos (2 Ptas)" />
                    </ModuleCategoryAccordion>

                    {/* 6. Elementos Arquitectónicos */}
                    <ModuleCategoryAccordion
                      id="arch"
                      title="6. Elementos Arquitectónicos"
                      count={3}
                      icon={<Columns size={14} />}
                      isOpen={!!moduleAccordions.arch}
                      onToggle={() => toggleModuleAccordion('arch')}
                      hasActiveTool={['place_arch_door', 'place_arch_window', 'place_arch_pillar'].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_arch_door'} onClick={() => { setToolMode('place_arch_door'); setViewMode('3d'); }} icon={<Columns size={14}/>} label="Puerta" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_arch_window'} onClick={() => { setToolMode('place_arch_window'); setViewMode('3d'); }} icon={<Square size={14}/>} label="Ventana" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_arch_pillar'} onClick={() => { setToolMode('place_arch_pillar'); setViewMode('3d'); }} icon={<Maximize2 size={14}/>} label="Pilar / Muro Corto" />
                    </ModuleCategoryAccordion>

                    {/* 7. Decoración */}
                    <ModuleCategoryAccordion
                      id="deco"
                      title="7. Decoración"
                      count={5}
                      icon={<Sparkles size={14} />}
                      isOpen={!!moduleAccordions.deco}
                      onToggle={() => toggleModuleAccordion('deco')}
                      hasActiveTool={['place_deco_stove', 'place_deco_fridge', 'place_deco_hood', 'place_deco_plant', 'place_deco_dishwasher'].includes(toolMode)}
                      isLight={isLight}
                    >
                      <ToolButton isLight={isLight} active={toolMode === 'place_deco_stove'} onClick={() => handleInsertModule('place_deco_stove')} icon={<Flame size={14}/>} label="1. Cocina FDV 90" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_deco_fridge'} onClick={() => handleInsertModule('place_deco_fridge')} icon={<Refrigerator size={14}/>} label="2. Refrigerador SBS" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_deco_hood'} onClick={() => handleInsertModule('place_deco_hood')} icon={<Sparkles size={14}/>} label="3. Campana FDV Conic 90" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_deco_plant'} onClick={() => handleInsertModule('place_deco_plant')} icon={<Flower2 size={14}/>} label="4. Planta Interior" />
                      <ToolButton isLight={isLight} active={toolMode === 'place_deco_dishwasher'} onClick={() => handleInsertModule('place_deco_dishwasher')} icon={<Utensils size={14}/>} label="5. Lavavajillas FDV 12C" />
                    </ModuleCategoryAccordion>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                     <div className={`text-[10px] uppercase font-bold tracking-widest ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                       Módulos en Escena ({cabinets.length})
                     </div>
                     {cabinets.length > 0 && (
                       <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Clic para editar o borrar</span>
                     )}
                   </div>

                   {cabinets.length === 0 ? (
                     <div className={`p-5 rounded-xl border text-center flex flex-col items-center gap-2.5 mt-2 ${
                       isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                     }`}>
                       <Box size={24} className={isLight ? "text-slate-400" : "text-zinc-500"} />
                       <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>No hay muebles cargados en la escena</p>
                       <button
                         onClick={() => setLeftTab('modules')}
                         className="mt-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-orange-500/40 transition-colors cursor-pointer"
                       >
                         Ver Catálogo de Módulos
                       </button>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-2">
                       {cabinets.map((cab, idx) => {
                         const isSelected = cab.id === activeCabinetId;
                         const label = getCabinetLabel(cab, idx);
                         return (
                           <div
                             key={cab.id}
                             onClick={() => setActiveCabinet(isSelected ? null : cab.id)}
                             className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                               isSelected
                                 ? isLight
                                   ? 'bg-orange-50 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                                   : 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                                 : isLight
                                   ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                                   : 'bg-[#18181b] border-white/10 hover:border-white/20 hover:bg-[#202024]'
                             }`}
                           >
                             <div className="flex items-center justify-between gap-2">
                               <div className="flex items-center gap-2 min-w-0">
                                 <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${
                                   isLight
                                     ? isSelected
                                       ? 'bg-orange-500 text-black border-orange-600'
                                       : 'bg-slate-100 border-slate-300 text-slate-700'
                                     : 'bg-black/50 border-white/10 text-orange-400'
                                 }`}>
                                   MOD {idx + 1}
                                 </span>
                                 <span className={`text-xs font-bold truncate ${
                                   isSelected
                                     ? isLight ? 'text-slate-900 font-extrabold' : 'text-white'
                                     : isLight ? 'text-slate-700 group-hover:text-slate-950' : 'text-zinc-200 group-hover:text-white'
                                 }`}>
                                   {label}
                                 </span>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     const currentRot = cab.rotation || 0;
                                     const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                                     updateCabinet(cab.id, { rotation: nextRot });
                                   }}
                                   title="Girar 90°"
                                   className={`p-1 rounded transition-colors ${
                                     isLight
                                       ? 'text-slate-400 hover:text-cyan-600 hover:bg-slate-100'
                                       : 'text-zinc-400 hover:text-cyan-400 hover:bg-white/5'
                                   }`}
                                 >
                                   <RotateCw size={13} />
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     removeCabinet(cab.id);
                                   }}
                                   title="Eliminar este mueble"
                                   className={`p-1 rounded transition-colors ${
                                     isLight
                                       ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                       : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10'
                                   }`}
                                 >
                                   <Trash2 size={13} />
                                 </button>
                               </div>
                             </div>

                             <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
                               isLight ? 'border-slate-200 text-slate-500' : 'border-white/5 text-zinc-400'
                             }`}>
                               <span>{cab.width} × {cab.height} × {cab.depth} cm</span>
                               <span className={`text-[9px] uppercase font-sans tracking-wider ${
                                 isLight ? 'text-slate-500' : 'text-zinc-500'
                               }`}>
                                 {cab.type === 'base' ? 'Base' : cab.type === 'tall' ? 'Torre' : cab.type === 'wall' ? 'Aéreo' : cab.type === 'island' ? 'Isla' : 'Equipamiento'}
                               </span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Acceso Rápido a Planos y Fabricación en Móvil para Catálogo / Escena */}
            <div className={`p-2.5 border-t shrink-0 flex lg:hidden items-center justify-between gap-2 transition-colors ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/70'
            }`}>
              <button
                onClick={() => setRoomPlannerOpen(true)}
                className="flex-1 py-2 px-2 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Layers size={13} />
                <span>Área</span>
              </button>
              <button
                onClick={() => setIsCountertopModalOpen(true)}
                className={`flex-1 py-2 px-2 border font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  countertopConfig.enabled
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>Qstone</span>
              </button>
              <button
                onClick={() => globalState.setIsPrinting(true)}
                className="flex-[1.3] py-2 px-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <FileText size={13} />
                <span>Planos</span>
              </button>
            </div>
         </div>
          <div className={`w-full lg:flex-1 h-[45vh] sm:h-[48vh] lg:h-full shrink-0 min-w-0 relative transition-colors order-1 lg:order-2 ${isLight ? 'bg-[#e2e8f0]' : 'bg-[#111]'}`}>
            <KitchenScene theme={theme} />


            {toolMode === 'draw_wall' && (
              <div className={`absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-full border text-[10px] sm:text-xs font-semibold pointer-events-none uppercase tracking-wider max-w-[90%] text-center ${
                isLight ? 'bg-white/90 border-slate-300 text-slate-800 shadow-lg' : 'bg-black/80 border-white/10 text-slate-300'
              }`}>
                Haz clic en la grilla para iniciar un muro. Pulsa ESC para cancelar.
              </div>
            )}
            {(toolMode.startsWith('place_') || toolMode === 'move_active') && (
              <div className={`absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-full border text-[10px] sm:text-xs font-semibold pointer-events-none uppercase tracking-wider max-w-[90%] text-center ${
                isLight ? 'bg-orange-100/90 border-orange-300 text-orange-950 shadow-lg' : 'bg-orange-500/20 border-orange-500/50 text-blue-200'
              }`}>
                {toolMode.startsWith('place_island') ? 'Mueve sobre el piso (imantación automática). Clic para fijar.' : 'Mueve sobre un muro para imantar. Clic para posicionar.'}
              </div>
            )}
         </div>

         {/* Barra Horizontal de Pestañas Móvil (< lg) - Conecta la mitad superior 3D con la mitad inferior */}
         <div className={`order-2 flex lg:hidden items-center gap-1 p-1.5 overflow-x-auto no-scrollbar border-y shrink-0 z-20 transition-colors ${
           isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/80'
         }`}>
           <button
             onClick={() => {
               setActiveMobileTab('catalog');
               setLeftTab('modules');
             }}
             className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'catalog'
                 ? 'bg-orange-500 text-black shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <Box size={14} />
             <span>Catálogo</span>
           </button>

           <button
             onClick={() => {
               setActiveMobileTab('module');
               setRightTab('module');
             }}
             className={`relative flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'module'
                 ? 'bg-orange-500 text-black shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <Sliders size={14} />
             <span>Propiedades</span>
             {(activeCabinetId || activeArchElementId || activeWallId) && (
               <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-0.5" />
             )}
           </button>

           <button
             onClick={() => {
               setActiveMobileTab('materials');
               setRightTab('materials');
             }}
             className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'materials'
                 ? 'bg-orange-500 text-black shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <Palette size={14} />
             <span>Acabados</span>
           </button>

           <button
             onClick={() => {
               setActiveMobileTab('engineering');
               setRightTab('engineering');
             }}
             className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'engineering'
                 ? 'bg-orange-500 text-black shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <Wrench size={14} />
             <span>Herrajes</span>
           </button>

           <button
             onClick={() => {
               setActiveMobileTab('mep');
               setRightTab('mep');
             }}
             className={`relative flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'mep'
                 ? 'bg-cyan-600 text-white shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <Wrench size={14} />
             <span>MEP</span>
             {mepClashes.length > 0 && (
               <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[9px] font-black">
                 {mepClashes.length}
               </span>
             )}
           </button>

           <button
             onClick={() => {
               setActiveMobileTab('scene');
               setLeftTab('placed');
             }}
             className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer ${
               activeMobileTab === 'scene'
                 ? 'bg-orange-500 text-black shadow-sm'
                 : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
             }`}
           >
             <ListOrdered size={14} />
             <span>Escena ({cabinets.length})</span>
           </button>
         </div>
      
    <aside className={`${(activeMobileTab !== 'catalog' && activeMobileTab !== 'scene') ? 'flex' : 'hidden lg:flex'} flex-col relative z-20 order-3 lg:order-3 flex-1 lg:flex-none w-full lg:w-96 min-h-0 backdrop-blur-xl border-t lg:border-t-0 lg:border-l h-auto lg:h-full pointer-events-auto transition-colors shadow-2xl ${
      isLight ? 'bg-white/95 border-slate-200 shadow-slate-200 text-slate-800' : 'bg-black/70 border-white/10 text-slate-200'
    }`}>
      {/* Selector de Pestañas Superior (Desktop >= lg - Stitch Style) */}
      <header className={`hidden lg:block border-b shrink-0 transition-colors ${
        isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-zinc-900'
      }`}>
        <nav className="p-2 overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-5 gap-1.5 min-w-max">
            <button
              onClick={() => setRightTab('module')}
              className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                rightTab === 'module'
                  ? 'bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/30'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Box size={15} />
              <span>Módulo</span>
              {(activeCabinetId || activeArchElementId || activeWallId) && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
              )}
            </button>

            <button
              onClick={() => {
                if (activeCabinetId) setActiveCabinet(null);
                if (activeArchElementId) setActiveArchElement(null);
                if (activeWallId) setActiveWall(null);
                setRightTab('materials');
              }}
              className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                rightTab === 'materials'
                  ? 'bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/30'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette size={15} />
              <span>Acabados</span>
              {rightTab === 'materials' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
              )}
            </button>

            <button
              onClick={() => {
                if (activeCabinetId) setActiveCabinet(null);
                if (activeArchElementId) setActiveArchElement(null);
                if (activeWallId) setActiveWall(null);
                setRightTab('engineering');
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                rightTab === 'engineering'
                  ? 'bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/30'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders size={15} />
              <span>Herrajes</span>
            </button>

            <button
              onClick={() => {
                if (activeCabinetId) setActiveCabinet(null);
                if (activeArchElementId) setActiveArchElement(null);
                if (activeWallId) setActiveWall(null);
                setRightTab('mep');
              }}
              className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                rightTab === 'mep'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm shadow-cyan-600/30'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Trazado MEP & Interferencias"
            >
              <Wrench size={15} />
              <span>MEP</span>
              {mepClashes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[9px] font-black">
                  {mepClashes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (activeCabinetId) setActiveCabinet(null);
                if (activeArchElementId) setActiveArchElement(null);
                if (activeWallId) setActiveWall(null);
                setRightTab('decoration');
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                rightTab === 'decoration'
                  ? 'bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/30'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Decoración & Remodelación Espacial"
            >
              <Sparkles size={15} />
              <span>Deco</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Contenido Scrollable según Pestaña */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {rightTab === 'decoration' && (
          <DecorationSection theme={theme} />
        )}
        {rightTab === 'module' && (
          <div>
            {activeWallId && activeWall ? (
              <div className="mb-4">
                <h2 className={isLight ? "text-xs uppercase tracking-wider text-orange-600 font-bold mb-3 mt-4 first:mt-0" : sectionTitle}>Propiedades de Muro</h2>
                <div className={`p-4 rounded-xl flex flex-col gap-3.5 ${
                  isLight ? 'bg-slate-50 border border-slate-200 shadow-sm' : 'bg-white/5 border border-white/10 shadow-inner'
                }`}>
                  <div className={`flex justify-between items-center border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                    <h3 className={`text-xs uppercase tracking-wider font-bold truncate pr-2 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                      Tramo de Muro Interior
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (toolMode === 'move_active') {
                            setToolMode('select');
                          } else {
                            setToolMode('move_active');
                          }
                        }}
                        className={`text-xs flex items-center gap-1 font-semibold cursor-pointer transition-colors ${
                          toolMode === 'move_active'
                            ? 'text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded shadow-sm'
                            : 'text-amber-500 hover:text-amber-600'
                        }`}
                        title={toolMode === 'move_active' ? 'Finalizar movimiento (Fijar)' : 'Mover muro libremente (Área fija)'}
                      >
                        <Move3D size={13} />
                        <span>{toolMode === 'move_active' ? 'Moviendo (Fijar)' : 'Mover'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (toolMode === 'move_active') setToolMode('select');
                          setActiveWall(null);
                        }}
                        className={`text-xs flex items-center gap-1 font-semibold cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        title="Deseleccionar"
                      >
                        <span>Soltar</span>
                      </button>
                      <button
                        onClick={() => removeWall(activeWall.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Eliminar muro (Supr)"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {/* Aviso de Área Fija durante movimiento */}
                  {toolMode === 'move_active' && (
                    <div className="text-[11px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Move3D size={12} className="animate-pulse shrink-0" />
                        <span>Área fija: haz clic en el plano o arrastra para ubicar el muro.</span>
                      </span>
                      <button
                        onClick={() => setToolMode('select')}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded cursor-pointer transition-colors"
                      >
                        Fijar
                      </button>
                    </div>
                  )}

                  {/* Resumen de Dimensiones */}
                  {(() => {
                    const wallLen = Math.round(Math.hypot(activeWall.end[0] - activeWall.start[0], activeWall.end[1] - activeWall.start[1]));
                    return (
                      <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10'}`}>
                        <div>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Espesor</div>
                          <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeWall.thickness} cm</div>
                        </div>
                        <div>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Altura</div>
                          <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeWall.height} cm</div>
                        </div>
                        <div>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Largo</div>
                          <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{wallLen} cm</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Posicionamiento y Distancia a Muros Vecinos */}
                  {(() => {
                    const [x1, z1] = activeWall.start;
                    const [x2, z2] = activeWall.end;
                    const wDx = x2 - x1;
                    const wDz = z2 - z1;
                    const wallLen = Math.hypot(wDx, wDz);
                    if (wallLen < 1) return null;
                    const uX = wDx / wallLen;
                    const uZ = wDz / wallLen;
                    const nX = -uZ;
                    const nZ = uX;
                    const midX = (x1 + x2) / 2;
                    const midZ = (z1 + z2) / 2;
                    const halfThick = (activeWall.thickness || 15) / 2;

                    let closestDist = Infinity;
                    let closestDir = 1;

                    for (const otherW of walls) {
                      if (otherW.id === activeWall.id) continue;
                      const [ox1, oz1] = otherW.start;
                      const [ox2, oz2] = otherW.end;
                      const oDx = ox2 - ox1;
                      const oDz = oz2 - oz1;
                      const oLen = Math.hypot(oDx, oDz);
                      if (oLen < 1) continue;

                      const ouX = oDx / oLen;
                      const ouZ = oDz / oLen;
                      const dotPar = Math.abs(uX * ouX + uZ * ouZ);
                      if (dotPar > 0.8) {
                        const otherMidX = (ox1 + ox2) / 2;
                        const otherMidZ = (oz1 + oz2) / 2;
                        const perpDist = (otherMidX - midX) * nX + (otherMidZ - midZ) * nZ;
                        const otherThick = (otherW.thickness || 20) / 2;
                        const clear = Math.abs(perpDist) - halfThick - otherThick;
                        if (clear > 0 && clear < closestDist) {
                          closestDist = clear;
                          closestDir = perpDist >= 0 ? 1 : -1;
                        }
                      }
                    }

                    const shiftPerp = (deltaCm: number) => {
                      updateWall(activeWall.id, {
                        start: [Math.round((x1 + deltaCm * nX) * 2) / 2, Math.round((z1 + deltaCm * nZ) * 2) / 2],
                        end: [Math.round((x2 + deltaCm * nX) * 2) / 2, Math.round((z2 + deltaCm * nZ) * 2) / 2],
                      });
                    };

                    const applyExactDistance = (targetCm: number) => {
                      if (closestDist === Infinity || isNaN(targetCm) || targetCm <= 0) return;
                      const delta = (targetCm - closestDist) * (-closestDir);
                      shiftPerp(delta);
                    };

                    const measuredDistance = closestDist < Infinity ? Math.round(closestDist * 10) / 10 : null;

                    return (
                      <div className={`flex flex-col gap-2 p-3 rounded-xl border ${
                        isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-orange-950/20 border-orange-500/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-orange-900' : 'text-orange-300'}`}>
                            Distancia a Muro Paralelo
                          </label>
                          {measuredDistance !== null && (
                            <span className="font-mono text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded">
                              {measuredDistance} cm
                            </span>
                          )}
                        </div>

                        {/* Input numérico directo para fijar medida exacta (ej. 122 cm) */}
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            placeholder="Ej: 122"
                            defaultValue={measuredDistance || ''}
                            key={`dist-input-${measuredDistance}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (!isNaN(val) && val > 0) applyExactDistance(val);
                              }
                            }}
                            className={`flex-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-orange-500' : 'bg-black/50 border-white/20 text-white focus:border-orange-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              if (input) {
                                const val = Number(input.value);
                                if (!isNaN(val) && val > 0) applyExactDistance(val);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-black rounded-lg transition-colors cursor-pointer"
                          >
                            Fijar cm
                          </button>
                        </div>

                        {/* Botones de ajuste fino */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Desplazar:</span>
                          <div className="flex items-center gap-1">
                            {[-10, -5, -1, 1, 5, 10].map((step) => (
                              <button
                                key={step}
                                type="button"
                                onClick={() => shiftPerp(step)}
                                className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded border transition-all cursor-pointer ${
                                  isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-zinc-800 border-white/10 text-slate-300 hover:bg-zinc-700'
                                }`}
                              >
                                {step > 0 ? `+${step}` : step}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Configuración de Espesor / Ancho */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Espesor / Ancho del Muro
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[10, 15, 20].map((th) => (
                        <button
                          key={th}
                          type="button"
                          onClick={() => updateWall(activeWall.id, { thickness: th })}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            activeWall.thickness === th
                              ? 'bg-orange-500 text-black border-orange-500 shadow-sm'
                              : isLight
                              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              : 'bg-zinc-800 text-slate-300 border-white/10 hover:bg-zinc-700'
                          }`}
                        >
                          {th} cm
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={activeWall.thickness}
                        onChange={(e) => updateWall(activeWall.id, { thickness: Number(e.target.value) })}
                        className="flex-1 accent-orange-500 cursor-pointer"
                      />
                      <span className={`text-xs font-mono font-bold w-12 text-right ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {activeWall.thickness} cm
                      </span>
                    </div>
                  </div>

                  {/* Configuración de Altura */}
                  <div className={`flex flex-col gap-2 pt-2 border-t border-dashed ${isLight ? 'border-slate-300' : 'border-white/10'}`}>
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Altura del Muro
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[220, 240, 260].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => updateWall(activeWall.id, { height: h })}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            activeWall.height === h
                              ? 'bg-orange-500 text-black border-orange-500 shadow-sm'
                              : isLight
                              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              : 'bg-zinc-800 text-slate-300 border-white/10 hover:bg-zinc-700'
                          }`}
                        >
                          {h} cm
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="80"
                        max="320"
                        step="5"
                        value={activeWall.height}
                        onChange={(e) => updateWall(activeWall.id, { height: Number(e.target.value) })}
                        className="flex-1 accent-orange-500 cursor-pointer"
                      />
                      <span className={`text-xs font-mono font-bold w-12 text-right ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {activeWall.height} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeArchElementId && activeArchElement ? (
              <div className="mb-4">
                <h2 className={isLight ? "text-xs uppercase tracking-wider text-orange-600 font-bold mb-3 mt-4 first:mt-0" : sectionTitle}>Propiedades Arquitectónicas</h2>
                <div className={`p-4 rounded-xl flex flex-col gap-3 ${
                  isLight ? 'bg-slate-50 border border-slate-200 shadow-sm' : 'bg-white/5 border border-white/10 shadow-inner'
                }`}>
                  <div className={`flex justify-between items-center border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                    <h3 className={`text-xs uppercase tracking-wider font-bold truncate pr-2 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                      {activeArchElement.name}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setToolMode('move_active');
                          setViewMode('3d');
                        }}
                        className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Mover elemento"
                      >
                        <Move3D size={13} />
                        <span>Mover</span>
                      </button>
                      <button
                        onClick={() => {
                          const currentRot = activeArchElement.rotation || 0;
                          const nextRot = (currentRot + Math.PI / 2) % (Math.PI * 2);
                          updateArchitecturalElement(activeArchElement.id, { rotation: nextRot });
                        }}
                        className="text-xs text-cyan-500 hover:text-cyan-600 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Girar 90°"
                      >
                        <RotateCw size={13} />
                        <span>Girar</span>
                      </button>
                      <button
                        onClick={() => setActiveArchElement(null)}
                        className={`text-xs flex items-center gap-1 font-semibold cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        title="Deseleccionar"
                      >
                        <span>Soltar</span>
                      </button>
                      <button
                        onClick={() => removeArchitecturalElement(activeArchElement.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  <div className={`grid ${activeArchElement.type === 'pillar' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10'}`}>
                    <div>
                      <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Ancho</div>
                      <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeArchElement.width} cm</div>
                    </div>
                    <div>
                      <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Alto</div>
                      <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeArchElement.height} cm</div>
                    </div>
                    {activeArchElement.type === 'pillar' && (
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Prof.</div>
                        <div className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeArchElement.depth || 30} cm</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {(() => {
                      const currentArchWall = effectiveWalls.find(w => w.id === activeArchElement.wallId || `wall_${w.id}` === activeArchElement.wallId || w.id === `wall_${activeArchElement.wallId}`) || effectiveWalls[0];
                      const currentArchWallLen = currentArchWall ? Math.hypot(currentArchWall.end[0] - currentArchWall.start[0], currentArchWall.end[1] - currentArchWall.start[1]) : 300;
                      const maxArchOffset = Math.max(20, Math.floor(currentArchWallLen / 2 - activeArchElement.width / 2 - 2));

                      return (
                        <>
                          {effectiveWalls.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <div className={`text-[10px] uppercase tracking-wider font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                Muro Asignado (Clic para reubicar)
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {effectiveWalls.map((w, idx) => {
                                  const isThisWall = currentArchWall?.id === w.id;
                                  const wLength = Math.round(Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]));
                                  return (
                                    <button
                                      key={w.id || idx}
                                      type="button"
                                      onClick={() => {
                                        const [x1, z1] = w.start;
                                        const [x2, z2] = w.end;
                                        const len = Math.hypot(x2 - x1, z2 - z1);
                                        const uX = (x2 - x1) / len;
                                        const uZ = (z2 - z1) / len;
                                        const pX = x1 + (len / 2) * uX;
                                        const pZ = z1 + (len / 2) * uZ;
                                        const rot = Math.atan2(x1 - x2, z1 - z2);
                                        updateArchitecturalElement(activeArchElement.id, {
                                          wallId: w.id,
                                          offset: 0,
                                          position: [pX, activeArchElement.elevation + activeArchElement.height / 2, pZ],
                                          rotation: rot,
                                        });
                                      }}
                                      className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                                        isThisWall
                                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                          : isLight
                                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                      }`}
                                    >
                                      <span>Muro {idx + 1}</span>
                                      <span className="text-[10px] opacity-75">{wLength} cm</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(() => {
                            const isDoor = activeArchElement.type === 'door';
                            const isWindow = activeArchElement.type === 'window';
                            const wallMaxHeight = currentArchWall?.height || 240;

                            const widthMin = isDoor ? 50 : isWindow ? 20 : 10;
                            const widthMax = isDoor ? 120 : isWindow ? 300 : 150;

                            const heightMin = isDoor ? 210 : isWindow ? 20 : 50;
                            const heightMax = wallMaxHeight;

                            return (
                              <>
                                <SliderControl
                                  isLight={isLight}
                                  label="Ancho (cm)"
                                  value={activeArchElement.width}
                                  min={widthMin}
                                  max={widthMax}
                                  step={5}
                                  onChange={(val) => updateArchitecturalElement(activeArchElement.id, { width: val })}
                                />
                                <SliderControl
                                  isLight={isLight}
                                  label="Alto (cm)"
                                  value={activeArchElement.height}
                                  min={heightMin}
                                  max={heightMax}
                                  step={5}
                                  onChange={(val) => updateArchitecturalElement(activeArchElement.id, { height: val })}
                                />
                              </>
                            );
                          })()}

                          {/* Ajuste milimétrico de posición en el muro */}
                          <SliderControl
                            isLight={isLight}
                            label="Posición en Muro (Desplazamiento cm)"
                            value={Math.round(activeArchElement.offset || 0)}
                            min={-maxArchOffset}
                            max={maxArchOffset}
                            step={1}
                            onChange={(val) => updateArchitecturalElement(activeArchElement.id, { offset: val })}
                          />
                        </>
                      );
                    })()}

                    {activeArchElement.type === 'window' && (
                      <SliderControl
                        isLight={isLight}
                        label="Altura en Muro / Antepecho (cm)"
                        value={activeArchElement.elevation}
                        min={0}
                        max={180}
                        step={5}
                        onChange={(val) => updateArchitecturalElement(activeArchElement.id, { elevation: val })}
                      />
                    )}

                    {activeArchElement.type === 'pillar' && (
                      <SliderControl
                        isLight={isLight}
                        label="Largo / Profundidad (cm)"
                        value={activeArchElement.depth || 30}
                        min={10}
                        max={150}
                        step={5}
                        onChange={(val) => updateArchitecturalElement(activeArchElement.id, { depth: val })}
                      />
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setToolMode('move_active');
                          setViewMode('3d');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        <Move3D size={14} />
                        Reubicar / Mover
                      </button>
                      <button
                        onClick={() => setActiveArchElement(null)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                          isLight
                            ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Deseleccionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeCabinetId && activeCabinet ? (
              <div className="mb-4">
                <KitchenModuleContextMenu
                  inline={true}
                  isLight={isLight}
                  onOpenIslandBack={() => setRightTab('materials')}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                  isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                }`}>
                  <Info size={18} className={`${isLight ? 'text-orange-600' : 'text-orange-400'} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Módulo Seleccionado</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                      Haz clic en cualquier mueble en el visor 3D para ajustar sus dimensiones, variantes o rotación particular.
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                }`}>
                  <h3 className={`text-xs uppercase tracking-wider font-bold mb-3 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>Visualización de Escena</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <ToggleBtn isLight={isLight} active={globalState.showDimensions} onClick={globalState.toggleDimensions} label="Mostrar Cotas" />
                      {globalState.showDimensions && (
                        <div className={`mt-2 flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={isLight ? "text-slate-900 uppercase tracking-wider text-[11px]" : "text-white uppercase tracking-wider text-[11px]"}>
                              {DIMENSION_LEVEL_DATA[globalState.dimensionLevel]?.title || `Nivel ${globalState.dimensionLevel}`}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-500 dark:text-orange-400 font-mono font-bold border border-orange-500/30">
                              {globalState.dimensionLevel}/6
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min={1} 
                            max={6} 
                            step={1}
                            value={globalState.dimensionLevel} 
                            onChange={(e) => globalState.setDimensionLevel(Number(e.target.value))}
                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all ${
                              isLight ? 'bg-slate-200' : 'bg-zinc-800'
                            }`}
                            title="Nivel de Detalle de Cotas"
                          />
                          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                            {DIMENSION_LEVEL_DATA[globalState.dimensionLevel]?.desc}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <ToggleBtn isLight={isLight} active={globalState.isTransparent} onClick={globalState.toggleTransparent} label="Modo Transparente (Rayos X)" />
                    </div>
                  </div>
                </div>

                {/* ACCESOS RÁPIDOS A SISTEMAS GLOBALES */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs uppercase tracking-wider font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                      Sistemas y Perfilería Global
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Toda la Cocina</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Tarjeta Zócalo */}
                    <div 
                      onClick={() => {
                        setRightTab('engineering');
                        setOpenAccordions(prev => ({ ...prev, socle: true }));
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isLight 
                          ? 'bg-white border-slate-200 hover:border-orange-500 hover:shadow-xs' 
                          : 'bg-white/[0.03] border-white/10 hover:border-orange-500/50 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          showSocle 
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' 
                            : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-slate-500')
                        }`}>
                          <Layers size={15} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            Zócalo Continuo
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {!showSocle 
                              ? 'Oculto / Desactivado' 
                              : `${socleFinish === 'black' ? 'Negro Mate' : 'Gris Satinado'} (${socleHeight ?? 10} cm)`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                        <span>Configurar</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>

                    {/* Tarjeta Sistema Gola */}
                    <div 
                      onClick={() => {
                        setRightTab('engineering');
                        setOpenAccordions(prev => ({ ...prev, gola: true }));
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isLight 
                          ? 'bg-white border-slate-200 hover:border-orange-500 hover:shadow-xs' 
                          : 'bg-white/[0.03] border-white/10 hover:border-orange-500/50 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          golaSystem !== 'none' 
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' 
                            : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-slate-500')
                        }`}>
                          <Sliders size={15} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            Sistema Riel Gola
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {golaSystem === 'none' 
                              ? 'Sin Gola (Tiradores convencionales)' 
                              : `Provelcar (${golaSystem === 'black' ? 'Negro' : 'Gris Satin'})`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                        <span>Configurar</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>

                    {/* Tarjeta Cubiertas Qstone */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${
                      isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          QS
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Cubiertas Qstone
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {countertopConfig.enabled
                              ? `${qstoneCatalog.find(p => p.id === countertopConfig.selectedProductId)?.materialType === 'sinterizado' ? 'Sinterizado 12mm' : 'Cuarzo'} (Activa)`
                              : 'Desactivada'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCountertopModalOpen(true)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-sm cursor-pointer shrink-0 ml-2"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {rightTab === 'materials' && (
          <div className="flex flex-col gap-4">
            {/* Banner de Alcance: Proyecto Global (Stitch iOS Style) */}
            <section
              className={`rounded-2xl border p-3.5 shadow-xs transition-all ${
                isLight
                  ? 'border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-orange-50/50'
                  : 'border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-orange-950/20'
              }`}
              data-purpose="scope-indicator"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0 border border-orange-200 dark:border-orange-500/30">
                    <Globe size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-orange-700 dark:text-orange-400">
                      Alcance: Proyecto Global
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Aplica cambios a toda la cocina y a módulos con sincronización heredada.
                    </p>
                  </div>
                </div>
                {activeCabinetId && (
                  <button
                    onClick={() => setRightTab('module')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500 text-white shadow-xs hover:bg-orange-600 cursor-pointer shrink-0 transition active:scale-95"
                    title="Volver a configurar el módulo individual seleccionado"
                  >
                    Ir al Módulo
                  </button>
                )}
              </div>
            </section>

            <IslandBackPanelConfigSection isLight={isLight} />
            <RoomFinishesSection isLight={isLight} />
            <div className={`mt-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <TexturesSection 
                onSelectTexture={handleGlobalTextureSelect}
                title="Decorativos de Cocina (Global)"
                badgeText="Toda la Cocina"
                isLight={isLight}
              />
            </div>
          </div>
        )}

        {rightTab === 'engineering' && (
          <div className="flex flex-col gap-3">
            {/* Banner de Alcance: Herrajes Globales */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              isLight
                ? 'bg-slate-100/90 border-slate-300 text-slate-700 shadow-xs'
                : 'bg-white/[0.04] border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={15} className="text-orange-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Alcance: Herrajes Globales
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Define tiradores y sistema de apertura para toda la cocina
                  </span>
                </div>
              </div>
              {activeCabinetId && (
                <button
                  onClick={() => setRightTab('module')}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 cursor-pointer shrink-0"
                  title="Volver a configurar el módulo individual seleccionado"
                >
                  Ir al Módulo
                </button>
              )}
            </div>

            {/* 1. Sistema de Apertura (Perfil Gola) */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => toggleAccordion('gola')}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                  openAccordions.gola 
                    ? (isLight ? 'bg-orange-50/50' : 'bg-white/[0.04]') 
                    : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    openAccordions.gola 
                      ? 'bg-orange-500 text-black shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300')
                  }`}>
                    <Sliders size={14} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                    openAccordions.gola 
                      ? (isLight ? 'text-orange-600' : 'text-orange-400') 
                      : (isLight ? 'text-slate-800' : 'text-slate-200')
                  }`}>
                    Sistema de Apertura (Gola)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    openAccordions.gola
                      ? (isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-500/20 text-orange-400 border-orange-500/30')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10')
                  }`}>
                    {golaSystem === 'none' ? 'Sin Gola' : golaSystem === 'black' ? 'Negro Mate' : 'Gris Satinado'}
                  </span>
                  {openAccordions.gola ? (
                    <ChevronDown size={16} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  ) : (
                    <ChevronRight size={16} className={isLight ? "text-slate-400" : "text-slate-500"} />
                  )}
                </div>
              </button>

              {openAccordions.gola && (
                <div className={`p-3.5 border-t ${isLight ? 'border-slate-100 bg-slate-50/40' : 'border-white/5 bg-black/10'}`}>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'none', label: 'Sin Gola', colorDot: null },
                        { id: 'aluminum', label: 'Gris Satinado', colorDot: 'bg-slate-300 border-slate-400' },
                        { id: 'black', label: 'Negro Mate', colorDot: 'bg-zinc-900 border-zinc-700' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setGolaSystem(opt.id as any)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            golaSystem === opt.id
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          {opt.colorDot && (
                            <span className={`w-2.5 h-2.5 rounded-full border ${opt.colorDot}`} />
                          )}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {golaSystem === 'none'
                        ? 'Los muebles se fabrican con tiradores tradicionales estándar y frentes a cota completa.'
                        : `Perfil Provelcar x175 (L superior -35mm) y x176 (C intermedio 40mm) en acabado ${golaSystem === 'black' ? 'Negro Mate Anodizado' : 'Aluminio Gris Satinado / Claro'}. Descuenta alturas automáticamente y suprime tiradores convencionales.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 1.1 Zócalo & Perfilería de Piso */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => toggleAccordion('socle')}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                  openAccordions.socle 
                    ? (isLight ? 'bg-orange-50/50' : 'bg-white/[0.04]') 
                    : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    openAccordions.socle 
                      ? 'bg-orange-500 text-black shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300')
                  }`}>
                    <Layers size={14} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                    openAccordions.socle 
                      ? (isLight ? 'text-orange-600' : 'text-orange-400') 
                      : (isLight ? 'text-slate-800' : 'text-slate-200')
                  }`}>
                    Zócalo & Perfilería
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    openAccordions.socle
                      ? (isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-500/20 text-orange-400 border-orange-500/30')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10')
                  }`}>
                    {!showSocle ? 'Sin Zócalo' : `${socleFinish === 'black' ? 'Negro Mate' : 'Gris Satinado'} (${socleHeight ?? 10}cm)`}
                  </span>
                  {openAccordions.socle ? (
                    <ChevronDown size={16} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  ) : (
                    <ChevronRight size={16} className={isLight ? "text-slate-400" : "text-slate-500"} />
                  )}
                </div>
              </button>

              {openAccordions.socle && (
                <div className={`p-3.5 border-t ${isLight ? 'border-slate-100 bg-slate-50/40' : 'border-white/5 bg-black/10'}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        Mostrar Zócalo Continuo
                      </span>
                      <ToggleBtn
                        isLight={isLight}
                        active={showSocle}
                        onClick={() => setShowSocle(!showSocle)}
                        label={showSocle ? `Activo (${socleHeight ?? 10}cm)` : "Oculto"}
                      />
                    </div>

                    {showSocle && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                        <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>
                          Altura de Zócalo / Patas
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSocleHeight(10)}
                            className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                              (socleHeight ?? 10) === 10
                                ? 'bg-orange-500 text-black shadow-sm'
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            <span>10 cm (100 mm)</span>
                            <span className="text-[10px] font-normal lowercase opacity-80">Estándar Moderno</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSocleHeight(15)}
                            className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                              (socleHeight ?? 10) === 15
                                ? 'bg-orange-500 text-black shadow-sm'
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            <span>15 cm (150 mm)</span>
                            <span className="text-[10px] font-normal lowercase opacity-80">Estándar Europeo</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {showSocle && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                        <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>
                          Acabado de Zócalo & Conectores
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSocleFinish('aluminum')}
                            className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                              socleFinish === 'aluminum'
                                ? 'bg-orange-500 text-black shadow-sm'
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 shrink-0" />
                            Gris Satinado
                          </button>
                          <button
                            type="button"
                            onClick={() => setSocleFinish('black')}
                            className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                              socleFinish === 'black'
                                ? 'bg-orange-500 text-black shadow-sm'
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 shrink-0" />
                            Negro Mate
                          </button>
                        </div>
                        <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                          Perfil continuo estándar de 3000mm (3m) con sello de agua inferior en acabado {socleFinish === 'black' ? 'Negro Mate' : 'Aluminio Satinado / Gris Claro'}. Los esquineros 90° y empalmes 180° se calibran automáticamente en el render y cotización.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Tiradores & Pomos de Mueble */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => toggleAccordion('handles')}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                  openAccordions.handles 
                    ? (isLight ? 'bg-orange-50/50' : 'bg-white/[0.04]') 
                    : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    openAccordions.handles 
                      ? 'bg-orange-500 text-black shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300')
                  }`}>
                    <Sparkles size={14} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                    openAccordions.handles 
                      ? (isLight ? 'text-orange-600' : 'text-orange-400') 
                      : (isLight ? 'text-slate-800' : 'text-slate-200')
                  }`}>
                    Tiradores & Pomos
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    openAccordions.handles
                      ? (isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-500/20 text-orange-400 border-orange-500/30')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10')
                  }`}>
                    {golaSystem !== 'none'
                      ? 'Gola Activo'
                      : (HANDLE_CATALOG.find((h) => h.id === handleConfig?.model)?.name?.replace('Tirador ', '') || 'Sin Tirador')}
                  </span>
                  {openAccordions.handles ? (
                    <ChevronDown size={16} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  ) : (
                    <ChevronRight size={16} className={isLight ? "text-slate-400" : "text-slate-500"} />
                  )}
                </div>
              </button>

              {openAccordions.handles && (
                <div className={`p-3.5 border-t ${isLight ? 'border-slate-100 bg-slate-50/40' : 'border-white/5 bg-black/10'}`}>
                  <HandlesSection isLight={isLight} />
                </div>
              )}
            </div>

            {/* 3. Tapacantos Industriales */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => toggleAccordion('tapacantos')}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                  openAccordions.tapacantos 
                    ? (isLight ? 'bg-orange-50/50' : 'bg-white/[0.04]') 
                    : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    openAccordions.tapacantos 
                      ? 'bg-orange-500 text-black shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300')
                  }`}>
                    <Layers size={14} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                    openAccordions.tapacantos 
                      ? (isLight ? 'text-orange-600' : 'text-orange-400') 
                      : (isLight ? 'text-slate-800' : 'text-slate-200')
                  }`}>
                    Tapacantos Industriales
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    openAccordions.tapacantos
                      ? (isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-500/20 text-orange-400 border-orange-500/30')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10')
                  }`}>
                    G:{globalState.edgeBandingThicknessCabinets} / F:{globalState.edgeBandingThicknessFronts} mm
                  </span>
                  {openAccordions.tapacantos ? (
                    <ChevronDown size={16} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  ) : (
                    <ChevronRight size={16} className={isLight ? "text-slate-400" : "text-slate-500"} />
                  )}
                </div>
              </button>

              {openAccordions.tapacantos && (
                <div className={`p-3.5 border-t ${isLight ? 'border-slate-100 bg-slate-50/40' : 'border-white/5 bg-black/10'}`}>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>Tapacanto Gabinetes (mm)</label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                        {[0.5, 1.0, 1.5, 2.0].map((t) => (
                          <button 
                            key={t}
                            onClick={() => globalState.setEdgeBandingThicknessCabinets(t as any)}
                            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              globalState.edgeBandingThicknessCabinets === t 
                                ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            {t.toFixed(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>Tapacanto Frentes (mm)</label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                        {[0.5, 1.0, 1.5, 2.0].map((t) => (
                          <button 
                            key={t}
                            onClick={() => globalState.setEdgeBandingThicknessFronts(t as any)}
                            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              globalState.edgeBandingThicknessFronts === t 
                                ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                                : isLight
                                  ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                            }`}
                          >
                            {t.toFixed(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Armado y Sujeción */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => toggleAccordion('assembly')}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                  openAccordions.assembly 
                    ? (isLight ? 'bg-orange-50/50' : 'bg-white/[0.04]') 
                    : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    openAccordions.assembly 
                      ? 'bg-orange-500 text-black shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300')
                  }`}>
                    <Wrench size={14} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                    openAccordions.assembly 
                      ? (isLight ? 'text-orange-600' : 'text-orange-400') 
                      : (isLight ? 'text-slate-800' : 'text-slate-200')
                  }`}>
                    Armado y Sujeción
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    openAccordions.assembly
                      ? (isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-500/20 text-orange-400 border-orange-500/30')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10')
                  }`}>
                    {globalState.assemblyType === 'spax' ? 'Soberbio/Spax' : 'Minifix'}
                  </span>
                  {openAccordions.assembly ? (
                    <ChevronDown size={16} className={isLight ? "text-orange-600" : "text-orange-400"} />
                  ) : (
                    <ChevronRight size={16} className={isLight ? "text-slate-400" : "text-slate-500"} />
                  )}
                </div>
              </button>

              {openAccordions.assembly && (
                <div className={`p-3.5 border-t ${isLight ? 'border-slate-100 bg-slate-50/40' : 'border-white/5 bg-black/10'}`}>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>Tipo de Ensamblaje Estructura</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button 
                          onClick={() => globalState.setAssemblyType('spax')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.assemblyType === 'spax' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Soberbio / Spax
                        </button>
                        <button 
                          onClick={() => globalState.setAssemblyType('minifix')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.assemblyType === 'minifix' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Minifix
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>Herrajes de Cajón</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button 
                          onClick={() => globalState.setDrawerHardware('Provelcar')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.drawerHardware === 'Provelcar' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Provelcar
                        </button>
                        <button 
                          onClick={() => globalState.setDrawerHardware('Hafele')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.drawerHardware === 'Hafele' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Häfele
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className={isLight ? "text-xs uppercase tracking-wider text-slate-700 font-bold" : labelClass}>Armado de Cajón</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button 
                          onClick={() => globalState.setDrawerAssemblyType('spax')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.drawerAssemblyType === 'spax' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Soberbio / Spax
                        </button>
                        <button 
                          onClick={() => globalState.setDrawerAssemblyType('minifix')}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            globalState.drawerAssemblyType === 'minifix' 
                              ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                              : isLight
                                ? 'bg-white text-slate-800 border border-slate-300 hover:border-orange-500 shadow-sm'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:border-orange-500/50'
                          }`}
                        >
                          Minifix
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {rightTab === 'mep' && (
          <div className="h-full">
            <KitchenMepPanel isLight={isLight} />
          </div>
        )}
      </div>

      {/* Fixed Bottom Footer CTA for Technical Export (Stitch iOS Style) */}
      <footer
        className={`p-3.5 border-t shrink-0 backdrop-blur-md transition-colors ${
          isLight ? 'border-slate-200 bg-white/95 shadow-lg' : 'border-white/10 bg-zinc-900/95 shadow-2xl'
        }`}
        data-purpose="footer-action-bar"
      >
        <div className="flex items-center gap-2">
          {canAccessIndustrialOutputs ? (
            <button 
              onClick={() => globalState.setIsPrinting(true)} 
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-orange-500/30 active:scale-[0.99] transition duration-150 cursor-pointer tracking-wide"
              title="Abrir planos interactivos 2D/A3, despiece de corte, cotizaciones, etiquetas QR y archivos DXF para CNC"
            >
              <FileText size={18} className="text-white" />
              <span>PLANOS Y DESPIECE</span>
            </button>
          ) : (
            <button 
              onClick={handleDirectCommercialPdfDownload} 
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-orange-500/30 active:scale-[0.99] transition duration-150 cursor-pointer tracking-wide"
              title="Descargar Cotización y Ficha Comercial en PDF con Renders 3D y Precios"
            >
              <Download size={18} className="text-white" />
              <span>DESCARGAR COTIZACIÓN PDF</span>
            </button>
          )}
          <button
            onClick={() => setRoomPlannerOpen(true)}
            className="lg:hidden p-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
            title="Área de Cocina y Muros"
          >
            <Layers size={18} />
          </button>
        </div>
      </footer>

    </aside>
   </main>

   {/* Modal Guardar Proyecto */}
   <SaveProjectModal
     isOpen={isSaveModalOpen}
     onClose={() => setIsSaveModalOpen(false)}
     projectType="kitchen"
     defaultName="Proyecto Cocina Arquify"
     estimatedCost={3800000}
     projectData={{
       cabinets,
       roomConfig,
       showSocle,
       structureColor: globalState.structureColor,
       doorColor: globalState.doorColor,
       thickness: globalState.thickness,
     }}
     onSaved={(id) => {
       console.log('Proyecto de cocina guardado con ID:', id);
     }}
   />

   {/* Modal Cubiertas Qstone */}
   <CountertopConfigModal
     isOpen={isCountertopModalOpen}
     onClose={() => setIsCountertopModalOpen(false)}
     isLight={isLight}
   />

   {/* Modal Popup Alerta Incompatibilidad Riel Gola vs Regrueso */}
   <GolaRegruesoIncompatibilityModal isLight={isLight} />

   {/* Modal Cotización Comercial Dual B2B (Fábrica vs Cliente PVP) */}
   <KitchenB2BQuoteModal
     isOpen={isB2BQuoteOpen}
     onClose={() => setIsB2BQuoteOpen(false)}
   />

   {/* Modal Exportación Modelo 3D & OpenBIM (.OBJ, .IFC, .DXF 3D, .ZIP) */}
   <ExportBimModal
     isOpen={isBimModalOpen}
     onClose={() => setIsBimModalOpen(false)}
     isLight={isLight}
   />

   {/* Modal Renders Fotográficos NanoBanana AI */}
   <NanoBananaRenderModal
     isOpen={isNanoBananaModalOpen}
     onClose={() => setIsNanoBananaModalOpen(false)}
     isLight={isLight}
   />

    {/* Modal Renders Fotorrealistas de Estudio Three.js (Sin IA) */}
   <StudioRenderModal
     isOpen={isStudioRenderModalOpen}
     onClose={() => setIsStudioRenderModalOpen(false)}
     isLight={isLight}
   />
    </div>
   </StudioRenderProvider>
  );
}

function ToolButton({ active, onClick, icon, label, isLight }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isLight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg text-xs uppercase tracking-wider transition-all border cursor-pointer ${
        active 
          ? 'bg-orange-500/20 border-orange-500 text-orange-500 font-bold shadow-[0_0_10px_rgba(249,115,22,0.15)]' 
          : isLight 
            ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold hover:bg-slate-200 hover:text-black hover:border-slate-400 shadow-sm'
            : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200 font-semibold'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-orange-500' : isLight ? 'text-slate-800' : 'text-slate-400'}`}>{icon}</span>
      <span className="text-left leading-tight">{label}</span>
    </button>
  );
}

interface ModuleCategoryAccordionProps {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  hasActiveTool: boolean;
  isLight: boolean;
  children: React.ReactNode;
}

function ModuleCategoryAccordion({
  title,
  count,
  icon,
  isOpen,
  onToggle,
  hasActiveTool,
  isLight,
  children,
}: ModuleCategoryAccordionProps) {
  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      hasActiveTool
        ? isLight
          ? 'border-orange-400 bg-orange-50/40 shadow-sm'
          : 'border-orange-500/50 bg-orange-950/10 shadow-sm'
        : isLight
          ? 'border-slate-200 bg-white'
          : 'border-white/10 bg-white/[0.02]'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer select-none transition-colors ${
          hasActiveTool
            ? isLight
              ? 'text-orange-800 bg-orange-100/70'
              : 'text-orange-400 bg-orange-500/20'
            : isLight
              ? 'text-slate-800 hover:bg-slate-50'
              : 'text-slate-200 hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={hasActiveTool ? 'text-orange-500' : isLight ? 'text-slate-600' : 'text-slate-400'}>
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            hasActiveTool
              ? isLight ? 'bg-orange-200 text-orange-950 border border-orange-300' : 'bg-orange-500/40 text-orange-200 border border-orange-400/30'
              : isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-black/40 text-slate-400 border border-white/5'
          }`}>
            {count}
          </span>
          {isOpen ? <ChevronDown size={14} className="text-orange-500" /> : <ChevronRight size={14} className={isLight ? 'text-slate-400' : 'text-slate-500'} />}
        </div>
      </button>

      {isOpen && (
        <div className={`p-2 flex flex-col gap-1.5 border-t ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-white/5 bg-black/20'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}

