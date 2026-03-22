-- Allow BARBER_WORKER users to read/update appointments for any barber in the same shop (single-team salon).

DROP POLICY IF EXISTS "appointments_read_scoped" ON public.appointments;
CREATE POLICY "appointments_read_scoped"
  ON public.appointments FOR SELECT
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR customer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.barbers b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE b.id = appointments.barber_id
        AND (
          b.profile_id = auth.uid()
          OR s.owner_id = auth.uid()
          OR (
            public.current_role() = 'BARBER_WORKER'
            AND EXISTS (
              SELECT 1 FROM public.barbers me
              WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "appointments_update_scoped" ON public.appointments;
CREATE POLICY "appointments_update_scoped"
  ON public.appointments FOR UPDATE
  USING (
    public.current_role() = 'SUPER_ADMIN'
    OR EXISTS (
      SELECT 1
      FROM public.barbers b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE b.id = appointments.barber_id
        AND (
          b.profile_id = auth.uid()
          OR s.owner_id = auth.uid()
          OR (
            public.current_role() = 'BARBER_WORKER'
            AND EXISTS (
              SELECT 1 FROM public.barbers me
              WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
            )
          )
        )
    )
  )
  WITH CHECK (true);

-- Time slots: coworkers in same shop can insert/update/delete each other's slots
DROP POLICY IF EXISTS "time_slots_worker_manage_own" ON public.time_slots;
CREATE POLICY "time_slots_worker_manage_own"
  ON public.time_slots FOR INSERT
  WITH CHECK (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND (
            b.profile_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.barbers me
              WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
            )
          ))
        )
    )
  );

DROP POLICY IF EXISTS "time_slots_worker_update_delete" ON public.time_slots;
CREATE POLICY "time_slots_worker_update_delete"
  ON public.time_slots FOR UPDATE
  USING (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND (
            b.profile_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.barbers me
              WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
            )
          ))
        )
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "time_slots_worker_delete" ON public.time_slots;
CREATE POLICY "time_slots_worker_delete"
  ON public.time_slots FOR DELETE
  USING (
    public.current_role() IN ('BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = time_slots.barber_id
        AND (
          public.current_role() = 'SUPER_ADMIN'
          OR (public.current_role() = 'BARBER_OWNER' AND EXISTS (
            SELECT 1 FROM public.shops s WHERE s.id = b.shop_id AND s.owner_id = auth.uid()
          ))
          OR (public.current_role() = 'BARBER_WORKER' AND (
            b.profile_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.barbers me
              WHERE me.profile_id = auth.uid() AND me.shop_id = b.shop_id
            )
          ))
        )
    )
  );
