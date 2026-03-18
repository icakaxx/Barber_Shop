-- Add branding columns to shops table
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN public.shops.logo_url IS 'URL to shop logo image for header';
COMMENT ON COLUMN public.shops.hero_image_url IS 'URL to hero section background image';
