-- Fix handle_new_user trigger: use empty search_path (Supabase best practice)
-- and add exception handling so trigger failure doesn't block user creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    'USER'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail user creation - app will create/update profile (e.g. barber flow)
  RAISE WARNING 'handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;
