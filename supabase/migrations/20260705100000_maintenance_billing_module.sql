-- ============================================================
-- Maintenance billing module: flats registry, charge heads,
-- billing settings, bills, line items, and offline payments.
-- ============================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.charge_calculation_type AS ENUM ('per_sqft', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'cheque', 'bank_transfer', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. flats: master registry of physical units (independent of who currently
-- resides there). Uses the same (society_id, wing, flat_number) natural key
-- pattern already used across resident_flats/vehicles/entry_logs -- no FK
-- changes needed to existing tables.
CREATE TABLE IF NOT EXISTS public.flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  wing text NOT NULL,
  flat_number text NOT NULL,
  area_sqft numeric NOT NULL,
  flat_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (society_id, wing, flat_number)
);

ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS flats_updated_at ON public.flats;
CREATE TRIGGER flats_updated_at BEFORE UPDATE ON public.flats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage flats" ON public.flats;
CREATE POLICY "Admins manage flats" ON public.flats
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view own society flats" ON public.flats;
CREATE POLICY "Residents view own society flats" ON public.flats
  FOR SELECT USING (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

-- 3. maintenance_charge_heads: configurable charge components per society
-- (e.g. "Maintenance" per_sqft @ 3.5/sqft, "Sinking Fund" fixed @ 500).
CREATE TABLE IF NOT EXISTS public.maintenance_charge_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  calculation_type public.charge_calculation_type NOT NULL,
  rate numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_charge_heads ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS maintenance_charge_heads_updated_at ON public.maintenance_charge_heads;
CREATE TRIGGER maintenance_charge_heads_updated_at BEFORE UPDATE ON public.maintenance_charge_heads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage charge heads" ON public.maintenance_charge_heads;
CREATE POLICY "Admins manage charge heads" ON public.maintenance_charge_heads
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view charge heads" ON public.maintenance_charge_heads;
CREATE POLICY "Residents view charge heads" ON public.maintenance_charge_heads
  FOR SELECT USING (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

-- 4. society_billing_settings: one row per society. Billing frequency is
-- society-specific (monthly/quarterly/half-yearly/annual), stored as months.
CREATE TABLE IF NOT EXISTS public.society_billing_settings (
  society_id uuid PRIMARY KEY REFERENCES public.societies(id) ON DELETE CASCADE,
  billing_frequency_months integer NOT NULL DEFAULT 1,
  due_days integer NOT NULL DEFAULT 15,
  late_fee_fixed numeric NOT NULL DEFAULT 0,
  late_fee_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_frequency_valid CHECK (billing_frequency_months IN (1, 3, 6, 12))
);

ALTER TABLE public.society_billing_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS society_billing_settings_updated_at ON public.society_billing_settings;
CREATE TRIGGER society_billing_settings_updated_at BEFORE UPDATE ON public.society_billing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage billing settings" ON public.society_billing_settings;
CREATE POLICY "Admins manage billing settings" ON public.society_billing_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view billing settings" ON public.society_billing_settings;
CREATE POLICY "Residents view billing settings" ON public.society_billing_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'resident'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

-- 5. maintenance_bills: one bill per flat per billing cycle.
CREATE TABLE IF NOT EXISTS public.maintenance_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES public.flats(id) ON DELETE CASCADE,
  wing text NOT NULL,
  flat_number text NOT NULL,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  status public.bill_status NOT NULL DEFAULT 'unpaid',
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flat_id, billing_period_start)
);

ALTER TABLE public.maintenance_bills ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS maintenance_bills_updated_at ON public.maintenance_bills;
CREATE TRIGGER maintenance_bills_updated_at BEFORE UPDATE ON public.maintenance_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins manage bills" ON public.maintenance_bills;
CREATE POLICY "Admins manage bills" ON public.maintenance_bills
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view their own bills" ON public.maintenance_bills;
CREATE POLICY "Residents view their own bills" ON public.maintenance_bills
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND society_id = public.get_user_society_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.resident_flats rf
      WHERE (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
        AND rf.wing = maintenance_bills.wing AND rf.flat_number = maintenance_bills.flat_number
    )
  );

-- 6. maintenance_bill_line_items: the charge-head breakdown behind each bill total.
CREATE TABLE IF NOT EXISTS public.maintenance_bill_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.maintenance_bills(id) ON DELETE CASCADE,
  charge_head_id uuid REFERENCES public.maintenance_charge_heads(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_bill_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage bill line items" ON public.maintenance_bill_line_items;
CREATE POLICY "Admins manage bill line items" ON public.maintenance_bill_line_items
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.maintenance_bills b WHERE b.id = maintenance_bill_line_items.bill_id AND b.society_id = public.get_user_society_id(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.maintenance_bills b WHERE b.id = maintenance_bill_line_items.bill_id AND b.society_id = public.get_user_society_id(auth.uid()))
  );

DROP POLICY IF EXISTS "Residents view their bill line items" ON public.maintenance_bill_line_items;
CREATE POLICY "Residents view their bill line items" ON public.maintenance_bill_line_items
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.maintenance_bills b
      JOIN public.resident_flats rf ON rf.wing = b.wing AND rf.flat_number = b.flat_number
      WHERE b.id = maintenance_bill_line_items.bill_id
        AND (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
    )
  );

-- 7. maintenance_payments: offline payment records against a bill. Supports
-- partial payments (multiple rows per bill); amount_paid on the bill is kept
-- in sync via trigger below.
CREATE TABLE IF NOT EXISTS public.maintenance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.maintenance_bills(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method public.payment_method NOT NULL,
  reference_number text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payments" ON public.maintenance_payments;
CREATE POLICY "Admins manage payments" ON public.maintenance_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND society_id = public.get_user_society_id(auth.uid()));

DROP POLICY IF EXISTS "Residents view their own payments" ON public.maintenance_payments;
CREATE POLICY "Residents view their own payments" ON public.maintenance_payments
  FOR SELECT USING (
    public.has_role(auth.uid(), 'resident'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.maintenance_bills b
      JOIN public.resident_flats rf ON rf.wing = b.wing AND rf.flat_number = b.flat_number
      WHERE b.id = maintenance_payments.bill_id
        AND (rf.user_id = auth.uid() OR rf.user_id = public.get_parent_user_id(auth.uid()))
    )
  );

-- 8. Trigger: keep maintenance_bills.amount_paid and .status in sync whenever
-- a payment is inserted, updated, or deleted -- avoids relying on the app to
-- remember to update both tables consistently.
CREATE OR REPLACE FUNCTION public.sync_bill_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_bill_id uuid;
  total_paid numeric;
  bill_total numeric;
  bill_due date;
BEGIN
  target_bill_id := COALESCE(NEW.bill_id, OLD.bill_id);

  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM public.maintenance_payments WHERE bill_id = target_bill_id;
  SELECT total_amount, due_date INTO bill_total, bill_due FROM public.maintenance_bills WHERE id = target_bill_id;

  UPDATE public.maintenance_bills
  SET amount_paid = total_paid,
      status = CASE
        WHEN total_paid >= bill_total THEN 'paid'::public.bill_status
        WHEN total_paid > 0 THEN 'partial'::public.bill_status
        WHEN bill_due < CURRENT_DATE THEN 'overdue'::public.bill_status
        ELSE 'unpaid'::public.bill_status
      END,
      updated_at = now()
  WHERE id = target_bill_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_bill_payment_status ON public.maintenance_payments;
CREATE TRIGGER trg_sync_bill_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_bill_payment_status();
