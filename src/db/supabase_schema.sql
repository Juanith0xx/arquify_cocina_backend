-- ==============================================================================
-- SCHEMA MULTI-TENANT PARA ARQUIFY BIM / CAD INDUSTRIAL (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear Enums de Roles y Tipos de Proyecto
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('superadmin', 'tenant_admin', 'designer', 'operator');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
    CREATE TYPE project_type AS ENUM ('kitchen', 'closet', 'special_furniture', 'sip_house');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('draft', 'quoted', 'in_production', 'completed', 'archived');
  END IF;
END $$;

-- 3. Tabla: tenants (Proveedores / Empresas Fabricantes)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  currency TEXT DEFAULT 'CLP',
  default_margin_pct NUMERIC(5, 2) DEFAULT 35.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: profiles (Usuarios vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'designer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla: materials_catalog (Catálogo de Melaminas, HPL, Durolac y Paneles por Proveedor)
CREATE TABLE IF NOT EXISTS public.materials_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Melamina', -- 'Melamina', 'HPL', 'Durolac', 'MDF', 'SIP'
  thickness_mm NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  sheet_width_mm NUMERIC(7, 2) NOT NULL DEFAULT 2500.00,
  sheet_height_mm NUMERIC(7, 2) NOT NULL DEFAULT 1830.00,
  cost_per_sheet NUMERIC(12, 2) NOT NULL DEFAULT 35000.00,
  sale_price_per_sheet NUMERIC(12, 2) NOT NULL DEFAULT 49000.00,
  color_hex TEXT DEFAULT '#FFFFFF',
  texture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla: hardware_catalog (Correderas, Bisagras, Tiradores y Tornillería)
CREATE TABLE IF NOT EXISTS public.hardware_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Corredera', 'Bisagra', 'Pata', 'Tirador', 'Fijación'
  brand TEXT DEFAULT 'Provelcar', -- 'Provelcar', 'Hafele', 'Blum', 'DTC'
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  unit TEXT DEFAULT 'Par', -- 'Par', 'Unidad', 'Caja'
  specs_json JSONB DEFAULT '{}'::jsonb, -- holguras, descuentos y capacidades
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla: projects (Proyectos CAD/BIM y Órdenes de Fabricación)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  project_type project_type NOT NULL DEFAULT 'kitchen',
  status project_status NOT NULL DEFAULT 'draft',
  total_area_m2 NUMERIC(8, 2) DEFAULT 0.00,
  total_sheets_count INT DEFAULT 0,
  material_cost NUMERIC(12, 2) DEFAULT 0.00,
  hardware_cost NUMERIC(12, 2) DEFAULT 0.00,
  total_price NUMERIC(12, 2) DEFAULT 0.00,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configuración 3D exacta y despiece
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla: tenant_settings (Configuración de Membretes, Tolerancias y Parámetros CAD)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  default_assembly_type TEXT DEFAULT 'minifix', -- 'minifix' | 'soberbio'
  default_drawer_hardware TEXT DEFAULT 'Provelcar', -- 'Provelcar' | 'Hafele'
  default_thickness NUMERIC(4, 2) DEFAULT 1.5, -- 1.5 o 1.8 cm
  pdf_header_title TEXT DEFAULT 'PLANOS DE FABRICACIÓN INDUSTRIAL',
  pdf_legal_notes TEXT DEFAULT 'Fabricación sujeta a tolerancia estándar de corte +/- 0.5 mm.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- FUNCIONES AUXILIARES DE RLS & TRIGGER DE NUEVO USUARIO
-- ==============================================================================

-- Función para obtener el tenant_id del usuario autenticado actual
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función para obtener el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger automático al registrar usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_tenant_id UUID;
BEGIN
  -- Tomar el primer tenant disponible si no viene especificado en metadata
  SELECT id INTO first_tenant_id FROM public.tenants ORDER BY created_at ASC LIMIT 1;

  INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::UUID, first_tenant_id),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'designer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador después de insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - AISLAMIENTO POR PROVEEDOR
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: tenants
CREATE POLICY "Superadmin acceso total a tenants"
  ON public.tenants FOR ALL
  USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Usuarios ven su propio tenant"
  ON public.tenants FOR SELECT
  USING (id = public.get_auth_tenant_id());

CREATE POLICY "Tenant admin edita su propio tenant"
  ON public.tenants FOR UPDATE
  USING (id = public.get_auth_tenant_id() AND public.get_auth_role() IN ('tenant_admin', 'superadmin'));

-- Políticas: profiles
CREATE POLICY "Superadmin acceso total a profiles"
  ON public.profiles FOR ALL
  USING (public.get_auth_role() = 'superadmin');

CREATE POLICY "Usuarios ven profiles de su tenant"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_auth_tenant_id() OR id = auth.uid());

CREATE POLICY "Usuarios editan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Políticas: materials_catalog
CREATE POLICY "Lectura materiales tenant"
  ON public.materials_catalog FOR SELECT
  USING (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Admin gestiona materiales tenant"
  ON public.materials_catalog FOR ALL
  USING (tenant_id = public.get_auth_tenant_id() AND public.get_auth_role() IN ('tenant_admin', 'superadmin'));

-- Políticas: hardware_catalog
CREATE POLICY "Lectura herrajes tenant"
  ON public.hardware_catalog FOR SELECT
  USING (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Admin gestiona herrajes tenant"
  ON public.hardware_catalog FOR ALL
  USING (tenant_id = public.get_auth_tenant_id() AND public.get_auth_role() IN ('tenant_admin', 'superadmin'));

-- Políticas: projects
CREATE POLICY "Ver proyectos del tenant"
  ON public.projects FOR SELECT
  USING (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Crear proyectos en tenant propio"
  ON public.projects FOR INSERT
  WITH CHECK (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Editar proyectos del tenant"
  ON public.projects FOR UPDATE
  USING (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Eliminar proyectos del tenant"
  ON public.projects FOR DELETE
  USING (tenant_id = public.get_auth_tenant_id() AND public.get_auth_role() IN ('tenant_admin', 'superadmin'));

-- Políticas: tenant_settings
CREATE POLICY "Lectura settings tenant"
  ON public.tenant_settings FOR SELECT
  USING (tenant_id = public.get_auth_tenant_id() OR public.get_auth_role() = 'superadmin');

CREATE POLICY "Admin gestiona settings tenant"
  ON public.tenant_settings FOR ALL
  USING (tenant_id = public.get_auth_tenant_id() AND public.get_auth_role() IN ('tenant_admin', 'superadmin'));

-- ==============================================================================
-- DATOS SEMILLA (TENANT DEMO INICIAL PARA COMENZAR DE INMEDIATO)
-- ==============================================================================

INSERT INTO public.tenants (id, name, slug, contact_email, phone, address)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Muebles & Maderas Industrial Pro',
  'maderas-pro',
  'contacto@maderaspro.cl',
  '+56 9 1234 5678',
  'Av. Industrial 4500, Santiago, Chile'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_settings (tenant_id, default_assembly_type, default_drawer_hardware, default_thickness)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'minifix',
  'Provelcar',
  1.5
) ON CONFLICT (tenant_id) DO NOTHING;

-- Materiales Iniciales de Demostración
INSERT INTO public.materials_catalog (tenant_id, code, name, category, thickness_mm, cost_per_sheet, sale_price_per_sheet, color_hex)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'MEL-BLA-15', 'Melamina Blanco Frost 15mm', 'Melamina', 15.0, 28000, 39900, '#FFFFFF'),
  ('00000000-0000-0000-0000-000000000001', 'MEL-ROB-15', 'Melamina Roble Natural 15mm', 'Melamina', 15.0, 34000, 48500, '#D4A373'),
  ('00000000-0000-0000-0000-000000000001', 'MEL-GRA-15', 'Melamina Grafito Mate 15mm', 'Melamina', 15.0, 36000, 51000, '#2B2D42'),
  ('00000000-0000-0000-0000-000000000001', 'DUR-BLA-03', 'Durolac Blanco Traseras 3mm', 'Durolac', 3.0, 9500, 14900, '#FFFFFF')
ON CONFLICT DO NOTHING;

-- Herrajes Iniciales de Demostración
INSERT INTO public.hardware_catalog (tenant_id, sku, name, category, brand, cost_price, sale_price, unit)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'COR-TEL-500', 'Corredera Telescópica Pesada 500mm', 'Corredera', 'Provelcar', 4500, 7500, 'Par'),
  ('00000000-0000-0000-0000-000000000001', 'COR-HAF-500', 'Corredera Oculta Cierre Suave 500mm', 'Corredera', 'Hafele', 12000, 18900, 'Par'),
  ('00000000-0000-0000-0000-000000000001', 'BIS-REC-35', 'Bisagra Recta 35mm Cierre Suave', 'Bisagra', 'Provelcar', 1100, 1990, 'Unidad'),
  ('00000000-0000-0000-0000-000000000001', 'MIN-CON-15', 'Set Minifix + Perno 15mm', 'Fijación', 'Hafele', 250, 450, 'Unidad')
ON CONFLICT DO NOTHING;
