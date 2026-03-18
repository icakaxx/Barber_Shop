-- Allow public read access to barbershop_info bucket so logo/hero images display on the site
-- Run this in Supabase SQL Editor if images in the bucket are not showing

-- 1. Make the bucket public (required for getPublicUrl to work without auth)
UPDATE storage.buckets
SET public = true
WHERE id = 'barbershop_info';

-- 2. Policy: Allow anyone to view (SELECT) files in barbershop_info bucket
DROP POLICY IF EXISTS "Public read for barbershop_info" ON storage.objects;
CREATE POLICY "Public read for barbershop_info"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'barbershop_info');
