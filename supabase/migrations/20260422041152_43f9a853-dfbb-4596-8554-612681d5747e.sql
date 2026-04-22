-- Function to check if an email is already registered for a given role
CREATE OR REPLACE FUNCTION public.email_has_role(_email text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE lower(u.email) = lower(_email)
      AND ur.role = _role
  )
$$;

-- Trigger function to block duplicate registration requests
CREATE OR REPLACE FUNCTION public.prevent_duplicate_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block if user already has this role
  IF public.email_has_role(NEW.email, NEW.requested_role::app_role) THEN
    RAISE EXCEPTION 'This email is already registered as a %', NEW.requested_role
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Block if there's an existing pending request for this email + role
  IF EXISTS (
    SELECT 1 FROM public.registration_requests
    WHERE lower(email) = lower(NEW.email)
      AND requested_role = NEW.requested_role
      AND status = 'pending'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'A pending registration request already exists for this email and role'
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_duplicate_registration ON public.registration_requests;
CREATE TRIGGER check_duplicate_registration
BEFORE INSERT ON public.registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_registration();