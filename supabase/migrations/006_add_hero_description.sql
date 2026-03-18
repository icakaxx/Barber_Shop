-- Add hero description to shops table
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS hero_description TEXT;

COMMENT ON COLUMN public.shops.hero_description IS 'Custom description shown in hero section (e.g. Premium cuts & classic style)';
