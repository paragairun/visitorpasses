
-- ============================================================
-- 1. societies table
-- ============================================================
CREATE TABLE public.societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line text NOT NULL,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  pin_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.societies TO authenticated;
GRANT SELECT ON public.societies TO anon;
GRANT ALL ON public.societies TO service_role;

ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER societies_updated_at BEFORE UPDATE ON public.societies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.societies (id, name, address_line, city, state, country, pin_code, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Triumph Tower CHSL',
  'Triumph Tower',
  'Mumbai',
  'Maharashtra',
  'India',
  '400000',
  'active'
);

-- ============================================================
-- 2. society_registration_requests table
-- ============================================================
CREATE TABLE public.society_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_name text NOT NULL,
  address_line text NOT NULL,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  pin_code text NOT NULL,
  admin_email text NOT NULL,
  admin_display_name text NOT NULL,
  admin_phone text,
  admin_password text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_society_id uuid REFERENCES public.societies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.society_registration_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_registration_requests TO authenticated;
GRANT ALL ON public.society_registration_requests TO service_role;

ALTER TABLE public.society_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER society_reg_updated_at BEFORE UPDATE ON public.society_registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Add society_id to every tenant-scoped table
-- ============================================================
DO $$
DECLARE
  default_society uuid := '00000000-0000-0000-0000-000000000001';
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','user_roles','resident_flats','vehicles',
    'visitor_requests','entry_logs','access_logs',
    'barrier_devices','barrier_events',
    'registration_requests','vehicle_change_requests'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN society_id uuid NOT NULL DEFAULT %L REFERENCES public.societies(id) ON DELETE CASCADE',
      t, default_society
    );
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN society_id DROP DEFAULT', t);
    EXECUTE format('CREATE INDEX %I ON public.%I(society_id)', 'idx_'||t||'_society_id', t);
  END LOOP;
END $$;

-- profiles.society_id can be NULL right after signup (the app populates it)
ALTER TABLE public.profiles ALTER COLUMN society_id DROP NOT NULL;

-- ============================================================
-- 4. Helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_society_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT society_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::app_role
  )
$$;

-- ============================================================
-- 5. Drop existing policies on tenant tables
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','user_roles','resident_flats','vehicles',
        'visitor_requests','entry_logs','access_logs',
        'barrier_devices','barrier_events',
        'registration_requests','vehicle_change_requests'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 6. Recreate policies with society scoping + super_admin bypass
-- ============================================================

-- profiles
CREATE POLICY "super_admin full access profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view society profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Primaries view child profiles" ON public.profiles
  FOR SELECT USING (parent_user_id = auth.uid());

-- user_roles
CREATE POLICY "super_admin full access user_roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage society roles" ON public.user_roles
  FOR ALL USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- resident_flats
CREATE POLICY "super_admin full access resident_flats" ON public.resident_flats
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins manage society flats" ON public.resident_flats
  FOR ALL USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards view society flats" ON public.resident_flats
  FOR SELECT USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Residents view own and parent flats" ON public.resident_flats
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR user_id = public.get_parent_user_id(auth.uid())
  );
CREATE POLICY "Primary residents insert own flats" ON public.resident_flats
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND public.has_role(auth.uid(),'resident'::app_role)
    AND public.is_primary_resident(auth.uid())
    AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Primary residents delete own flats" ON public.resident_flats
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    AND public.has_role(auth.uid(),'resident'::app_role)
    AND public.is_primary_resident(auth.uid())
  );

-- vehicles
CREATE POLICY "super_admin full access vehicles" ON public.vehicles
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins manage society vehicles" ON public.vehicles
  FOR ALL USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards view society vehicles" ON public.vehicles
  FOR SELECT USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Residents view own flat vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.resident_flats rf
              WHERE rf.user_id = auth.uid() AND rf.wing = vehicles.wing AND rf.flat_number = vehicles.flat_number)
      OR EXISTS (SELECT 1 FROM public.resident_flats rf
              WHERE rf.user_id = public.get_parent_user_id(auth.uid()) AND rf.wing = vehicles.wing AND rf.flat_number = vehicles.flat_number)
    )
  );

-- visitor_requests
CREATE POLICY "super_admin full access visitor_requests" ON public.visitor_requests
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Public can create visitor requests" ON public.visitor_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view society visitor requests" ON public.visitor_requests
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards view society visitor requests" ON public.visitor_requests
  FOR SELECT USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards update society visitor requests" ON public.visitor_requests
  FOR UPDATE USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- entry_logs
CREATE POLICY "super_admin full access entry_logs" ON public.entry_logs
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins view society entry logs" ON public.entry_logs
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards manage society entry logs" ON public.entry_logs
  FOR ALL USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- access_logs
CREATE POLICY "super_admin full access access_logs" ON public.access_logs
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins view society access logs" ON public.access_logs
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards manage society access logs" ON public.access_logs
  FOR ALL USING (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- barrier_devices
CREATE POLICY "super_admin full access barrier_devices" ON public.barrier_devices
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins manage society barrier devices" ON public.barrier_devices
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards view society barrier devices" ON public.barrier_devices
  FOR SELECT TO authenticated USING (
    (public.has_role(auth.uid(),'guard'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
    AND society_id = public.get_user_society_id(auth.uid())
  );

-- barrier_events
CREATE POLICY "super_admin full access barrier_events" ON public.barrier_events
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Guards and admins view society barrier events" ON public.barrier_events
  FOR SELECT TO authenticated USING (
    (public.has_role(auth.uid(),'guard'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
    AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Guards and admins insert society barrier events" ON public.barrier_events
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'guard'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
    AND society_id = public.get_user_society_id(auth.uid())
  );

-- registration_requests
CREATE POLICY "super_admin full access registration_requests" ON public.registration_requests
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Anyone can submit registration request" ON public.registration_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view society registration requests" ON public.registration_requests
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Admins update society registration requests" ON public.registration_requests
  FOR UPDATE USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Admins delete society registration requests" ON public.registration_requests
  FOR DELETE USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- vehicle_change_requests
CREATE POLICY "super_admin full access vcr" ON public.vehicle_change_requests
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Residents view own vcr" ON public.vehicle_change_requests
  FOR SELECT TO authenticated USING (auth.uid() = requested_by);
CREATE POLICY "Primary residents create own vcr" ON public.vehicle_change_requests
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = requested_by
    AND public.has_role(auth.uid(),'resident'::app_role)
    AND public.is_primary_resident(auth.uid())
    AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Admins view society vcr" ON public.vehicle_change_requests
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Admins update society vcr" ON public.vehicle_change_requests
  FOR UPDATE USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );
CREATE POLICY "Admins delete society vcr" ON public.vehicle_change_requests
  FOR DELETE USING (
    public.has_role(auth.uid(),'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid())
  );

-- ============================================================
-- 7. societies + society_registration_requests RLS
-- ============================================================
CREATE POLICY "super_admin full access societies" ON public.societies
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Public can view active societies" ON public.societies
  FOR SELECT USING (status = 'active');
CREATE POLICY "Admins update own society" ON public.societies
  FOR UPDATE USING (
    public.has_role(auth.uid(),'admin'::app_role) AND id = public.get_user_society_id(auth.uid())
  );

CREATE POLICY "Anyone can submit society registration" ON public.society_registration_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "super_admin full access society_reg" ON public.society_registration_requests
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================================
-- 8. Per-society uniqueness for vehicles
-- ============================================================
DROP INDEX IF EXISTS public.vehicles_vehicle_number_normalized_unique;
CREATE UNIQUE INDEX vehicles_vehicle_number_per_society_unique
  ON public.vehicles (society_id, regexp_replace(upper(vehicle_number), '[^A-Z0-9]'::text, ''::text, 'g'::text));
