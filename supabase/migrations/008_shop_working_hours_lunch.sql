-- Add structured working hours and lunch break to shops
-- working_hours: JSONB per-day { "mon": { "open": "09:00", "close": "18:00" }, "tue": {...}, ... } or null = closed
-- lunch_start, lunch_end: shop-wide lunch break (no appointments during this time)

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
    "mon": {"open": "09:00", "close": "18:00"},
    "tue": {"open": "09:00", "close": "18:00"},
    "wed": {"open": "09:00", "close": "18:00"},
    "thu": {"open": "09:00", "close": "18:00"},
    "fri": {"open": "09:00", "close": "18:00"},
    "sat": {"open": "09:00", "close": "18:00"},
    "sun": null
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS lunch_start TEXT,
  ADD COLUMN IF NOT EXISTS lunch_end TEXT;

COMMENT ON COLUMN public.shops.working_hours IS 'Per-day open/close times: { "mon": { "open": "09:00", "close": "18:00" }, "sun": null }';
COMMENT ON COLUMN public.shops.lunch_start IS 'Shop lunch break start (HH:mm), e.g. 13:00';
COMMENT ON COLUMN public.shops.lunch_end IS 'Shop lunch break end (HH:mm), e.g. 14:00';
