import React, { useState } from 'react';
import { LayoutDashboard, ArrowRight, ShieldCheck, User, LogIn } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { AdminLoginModal } from '../components/admin/AdminLoginModal';
import { AdminBackofficeModal } from '../components/admin/AdminBackofficeModal';

export function Home({ onNavigate }: { onNavigate: (route: 'closet' | 'kitchen' | 'special' | 'hpl-bathroom' | 'office' | 'chair') => void }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBackofficeOpen, setIsBackofficeOpen] = useState(false);
  const isLocalAuth = useAdminStore((state) => state.isAuthenticated);
  const adminEmail = useAdminStore((state) => state.adminEmail);
  const currentUser = useAdminStore((state) => state.currentUser);
  const supabaseUser = useSupabaseAuthStore((state) => state.user);
  const supabaseTenant = useSupabaseAuthStore((state) => state.tenant);
  const isCloud = isSupabaseConfigured();

  const isUserLoggedIn = Boolean(isLocalAuth || supabaseUser);

  const [loginPrompt, setLoginPrompt] = useState<string>('');
  const [pendingRoute, setPendingRoute] = useState<'kitchen' | null>(null);

  const handleEnterConfigurator = (targetRoute: 'kitchen') => {
    if (isUserLoggedIn) {
      useAdminStore.getState().logAccess(targetRoute);
      onNavigate(targetRoute);
    } else {
      setPendingRoute(targetRoute);
      setLoginPrompt('Para ingresar a diseñar al configurador debes estar registrado o iniciar sesión.');
      setIsLoginOpen(true);
    }
  };

  const handleLogout = () => {
    useAdminStore.getState().logout();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans p-4 sm:p-8 flex flex-col items-center overflow-y-auto">
      <header className="w-full max-w-7xl flex flex-wrap justify-between items-center mb-8 sm:mb-16 gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bellota text-3xl sm:text-4xl font-bold lowercase text-orange-500 tracking-tight select-none">
            arquify
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {isUserLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBackofficeOpen(true)}
                className="group px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/50 rounded-xl text-xs font-bold uppercase tracking-wider text-orange-300 hover:text-orange-200 flex items-center gap-2 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
                title="Abrir panel de proyectos y control"
              >
                <div className="p-1 bg-orange-500/30 rounded-md text-orange-400">
                  <ShieldCheck size={14} />
                </div>
                <span>{currentUser?.role === 'free_user' || currentUser?.role === 'designer' || supabaseUser?.role === 'designer' || supabaseUser?.role === 'free_user' ? 'Mis Proyectos' : 'Backoffice'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sesión activa" />
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-300">
                <User size={13} className="text-orange-400" />
                <span className="font-semibold text-xs text-white max-w-[150px] truncate">
                  {currentUser?.full_name || supabaseUser?.full_name || currentUser?.email || 'Usuario'}
                </span>
                {currentUser?.rubro && (
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-orange-400 text-[10px] font-medium rounded border border-zinc-700">
                    {currentUser.rubro}
                  </span>
                )}
                {currentUser?.role === 'superadmin' && (
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-bold uppercase rounded">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-xs"
                title="Cerrar Sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setLoginPrompt('Ingresa o regístrate para diseñar cocinas 3D con todas las herramientas');
                setPendingRoute(null);
                setIsLoginOpen(true);
              }}
              className="group px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
              title="Iniciar sesión o registrar cuenta gratuita"
            >
              <LogIn size={15} />
              <span>Iniciar Sesión / Registro Gratis</span>
            </button>
          )}

          <div className="hidden md:block text-xs font-semibold uppercase tracking-widest text-slate-500 border-l border-zinc-800 pl-3">
            Suite Muebles 3D
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-center mb-4 sm:mb-6 tracking-tight px-2">
          Diseño y Configuración de Cocinas con <br />
          <span className="text-blue-500">Precisión Milimétrica</span>
        </h1>
        <p className="text-slate-400 text-center max-w-2xl mb-8 sm:mb-10 text-sm sm:text-base md:text-lg px-3">
          Configurador paramétrico y motor BIM 2D/3D con trazado de muros, gabinetes modulares, tuberías MEP, sistemas Gola y regruesos de cubierta.
        </p>

        {/* Primary CTA Button */}
        <button
          onClick={() => handleEnterConfigurator('kitchen')}
          className="mb-8 sm:mb-12 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base md:text-lg rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-blue-400/30"
        >
          <LayoutDashboard size={20} className="text-blue-200" />
          <span>Ingresar al Configurador de Cocinas</span>
          <ArrowRight size={18} className="text-blue-200" />
        </button>

        <div className="w-full max-w-xl px-1 sm:px-0">
          {/* Cocinas & BIM Card */}
          <div 
            onClick={() => handleEnterConfigurator('kitchen')}
            className="group relative bg-zinc-900 border border-blue-500/60 rounded-2xl p-6 sm:p-8 hover:border-blue-400 transition-all cursor-pointer overflow-hidden flex flex-col items-start min-h-[260px] sm:min-h-[300px] shadow-xl shadow-blue-500/10 hover:shadow-blue-500/25 ring-1 ring-blue-500/20"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-blue-500/25"></div>
            <div className="p-3.5 sm:p-4 bg-black/50 rounded-xl border border-blue-500/40 mb-4 sm:mb-5 z-10 relative">
              <LayoutDashboard size={28} className="text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide mb-2 z-10 relative text-white">Cocinas & BIM</h2>
            <div className="inline-block px-2.5 sm:px-3 py-1 bg-blue-500/20 text-blue-300 text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded mb-3 sm:mb-4 z-10 relative border border-blue-500/30">
              Motor BIM 2D/3D • MEP • Regrueso & Gola
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 z-10 relative">
              Dibuja muros en 2D y arrastra gabinetes y aéreos en 3D con imantación automática, trazado de tuberías MEP y detección de interferencias.
            </p>
            <div className="mt-auto flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider group-hover:gap-3 transition-all z-10 relative">
              Abrir Cocinas <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </main>

      {/* Superadmin / Login / Register Modals */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        promptTitle={loginPrompt}
        onSuccess={() => {
          setIsLoginOpen(false);
          if (pendingRoute) {
            useAdminStore.getState().logAccess(pendingRoute);
            onNavigate(pendingRoute);
            setPendingRoute(null);
          } else {
            setIsBackofficeOpen(true);
          }
        }}
      />

      <AdminBackofficeModal
        isOpen={isBackofficeOpen}
        onClose={() => setIsBackofficeOpen(false)}
        onNavigateToModule={onNavigate}
      />
    </div>
  );
}
