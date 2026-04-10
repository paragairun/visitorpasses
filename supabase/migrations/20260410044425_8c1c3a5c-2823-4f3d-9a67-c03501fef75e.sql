
CREATE TABLE public.registration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  requested_role TEXT NOT NULL,
  flat_number TEXT,
  wing TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a registration request (no auth required for insert)
CREATE POLICY "Anyone can submit registration request"
ON public.registration_requests
FOR INSERT
WITH CHECK (true);

-- Admins can view all registration requests
CREATE POLICY "Admins can view registration requests"
ON public.registration_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update registration requests (approve/reject)
CREATE POLICY "Admins can update registration requests"
ON public.registration_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
