import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { TimeRange, GeneratedAvailabilitySlot } from './availability-slot.types';
import { QueryAvailabilitySlotsDto } from './dto/query-availability-slots.dto';
import { DateTime } from 'luxon';
import { DEFAULT_SCHEDULING_TIMEZONE } from './availability.constants';
@Injectable()
export class AvailabilitySlotGenerationService {
  constructor(
    private readonly availabilityRulesService: AvailabilityRulesService,
    private readonly googleCalendarAvailabilityService: GoogleCalendarAvailabilityService,
  ) {}

  async querySlots(
    params: QueryAvailabilitySlotsDto & { user_id: string },
  ): Promise<{ slots: GeneratedAvailabilitySlot[]; time_zone: string }> {
    const timeZone = params.time_zone ?? DEFAULT_SCHEDULING_TIMEZONE;
    const windowStartUtc = DateTime.fromISO(params.time_min, { zone: 'utc' });
    const windowEndUtc = DateTime.fromISO(params.time_max, { zone: 'utc' });

    if (!windowStartUtc.isValid || !windowEndUtc.isValid) {
      throw new BadRequestException('Invalid time range');
    }

    if (windowStartUtc >= windowEndUtc) {
      throw new BadRequestException('timeMin must be before timeMax');
    }

    const rules = await this.availabilityRulesService.listActiveRulesForUser(params.user_id);

    const availabilityWindows = this.buildAvailabilityWindows(
      rules,
      windowStartUtc,
      windowEndUtc,
      timeZone,
    );
    const blackoutWindows = this.buildBlackoutWindows(rules, windowStartUtc, windowEndUtc);

    const busyResponse = await this.googleCalendarAvailabilityService.queryMyAvailability({
      user_id: params.user_id,
      time_min: params.time_min,
      time_max: params.time_max,
      time_zone: timeZone,
    });

    const busyWindows = busyResponse.busy_times.map((busy) => ({
      start: busy.start,
      end: busy.end,
    }));

    const blockedWindows = this.mergeRanges([...blackoutWindows, ...busyWindows]);

    const freeWindows = this.subtractRanges(availabilityWindows, blockedWindows);

    const slots = this.generateSlotsFromRanges(
      freeWindows,
      params.slot_duration_minutes,
      params.slot_interval_minutes,
    );

    return { slots, time_zone: timeZone };
  }

  private buildAvailabilityWindows(
    rules: Array<{
      rule_type: string;
      day_of_week: number | null;
      start_time: string | null;
      end_time: string | null;
    }>,
    windowStartUtc: DateTime,
    windowEndUtc: DateTime,
    timeZone: string,
  ): TimeRange[] {
    const windows: TimeRange[] = [];
    let cursor = windowStartUtc.setZone(timeZone).startOf('day');
    const endLocal = windowEndUtc.setZone(timeZone);

    while (cursor < endLocal) {
      const dayOfWeek = this.toAppDayOfWeek(cursor);

      const dayRules = rules.filter(
        (rule) =>
          rule.rule_type === 'weekly_window' &&
          rule.day_of_week === dayOfWeek &&
          rule.start_time !== null &&
          rule.end_time !== null,
      );

      for (const rule of dayRules) {
        const startLocal = this.combineLocalDayAndTime(cursor, rule.start_time as string);
        const endLocal = this.combineLocalDayAndTime(cursor, rule.end_time as string);

        const startUtc = startLocal.toUTC();
        const endUtc = endLocal.toUTC();

        if (endUtc > windowStartUtc && startUtc < windowEndUtc) {
          windows.push({
            start: DateTime.max(startUtc, windowStartUtc).toISO() as string,
            end: DateTime.min(endUtc, windowEndUtc).toISO() as string,
          });
        }
      }

      cursor = cursor.plus({ days: 1 }).startOf('day');
    }

    return this.mergeRanges(windows);
  }

  private buildBlackoutWindows(
    rules: Array<{
      rule_type: string;
      date_start: string | null;
      date_end: string | null;
    }>,
    windowStartUtc: DateTime,
    windowEndUtc: DateTime,
  ): TimeRange[] {
    const blackoutRules = rules.filter(
      (rule) => rule.rule_type === 'blackout_window' && rule.date_start && rule.date_end,
    );

    const blackoutWindows: TimeRange[] = blackoutRules.map((rule) => {
      const start = DateTime.fromISO(rule.date_start as string, { zone: 'utc' });
      const end = DateTime.fromISO(rule.date_end as string, { zone: 'utc' });

      return {
        start: DateTime.max(start, windowStartUtc).toISO() as string,
        end: DateTime.min(end, windowEndUtc).toISO() as string,
      };
    });

    return blackoutWindows.filter((window) => window.start < window.end);
  }

  private subtractRanges(sourceRanges: TimeRange[], blockedRanges: TimeRange[]): TimeRange[] {
    let result = [...sourceRanges];

    for (const blocked of blockedRanges) {
      const next: TimeRange[] = [];

      for (const source of result) {
        const sourceStart = DateTime.fromISO(source.start, { zone: 'utc' }).toMillis();
        const sourceEnd = DateTime.fromISO(source.end, { zone: 'utc' }).toMillis();
        const blockedStart = DateTime.fromISO(blocked.start, { zone: 'utc' }).toMillis();
        const blockedEnd = DateTime.fromISO(blocked.end, { zone: 'utc' }).toMillis();

        if (blockedEnd <= sourceStart || blockedStart >= sourceEnd) {
          next.push(source);
          continue;
        }

        if (blockedStart > sourceStart) {
          next.push({
            start: DateTime.fromMillis(sourceStart, { zone: 'utc' }).toISO() as string,
            end: DateTime.fromMillis(blockedStart, { zone: 'utc' }).toISO() as string,
          });
        }

        if (blockedEnd < sourceEnd) {
          next.push({
            start: DateTime.fromMillis(blockedEnd, { zone: 'utc' }).toISO() as string,
            end: DateTime.fromMillis(sourceEnd, { zone: 'utc' }).toISO() as string,
          });
        }
      }

      result = next;
    }

    return result.filter((range) => range.start < range.end);
  }

  private generateSlotsFromRanges(
    ranges: TimeRange[],
    slotDurationMinutes: number,
    slotIntervalMinutes: number,
  ): GeneratedAvailabilitySlot[] {
    const slots: GeneratedAvailabilitySlot[] = [];
    const durationMs = slotDurationMinutes * 60 * 1000;
    const intervalMs = slotIntervalMinutes * 60 * 1000;

    for (const range of ranges) {
      const rangeStart = DateTime.fromISO(range.start, { zone: 'utc' }).toMillis();
      const rangeEnd = DateTime.fromISO(range.end, { zone: 'utc' }).toMillis();

      for (
        let slotStart = rangeStart;
        slotStart + durationMs <= rangeEnd;
        slotStart += intervalMs
      ) {
        slots.push({
          start: DateTime.fromMillis(slotStart, { zone: 'utc' }).toISO() as string,
          end: DateTime.fromMillis(slotStart + durationMs, { zone: 'utc' }).toISO() as string,
        });
      }
    }

    return slots;
  }

  private mergeRanges(ranges: TimeRange[]): TimeRange[] {
    if (ranges.length === 0) return [];

    const sortedRanges = [...ranges].sort(
      (a, b) =>
        DateTime.fromISO(a.start, { zone: 'utc' }).toMillis() -
        DateTime.fromISO(b.start, { zone: 'utc' }).toMillis(),
    );

    const merged: TimeRange[] = [sortedRanges[0]];

    for (let i = 1; i < sortedRanges.length; i++) {
      const current = sortedRanges[i];
      const lastMerged = merged[merged.length - 1];

      const currentStart = DateTime.fromISO(current.start, { zone: 'utc' }).toMillis();
      const currentEnd = DateTime.fromISO(current.end, { zone: 'utc' }).toMillis();
      const lastMergedEnd = DateTime.fromISO(lastMerged.end, { zone: 'utc' }).toMillis();

      if (currentStart <= lastMergedEnd) {
        if (currentEnd > lastMergedEnd) {
          lastMerged.end = current.end;
        }
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }

  private combineLocalDayAndTime(day: DateTime, time: string): DateTime {
    const [hours, minutes, seconds] = time.split(':').map(Number);

    return day.set({
      hour: hours,
      minute: minutes,
      second: seconds || 0,
      millisecond: 0,
    });
  }

  private toAppDayOfWeek(dateTime: DateTime): number {
    return dateTime.weekday % 7;
  }
}
