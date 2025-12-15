-- Comprehensive data restoration script
-- Run this in your Supabase SQL Editor to restore all default data

DO $$
DECLARE
  default_shop_id UUID;
  barber_profile_id UUID;
  barber_auth_id UUID;
BEGIN
  -- ============================================
  -- 1. CREATE OR GET DEFAULT SHOP
  -- ============================================
  SELECT id INTO default_shop_id
  FROM public.shops
  WHERE is_active = true
  LIMIT 1;

  IF default_shop_id IS NULL THEN
    INSERT INTO public.shops (name, city, address, is_active)
    VALUES ('Main Barber Shop', 'Sofia', '123 Main Street', true)
    RETURNING id INTO default_shop_id;
    RAISE NOTICE 'Created default shop: %', default_shop_id;
  ELSE
    RAISE NOTICE 'Using existing shop: %', default_shop_id;
  END IF;

  -- ============================================
  -- 2. INSERT DEFAULT SERVICES
  -- ============================================
  INSERT INTO public.services (shop_id, name, duration_min, price_bgn, is_active, sort_order)
  VALUES
    (default_shop_id, 'Haircut', 30, 25, true, 1),
    (default_shop_id, 'Beard shaping / Beard trim', 20, 15, true, 2),
    (default_shop_id, 'Eyebrow grooming / Eyebrow shaping', 5, 10, true, 3),
    (default_shop_id, 'Ear cleaning', 5, 8, true, 4),
    (default_shop_id, 'Nose hair removal / Nose grooming', 5, 8, true, 5)
  ON CONFLICT (shop_id, name) DO NOTHING;

  RAISE NOTICE 'Services inserted/verified for shop: %', default_shop_id;

  -- ============================================
  -- 3. CREATE SAMPLE BARBERS (if they don't exist)
  -- ============================================
  -- Note: This creates barbers with auth users
  -- You may need to adjust email addresses if they already exist

  -- Barber 1: Alex Master
  SELECT id INTO barber_profile_id
  FROM public.profiles
  WHERE full_name = 'Alexander Petrov'
  LIMIT 1;

  IF barber_profile_id IS NULL THEN
    -- Create auth user first (you'll need to do this manually or use Supabase Admin API)
    -- For now, we'll create a profile that references a placeholder
    -- In production, you'd create the auth user first, then the profile
    
    RAISE NOTICE 'Barber profiles need to be created via the application or Supabase Auth Admin API';
    RAISE NOTICE 'You can create barbers through the Super Admin panel at /admin';
  END IF;

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to check your data:

-- Check shops
SELECT id, name, city, is_active, created_at 
FROM public.shops 
ORDER BY created_at;

-- Check services
SELECT s.id, s.name, s.duration_min, s.price_bgn, sh.name as shop_name
FROM public.services s
JOIN public.shops sh ON sh.id = s.shop_id
WHERE s.is_active = true
ORDER BY s.sort_order;

-- Check barbers
SELECT b.id, b.display_name, b.is_active, sh.name as shop_name, p.full_name, p.role
FROM public.barbers b
JOIN public.shops sh ON sh.id = b.shop_id
LEFT JOIN public.profiles p ON p.id = b.profile_id
ORDER BY b.created_at;

-- Check appointments
SELECT COUNT(*) as total_appointments,
       COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
       COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
       COUNT(*) FILTER (WHERE status = 'DONE') as done,
       COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
FROM public.appointments;

