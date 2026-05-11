
CREATE TABLE public.vehicle_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  request_type text NOT NULL CHECK (request_type IN ('add','remove')),
  requested_by uuid NOT NULL,
  wing text NOT NULL,
  flat_number text NOT NULL,
  owner_name text NOT NULL,
  vehicle_number text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'car',
  target_vehicle_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz
);

ALTER TABLE public.vehicle_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents create own requests"
  ON public.vehicle_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by AND public.has_role(auth.uid(), 'resident'::app_role));

CREATE POLICY "Residents view own requests"
  ON public.vehicle_change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by);

CREATE POLICY "Admins view all requests"
  ON public.vehicle_change_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update requests"
  ON public.vehicle_change_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete requests"
  ON public.vehicle_change_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER vehicle_change_requests_updated_at
  BEFORE UPDATE ON public.vehicle_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vcr_status ON public.vehicle_change_requests(status);
CREATE INDEX idx_vcr_requested_by ON public.vehicle_change_requests(requested_by);
