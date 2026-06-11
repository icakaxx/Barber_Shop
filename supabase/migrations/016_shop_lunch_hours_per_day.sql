-- Per-day lunch breaks: { "mon": { "start": "13:00", "end": "14:00" }, "sat": null, ... }
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS lunch_hours JSONB;

COMMENT ON COLUMN public.shops.lunch_hours IS 'Per-day lunch break: { "mon": { "start": "13:00", "end": "14:00" }, "sun": null }';

-- Backfill from shop-wide lunch_start / lunch_end for open weekdays
UPDATE public.shops
SET lunch_hours = (
  SELECT jsonb_object_agg(
    d,
    CASE
      WHEN lunch_start IS NOT NULL
        AND lunch_end IS NOT NULL
        AND working_hours ? d
        AND jsonb_typeof(working_hours -> d) = 'object'
      THEN jsonb_build_object('start', lunch_start, 'end', lunch_end)
      ELSE 'null'::jsonb
    END
  )
  FROM unnest(ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) AS d
)
WHERE lunch_start IS NOT NULL
  AND lunch_end IS NOT NULL
  AND lunch_hours IS NULL;
