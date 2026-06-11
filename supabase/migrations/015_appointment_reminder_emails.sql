-- Track appointment reminder emails (1 day and 2 hours before start)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_1day_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reminder_2hours_sent_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_1day
  ON public.appointments (start_time)
  WHERE reminder_1day_sent_at IS NULL
    AND customer_email IS NOT NULL
    AND status IN ('PENDING', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_2hours
  ON public.appointments (start_time)
  WHERE reminder_2hours_sent_at IS NULL
    AND customer_email IS NOT NULL
    AND status IN ('PENDING', 'CONFIRMED');
