CREATE POLICY "Admins can delete vehicles"
ON public.vehicles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));