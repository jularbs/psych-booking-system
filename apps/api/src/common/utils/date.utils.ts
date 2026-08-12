import { DateTime } from 'luxon';

export function convertToUTC(value: string, timeZone: string): DateTime {
  const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const parsed = hasExplicitOffset
    ? DateTime.fromISO(value, { setZone: true })
    : DateTime.fromISO(value, { zone: timeZone });

  return parsed.toUTC();
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
