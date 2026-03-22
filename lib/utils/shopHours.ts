/** Day keys for working hours (ISO weekday: 1=Mon, 7=Sun) */
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  open: string; // "09:00"
  close: string; // "18:00"
}

export type WorkingHoursMap = Partial<Record<DayKey, DayHours | null>>;

const DEFAULT_HOURS: WorkingHoursMap = {
  mon: { open: '09:00', close: '18:00' },
  tue: { open: '09:00', close: '18:00' },
  wed: { open: '09:00', close: '18:00' },
  thu: { open: '09:00', close: '18:00' },
  fri: { open: '09:00', close: '18:00' },
  sat: { open: '09:00', close: '18:00' },
  sun: null
};

/**
 * Working hours for a calendar date (YYYY-MM-DD).
 * Uses UTC noon so weekday is correct regardless of server timezone.
 * If the key exists in `workingHours` and is `null`, the day is closed (not defaulted).
 */
export function getHoursForCalendarDate(
  workingHours: WorkingHoursMap | undefined,
  dateStr: string
): DayHours | null {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d) return null;
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const dayIndex = utcNoon.getUTCDay();
  const key = dayIndex === 0 ? 'sun' : DAY_KEYS[dayIndex - 1];

  if (workingHours != null && Object.prototype.hasOwnProperty.call(workingHours, key)) {
    const h = workingHours[key];
    if (h === undefined) return DEFAULT_HOURS[key] ?? null;
    return h;
  }

  return DEFAULT_HOURS[key] ?? null;
}

/** Get working hours for a JS Date using that date's local calendar day */
export function getHoursForDate(
  workingHours: WorkingHoursMap | undefined,
  date: Date
): DayHours | null {
  const y = date.getFullYear();
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  const dateStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return getHoursForCalendarDate(workingHours, dateStr);
}

/** Default timezone for shop hours validation (API + “any barber” checks). */
export const SHOP_BUSINESS_TIMEZONE = 'Europe/Sofia';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateYYYYMMDDInTimeZone(d: Date, timeZone = SHOP_BUSINESS_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatTimeHHMMInTimeZone(d: Date, timeZone = SHOP_BUSINESS_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '0';
  return `${pad2(parseInt(h, 10))}:${pad2(parseInt(m, 10))}`;
}

function timeStrToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export type ShopSlotValidationCode = 'CLOSED' | 'OUTSIDE_HOURS' | 'LUNCH' | 'SPANS_MIDNIGHT';

/**
 * Validate that [start, end) fits shop open hours and does not overlap lunch (in shop TZ).
 */
export function validateSlotAgainstShop(
  workingHours: WorkingHoursMap | undefined,
  lunchStart: string | undefined,
  lunchEnd: string | undefined,
  start: Date,
  end: Date,
  timeZone = SHOP_BUSINESS_TIMEZONE
): { ok: true } | { ok: false; code: ShopSlotValidationCode } {
  const dateStr = formatDateYYYYMMDDInTimeZone(start, timeZone);
  const endDateStr = formatDateYYYYMMDDInTimeZone(end, timeZone);
  if (dateStr !== endDateStr) {
    return { ok: false, code: 'SPANS_MIDNIGHT' };
  }

  const dayH = getHoursForCalendarDate(workingHours, dateStr);
  if (!dayH) {
    return { ok: false, code: 'CLOSED' };
  }

  const startHm = formatTimeHHMMInTimeZone(start, timeZone);
  const endHm = formatTimeHHMMInTimeZone(end, timeZone);

  const openM = timeStrToMinutes(dayH.open);
  const closeM = timeStrToMinutes(dayH.close);
  const startM = timeStrToMinutes(startHm);
  const endM = timeStrToMinutes(endHm);

  if (startM < openM || endM > closeM) {
    return { ok: false, code: 'OUTSIDE_HOURS' };
  }

  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (durationMinutes < 0) {
    return { ok: false, code: 'OUTSIDE_HOURS' };
  }

  if (overlapsLunch(dateStr, startHm, durationMinutes, lunchStart, lunchEnd)) {
    return { ok: false, code: 'LUNCH' };
  }

  return { ok: true };
}

/** Check if a time falls within lunch break */
export function isDuringLunch(
  dateStr: string,
  timeStr: string,
  lunchStart?: string,
  lunchEnd?: string
): boolean {
  if (!lunchStart || !lunchEnd) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const [lStartH, lStartM] = lunchStart.split(':').map(Number);
  const [lEndH, lEndM] = lunchEnd.split(':').map(Number);
  const minutes = h * 60 + m;
  const lunchStartMinutes = lStartH * 60 + lStartM;
  const lunchEndMinutes = lEndH * 60 + lEndM;
  return minutes >= lunchStartMinutes && minutes < lunchEndMinutes;
}

/** Format working hours for display (e.g. "Mon–Sat: 09:00 – 18:00, Sun: Closed") */
export function formatWorkingHoursForDisplay(workingHours: WorkingHoursMap | undefined): string {
  if (!workingHours) return '';
  const parts: string[] = [];
  const dayNames: Record<DayKey, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun'
  };
  for (const key of DAY_KEYS) {
    const h = workingHours[key];
    if (h) {
      parts.push(`${dayNames[key]}: ${h.open} – ${h.close}`);
    } else {
      parts.push(`${dayNames[key]}: Closed`);
    }
  }
  return parts.join(', ');
}

/** Check if appointment (start + duration) overlaps lunch */
export function overlapsLunch(
  dateStr: string,
  startTimeStr: string,
  durationMinutes: number,
  lunchStart?: string,
  lunchEnd?: string
): boolean {
  if (!lunchStart || !lunchEnd) return false;
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = startMinutes + durationMinutes;
  const [lStartH, lStartM] = lunchStart.split(':').map(Number);
  const [lEndH, lEndM] = lunchEnd.split(':').map(Number);
  const lunchStartMinutes = lStartH * 60 + lStartM;
  const lunchEndMinutes = lEndH * 60 + lEndM;
  return startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes;
}
