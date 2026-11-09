import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FolderKanban,
  DollarSign,
  Palette,
  LogOut,
  X,
  Sparkles,
  BarChart3,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Building,
  Database,
  Cloud,
  Users,
  Sun,
  Moon,
  Clock,
  ChevronRight,
  TrendingUp,
  Camera,
  Edit2,
  Check,
  User,
  Wrench,
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { useTenantDataStore } from '../../store/tenantDataStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { ProjectsManagerTab } from './ProjectsManagerTab';
import { SuppliesPriceTab } from './SuppliesPriceTab';
import { TexturesManagerTab } from './TexturesManagerTab';
import { UsersAndProvidersTab } from './UsersAndProvidersTab';
import { ProviderAnalyticsTab } from './ProviderAnalyticsTab';
import { ManufacturingRatesTab } from './ManufacturingRatesTab';

interface AdminBackofficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (route: 'kitchen' | 'closet' | 'special' | 'hpl-bathroom' | 'office' | 'chair') => void;
}

export function AdminBackofficeModal({
  isOpen,
  onClose,
  onNavigateToModule,
}: AdminBackofficeModalProps) {
  const {
    adminEmail,
    currentUser,
    updateCurrentUserProfile,
    logout: localLogout,
    projects,
    supplies,
    textures,
    themeMode,
    toggleThemeMode,
  } = useAdminStore();
  const { user: supabaseUser, tenant: supabaseTenant, logout: supabaseLogout } = useSupabaseAuthStore();
  const { fetchTenantData, materials, hardware, projects: cloudProjects } = useTenantDataStore();
  const isCloud = isSupabaseConfigured();

  const isFreeUser = currentUser?.role === 'free_user' || supabaseUser?.role === 'free_user' || currentUser?.role === 'designer' || supabaseUser?.role === 'designer';
  const isSuperAdmin = !isFreeUser && !supabaseUser?.tenant_id && (!currentUser || currentUser.role === 'superadmin');
  const isProvider = !isFreeUser && !isSuperAdmin;
  const currentTenantId = supabaseUser?.tenant_id || currentUser?.tenant_id || '';
  const currentTenantName = supabaseTenant?.name || currentUser?.tenant_name || '';

  const [activeTab, setActiveTab] = useState<'projects' | 'supplies' | 'textures' | 'users' | 'analytics' | 'manufacturing'>(
    isFreeUser ? 'projects' : isProvider ? 'supplies' : 'projects'
  );

  useEffect(() => {
    if (isFreeUser) {
      setActiveTab('projects');
    } else if (isProvider && (activeTab === 'projects' || activeTab === 'users' || activeTab === 'manufacturing')) {
      setActiveTab('supplies');
    }
  }, [isFreeUser, isProvider, activeTab]);

  const isLight = themeMode === 'light';

  // Insumos y texturas filtradas si es sesión de proveedor
  const displayedSupplies = isProvider
    ? supplies.filter((s) => {
        if (currentTenantId && s.providerId === currentTenantId) return true;
        const pId = (currentTenantId || '').toLowerCase();
        const pName = (currentTenantName || '').toLowerCase();
        const sup = (s.supplier || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const code = (s.code || '').toLowerCase();

        // Caso específico Abet Laminati: aislar de herrajes de terceros (Rehau, DTC, Häfele)
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

        if (currentTenantName) {
          return sup.includes(pName) || pName.includes(sup);
        }
        return false;
      })
    : supplies;

  const displayedTextures = isProvider
    ? textures.filter((t) => {
        if (currentTenantId && t.providerId === currentTenantId) return true;
        if (currentTenantName) {
          const pName = currentTenantName.toLowerCase();
          const b = (t.brand || '').toLowerCase();
          const pn = (t.providerName || '').toLowerCase();
          return b.includes(pName) || pName.includes(b) || pn.includes(pName) || pName.includes(pn);
        }
        return false;
      })
    : textures;

  const pendingTexturesCount = displayedTextures.filter((t) => t.approvalStatus === 'pending').length;

  const providerInventoryValue = displayedSupplies.reduce(
    (acc, s) => acc + (s.priceClp * (s.stockRef ?? 1)),
    0
  );

  useEffect(() => {
    if (isOpen && isCloud && supabaseUser?.tenant_id) {
      fetchTenantData();
    }
  }, [isOpen, isCloud, supabaseUser?.tenant_id]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.full_name || 'Marcelo Fuentes');
  const [editEmail, setEditEmail] = useState(supabaseUser?.email || currentUser?.email || adminEmail || 'marcelo@robfu.cl');
  const [avatarImage, setAvatarImage] = useState<string | null>(
    currentUser?.avatar_url || (typeof window !== 'undefined' ? localStorage.getItem('arquify_user_avatar') : null)
  );

  useEffect(() => {
    if (currentUser?.full_name) {
      setEditName(currentUser.full_name);
    }
    if (currentUser?.email || supabaseUser?.email) {
      setEditEmail(supabaseUser?.email || currentUser?.email || adminEmail || 'marcelo@robfu.cl');
    }
    if (currentUser?.avatar_url) {
      setAvatarImage(currentUser.avatar_url);
    }
  }, [currentUser, supabaseUser, adminEmail]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarImage(base64);
        try {
          localStorage.setItem('arquify_user_avatar', base64);
        } catch (err) {
          console.warn('Avatar image too large for localStorage', err);
        }
        if (updateCurrentUserProfile) {
          updateCurrentUserProfile({ avatar_url: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateCurrentUserProfile) {
      updateCurrentUserProfile({
        full_name: editName,
        email: editEmail,
        avatar_url: avatarImage || undefined,
      });
    }
    setIsEditingProfile(false);
  };

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (isCloud) {
      await supabaseLogout();
    }
    localLogout();
    onClose();
  };

  const handleLoadProject = (route: 'kitchen' | 'closet' | 'special' | 'hpl-bathroom' | 'office' | 'chair') => {
    onClose();
    onNavigateToModule(route);
  };

  const totalProjectsValue = projects.reduce(
    (acc, p) => acc + (p.totalCostEstimateClp || 0),
    0
  );

  const nameDisplay = editName || currentUser?.full_name || 'Marcelo Fuentes';
  const emailDisplay = editEmail || supabaseUser?.email || currentUser?.email || adminEmail || 'marcelo@robfu.cl';
  const roleDisplay = supabaseUser?.role || currentUser?.role || 'Superadmin';
  const userInitials = (nameDisplay || 'AD')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  const getTabTitle = () => {
    switch (activeTab) {
      case 'projects':
        return isFreeUser ? 'Mis Proyectos Guardados' : 'Gestor de Proyectos & Pipeline';
      case 'supplies':
        return isProvider ? 'Mis Insumos y Precios' : 'Tabla de Precios e Insumos';
      case 'textures':
        return isProvider ? 'Mis Diseños & Texturas 3D' : 'Gestor de Texturas & Decorativos 3D';
      case 'analytics':
        return isProvider ? 'Mis Estadísticas & Métricas' : 'Estadísticas & Telemetría Proveedor';
      case 'users':
        return 'Usuarios & Empresas Proveedoras';
      case 'manufacturing':
        return 'Tarifas B2B & Parámetros de Manufactura';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex w-screen h-screen overflow-hidden animate-in fade-in duration-200 transition-colors ${
        isLight ? 'bg-slate-100 text-zinc-900' : 'bg-zinc-950 text-slate-100'
      }`}
    >
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`w-72 sm:w-80 border-r flex flex-col h-full shrink-0 relative z-20 shadow-xl transition-colors ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        {/* Brand Header: proporcional, sin escudo ni palabra Backoffice */}
        <div
          className={`p-6 border-b flex flex-col justify-center transition-colors ${
            isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-800/80 bg-zinc-950/40'
          }`}
        >
          <span className="font-bellota text-3xl font-bold lowercase text-orange-500 tracking-tight select-none leading-none">
            arquify
          </span>
          <p className={`text-xs mt-1.5 font-medium ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
            Plataforma B2B & Control de Catálogo
          </p>
        </div>

        {/* User Account Info Section (Clean & Transparent with Large Avatar) */}
        <div className="py-6 px-4 flex flex-col items-center text-center relative border-b border-zinc-200/70 dark:border-zinc-800/80">
          {/* Avatar Circular Agrandado con Anillo de Estado */}
          <div className="relative group/avatar cursor-pointer">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-orange-500 to-amber-500 shadow-xl flex items-center justify-center relative overflow-hidden transition-transform group-hover/avatar:scale-105">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                {avatarImage ? (
                  <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-extrabold text-white text-2xl">
                    {userInitials}
                  </div>
                )}
                {/* Overlay hover para cambiar foto */}
                <label className="absolute inset-0 bg-black/65 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition-opacity cursor-pointer">
                  <Camera size={22} className="mb-1 text-orange-400" />
                  <span>Cambiar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {/* Botón de cámara en la esquina inferior del avatar */}
            <label
              className="absolute bottom-0 right-0 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 border-2 border-white dark:border-zinc-900"
              title="Cargar foto de perfil"
            >
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* ÚNICAMENTE el Nombre Completo */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 w-full">
            <h3
              onClick={() => setIsEditingProfile(true)}
              className={`text-base font-extrabold tracking-tight truncate max-w-[210px] cursor-pointer hover:text-orange-500 transition-colors ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
              title="Hacer clic para editar perfil"
            >
              {nameDisplay}
            </h3>
            <button
              onClick={() => setIsEditingProfile(true)}
              className={`p-1 transition-colors cursor-pointer rounded-lg ${
                isLight ? 'text-zinc-400 hover:text-orange-500 hover:bg-zinc-100' : 'text-zinc-500 hover:text-orange-400 hover:bg-zinc-800'
              }`}
              title="Editar nombre"
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
            Menú Principal
          </div>

          {isFreeUser ? (
            <button
              onClick={() => setActiveTab('projects')}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer bg-orange-500 text-white shadow-md shadow-orange-500/20"
            >
              <div className="flex items-center gap-3">
                <FolderKanban size={18} />
                <span>Mis Proyectos</span>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-white/20 rounded-full">
                {projects.filter((p) => p.userId === currentUser?.id || p.userEmail === currentUser?.email).length}
              </span>
            </button>
          ) : (
            <>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'projects'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : isLight
                      ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                      : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderKanban size={18} />
                    <span>Gestor de Proyectos</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                      activeTab === 'projects'
                        ? 'bg-white/20 text-white'
                        : isLight
                        ? 'bg-zinc-200 text-zinc-700'
                        : 'bg-zinc-800 text-slate-300'
                    }`}
                  >
                    {projects.length}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('supplies')}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'supplies'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isLight
                    ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={18} />
                  <span>{isProvider ? 'Insumos & Precios' : 'Tabla de Precios'}</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                    activeTab === 'supplies'
                      ? 'bg-white/20 text-white'
                      : isLight
                      ? 'bg-zinc-200 text-zinc-700'
                      : 'bg-zinc-800 text-slate-300'
                  }`}
                >
                  {displayedSupplies.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('textures')}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'textures'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isLight
                    ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Palette size={18} />
                  <span>{isProvider ? 'Diseños & Texturas 3D' : 'Gestor de Texturas'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingTexturesCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 text-[10px] font-extrabold rounded-full animate-pulse">
                      {pendingTexturesCount} VB
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                      activeTab === 'textures'
                        ? 'bg-white/20 text-white'
                        : isLight
                        ? 'bg-zinc-200 text-zinc-700'
                        : 'bg-zinc-800 text-slate-300'
                    }`}
                  >
                    {displayedTextures.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isLight
                    ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} />
                  <span>{isProvider ? 'Mis Estadísticas' : 'Estadísticas Proveedor'}</span>
                </div>
                <ChevronRight size={16} className="opacity-60" />
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : isLight
                      ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                      : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span>Usuarios & Proveedores</span>
                  </div>
                  <ChevronRight size={16} className="opacity-60" />
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('manufacturing')}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'manufacturing'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : isLight
                      ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                      : 'text-slate-300 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench size={18} />
                    <span>Tarifas B2B Manufactura</span>
                  </div>
                  <ChevronRight size={16} className="opacity-60" />
                </button>
              )}
            </>
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div
          className={`p-4 border-t space-y-2.5 shrink-0 ${
            isLight ? 'border-zinc-200 bg-zinc-50/80' : 'border-zinc-800 bg-zinc-950/60'
          }`}
        >
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={toggleThemeMode}
            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
                : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLight ? (
                <Moon size={16} className="text-zinc-700" />
              ) : (
                <Sun size={16} className="text-amber-400" />
              )}
              <span>Tema Visual</span>
            </div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-zinc-500/10">
              {isLight ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        {/* Workspace Top Header Bar */}
        <header
          className={`h-20 px-6 sm:px-8 border-b flex items-center justify-between gap-6 shrink-0 z-10 transition-colors ${
            isLight ? 'bg-white/90 border-zinc-200' : 'bg-zinc-900/90 border-zinc-800'
          }`}
        >
          {/* Breadcrumb & Section Title */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
              <span>arquify</span>
              <span>/</span>
              <span>Dashboard</span>
            </div>
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              {getTabTitle()}
            </h1>
          </div>

          {/* Key Metric Indicators & Exit Button */}
          <div className="flex items-center gap-4">
            {/* Value Estimate Metric Strip */}
            {!isFreeUser && (
              <div
                className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border ${
                  isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-800/60 border-zinc-700/80'
                }`}
              >
                <div className="p-2 bg-emerald-500/15 text-emerald-500 rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {isProvider ? 'Valor Inventario' : 'Valor Cartera'}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-orange-500">
                    ${(isProvider ? providerInventoryValue : totalProjectsValue).toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>
            )}

            {/* Exit / Close Backoffice Button */}
            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-slate-200'
              }`}
              title="Volver al Configurador 3D"
            >
              <X size={18} />
              <span className="hidden sm:inline">Volver a 3D</span>
            </button>
          </div>
        </header>

        {/* Content Body Viewport */}
        <main
          className={`flex-1 overflow-y-auto p-6 sm:p-8 ${
            isLight ? 'bg-slate-50 text-zinc-900' : 'bg-zinc-950 text-slate-100'
          }`}
        >
          {activeTab === 'projects' && (
            <ProjectsManagerTab
              onLoadProjectToModule={handleLoadProject}
              isFreeUserMode={isFreeUser}
            />
          )}
          {!isFreeUser && activeTab === 'supplies' && (
            <SuppliesPriceTab
              currentProviderId={currentTenantId}
              currentProviderName={currentTenantName}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {!isFreeUser && activeTab === 'textures' && (
            <TexturesManagerTab
              currentProviderId={currentTenantId}
              currentProviderName={currentTenantName}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {!isFreeUser && activeTab === 'analytics' && (
            <ProviderAnalyticsTab
              currentProviderId={currentTenantId}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {isSuperAdmin && activeTab === 'users' && <UsersAndProvidersTab />}
          {isSuperAdmin && activeTab === 'manufacturing' && <ManufacturingRatesTab />}
        </main>
      </div>

      {/* Modal / Dialog de Edición de Perfil de Usuario */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 p-4">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
              isLight ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-900 text-white border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 size={16} className="text-orange-500" />
                <span>Editar Perfil de Usuario</span>
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              {/* Previsualización y Carga de Avatar */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-orange-500/50 flex items-center justify-center text-white shrink-0">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-sm">{userInitials}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer transition-colors">
                    <Camera size={14} />
                    <span>Cargar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-400 uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-sm rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-800 border-zinc-700 text-white'
                  }`}
                  placeholder="Ej. Marcelo Fuentes"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-400 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-sm rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-800 border-zinc-700 text-white'
                  }`}
                  placeholder="ejemplo@robfu.cl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

