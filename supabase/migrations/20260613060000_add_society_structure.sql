-- ============================================================
-- Society structure: Towers -> Wings -> Flat number ranges
-- Submitted at registration time, locked after super-admin approval.
-- ============================================================

-- 1. Add structure column to registration requests (submitted by registrant)
ALTER TABLE public.society_registration_requests
  ADD COLUMN IF NOT EXISTS society_structure jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Dedicated table for the approved/live structure, one row per society
CREATE TABLE public.society_structure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL UNIQUE REFERENCES public.societies(id) ON DELETE CASCADE,
  -- structure shape: [{ "tower_name": "Tower 1", "wings": [{ "wing": "A", "flat_from": 101, "flat_to": 412 }, ...] }, ...]
  structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.society_structure TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_structure TO authenticated;
GRANT ALL ON public.society_structure TO service_role;

ALTER TABLE public.society_structure ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER society_structure_updated_at BEFORE UPDATE ON public.society_structure
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Super admin: full access always
CREATE POLICY "super_admin full access society_structure" ON public.society_structure
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Anyone (incl. anon, for registration form display / visitor form) can read structure
CREATE POLICY "Anyone can view society structure" ON public.society_structure
  FOR SELECT USING (true);

-- Admins of the society can INSERT/UPDATE their own row ONLY while it is not locked.
-- Once locked = true, only super_admin (via the policy above) can change it.
CREATE POLICY "Admins manage own unlocked society structure" ON public.society_structure
  FOR ALL USING (
    public.has_role(auth.uid(),'admin'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND locked = false
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND locked = false
  );
