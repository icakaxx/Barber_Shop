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

/** Get working hours for a day (0=Sun, 1=Mon, ... 6=Sat) */
export function getHoursForDate(
  workingHours: WorkingHoursMap | undefined,
  date: Date
): DayHours | null {
  const dayIndex = date.getDay(); // 0=Sun, 1=Mon, ...
  const key = dayIndex === 0 ? 'sun' : DAY_KEYS[dayIndex - 1];
  const hours = workingHours?.[key] ?? DEFAULT_HOURS[key];
  return hours ?? null;
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
