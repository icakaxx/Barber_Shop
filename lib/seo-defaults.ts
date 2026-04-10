/**
 * Shared SEO defaults (Bulgarian primary for OG/social).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://example.com) for correct canonicals and absolute OG URLs.
 */
export function getMetadataBase(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const normalized = fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
    return new URL(normalized);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}/`);
  }
  return new URL("http://localhost:3000/");
}

export const metadataBase = getMetadataBase();

/** Same asset as LoadingScreen default — do not change path without updating OG preview intentionally */
export const OG_IMAGE_PATH =
  "/images/1773509226948-019ced62-b0c9-769a-b196-d3b4059ea87b-removebg-preview.png";

export const SEO_TITLE_BG =
  "Клуб мъжки свят | Премиум подстригване и брада в Ловеч";

export const SEO_TITLE_EN =
  "Men’s World Club | Premium Haircuts & Beard Trims in Lovech";

export const SEO_DESCRIPTION_BG =
  "Клуб мъжки свят е бръснарски салон в Ловеч, предлагащ мъжко подстригване, оформяне на брада и удобна онлайн резервация.";

export const SEO_DESCRIPTION_EN =
  "Men’s World Club is a barber shop in Lovech offering men’s haircuts, beard trims, and convenient online booking.";
