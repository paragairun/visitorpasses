
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL CHECK (action_type IN ('entry', 'exit')),
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'denied')),
  logged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards can manage access logs"
  ON public.access_logs FOR ALL
  USING (public.has_role(auth.uid(), 'guard'));

CREATE POLICY "Admins can view access logs"
  ON public.access_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_access_logs_vehicle_id ON public.access_logs(vehicle_id);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp DESC);
