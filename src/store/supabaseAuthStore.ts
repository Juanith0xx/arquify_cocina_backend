import { create } from 'zustand';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export type UserRole = 'superadmin' | 'tenant_admin' | 'designer' | 'operator' | 'free_user';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  currency: string;
  default_margin_pct: number;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  tenant?: TenantInfo;
}

export interface SupabaseAuthState {
  user: UserProfile | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // Acciones
  checkSession: () => Promise<void>;
  loginWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithTenant: (email: string, pass: string, fullName: string, tenantName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useSupabaseAuthStore = create<SupabaseAuthState>((set, get) => ({
  user: null,
  tenant: null,
  isLoading: false,
  isConfigured: isSupabaseConfigured(),
  error: null,

  clearError: () => set({ error: null }),

  checkSession: async () => {
    const supabase = getSupabase();
    if (!supabase) {
      set({ isConfigured: false });
      return;
    }

    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ user: null, tenant: null, isLoading: false });
        return;
      }

      // Obtener el perfil del usuario y su tenant
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select(`
          id,
          tenant_id,
          email,
          full_name,
          role,
          avatar_url,
          tenants:tenant_id (
            id,
            name,
            slug,
            logo_url,
            contact_email,
            phone,
            address,
            currency,
            default_margin_pct
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (profileErr || !profile) {
        console.warn('Perfil no encontrado, usando datos de sesión básica', profileErr);
        set({
          user: {
            id: session.user.id,
            tenant_id: '',
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            role: (session.user.user_metadata?.role as UserRole) || 'designer',
          },
          tenant: null,
          isLoading: false
        });
        return;
      }

      const tenantData = (profile as any).tenants as TenantInfo | null;

      set({
        user: {
          id: profile.id,
          tenant_id: profile.tenant_id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role as UserRole,
          avatar_url: profile.avatar_url,
        },
        tenant: tenantData,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Error al verificar sesión Supabase:', err);
      set({ isLoading: false });
    }
  },

  loginWithPassword: async (email: string, pass: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        error: 'Las credenciales de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) no están configuradas en el entorno.',
      };
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass.trim(),
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        await get().checkSession();
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Error de conexión' });
      return { success: false, error: err.message || 'Error de conexión' };
    }
  },

  signUpWithTenant: async (email: string, pass: string, fullName: string, tenantName?: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase no está configurado en las variables de entorno.',
      };
    }

    try {
      set({ isLoading: true, error: null });

      let createdTenantId: string | undefined = undefined;

      // Si especificó nombre de proveedor, crearlo primero
      if (tenantName && tenantName.trim()) {
        const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { data: newTenant } = await supabase
          .from('tenants')
          .insert({
            name: tenantName.trim(),
            slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
            contact_email: email.trim(),
          })
          .select('id')
          .single();

        if (newTenant) {
          createdTenantId = newTenant.id;
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            role: createdTenantId ? 'tenant_admin' : 'designer',
            tenant_id: createdTenantId,
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        await get().checkSession();
        return { success: true };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, tenant: null });
  },
}));
