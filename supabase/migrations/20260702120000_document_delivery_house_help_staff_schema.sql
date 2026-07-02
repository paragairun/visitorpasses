-- ============================================================
-- Backfill migration: document the delivery / house-help / staff
-- attendance feature schema.
--
-- These tables (delivery_visits, house_helps, house_help_flats,
-- staff_members, staff_logs) and the societies.slug column were
-- built directly against the live database a few days ago and
-- never got a tracked migration. This migration exists purely to
-- restore accurate history -- it is written defensively (IF NOT
-- EXISTS / DROP ... IF EXISTS before CREATE) so it is a safe no-op
-- if ever run against the live database where these objects
-- already exist, and still works correctly against a fresh
-- database (e.g. local dev, disaster recovery).
-- ============================================================

-- 1. Enum types
DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM ('pending_approval', 'approved', 'rejected', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_category AS ENUM ('society_staff', 'house_help');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. staff_members
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  staff_type text NOT NULL,
  phone text,
  photo_base64 text,
  qr_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  registered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS staff_members_updated_at ON public.staff_members;
CREATE TRIGGER staff_members_updated_at BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage society staff" ON public.staff_members;
CREATE POLICY "Admins manage society staff" ON public.staff_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Guards view society staff" ON public.staff_members;
CREATE POLICY "Guards view society staff" ON public.staff_members
  FOR SELECT USING (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view society staff" ON public.staff_members;
CREATE POLICY "Residents view society staff" ON public.staff_members
  FOR SELECT USING (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

-- 3. house_helps
CREATE TABLE IF NOT EXISTS public.house_helps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  help_type text NOT NULL,
  phone text,
  photo_base64 text,
  qr_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.house_helps ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS house_helps_updated_at ON public.house_helps;
CREATE TRIGGER house_helps_updated_at BEFORE UPDATE ON public.house_helps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins view all house helps" ON public.house_helps;
CREATE POLICY "Admins view all house helps" ON public.house_helps
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Guards view house helps" ON public.house_helps;
CREATE POLICY "Guards view house helps" ON public.house_helps
  FOR SELECT USING (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents insert house helps" ON public.house_helps;
CREATE POLICY "Residents insert house helps" ON public.house_helps
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view their house helps" ON public.house_helps;
CREATE POLICY "Residents view their house helps" ON public.house_helps
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND id IN (SELECT house_help_flats.house_help_id FROM public.house_help_flats WHERE house_help_flats.resident_id = auth.uid())
  );

DROP POLICY IF EXISTS "Residents update their house helps" ON public.house_helps;
CREATE POLICY "Residents update their house helps" ON public.house_helps
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND id IN (SELECT house_help_flats.house_help_id FROM public.house_help_flats WHERE house_help_flats.resident_id = auth.uid())
  );

DROP POLICY IF EXISTS "Residents delete their house helps" ON public.house_helps;
CREATE POLICY "Residents delete their house helps" ON public.house_helps
  FOR DELETE USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND id IN (SELECT house_help_flats.house_help_id FROM public.house_help_flats WHERE house_help_flats.resident_id = auth.uid())
  );

-- 4. house_help_flats (join table: which resident added which house help to which flat)
CREATE TABLE IF NOT EXISTS public.house_help_flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_help_id uuid NOT NULL REFERENCES public.house_helps(id) ON DELETE CASCADE,
  resident_id uuid NOT NULL,
  wing text NOT NULL,
  flat_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.house_help_flats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view help-flat links" ON public.house_help_flats;
CREATE POLICY "Admins view help-flat links" ON public.house_help_flats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.house_helps h WHERE h.id = house_help_flats.house_help_id AND h.society_id = public.get_user_society_id(auth.uid()))
  );

DROP POLICY IF EXISTS "Guards view help-flat links" ON public.house_help_flats;
CREATE POLICY "Guards view help-flat links" ON public.house_help_flats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'guard'::app_role)
    AND EXISTS (SELECT 1 FROM public.house_helps h WHERE h.id = house_help_flats.house_help_id AND h.society_id = public.get_user_society_id(auth.uid()))
  );

DROP POLICY IF EXISTS "Residents manage their help-flat links" ON public.house_help_flats;
CREATE POLICY "Residents manage their help-flat links" ON public.house_help_flats
  FOR ALL USING (resident_id = auth.uid()) WITH CHECK (resident_id = auth.uid());

-- 5. staff_logs (attendance / check-in-out log for both staff_members and house_helps)
CREATE TABLE IF NOT EXISTS public.staff_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  category public.staff_category NOT NULL,
  staff_id uuid NOT NULL,
  action_type text NOT NULL,
  logged_by uuid,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all staff logs" ON public.staff_logs;
CREATE POLICY "Admins view all staff logs" ON public.staff_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Guards manage staff logs" ON public.staff_logs;
CREATE POLICY "Guards manage staff logs" ON public.staff_logs
  FOR ALL USING (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view logs for their helps" ON public.staff_logs;
CREATE POLICY "Residents view logs for their helps" ON public.staff_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND category = 'house_help'::staff_category
    AND staff_id IN (SELECT house_help_flats.house_help_id FROM public.house_help_flats WHERE house_help_flats.resident_id = auth.uid())
  );

-- 6. delivery_visits
CREATE TABLE IF NOT EXISTS public.delivery_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  mobile text NOT NULL,
  photo_base64 text,
  delivery_type text NOT NULL,
  agent_name text,
  wing text NOT NULL,
  flat_number text NOT NULL,
  status public.delivery_status NOT NULL DEFAULT 'pending_approval'::public.delivery_status,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  guard_id uuid,
  approved_by uuid,
  rejection_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_visits ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS delivery_visits_updated_at ON public.delivery_visits;
CREATE TRIGGER delivery_visits_updated_at BEFORE UPDATE ON public.delivery_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins view delivery visits" ON public.delivery_visits;
CREATE POLICY "Admins view delivery visits" ON public.delivery_visits
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Guards manage delivery visits" ON public.delivery_visits;
CREATE POLICY "Guards manage delivery visits" ON public.delivery_visits
  FOR ALL USING (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'guard'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view their delivery visits" ON public.delivery_visits;
CREATE POLICY "Residents view their delivery visits" ON public.delivery_visits
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE rf.user_id = auth.uid() AND rf.wing = delivery_visits.wing AND rf.flat_number = delivery_visits.flat_number
    )
  );

DROP POLICY IF EXISTS "Residents approve/reject their delivery visits" ON public.delivery_visits;
CREATE POLICY "Residents approve/reject their delivery visits" ON public.delivery_visits
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE rf.user_id = auth.uid() AND rf.wing = delivery_visits.wing AND rf.flat_number = delivery_visits.flat_number
    )
  )
  WITH CHECK (status = ANY (ARRAY['approved'::public.delivery_status, 'rejected'::public.delivery_status]));

-- 7. societies.slug (used to build short admin/visitor-form URLs, e.g. visitorpasses.in/<slug>/admin)
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS slug text;

-- 8. expire_delivery_visits: called by the guard dashboard on load to auto-expire
-- stale pending deliveries (past expires_at) before displaying the active list.
CREATE OR REPLACE FUNCTION public.expire_delivery_visits(p_society_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.delivery_visits
  SET status = 'expired', updated_at = now()
  WHERE society_id = p_society_id
    AND status = 'pending_approval'
    AND expires_at < now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$function$;

