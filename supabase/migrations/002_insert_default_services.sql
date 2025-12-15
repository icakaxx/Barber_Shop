-- Insert default services for the main shop
-- Run this after creating your first shop

-- First, get or create a default shop
-- If you already have a shop, replace the shop_id below with your actual shop ID

DO $$
DECLARE
  default_shop_id UUID;
BEGIN
  -- Get the first active shop, or create one if none exists
  SELECT id INTO default_shop_id
  FROM public.shops
  WHERE is_active = true
  LIMIT 1;

  -- If no shop exists, create one
  IF default_shop_id IS NULL THEN
    INSERT INTO public.shops (name, city, address, is_active)
    VALUES ('Main Barber Shop', 'Sofia', '123 Main Street', true)
    RETURNING id INTO default_shop_id;
  END IF;

  -- Insert services only if they don't already exist
  INSERT INTO public.services (shop_id, name, duration_min, price_bgn, is_active, sort_order)
  VALUES
    (default_shop_id, 'Haircut', 30, 25, true, 1),
    (default_shop_id, 'Beard shaping / Beard trim', 20, 15, true, 2),
    (default_shop_id, 'Eyebrow grooming / Eyebrow shaping', 5, 10, true, 3),
    (default_shop_id, 'Ear cleaning', 5, 8, true, 4),
    (default_shop_id, 'Nose hair removal / Nose grooming', 5, 8, true, 5)
  ON CONFLICT (shop_id, name) DO NOTHING;

  RAISE NOTICE 'Services inserted for shop: %', default_shop_id;
END $$;

