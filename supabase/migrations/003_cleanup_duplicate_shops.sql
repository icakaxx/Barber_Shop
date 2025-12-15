-- Cleanup duplicate shops
-- This script removes duplicate shops and consolidates data

DO $$
DECLARE
  main_shop_id UUID;
  duplicate_shop_ids UUID[];
BEGIN
  -- Find the first "Main Shop" or "Main Barber Shop" (keep the oldest one)
  SELECT id INTO main_shop_id
  FROM public.shops
  WHERE (name ILIKE '%Main%' OR name ILIKE '%main%')
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- If we found a main shop, get all other duplicate shops
  IF main_shop_id IS NOT NULL THEN
    -- Get IDs of duplicate shops (same name pattern, different ID)
    SELECT ARRAY_AGG(id) INTO duplicate_shop_ids
    FROM public.shops
    WHERE (name ILIKE '%Main%' OR name ILIKE '%main%')
      AND is_active = true
      AND id != main_shop_id;

    -- If we have duplicates, migrate their data
    IF duplicate_shop_ids IS NOT NULL AND array_length(duplicate_shop_ids, 1) > 0 THEN
      -- Update barbers to point to the main shop
      UPDATE public.barbers
      SET shop_id = main_shop_id
      WHERE shop_id = ANY(duplicate_shop_ids);

      -- Update appointments to point to the main shop
      UPDATE public.appointments
      SET shop_id = main_shop_id
      WHERE shop_id = ANY(duplicate_shop_ids);

      -- Update services to point to the main shop
      UPDATE public.services
      SET shop_id = main_shop_id
      WHERE shop_id = ANY(duplicate_shop_ids);

      -- Delete duplicate shops
      DELETE FROM public.shops
      WHERE id = ANY(duplicate_shop_ids);

      RAISE NOTICE 'Consolidated % duplicate shops into shop ID: %', array_length(duplicate_shop_ids, 1), main_shop_id;
    ELSE
      RAISE NOTICE 'No duplicate shops found';
    END IF;
  ELSE
    RAISE NOTICE 'No main shop found to consolidate into';
  END IF;
END $$;

-- Also ensure we have at least one shop (create if none exists)
DO $$
DECLARE
  shop_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shop_count FROM public.shops WHERE is_active = true;
  
  IF shop_count = 0 THEN
    INSERT INTO public.shops (name, city, address, is_active)
    VALUES ('Main Barber Shop', 'Sofia', '123 Main Street', true);
    RAISE NOTICE 'Created default shop as none existed';
  END IF;
END $$;

