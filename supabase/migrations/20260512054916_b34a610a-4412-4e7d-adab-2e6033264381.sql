
CREATE OR REPLACE FUNCTION public.sync_vehicles_owner_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name AND NEW.display_name IS NOT NULL AND length(trim(NEW.display_name)) > 0 THEN
    -- Update vehicles for every flat mapped to this resident
    UPDATE public.vehicles v
    SET owner_name = NEW.display_name, updated_at = now()
    FROM public.resident_flats rf
    WHERE rf.user_id = NEW.user_id
      AND rf.wing = v.wing
      AND rf.flat_number = v.flat_number;

    -- Fallback: also cover the profile's own wing/flat if not in resident_flats yet
    IF NEW.wing IS NOT NULL AND NEW.flat_number IS NOT NULL THEN
      UPDATE public.vehicles
      SET owner_name = NEW.display_name, updated_at = now()
      WHERE wing = NEW.wing AND flat_number = NEW.flat_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_vehicles_owner_name ON public.profiles;
CREATE TRIGGER profiles_sync_vehicles_owner_name
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_vehicles_owner_name();
