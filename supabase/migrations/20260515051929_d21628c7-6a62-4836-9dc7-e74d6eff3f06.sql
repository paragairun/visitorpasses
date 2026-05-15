
-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS child_type text NULL CHECK (child_type IN ('family', 'tenant'));

CREATE INDEX IF NOT EXISTS idx_profiles_parent_user_id ON public.profiles(parent_user_id);

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.is_primary_resident(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_user_id IS NULL FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    true
  )
$$;

-- 3. Get parent helper
CREATE OR REPLACE FUNCTION public.get_parent_user_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT parent_user_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Trigger: ensure only one primary resident per flat
CREATE OR REPLACE FUNCTION public.enforce_one_primary_per_flat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_child boolean;
BEGIN
  SELECT (parent_user_id IS NOT NULL) INTO is_child
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  -- Children cannot own resident_flats rows directly
  IF COALESCE(is_child, false) THEN
    RAISE EXCEPTION 'Child residents cannot own flats; flats are inherited from the primary'
      USING ERRCODE = 'check_violation';
  END IF;

  -- One primary per flat: block if another primary already exists
  IF EXISTS (
    SELECT 1
    FROM public.resident_flats rf
    JOIN public.profiles p ON p.user_id = rf.user_id
    WHERE rf.wing = NEW.wing
      AND rf.flat_number = NEW.flat_number
      AND rf.user_id <> NEW.user_id
      AND p.parent_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Flat %-% already has a primary resident', NEW.wing, NEW.flat_number
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_one_primary_per_flat ON public.resident_flats;
CREATE TRIGGER trg_enforce_one_primary_per_flat
  BEFORE INSERT OR UPDATE ON public.resident_flats
  FOR EACH ROW EXECUTE FUNCTION public.enforce_one_primary_per_flat();

-- 5. Trigger: child profile can only change display_name and phone
CREATE OR REPLACE FUNCTION public.restrict_child_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for children, and only when the row is being updated by the child themselves
  IF OLD.parent_user_id IS NOT NULL AND auth.uid() = OLD.user_id THEN
    IF NEW.wing IS DISTINCT FROM OLD.wing
       OR NEW.flat_number IS DISTINCT FROM OLD.flat_number
       OR NEW.parent_user_id IS DISTINCT FROM OLD.parent_user_id
       OR NEW.child_type IS DISTINCT FROM OLD.child_type
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Child residents may only update their name and phone'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_child_profile_updates ON public.profiles;
CREATE TRIGGER trg_restrict_child_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.restrict_child_profile_updates();

-- 6. RLS: profiles - primary can view child profiles
DROP POLICY IF EXISTS "Primaries can view their child profiles" ON public.profiles;
CREATE POLICY "Primaries can view their child profiles"
ON public.profiles
FOR SELECT
USING (parent_user_id = auth.uid());

-- 7. RLS: vehicles - children can view parent's flat vehicles
DROP POLICY IF EXISTS "Residents can view own flat vehicles" ON public.vehicles;
CREATE POLICY "Residents can view own flat vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'resident'::app_role) AND (
    EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE rf.user_id = auth.uid()
        AND rf.wing = vehicles.wing
        AND rf.flat_number = vehicles.flat_number
    )
    OR EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE rf.user_id = public.get_parent_user_id(auth.uid())
        AND rf.wing = vehicles.wing
        AND rf.flat_number = vehicles.flat_number
    )
  )
);

-- 8. RLS: resident_flats - only primaries can write
DROP POLICY IF EXISTS "Residents insert own flats" ON public.resident_flats;
CREATE POLICY "Primary residents insert own flats"
ON public.resident_flats
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND has_role(auth.uid(), 'resident'::app_role)
  AND public.is_primary_resident(auth.uid())
);

DROP POLICY IF EXISTS "Residents delete own flats" ON public.resident_flats;
CREATE POLICY "Primary residents delete own flats"
ON public.resident_flats
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND has_role(auth.uid(), 'resident'::app_role)
  AND public.is_primary_resident(auth.uid())
);

-- Allow children to view parent's flats too (for portal display)
DROP POLICY IF EXISTS "Residents manage own flats select" ON public.resident_flats;
CREATE POLICY "Residents view own and parent flats"
ON public.resident_flats
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR user_id = public.get_parent_user_id(auth.uid())
);

-- 9. RLS: vehicle_change_requests - block children from inserting
DROP POLICY IF EXISTS "Residents create own requests" ON public.vehicle_change_requests;
CREATE POLICY "Primary residents create own requests"
ON public.vehicle_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requested_by
  AND has_role(auth.uid(), 'resident'::app_role)
  AND public.is_primary_resident(auth.uid())
);
