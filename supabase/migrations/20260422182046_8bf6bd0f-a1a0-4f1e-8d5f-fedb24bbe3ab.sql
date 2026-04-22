CREATE POLICY "Residents can view own flat vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'resident'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.wing = vehicles.wing
      AND p.flat_number = vehicles.flat_number
  )
);