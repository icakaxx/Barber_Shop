/**
 * Extract numeric price value from formatted price string
 * Handles formats like "25 лв", "25.50 лв", "€25.50", etc.
 */
export function extractPrice(priceString: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = priceString.replace(/[^\d.,]/g, '');
  // Replace comma with dot if present
  const normalized = cleaned.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
}

/**
 * Extract numeric duration from duration string
 * Handles formats like "30 min", "45 мин", etc.
 */
export function extractDuration(durationString: string): number {
  const minutes = parseInt(durationString.replace(/\D/g, '')) || 0;
  return minutes;
}
