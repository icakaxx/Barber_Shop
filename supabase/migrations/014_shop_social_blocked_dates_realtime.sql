-- TikTok URL, vacation/blocked date ranges, Realtime on appointments

ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tiktok_url text;

CREATE TABLE IF NOT EXISTS public.shop_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shop_blocked_dates_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS shop_blocked_dates_shop_id_idx ON public.shop_blocked_dates(shop_id);
CREATE INDEX IF NOT EXISTS shop_blocked_dates_dates_idx ON public.shop_blocked_dates(shop_id, start_date, end_date);

ALTER TABLE public.shop_blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_blocked_dates_public_read" ON public.shop_blocked_dates;
CREATE POLICY "shop_blocked_dates_public_read"
  ON public.shop_blocked_dates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "shop_blocked_dates_owner_manage" ON public.shop_blocked_dates;
CREATE POLICY "shop_blocked_dates_owner_manage"
  ON public.shop_blocked_dates FOR ALL
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_blocked_dates.shop_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_blocked_dates.shop_id AND s.owner_id = auth.uid()
    )
  );

-- Realtime for owner new-booking alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;
