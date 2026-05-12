
-- 1. profiles.phone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. resident_flats table
CREATE TABLE IF NOT EXISTS public.resident_flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wing text NOT NULL,
  flat_number text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, wing, flat_number)
);

ALTER TABLE public.resident_flats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents manage own flats select"
  ON public.resident_flats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Residents insert own flats"
  ON public.resident_flats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'resident'::app_role));

CREATE POLICY "Residents delete own flats"
  ON public.resident_flats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'resident'::app_role));

CREATE POLICY "Admins manage all flats"
  ON public.resident_flats FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Guards view flats"
  ON public.resident_flats FOR SELECT
  USING (public.has_role(auth.uid(), 'guard'::app_role));

-- 3. Backfill from profiles
INSERT INTO public.resident_flats (user_id, wing, flat_number, is_primary)
SELECT p.user_id, upper(trim(p.wing)), upper(trim(p.flat_number)), true
FROM public.profiles p
WHERE p.wing IS NOT NULL AND p.flat_number IS NOT NULL
  AND trim(p.wing) <> '' AND trim(p.flat_number) <> ''
ON CONFLICT (user_id, wing, flat_number) DO NOTHING;

-- 4. Update vehicles RLS for residents (multi-flat)
DROP POLICY IF EXISTS "Residents can view own flat vehicles" ON public.vehicles;
CREATE POLICY "Residents can view own flat vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE rf.user_id = auth.uid()
        AND rf.wing = vehicles.wing
        AND rf.flat_number = vehicles.flat_number
    )
  );
