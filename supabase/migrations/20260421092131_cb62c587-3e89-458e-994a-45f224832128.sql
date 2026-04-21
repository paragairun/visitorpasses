CREATE POLICY "Admins can delete registration requests"
ON public.registration_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));