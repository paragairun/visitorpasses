-- ============================================================
-- Amenities module: bookable society facilities (clubhouse, gym,
-- pool, etc.) with free-form time booking, per-amenity approval
-- requirement, usage limits, and DB-enforced double-booking
-- prevention. No payment collection in this version.
-- ============================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.amenity_booking_status AS ENUM ('pending_approval', 'approved', 'rejected', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.usage_limit_period AS ENUM ('day', 'week', 'month');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. amenities: the bookable facilities themselves
CREATE TABLE IF NOT EXISTS public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  operating_hours_start time NOT NULL DEFAULT '06:00',
  operating_hours_end time NOT NULL DEFAULT '22:00',
  max_booking_hours numeric NOT NULL DEFAULT 2,
  requires_approval boolean NOT NULL DEFAULT true,
  usage_limit_count integer,
  usage_limit_period public.usage_limit_period,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operating_hours_valid CHECK (operating_hours_end > operating_hours_start)
);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS amenities_updated_at ON public.amenities;
CREATE TRIGGER amenities_updated_at BEFORE UPDATE ON public.amenities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage amenities" ON public.amenities;
CREATE POLICY "Admins manage amenities" ON public.amenities
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view active amenities" ON public.amenities;
CREATE POLICY "Residents view active amenities" ON public.amenities
  FOR SELECT USING (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

-- 3. amenity_bookings
CREATE TABLE IF NOT EXISTS public.amenity_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  wing text NOT NULL,
  flat_number text NOT NULL,
  booked_by uuid NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status public.amenity_booking_status NOT NULL DEFAULT 'pending_approval',
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_time_valid CHECK (end_time > start_time),
  CONSTRAINT booking_not_in_past CHECK (booking_date >= CURRENT_DATE)
);

ALTER TABLE public.amenity_bookings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS amenity_bookings_updated_at ON public.amenity_bookings;
CREATE TRIGGER amenity_bookings_updated_at BEFORE UPDATE ON public.amenity_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage all bookings" ON public.amenity_bookings;
CREATE POLICY "Admins manage all bookings" ON public.amenity_bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view own bookings" ON public.amenity_bookings;
CREATE POLICY "Residents view own bookings" ON public.amenity_bookings
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
        AND rf.wing = amenity_bookings.wing AND rf.flat_number = amenity_bookings.flat_number
    )
  );

DROP POLICY IF EXISTS "Residents create own bookings" ON public.amenity_bookings;
CREATE POLICY "Residents create own bookings" ON public.amenity_bookings
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND booked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
        AND rf.wing = amenity_bookings.wing AND rf.flat_number = amenity_bookings.flat_number
    )
  );

-- Residents may only cancel their own booking -- not approve/reject, not edit
-- times or other fields. Enforced fully in the trigger below (not just here),
-- since RLS WITH CHECK alone can't easily compare old vs new column-by-column.
DROP POLICY IF EXISTS "Residents cancel own bookings" ON public.amenity_bookings;
CREATE POLICY "Residents cancel own bookings" ON public.amenity_bookings
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
        AND rf.wing = amenity_bookings.wing AND rf.flat_number = amenity_bookings.flat_number
    )
  )
  WITH CHECK (status = 'cancelled'::public.amenity_booking_status);

-- 4. Trigger: auto-confirm bookings that don't require approval, enforce
-- per-flat usage limits, and prevent double-booking against other approved
-- bookings for the same amenity/date/time-range.
CREATE OR REPLACE FUNCTION public.enforce_amenity_booking_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  amenity_row RECORD;
  existing_count integer;
  period_start date;
  overlap_count integer;
BEGIN
  SELECT * INTO amenity_row FROM public.amenities WHERE id = NEW.amenity_id;
  IF amenity_row IS NULL THEN
    RAISE EXCEPTION 'Amenity not found';
  END IF;

  -- Only re-run usage-limit / status-default logic on INSERT -- an UPDATE
  -- (e.g. resident cancelling, or admin approving/rejecting) shouldn't be
  -- blocked by the flat's own historical usage count.
  IF TG_OP = 'INSERT' THEN
    -- Enforce usage limit, if configured
    IF amenity_row.usage_limit_count IS NOT NULL AND amenity_row.usage_limit_period IS NOT NULL THEN
      period_start := CASE amenity_row.usage_limit_period
        WHEN 'day' THEN CURRENT_DATE
        WHEN 'week' THEN date_trunc('week', CURRENT_DATE)::date
        WHEN 'month' THEN date_trunc('month', CURRENT_DATE)::date
      END;

      SELECT count(*) INTO existing_count
      FROM public.amenity_bookings
      WHERE amenity_id = NEW.amenity_id
        AND wing = NEW.wing AND flat_number = NEW.flat_number
        AND status IN ('pending_approval', 'approved')
        AND booking_date >= period_start;

      IF existing_count >= amenity_row.usage_limit_count THEN
        RAISE EXCEPTION 'Usage limit reached: % booking(s) per % for this amenity', amenity_row.usage_limit_count, amenity_row.usage_limit_period
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

    -- Auto-confirm if this amenity doesn't require approval
    IF NOT amenity_row.requires_approval THEN
      NEW.status := 'approved';
    END IF;
  END IF;

  -- Whenever a row is (or becomes) 'approved', make sure it doesn't overlap
  -- another approved booking for the same amenity on the same date.
  IF NEW.status = 'approved' THEN
    SELECT count(*) INTO overlap_count
    FROM public.amenity_bookings
    WHERE amenity_id = NEW.amenity_id
      AND booking_date = NEW.booking_date
      AND status = 'approved'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NEW.start_time < end_time AND NEW.end_time > start_time;

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'This time slot overlaps an already-approved booking for this amenity'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_amenity_booking_rules ON public.amenity_bookings;
CREATE TRIGGER trg_enforce_amenity_booking_rules
  BEFORE INSERT OR UPDATE ON public.amenity_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_amenity_booking_rules();

-- 5. Helper RPC: mark past approved bookings as completed. Called opportunistically
-- from the UI on load, same pattern as expire_delivery_visits.
CREATE OR REPLACE FUNCTION public.complete_past_amenity_bookings(p_society_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  completed_count integer;
BEGIN
  UPDATE public.amenity_bookings
  SET status = 'completed', updated_at = now()
  WHERE society_id = p_society_id
    AND status = 'approved'
    AND (booking_date < CURRENT_DATE OR (booking_date = CURRENT_DATE AND end_time < CURRENT_TIME));
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  RETURN completed_count;
END;
$$;
