import { create } from 'zustand';
import { getSupabase } from '../lib/supabase';
import { useSupabaseAuthStore } from './supabaseAuthStore';

export interface MaterialItem {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: string;
  thickness_mm: number;
  sheet_width_mm: number;
  sheet_height_mm: number;
  cost_per_sheet: number;
  sale_price_per_sheet: number;
  color_hex: string;
  texture_url?: string;
  is_active: boolean;
}

export interface HardwareItem {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  cost_price: number;
  sale_price: number;
  unit: string;
  specs_json: any;
  is_active: boolean;
}

export interface ProjectRecord {
  id: string;
  tenant_id: string;
  user_id?: string;
  code: string;
  name: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  project_type: 'kitchen' | 'closet' | 'special_furniture' | 'sip_house';
  status: 'draft' | 'quoted' | 'in_production' | 'completed' | 'archived';
  total_area_m2: number;
  total_sheets_count: number;
  material_cost: number;
  hardware_cost: number;
  total_price: number;
  config_json: any;
  created_at: string;
  updated_at?: string;
}

export interface TenantDataState {
  materials: MaterialItem[];
  hardware: HardwareItem[];
  projects: ProjectRecord[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchTenantData: () => Promise<void>;
  createMaterial: (mat: Omit<MaterialItem, 'id' | 'tenant_id'>) => Promise<boolean>;
  updateMaterial: (id: string, updates: Partial<MaterialItem>) => Promise<boolean>;
  deleteMaterial: (id: string) => Promise<boolean>;

  createHardware: (hw: Omit<HardwareItem, 'id' | 'tenant_id'>) => Promise<boolean>;
  updateHardware: (id: string, updates: Partial<HardwareItem>) => Promise<boolean>;
  deleteHardware: (id: string) => Promise<boolean>;

  saveProjectToCloud: (project: Omit<ProjectRecord, 'id' | 'tenant_id' | 'created_at'>) => Promise<string | null>;
  updateProjectStatus: (id: string, status: ProjectRecord['status']) => Promise<boolean>;
  deleteProjectFromCloud: (id: string) => Promise<boolean>;
}

export const useTenantDataStore = create<TenantDataState>((set, get) => ({
  materials: [],
  hardware: [],
  projects: [],
  isLoading: false,
  error: null,

  fetchTenantData: async () => {
    const supabase = getSupabase();
    const currentUser = useSupabaseAuthStore.getState().user;
    if (!supabase || !currentUser?.tenant_id) return;

    try {
      set({ isLoading: true, error: null });

      const [matsRes, hwRes, projRes] = await Promise.all([
        supabase.from('materials_catalog').select('*').eq('tenant_id', currentUser.tenant_id).order('created_at', { ascending: false }),
        supabase.from('hardware_catalog').select('*').eq('tenant_id', currentUser.tenant_id).order('created_at', { ascending: false }),
        supabase.from('projects').select('*').eq('tenant_id', currentUser.tenant_id).order('created_at', { ascending: false }),
      ]);

      set({
        materials: (matsRes.data as MaterialItem[]) || [],
        hardware: (hwRes.data as HardwareItem[]) || [],
        projects: (projRes.data as ProjectRecord[]) || [],
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Error cargando datos del tenant:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  createMaterial: async (mat) => {
    const supabase = getSupabase();
    const currentUser = useSupabaseAuthStore.getState().user;
    if (!supabase || !currentUser?.tenant_id) return false;

    const { data, error } = await supabase
      .from('materials_catalog')
      .insert({ ...mat, tenant_id: currentUser.tenant_id })
      .select()
      .single();

    if (!error && data) {
      set({ materials: [data, ...get().materials] });
      return true;
    }
    return false;
  },

  updateMaterial: async (id, updates) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('materials_catalog').update(updates).eq('id', id);
    if (!error) {
      set({ materials: get().materials.map((m) => (m.id === id ? { ...m, ...updates } : m)) });
      return true;
    }
    return false;
  },

  deleteMaterial: async (id) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('materials_catalog').delete().eq('id', id);
    if (!error) {
      set({ materials: get().materials.filter((m) => m.id !== id) });
      return true;
    }
    return false;
  },

  createHardware: async (hw) => {
    const supabase = getSupabase();
    const currentUser = useSupabaseAuthStore.getState().user;
    if (!supabase || !currentUser?.tenant_id) return false;

    const { data, error } = await supabase
      .from('hardware_catalog')
      .insert({ ...hw, tenant_id: currentUser.tenant_id })
      .select()
      .single();

    if (!error && data) {
      set({ hardware: [data, ...get().hardware] });
      return true;
    }
    return false;
  },

  updateHardware: async (id, updates) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('hardware_catalog').update(updates).eq('id', id);
    if (!error) {
      set({ hardware: get().hardware.map((h) => (h.id === id ? { ...h, ...updates } : h)) });
      return true;
    }
    return false;
  },

  deleteHardware: async (id) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('hardware_catalog').delete().eq('id', id);
    if (!error) {
      set({ hardware: get().hardware.filter((h) => h.id !== id) });
      return true;
    }
    return false;
  },

  saveProjectToCloud: async (project) => {
    const supabase = getSupabase();
    const currentUser = useSupabaseAuthStore.getState().user;
    if (!supabase || !currentUser?.tenant_id) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        tenant_id: currentUser.tenant_id,
        user_id: currentUser.id,
      })
      .select('id')
      .single();

    if (!error && data) {
      await get().fetchTenantData();
      return data.id;
    }
    return null;
  },

  updateProjectStatus: async (id, status) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('projects').update({ status }).eq('id', id);
    if (!error) {
      set({ projects: get().projects.map((p) => (p.id === id ? { ...p, status } : p)) });
      return true;
    }
    return false;
  },

  deleteProjectFromCloud: async (id) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      set({ projects: get().projects.filter((p) => p.id !== id) });
      return true;
    }
    return false;
  },
}));
