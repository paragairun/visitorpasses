-- Normalize existing vehicle_number values (uppercase, no spaces/symbols) to safely add unique index
-- First, deduplicate any existing duplicates by keeping the earliest record
WITH normalized AS (
  SELECT id, regexp_replace(upper(vehicle_number), '[^A-Z0-9]', '', 'g') AS norm, created_at
  FROM public.vehicles
),
ranked AS (
  SELECT id, norm, row_number() OVER (PARTITION BY norm ORDER BY created_at ASC) AS rn
  FROM normalized
)
DELETE FROM public.vehicles v
USING ranked r
WHERE v.id = r.id AND r.rn > 1;

-- Create a unique index on the normalized vehicle_number
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vehicle_number_normalized_unique
ON public.vehicles ((regexp_replace(upper(vehicle_number), '[^A-Z0-9]', '', 'g')));