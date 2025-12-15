-- =========================================
-- Barber Shop Database Schema
-- PostgreSQL Schema for Supabase
-- =========================================

-- =========================================
-- Extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- Enums
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'USER',
    'BARBER_WORKER',
    'BARBER_OWNER',
    'SUPER_ADMIN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.slot_type AS ENUM ('AVAILABLE', 'BREAK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'DONE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================================
-- Helper Functions
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =========================================
-- Profiles Table (1:1 with auth.users)
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Shops Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  working_hours_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON public.shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_city ON public.shops(city);

-- Triggers
DROP TRIGGER IF EXISTS trg_shops_updated_at ON public.shops;
CREATE TRIGGER trg_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Services Table (per shop)
-- =========================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0 AND duration_min <= 480),
  price_bgn INTEGER NOT NULL CHECK (price_bgn >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_shop_id ON public.services(shop_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services(shop_id, sort_order);

-- Triggers
DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Barbers Table (workers inside shops)
-- =========================================
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, shop_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_barbers_shop_id ON public.barbers(shop_id);
CREATE INDEX IF NOT EXISTS idx_barbers_profile_id ON public.barbers(profile_id);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_display_name ON public.barbers(display_name);

-- Triggers
DROP TRIGGER IF EXISTS trg_barbers_updated_at ON public.barbers;
CREATE TRIGGER trg_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Time Slots Table (availability/breaks)
-- =========================================
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type public.slot_type NOT NULL DEFAULT 'AVAILABLE',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_barber_time ON public.time_slots(barber_id, start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_time ON public.time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_type ON public.time_slots(type);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON public.time_slots(barber_id, is_available) WHERE is_available = true;

-- Triggers
DROP TRIGGER IF EXISTS trg_time_slots_updated_at ON public.time_slots;
CREATE TRIGGER trg_time_slots_updated_at
  BEFORE UPDATE ON public.time_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Appointments Table (bookings)
-- =========================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  
  customer_user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NULL,
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'PENDING',
  
  -- Cancellation tracking
  cancelled_by_user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_by_role public.user_role NULL,
  cancel_reason TEXT NULL,
  cancelled_at TIMESTAMPTZ NULL,
  
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_shop_time ON public.appointments(shop_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_time ON public.appointments(barber_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_user ON public.appointments(customer_user_id);
-- Note: Date queries can use idx_appointments_shop_time and idx_appointments_barber_time indexes

-- Unique constraint to prevent double-booking
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_barber_start
  ON public.appointments(barber_id, start_time)
  WHERE status IN ('PENDING', 'CONFIRMED');

-- Triggers
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Audit Logs Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role public.user_role NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- =========================================
-- Row Level Security (RLS)
-- =========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Helper Function: Get Current User Role
-- =========================================
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- =========================================
-- RLS Policies: Profiles
-- =========================================
DROP POLICY IF EXISTS "profiles_read_self" ON public.profiles;
CREATE POLICY "profiles_read_self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.current_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.current_role() = 'SUPER_ADMIN')
  WITH CHECK (id = auth.uid() OR public.current_role() = 'SUPER_ADMIN');

-- =========================================
-- RLS Policies: Shops
-- =========================================
DROP POLICY IF EXISTS "shops_read_public_active" ON public.shops;
CREATE POLICY "shops_read_public_active"
  ON public.shops FOR SELECT
  USING (is_active = true OR public.current_role() = 'SUPER_ADMIN' OR owner_id = auth.uid());

DROP POLICY IF EXISTS "shops_owner_manage" ON public.shops;
CREATE POLICY "shops_owner_manage"
  ON public.shops FOR ALL
  USING (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN') 
    AND (owner_id = auth.uid() OR public.current_role() = 'SUPER_ADMIN')
  )
  WITH CHECK (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN') 
    AND (owner_id = auth.uid() OR public.current_role() = 'SUPER_ADMIN')
  );

-- =========================================
-- RLS Policies: Services
-- =========================================
DROP POLICY IF EXISTS "services_read_shop" ON public.services;
CREATE POLICY "services_read_shop"
  ON public.services FOR SELECT
  USING (
    is_active = true
    OR public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = services.shop_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "services_owner_manage" ON public.services;
CREATE POLICY "services_owner_manage"
  ON public.services FOR ALL
  USING (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN')
    AND (
      public.current_role() = 'SUPER_ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = services.shop_id AND s.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN')
    AND (
      public.current_role() = 'SUPER_ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = services.shop_id AND s.owner_id = auth.uid()
      )
    )
  );

-- =========================================
-- RLS Policies: Barbers
-- =========================================
DROP POLICY IF EXISTS "barbers_read_public_active" ON public.barbers;
CREATE POLICY "barbers_read_public_active"
  ON public.barbers FOR SELECT
  USING (
    is_active = true
    OR public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = barbers.shop_id AND s.owner_id = auth.uid()
    )
    OR barbers.profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "barbers_owner_manage" ON public.barbers;
CREATE POLICY "barbers_owner_manage"
  ON public.barbers FOR ALL
  USING (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN')
    AND (
      public.current_role() = 'SUPER_ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = barbers.shop_id AND s.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.current_role() IN ('BARBER_OWNER', 'SUPER_ADMIN')
    AND (
      public.current_role() = 'SUPER_ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = barbers.shop_id AND s.owner_id = auth.uid()
      )
    )
  );

-- =========================================
-- RLS Policies: Time Slots
-- =========================================
DROP POLICY IF EXISTS "time_slots_read_scoped" ON public.time_slots;
CREATE POLICY "time_slots_read_scoped"
  ON public.time_slots FOR SELECT
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1
      FROM public.barbers b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE b.id = time_slots.barber_id
        AND (
          s.owner_id = auth.uid()
          OR b.profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.barbers me
            WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
          )
        )
    )
  );

DROP POLICY IF EXISTS "time_slots_worker_manage_own" ON public.time_slots;
CREATE POLICY "time_slots_worker_manage_own"
  ON public.time_slots FOR INSERT
  WITH CHECK (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND b.profile_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "time_slots_worker_update_delete" ON public.time_slots;
CREATE POLICY "time_slots_worker_update_delete"
  ON public.time_slots FOR UPDATE
  USING (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND b.profile_id = auth.uid())
        )
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "time_slots_worker_delete" ON public.time_slots;
CREATE POLICY "time_slots_worker_delete"
  ON public.time_slots FOR DELETE
  USING (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND b.profile_id = auth.uid())
        )
    )
  );

-- =========================================
-- RLS Policies: Appointments
-- =========================================
DROP POLICY IF EXISTS "appointments_read_scoped" ON public.appointments;
CREATE POLICY "appointments_read_scoped"
  ON public.appointments FOR SELECT
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR customer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.barbers b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE b.id = appointments.barber_id
        AND (
          b.profile_id = auth.uid()
          OR s.owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "appointments_insert_authenticated" ON public.appointments;
CREATE POLICY "appointments_insert_authenticated"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "appointments_update_scoped" ON public.appointments;
CREATE POLICY "appointments_update_scoped"
  ON public.appointments FOR UPDATE
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1
      FROM public.barbers b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE b.id = appointments.barber_id
        AND (
          b.profile_id = auth.uid()
          OR s.owner_id = auth.uid()
        )
    )
  )
  WITH CHECK (true);

-- =========================================
-- RLS Policies: Audit Logs
-- =========================================
DROP POLICY IF EXISTS "audit_super_admin_only" ON public.audit_logs;
CREATE POLICY "audit_super_admin_only"
  ON public.audit_logs FOR ALL
  USING (public.current_role() = 'SUPER_ADMIN')
  WITH CHECK (public.current_role() = 'SUPER_ADMIN');

-- =========================================
-- Sample Data (Optional - for testing)
-- =========================================
-- Uncomment below to insert sample data

/*
-- Insert a default shop
INSERT INTO public.shops (id, name, city, address, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Main Barber Shop', 'Sofia', '123 Main Street', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Profiles and barbers require auth users first, so they should be created via the application
*/

-- =========================================
-- Comments for Documentation
-- =========================================
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON TABLE public.shops IS 'Barber shop locations';
COMMENT ON TABLE public.services IS 'Services offered by each shop';
COMMENT ON TABLE public.barbers IS 'Barbers working at shops, linked to profiles';
COMMENT ON TABLE public.time_slots IS 'Barber availability and break times';
COMMENT ON TABLE public.appointments IS 'Customer appointments/bookings';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for administrative actions';

COMMENT ON COLUMN public.barbers.profile_id IS 'References profiles.id - must be a BARBER_WORKER profile';
COMMENT ON COLUMN public.appointments.customer_user_id IS 'Nullable to allow guest bookings';
COMMENT ON COLUMN public.time_slots.type IS 'AVAILABLE for booking, BREAK for unavailable time';

