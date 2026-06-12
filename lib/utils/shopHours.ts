import { BOOKING_SLOT_MINUTES } from '@/lib/utils/bookingSlots';

/** Day keys for working hours (ISO weekday: 1=Mon, 7=Sun) */
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  open: string; // "09:00"
  close: string; // "18:00"
}

export type WorkingHoursMap = Partial<Record<DayKey, DayHours | null>>;

export interface DayLunch {
  start: string; // "13:00"
  end: string; // "14:00"
}

export type LunchHoursMap = Partial<Record<DayKey, DayLunch | null>>;

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

/**
 * Lunch break for a calendar date (YYYY-MM-DD).
 * Per-day `lunchHours` wins; falls back to shop-wide lunch_start/lunch_end.
 */
export function getLunchForCalendarDate(
  lunchHours: LunchHoursMap | undefined,
  dateStr: string,
  globalLunchStart?: string,
  globalLunchEnd?: string
): DayLunch | null {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d) return null;
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const dayIndex = utcNoon.getUTCDay();
  const key = dayIndex === 0 ? 'sun' : DAY_KEYS[dayIndex - 1];

  if (lunchHours != null && Object.prototype.hasOwnProperty.call(lunchHours, key)) {
    const h = lunchHours[key];
    if (h === undefined) {
      // fall through to global
    } else if (h === null) {
      return null;
    } else if (h.start && h.end) {
      return h;
    } else {
      return null;
    }
  }

  if (globalLunchStart && globalLunchEnd) {
    return { start: globalLunchStart, end: globalLunchEnd };
  }

  return null;
}

/** Default timezone for shop hours validation (API + “any barber” checks). */
export const SHOP_BUSINESS_TIMEZONE = 'Europe/Sofia';

export interface BlockedDateRange {
  id?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label?: string | null;
}

/** True if calendar date falls within any blocked range (inclusive). */
export function isDateBlocked(dateStr: string, ranges: BlockedDateRange[] | undefined): boolean {
  if (!ranges?.length) return false;
  return ranges.some((r) => dateStr >= r.startDate && dateStr <= r.endDate);
}

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

/** Add days to a YYYY-MM-DD shop calendar label. */
export function addCalendarDays(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(y, mo - 1, d + days, 12, 0, 0));
  return `${utcNoon.getUTCFullYear()}-${pad2(utcNoon.getUTCMonth() + 1)}-${pad2(utcNoon.getUTCDate())}`;
}

/** UTC query bounds for one shop-local calendar day (start inclusive, end exclusive). */
export function getShopLocalDayQueryBounds(
  dateStr: string,
  timeZone = SHOP_BUSINESS_TIMEZONE
): { startIso: string; endExclusiveIso: string } {
  const startUtc = shopLocalDateTimeToUtc(dateStr, '00:00', timeZone);
  const endExclusiveUtc = shopLocalDateTimeToUtc(addCalendarDays(dateStr, 1), '00:00', timeZone);
  return {
    startIso: startUtc.toISOString(),
    endExclusiveIso: endExclusiveUtc.toISOString(),
  };
}

/** True when a slot ends on or before shop close on the given calendar date. */
export function slotEndsBeforeShopClose(
  dateStr: string,
  slotEndUtc: Date,
  closeTime: string,
  timeZone = SHOP_BUSINESS_TIMEZONE
): boolean {
  const closeUtc = shopLocalDateTimeToUtc(dateStr, closeTime, timeZone);
  return slotEndUtc.getTime() <= closeUtc.getTime();
}

/** Today's date as YYYY-MM-DD in shop timezone. */
export function getShopTodayYMD(timeZone = SHOP_BUSINESS_TIMEZONE): string {
  return formatDateYYYYMMDDInTimeZone(new Date(), timeZone);
}

const BG_WEEKDAYS_SHORT = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'] as const;
const BG_WEEKDAYS_LONG = [
  'неделя',
  'понеделник',
  'вторник',
  'сряда',
  'четвъртък',
  'петък',
  'събота',
] as const;
const BG_MONTHS_SHORT = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'] as const;
const BG_MONTHS_LONG = [
  'януари',
  'февруари',
  'март',
  'април',
  'май',
  'юни',
  'юли',
  'август',
  'септември',
  'октомври',
  'ноември',
  'декември',
] as const;

function weekdayIndexForCalendarDate(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).getUTCDay();
}

/** Weekday label for a shop calendar date (YYYY-MM-DD), not browser-local. */
export function formatShopWeekdayLabel(
  dateStr: string,
  locale: string,
  style: 'short' | 'long' = 'short',
  timeZone = SHOP_BUSINESS_TIMEZONE
): string {
  if (locale === 'bg') {
    const idx = weekdayIndexForCalendarDate(dateStr);
    return style === 'short' ? BG_WEEKDAYS_SHORT[idx] : BG_WEEKDAYS_LONG[idx];
  }
  const [y, mo, d] = dateStr.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return utcNoon.toLocaleDateString('en-GB', {
    weekday: style === 'short' ? 'short' : 'long',
    timeZone,
  });
}

/** Display label for a shop calendar date (YYYY-MM-DD), not browser-local. */
export function formatShopCalendarDateLabel(
  dateStr: string,
  locale: string,
  style: 'short' | 'long' = 'long',
  timeZone = SHOP_BUSINESS_TIMEZONE
): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (locale === 'bg') {
    const idx = weekdayIndexForCalendarDate(dateStr);
    if (style === 'short') {
      return `${BG_WEEKDAYS_SHORT[idx]}, ${d} ${BG_MONTHS_SHORT[mo - 1]}`;
    }
    return `${BG_WEEKDAYS_LONG[idx]}, ${d} ${BG_MONTHS_LONG[mo - 1]}`;
  }
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return utcNoon.toLocaleDateString('en-GB', {
    weekday: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    year: style === 'long' ? 'numeric' : undefined,
    timeZone,
  });
}

/** datetime-local input value (YYYY-MM-DDTHH:mm) in shop timezone. */
export function formatDateTimeLocalInShopTz(d: Date, timeZone = SHOP_BUSINESS_TIMEZONE): string {
  return `${formatDateYYYYMMDDInTimeZone(d, timeZone)}T${formatTimeHHMMInTimeZone(d, timeZone)}`;
}

/** Iterate booking slots in shop wall-clock time. */
export function eachShopLocalBookingSlot(
  dateStr: string,
  openStr: string,
  closeStr: string,
  stepMinutes: number,
  timeZone = SHOP_BUSINESS_TIMEZONE
): Array<{ timeStr: string; slotStartUtc: Date }> {
  const slots: Array<{ timeStr: string; slotStartUtc: Date }> = [];
  const [openH, openM] = openStr.split(':').map(Number);
  const [closeH, closeM] = closeStr.split(':').map(Number);
  const closeTotalMin = closeH * 60 + closeM;
  let h = openH;
  let m = openM;
  while (h * 60 + m < closeTotalMin) {
    const timeStr = `${pad2(h)}:${pad2(m)}`;
    slots.push({ timeStr, slotStartUtc: shopLocalDateTimeToUtc(dateStr, timeStr, timeZone) });
    m += stepMinutes;
    h += Math.floor(m / 60);
    m %= 60;
  }
  return slots;
}

export function slotOverlapsBusy(
  slotStartUtc: Date,
  slotEndUtc: Date,
  busyRanges: { start: Date; end: Date }[]
): boolean {
  return busyRanges.some((apt) => slotStartUtc < apt.end && slotEndUtc > apt.start);
}

export type ShopSlotDisplayStatus = 'available' | 'taken' | 'closed';

export interface ShopCalendarSlotOptions {
  lunchHours?: LunchHoursMap;
  lunchStart?: string;
  lunchEnd?: string;
  blockedRanges?: BlockedDateRange[];
  slotMinutes?: number;
}

/** All grid times for a shop day (open→close), empty when closed/blocked. */
export function getShopCalendarTimeSlots(
  dateStr: string,
  workingHours: WorkingHoursMap | undefined,
  options?: ShopCalendarSlotOptions
): string[] {
  if (isDateBlocked(dateStr, options?.blockedRanges)) return [];
  const dayHours = getHoursForCalendarDate(workingHours, dateStr);
  if (!dayHours) return [];
  return eachShopLocalBookingSlot(
    dateStr,
    dayHours.open,
    dayHours.close,
    options?.slotMinutes ?? BOOKING_SLOT_MINUTES
  ).map((s) => s.timeStr);
}

/** Classify a calendar slot using shop hours, lunch, and busy ranges. */
export function getShopCalendarSlotStatus(
  dateStr: string,
  timeStr: string,
  workingHours: WorkingHoursMap | undefined,
  busyRanges: { start: Date; end: Date }[],
  options?: ShopCalendarSlotOptions
): ShopSlotDisplayStatus {
  if (isDateBlocked(dateStr, options?.blockedRanges)) return 'closed';
  const dayHours = getHoursForCalendarDate(workingHours, dateStr);
  if (!dayHours) return 'closed';
  if (isDuringLunchForDate(dateStr, timeStr, options?.lunchHours, options?.lunchStart, options?.lunchEnd)) {
    return 'closed';
  }
  const slotMinutes = options?.slotMinutes ?? BOOKING_SLOT_MINUTES;
  const slotStart = shopLocalDateTimeToUtc(dateStr, timeStr);
  const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
  if (slotOverlapsBusy(slotStart, slotEnd, busyRanges)) return 'taken';
  return 'available';
}

/** Format an appointment instant as shop-local time (HH:mm). */
export function formatAppointmentTimeInShopTz(value: string, timeZone = SHOP_BUSINESS_TIMEZONE): string {
  return formatTimeHHMMInTimeZone(parseAppointmentInstant(value), timeZone);
}

/** Parse DB/API timestamp strings as UTC instants (Postgres timestamptz). */
export function parseAppointmentInstant(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  return new Date(`${normalized}Z`);
}

/**
 * Convert shop-local calendar date + HH:mm wall clock to a UTC Date instant.
 * Always uses Europe/Sofia (or given TZ), not the browser/server local zone.
 */
export function shopLocalDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone = SHOP_BUSINESS_TIMEZONE
): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const targetTime = `${pad2(h)}:${pad2(mi)}`;

  let utcMs = Date.UTC(y, mo - 1, d, h, mi, 0);
  for (let i = 0; i < 6; i++) {
    const dt = new Date(utcMs);
    const gotDate = formatDateYYYYMMDDInTimeZone(dt, timeZone);
    const gotTime = formatTimeHHMMInTimeZone(dt, timeZone);
    if (gotDate === dateStr && gotTime === targetTime) {
      return dt;
    }
    const [gh, gm] = gotTime.split(':').map(Number);
    let deltaMin = h * 60 + mi - (gh * 60 + gm);
    if (gotDate < dateStr) deltaMin += 24 * 60;
    else if (gotDate > dateStr) deltaMin -= 24 * 60;
    utcMs += deltaMin * 60_000;
  }
  return new Date(utcMs);
}

/** Human-readable appointment window for emails (always shop timezone). */
export function formatAppointmentWindowForEmail(
  start: string,
  end: string,
  timeZone = SHOP_BUSINESS_TIMEZONE
): string {
  const startDate = parseAppointmentInstant(start);
  const endDate = parseAppointmentInstant(end);

  const datePart = startDate.toLocaleDateString('bg-BG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });

  const startTimePart = formatTimeHHMMInTimeZone(startDate, timeZone);
  const endTimePart = formatTimeHHMMInTimeZone(endDate, timeZone);

  return `${datePart}, ${startTimePart} - ${endTimePart}`;
}

function timeStrToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export type ShopSlotValidationCode =
  | 'CLOSED'
  | 'OUTSIDE_HOURS'
  | 'LUNCH'
  | 'SPANS_MIDNIGHT'
  | 'BLOCKED'
  | 'INVALID_SLOT_INTERVAL';

/**
 * Validate that [start, end) fits shop open hours and does not overlap lunch (in shop TZ).
 */
export function validateSlotAgainstShop(
  workingHours: WorkingHoursMap | undefined,
  lunchStart: string | undefined,
  lunchEnd: string | undefined,
  start: Date,
  end: Date,
  timeZone = SHOP_BUSINESS_TIMEZONE,
  blockedRanges?: BlockedDateRange[],
  lunchHours?: LunchHoursMap
): { ok: true } | { ok: false; code: ShopSlotValidationCode } {
  const dateStr = formatDateYYYYMMDDInTimeZone(start, timeZone);
  const endDateStr = formatDateYYYYMMDDInTimeZone(end, timeZone);
  if (dateStr !== endDateStr) {
    return { ok: false, code: 'SPANS_MIDNIGHT' };
  }

  if (isDateBlocked(dateStr, blockedRanges)) {
    return { ok: false, code: 'BLOCKED' };
  }

  const dayH = getHoursForCalendarDate(workingHours, dateStr);
  if (!dayH) {
    return { ok: false, code: 'CLOSED' };
  }

  const startHm = formatTimeHHMMInTimeZone(start, timeZone);
  const endHm = formatTimeHHMMInTimeZone(end, timeZone);

  const [, startMinStr] = startHm.split(':');
  const startMin = parseInt(startMinStr ?? '0', 10);
  if (startMin % BOOKING_SLOT_MINUTES !== 0) {
    return { ok: false, code: 'INVALID_SLOT_INTERVAL' };
  }

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

  const lunch = getLunchForCalendarDate(lunchHours, dateStr, lunchStart, lunchEnd);
  if (overlapsLunch(dateStr, startHm, durationMinutes, lunch?.start, lunch?.end)) {
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

/** Lunch for a date, then check if a slot start falls inside it */
export function isDuringLunchForDate(
  dateStr: string,
  timeStr: string,
  lunchHours?: LunchHoursMap,
  globalLunchStart?: string,
  globalLunchEnd?: string
): boolean {
  const lunch = getLunchForCalendarDate(lunchHours, dateStr, globalLunchStart, globalLunchEnd);
  return isDuringLunch(dateStr, timeStr, lunch?.start, lunch?.end);
}

/** Lunch for a date, then check if appointment overlaps it */
export function overlapsLunchForDate(
  dateStr: string,
  startTimeStr: string,
  durationMinutes: number,
  lunchHours?: LunchHoursMap,
  globalLunchStart?: string,
  globalLunchEnd?: string
): boolean {
  const lunch = getLunchForCalendarDate(lunchHours, dateStr, globalLunchStart, globalLunchEnd);
  return overlapsLunch(dateStr, startTimeStr, durationMinutes, lunch?.start, lunch?.end);
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
