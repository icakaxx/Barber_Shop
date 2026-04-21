-- Service prices: INTEGER whole leva broke EUR↔BGN round-trip (e.g. 10 € → 20 лв → 10,23 €).
-- Store BGN with stotinki so the official fixed rate converts cleanly.

ALTER TABLE public.services
  ALTER COLUMN price_bgn TYPE NUMERIC(10, 2)
  USING (ROUND(price_bgn::NUMERIC, 2));
