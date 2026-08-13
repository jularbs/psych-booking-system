import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { AvailabilityValidationResult } from './availability-validation.types';
import { DEFAULT_SCHEDULING_TIMEZONE } from './availability.constants';
import {
  combineLocalDayAndTime,
  convertToUTC,
  normalizeInstantToUtcIso,
  rangesOverlap,
} from '../../common/utils/date.utils';

@Injectable()
export class AvailabilitySlotValidationService {
  constructor(
    private readonly availabilityRulesService: AvailabilityRulesService,
    private readonly googleCalendarAvailabilityService: GoogleCalendarAvailabilityService, // Replace 'any' with the actual type of GoogleCalendarAvailabilityService
  ) {}

  async validateSlot(
    user_id: string,
    start_time: string,
    end_time: string,
    time_zone?: string,
  ): Promise<AvailabilityValidationResult> {
    const timezone = time_zone || DEFAULT_SCHEDULING_TIMEZONE;

    if (!DateTime.now().setZone(timezone).isValid) {
      return {
        isValid: false,
        reason: 'invalid_time_zone',
      };
    }

    const startTimeUtc = convertToUTC(start_time, timezone);
    const endTimeUtc = convertToUTC(end_time, timezone);

    if (!startTimeUtc.isValid || !endTimeUtc.isValid || startTimeUtc >= endTimeUtc) {
      return {
        isValid: false,
        reason: 'invalid_time_range',
      };
    }

    const rules = await this.availabilityRulesService.listActiveRulesForUser(user_id);

    const isInsideWeeklyWindow = this.isInsideWeeklyAvailabilityWindow(
      rules,
      startTimeUtc,
      endTimeUtc,
      timezone,
    );

    if (!isInsideWeeklyWindow) {
      return {
        isValid: false,
        reason: 'slot_outside_availability_window',
      };
    }

    const overlapsBlackout = this.overlapsBlackoutWindows(rules, startTimeUtc, endTimeUtc);

    if (overlapsBlackout) {
      return {
        isValid: false,
        reason: 'slot_overlaps_blackout_window',
      };
    }

    const busyResponse = await this.googleCalendarAvailabilityService.queryMyAvailability({
      user_id,
      time_min: startTimeUtc.toISO() as string,
      time_max: endTimeUtc.toISO() as string,
      time_zone: timezone,
    });

    const overlapsBusy = busyResponse.busy_times.some((busy) =>
      rangesOverlap(
        { start: startTimeUtc.toISO() as string, end: endTimeUtc.toISO() as string },
        { start: busy.start, end: busy.end },
      ),
    );

    if (overlapsBusy) {
      return {
        isValid: false,
        reason: 'slot_overlaps_google_busy_time',
      };
    }

    return {
      isValid: true,
      reason: null,
    };
  }

  private isInsideWeeklyAvailabilityWindow(
    rules: Array<{
      rule_type: string;
      day_of_week: number | null;
      start_time: string | null;
      end_time: string | null;
    }>,
    startUtc: DateTime,
    endUtc: DateTime,
    timeZone: string,
  ): boolean {
    const startLocal = startUtc.setZone(timeZone);
    const endLocal = endUtc.setZone(timeZone);

    if (!startLocal.isValid || !endLocal.isValid) {
      return false;
    }

    if (startLocal.startOf('day').toISO() !== endLocal.startOf('day').toISO()) {
      return false;
    }

    const dayOfWeek = startLocal.weekday;

    const dayRules = rules.filter(
      (rule) =>
        rule.rule_type === 'weekly_window' &&
        rule.day_of_week === dayOfWeek &&
        rule.start_time &&
        rule.end_time,
    );

    return dayRules.some((rule) => {
      const windowStart = combineLocalDayAndTime(startLocal, rule.start_time as string);
      const windowEnd = combineLocalDayAndTime(startLocal, rule.end_time as string);

      return startLocal >= windowStart && endLocal <= windowEnd;
    });
  }

  private overlapsBlackoutWindows(
    rules: Array<{
      rule_type: string;
      date_start: string | null;
      date_end: string | null;
    }>,
    startUtc: DateTime,
    endUtc: DateTime,
  ): boolean {
    const blackoutRules = rules.filter(
      (rule) => rule.rule_type === 'blackout_window' && rule.date_start && rule.date_end,
    );
    return blackoutRules.some((rule) => {
      const normalizedStart = normalizeInstantToUtcIso(rule.date_start);
      const normalizedEnd = normalizeInstantToUtcIso(rule.date_end);

      if (!normalizedStart || !normalizedEnd) {
        return false;
      }

      return rangesOverlap(
        { start: startUtc.toISO() as string, end: endUtc.toISO() as string },
        {
          start: normalizedStart as string,
          end: normalizedEnd as string,
        },
      );
    });
  }
}
