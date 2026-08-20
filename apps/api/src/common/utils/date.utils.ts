import { DateTime } from 'luxon';

export function convertToUTC(value: string, timeZone: string): DateTime {
  const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const parsed = hasExplicitOffset
    ? DateTime.fromISO(value, { setZone: true })
    : DateTime.fromISO(value, { zone: timeZone });

  return parsed.toUTC();
}

export function isValidIsoWithOffset(value: string) {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  if (!regex.test(value)) return false;

  return !isNaN(Date.parse(value)); // Ensures it's a real calendar date
}

export function combineLocalDayAndTime(day: DateTime, time: string): DateTime {
  const [hours, minutes, seconds] = time.split(':').map(Number);

  return day.set({
    hour: hours,
    minute: minutes,
    second: seconds || 0,
    millisecond: 0,
  });
}

export function rangesOverlap(
  range1: { start: string; end: string },
  range2: { start: string; end: string },
): boolean {
  const start1 = DateTime.fromISO(range1.start, { zone: 'utc' });
  const end1 = DateTime.fromISO(range1.end, { zone: 'utc' });
  const start2 = DateTime.fromISO(range2.start, { zone: 'utc' });
  const end2 = DateTime.fromISO(range2.end, { zone: 'utc' });

  return start1 < end2 && start2 < end1;
}

export function normalizeInstantToUtcIso(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  const dateTime =
    typeof value === 'string'
      ? DateTime.fromISO(value, { setZone: true })
      : DateTime.fromJSDate(value, { zone: 'utc' });

  if (!dateTime.isValid) {
    return null;
  }

  return dateTime.toUTC().toISO();
}
