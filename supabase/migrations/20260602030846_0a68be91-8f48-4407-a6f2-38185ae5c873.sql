
-- 1) Fix is_primary_resident: default to false when no profile exists
CREATE OR REPLACE FUNCTION public.is_primary_resident(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT parent_user_id IS NULL FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$function$;

-- 2) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;

-- 3) Prevent plaintext password column from being read via the Data API.
-- service_role (used by the approve-registration edge function) retains access.
REVOKE SELECT (password) ON public.registration_requests FROM anon, authenticated;
