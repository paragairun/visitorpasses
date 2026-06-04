-- Barrier devices
CREATE TABLE public.barrier_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  direction text NOT NULL CHECK (direction IN ('entry','exit','both')),
  device_token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.barrier_devices TO authenticated;
GRANT ALL ON public.barrier_devices TO service_role;

ALTER TABLE public.barrier_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage barrier devices"
  ON public.barrier_devices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Guards can view barrier devices"
  ON public.barrier_devices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_barrier_devices_updated_at
  BEFORE UPDATE ON public.barrier_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Barrier events
CREATE TABLE public.barrier_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.barrier_devices(id) ON DELETE SET NULL,
  vehicle_number text,
  qr_payload text,
  decision text NOT NULL CHECK (decision IN ('opened','denied','manual_open','manual_close')),
  reason text,
  entry_log_id uuid REFERENCES public.entry_logs(id) ON DELETE SET NULL,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.barrier_events TO authenticated;
GRANT ALL ON public.barrier_events TO service_role;

ALTER TABLE public.barrier_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards and admins view barrier events"
  ON public.barrier_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Guards and admins insert barrier events"
  ON public.barrier_events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_barrier_events_created_at ON public.barrier_events (created_at DESC);
CREATE INDEX idx_barrier_events_device ON public.barrier_events (device_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.barrier_events;
ALTER TABLE public.barrier_events REPLICA IDENTITY FULL;