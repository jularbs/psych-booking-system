import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotValidationService } from './availability-slot-validation.service';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { DateTime } from 'luxon';

describe('AvailabilitySlotValidationService', () => {
  let service: AvailabilitySlotValidationService;

  const availabilityRulesService = {
    listActiveRulesForUser: vi.fn(),
  };

  const googleCalendarAvailabilityService = {
    queryMyAvailability: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilitySlotValidationService,
        { provide: AvailabilityRulesService, useValue: availabilityRulesService },
        {
          provide: GoogleCalendarAvailabilityService,
          useValue: googleCalendarAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<AvailabilitySlotValidationService>(AvailabilitySlotValidationService);
  });

  it('returns valid when slot fits rules and has no conflicts', async () => {
    const userId = 'user-1';
    const startTime = '2024-06-10T10:00:00';
    const endTime = '2024-06-10T11:00:00';
    const timeZone = 'Asia/Manila';

    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        id: 'rule-1',
        user_id: userId,
        rule_type: 'weekly_window',
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.validateSlot(userId, startTime, endTime, timeZone);
    expect(result).toEqual({ isValid: true, reason: null });
  });

  it('returns invalid for invalid timezone', async () => {
    const userId = 'user-1';
    const startTime = '2024-06-10T10:00:00';
    const endTime = '2024-06-10T11:00:00';
    const invalidTimeZone = 'Invalid/Timezone';

    const result = await service.validateSlot(userId, startTime, endTime, invalidTimeZone);
    expect(result).toEqual({ isValid: false, reason: 'invalid_time_zone' });
  });

  it('returns invalid for invalid time range', async () => {
    const userId = 'user-1';
    const startTime = '2024-06-10T12:00:00';
    const endTime = '2024-06-10T11:00:00'; // End time before start time
    const timeZone = 'Asia/Manila';

    const result = await service.validateSlot(userId, startTime, endTime, timeZone);
    expect(result).toEqual({ isValid: false, reason: 'invalid_time_range' });
  });

  it('returns invalid when slot is outside availability window', async () => {
    const userId = 'user-1';
    const startTime = DateTime.fromISO('2024-06-10T08:00:00', { zone: 'Asia/Manila' }).toISO();
    const endTime = DateTime.fromISO('2024-06-10T09:00:00', { zone: 'Asia/Manila' }).toISO();
    const timeZone = 'Asia/Manila';

    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        id: 'rule-1',
        user_id: userId,
        rule_type: 'weekly_window',
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    const result = await service.validateSlot(
      userId,
      startTime as string,
      endTime as string,
      timeZone,
    );
    expect(result).toEqual({ isValid: false, reason: 'slot_outside_availability_window' });
  });

  it('returns invalid when slot overlaps blackout window', async () => {
    const userId = 'user-1';
    const startTime = DateTime.fromISO('2024-06-10T10:30:00', { zone: 'Asia/Manila' }).toISO();
    const endTime = DateTime.fromISO('2024-06-10T11:00:00', { zone: 'Asia/Manila' }).toISO();
    const timeZone = 'Asia/Manila';

    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        id: 'rule-2',
        user_id: userId,
        rule_type: 'weekly_window',
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
      },
      {
        id: 'rule-1',
        user_id: userId,
        rule_type: 'blackout_window',
        date_start: DateTime.fromISO('2024-06-10T10:30:00', { zone: timeZone }).toUTC().toISO(),
        date_end: DateTime.fromISO('2024-06-10T11:00:00', { zone: timeZone }).toUTC().toISO(),
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.validateSlot(
      userId,
      startTime as string,
      endTime as string,
      timeZone,
    );
    expect(result).toEqual({ isValid: false, reason: 'slot_overlaps_blackout_window' });
  });

  it('returns invalid when slot overlaps Google busy time', async () => {
    const userId = 'user-1';
    const startTime = DateTime.fromISO('2024-06-10T10:00:00', { zone: 'Asia/Manila' }).toISO();
    const endTime = DateTime.fromISO('2024-06-10T11:00:00', { zone: 'Asia/Manila' }).toISO();
    const timeZone = 'Asia/Manila';

    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        id: 'rule-1',
        user_id: userId,
        rule_type: 'weekly_window',
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [
        {
          start: DateTime.fromISO('2024-06-10T10:30:00', { zone: timeZone }).toUTC().toISO(),
          end: DateTime.fromISO('2024-06-10T11:30:00', { zone: timeZone }).toUTC().toISO(),
        },
      ],
    });

    const result = await service.validateSlot(
      userId,
      startTime as string,
      endTime as string,
      timeZone,
    );
    expect(result).toEqual({ isValid: false, reason: 'slot_overlaps_google_busy_time' });
  });
});
