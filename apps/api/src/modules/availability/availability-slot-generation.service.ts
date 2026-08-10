import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { TimeRange, GeneratedAvailabilitySlot } from './availability-slot.types';
import { QueryAvailabilitySlotsDto } from './dto/query-availability-slots.dto';

@Injectable()
export class AvailabilitySlotGenerationService {
  constructor(
    private readonly availabilityRulesService: AvailabilityRulesService,
    private readonly googleCalendarAvailabilityService: GoogleCalendarAvailabilityService,
  ) {}

  async querySlots(
    params: QueryAvailabilitySlotsDto & { user_id: string },
  ): Promise<{ slots: GeneratedAvailabilitySlot[] }> {
    const windowStart = new Date(params.time_min);
    const windowEnd = new Date(params.time_max);

    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      throw new BadRequestException('Invalid time ranges.');
    }

    if (windowStart >= windowEnd) {
      throw new BadRequestException('time_min must be before time_max.');
    }

    const rules = await this.availabilityRulesService.listActiveRulesForUser(params.user_id);

    const availabilityWindows = this.buildAvailabilityWindows(rules, windowStart, windowEnd);
    const blackoutWindows = this.buildBlackoutWindows(rules, windowStart, windowEnd);

    const busyResponse = await this.googleCalendarAvailabilityService.queryMyAvailability({
      user_id: params.user_id,
      time_min: windowStart.toISOString(),
      time_max: windowEnd.toISOString(),
      time_zone: params.time_zone,
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

    return { slots };
  }

  private buildAvailabilityWindows(
    rules: Array<{
      rule_type: string;
      day_of_week: number | null;
      start_time: string | null;
      end_time: string | null;
    }>,
    windowStart: Date,
    windowEnd: Date,
  ): TimeRange[] {
    const windows: TimeRange[] = [];
    const cursor = new Date(windowStart);

    while (cursor < windowEnd) {
      const dayStart = new Date(cursor);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const dayOfWeek = dayStart.getUTCDay();

      const dayRules = rules.filter(
        (rule) =>
          rule.rule_type === 'weekly_window' &&
          rule.day_of_week === dayOfWeek &&
          rule.start_time &&
          rule.end_time,
      );

      for (const rule of dayRules) {
        const start = this.combineDayAndTime(dayStart, rule.start_time!);
        const end = this.combineDayAndTime(dayStart, rule.end_time!);

        if (start > windowStart && end < windowEnd) {
          windows.push({
            start: new Date(Math.max(start.getTime(), windowStart.getTime())).toISOString(),
            end: new Date(Math.min(end.getTime(), windowEnd.getTime())).toISOString(),
          });
        }
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
    }

    return this.mergeRanges(windows);
  }

  private buildBlackoutWindows(
    rules: Array<{
      rule_type: string;
      date_start: string | null;
      date_end: string | null;
    }>,
    windowStart: Date,
    windowEnd: Date,
  ): TimeRange[] {
    const blackoutRules = rules.filter(
      (rule) => rule.rule_type === 'blackout_window' && rule.date_start && rule.date_end,
    );

    const blackoutWindows: TimeRange[] = blackoutRules.map((rule) => {
      const start = new Date(rule.date_start as string);
      const end = new Date(rule.date_end as string);

      return {
        start: new Date(Math.max(start.getTime(), windowStart.getTime())).toISOString(),
        end: new Date(Math.min(end.getTime(), windowEnd.getTime())).toISOString(),
      };
    });

    return blackoutWindows.filter((window) => new Date(window.start) < new Date(window.end));
  }

  private subtractRanges(sourceRanges: TimeRange[], blockedRanges: TimeRange[]): TimeRange[] {
    let result = [...sourceRanges];

    for (const blocked of blockedRanges) {
      const next: TimeRange[] = [];

      for (const source of result) {
        const sourceStart = new Date(source.start).getTime();
        const sourceEnd = new Date(source.end).getTime();
        const blockedStart = new Date(blocked.start).getTime();
        const blockedEnd = new Date(blocked.end).getTime();

        if (blockedEnd <= sourceStart || blockedStart >= sourceEnd) {
          next.push(source);
          continue;
        }

        if (blockedStart > sourceStart) {
          next.push({
            start: new Date(sourceStart).toISOString(),
            end: new Date(blockedStart).toISOString(),
          });
        }

        if (blockedEnd < sourceEnd) {
          next.push({
            start: new Date(blockedEnd).toISOString(),
            end: new Date(sourceEnd).toISOString(),
          });
        }
      }

      result = next;
    }

    return result.filter((range) => new Date(range.start) < new Date(range.end));
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
      const rangeStart = new Date(range.start).getTime();
      const rangeEnd = new Date(range.end).getTime();

      for (
        let slotStart = rangeStart;
        slotStart + durationMs <= rangeEnd;
        slotStart += intervalMs
      ) {
        slots.push({
          start: new Date(slotStart).toISOString(),
          end: new Date(slotStart + durationMs).toISOString(),
        });
      }
    }

    return slots;
  }

  private mergeRanges(ranges: TimeRange[]): TimeRange[] {
    if (ranges.length === 0) return [];

    const sortedRanges = [...ranges].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    const merged: TimeRange[] = [sortedRanges[0]];

    for (let i = 1; i < sortedRanges.length; i++) {
      const current = sortedRanges[i];
      const lastMerged = merged[merged.length - 1];

      if (new Date(current.start).getTime() <= new Date(lastMerged.end).getTime()) {
        if (new Date(current.end).getTime() > new Date(lastMerged.end).getTime()) {
          lastMerged.end = current.end;
        }
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }

  private combineDayAndTime(day: Date, time: string): Date {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const result = new Date(day);
    result.setUTCHours(hours, minutes, seconds ?? 0, 0);

    return result;
  }
}
