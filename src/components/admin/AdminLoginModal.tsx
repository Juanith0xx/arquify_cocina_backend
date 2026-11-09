import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, AlertCircle, X, Sparkles, UserPlus, Building, Phone, MapPin, Briefcase, User, ArrowRight } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register_free' | 'provider';
  promptTitle?: string;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  promptTitle,
}: AdminLoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register_free' | 'provider'>(initialMode);
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Free User Registration Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [commune, setCommune] = useState('');
  const [country, setCountry] = useState('Chile');
  const [rubro, setRubro] = useState<'Diseñador' | 'Arquitecto' | 'Mueblista' | 'Inmobiliaria / Constructora'>('Diseñador');

  // Provider signup field
  const [tenantName, setTenantName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const localLogin = useAdminStore((state) => state.login);
  const registerFreeUser = useAdminStore((state) => state.registerFreeUser);
  const supabaseLogin = useSupabaseAuthStore((state) => state.loginWithPassword);
  const supabaseSignUp = useSupabaseAuthStore((state) => state.signUpWithTenant);
  const isCloudConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId) {
      setErrorMsg('Por favor ingresa tu nombre o correo electrónico.');
      setIsLoading(false);
      return;
    }

    // Probar primero login en nube si es correo y hay Supabase
    if (isCloudConfigured && cleanId.includes('@')) {
      try {
        const cloudRes = await supabaseLogin(cleanId, cleanPass);
        if (cloudRes.success) {
          setIsLoading(false);
          onSuccess();
          return;
        }
      } catch (e) {
        console.warn('Supabase login fallback:', e);
      }
    }

    // Login en store local (Superadmin, Free User o Proveedor)
    const res = localLogin(cleanId, cleanPass);
    setIsLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Credenciales inválidas. Verifica tu correo/nombre y contraseña.');
    }
  };

  const handleRegisterFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!firstName.trim() || !lastName.trim() || !regEmail.trim()) {
      setErrorMsg('Por favor completa tu nombre, apellido y correo.');
      setIsLoading(false);
      return;
    }

    if (!phone.trim() || !address.trim() || !city.trim() || !commune.trim()) {
      setErrorMsg('Por favor completa teléfono, dirección, ciudad y comuna para activar tu cuenta.');
      setIsLoading(false);
      return;
    }

    // Registrar en adminStore y persistir
    const res = registerFreeUser({
      firstName,
      lastName,
      email: regEmail,
      phone,
      address,
      city,
      commune,
      country,
      rubro,
      password: regPassword || '123456',
    });

    setIsLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'No se pudo completar el registro. Intente nuevamente.');
    }
  };

  const handleFillDemoAdmin = () => {
    setLoginIdentifier('marcelo@robfu.cl');
    setLoginPassword('Robfu2026@');
    setErrorMsg('');
  };

  const handleFillDemoFreeUser = () => {
    setFirstName('Camila');
    setLastName('Valenzuela');
    setRegEmail('camila.diseno@estudio.cl');
    setRegPassword('123456');
    setPhone('+56 9 8765 4321');
    setAddress('Av. Providencia 1240, Of. 602');
    setCity('Santiago');
    setCommune('Providencia');
    setCountry('Chile');
    setRubro('Diseñador');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-orange-500/30 rounded-2xl shadow-2xl shadow-orange-500/10 overflow-hidden text-slate-200 my-auto">
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {mode === 'login'
                  ? 'Acceso al Configurador'
                  : mode === 'register_free'
                  ? 'Registro Gratuito de Diseñador'
                  : 'Portal Proveedores & Admin'}
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                  {mode === 'register_free' ? 'Plan Gratuito' : 'Arquify'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {promptTitle ||
                  (mode === 'register_free'
                    ? 'Regístrate para diseñar con todas las herramientas, guardar y cotizar'
                    : 'Ingresa para diseñar, guardar tus proyectos y descargar cotizaciones')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Pestañas: Login vs Registro */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register_free');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              mode === 'register_free'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} />
            <span>Crear Cuenta Gratis</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario 1: Iniciar Sesión (Rápido con Nombre o Mail) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre de Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="tu nombre o tu@correo.cl"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <ArrowRight size={16} />
                  <span>Ingresar al Configurador</span>
                </>
              )}
            </button>

            {/* Accesos rápidos Demo */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="text-slate-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck size={12} className="text-orange-400" />
                <span>Superadmin</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('register_free')}
                className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
              >
                ¿No tienes cuenta? Regístrate gratis
              </button>
            </div>
          </form>
        )}

        {/* Formulario 2: Registro Completo Gratuito (Nombre, Apellido, Teléfono, Dirección, Ciudad, Comuna, País, Rubro) */}
        {mode === 'register_free' && (
          <form onSubmit={handleRegisterFreeSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: Marcelo"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: Torres"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Email y Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contacto@estudio.cl"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Contraseña de Acceso *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Teléfono y Rubro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Teléfono / Móvil *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Rubro Profesional *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase size={14} />
                  </div>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value as any)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="Diseñador">Diseñador / Interiorista</option>
                    <option value="Arquitecto">Arquitecto</option>
                    <option value="Mueblista">Mueblista / Fabricante</option>
                    <option value="Inmobiliaria / Constructora">Inmobiliaria / Constructora</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Dirección *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={14} />
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Apoquindo 4500, Dpto / Of. 301"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Ciudad, Comuna y País */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Santiago"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Comuna *
                </label>
                <input
                  type="text"
                  required
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Las Condes"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  País *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Chile"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Botón Auto-llenar demo para agilizar pruebas */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFillDemoFreeUser}
                className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} /> Llenar datos de prueba
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creando tu cuenta...</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Crear Cuenta e Ingresar al Configurador</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
              >
                ¿Ya estás registrado? Inicia sesión aquí
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
