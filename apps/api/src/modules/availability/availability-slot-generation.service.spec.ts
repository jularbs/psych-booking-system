import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AvailabilitySlotGenerationService', () => {
  let service: AvailabilitySlotGenerationService;

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
        AvailabilitySlotGenerationService,
        {
          provide: AvailabilityRulesService,
          useValue: availabilityRulesService,
        },
        {
          provide: GoogleCalendarAvailabilityService,
          useValue: googleCalendarAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<AvailabilitySlotGenerationService>(AvailabilitySlotGenerationService);
  });

  it('uses Asia/Manila as default timezone and returns UTC slots', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        date_start: null,
        date_end: null,
        time_zone: 'Asia/Manila',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [{ start: '2026-08-10T02:00:00.000Z', end: '2026-08-10T02:30:00.000Z' }],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2026-08-09T16:00:00.000Z',
      time_max: '2026-08-10T16:00:00.000Z',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.time_zone).toBe('Asia/Manila');
    expect(result.slots).toEqual([
      {
        start: '2026-08-10T01:00:00.000Z',
        end: '2026-08-10T01:30:00.000Z',
      },
      {
        start: '2026-08-10T01:30:00.000Z',
        end: '2026-08-10T02:00:00.000Z',
      },
      {
        start: '2026-08-10T02:30:00.000Z',
        end: '2026-08-10T03:00:00.000Z',
      },
      {
        start: '2026-08-10T03:00:00.000Z',
        end: '2026-08-10T03:30:00.000Z',
      },
      {
        start: '2026-08-10T03:30:00.000Z',
        end: '2026-08-10T04:00:00.000Z',
      },
    ]);
  });

  it('excludes blackout windows from generated slots', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        time_zone: 'Asia/Manila',
      },
      {
        rule_type: 'blackout_window',
        day_of_week: null,
        start_time: null,
        end_time: null,
        date_start: '2026-08-10T01:30:00.000Z',
        date_end: '2026-08-10T02:30:00.000Z',
        time_zone: 'Asia/Manila',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2026-08-09T16:00:00.000Z',
      time_max: '2026-08-10T16:00:00.000Z',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([
      {
        start: '2026-08-10T01:00:00.000Z',
        end: '2026-08-10T01:30:00.000Z',
      },
      {
        start: '2026-08-10T02:30:00.000Z',
        end: '2026-08-10T03:00:00.000Z',
      },
      {
        start: '2026-08-10T03:00:00.000Z',
        end: '2026-08-10T03:30:00.000Z',
      },
      {
        start: '2026-08-10T03:30:00.000Z',
        end: '2026-08-10T04:00:00.000Z',
      },
    ]);
  });

  it('blocks correct slots when request timezone is Asia/Manila and blackout is UTC', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
      },
      {
        rule_type: 'blackout_window',
        date_start: '2026-08-10T01:30:00.000Z',
        date_end: '2026-08-10T02:30:00.000Z',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2026-08-09T16:00:00.000Z',
      time_max: '2026-08-10T16:00:00.000Z',
      time_zone: 'Asia/Manila',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.time_zone).toBe('Asia/Manila');
    expect(result.slots).toEqual([
      {
        start: '2026-08-10T01:00:00.000Z',
        end: '2026-08-10T01:30:00.000Z',
      },
      {
        start: '2026-08-10T02:30:00.000Z',
        end: '2026-08-10T03:00:00.000Z',
      },
      {
        start: '2026-08-10T03:00:00.000Z',
        end: '2026-08-10T03:30:00.000Z',
      },
      {
        start: '2026-08-10T03:30:00.000Z',
        end: '2026-08-10T04:00:00.000Z',
      },
    ]);
  });

  it('throws if invalid time range is provided', async () => {
    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-04T00:00:00Z',
        time_max: '2024-06-03T00:00:00Z', // Invalid range
        time_zone: 'UTC',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: 'invalid-date',
        time_max: '2024-06-03T00:00:00Z', // Invalid date
        time_zone: 'UTC',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-03T00:00:00Z',
        time_max: 'invalid-date', // Invalid date
        time_zone: 'UTC',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns empty slots if no availability rules are found', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([]);

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      time_zone: 'UTC',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([]);
  });

  it('returns empty slots if all time is blocked by busy times with timezone handling', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        time_zone: 'Asia/Manila',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [
        {
          start: '2026-08-10T01:00:00.000Z', // 09:00 Asia/Manila
          end: '2026-08-10T04:00:00.000Z', // 12:00 Asia/Manila
        },
      ],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2026-08-09T16:00:00.000Z',
      time_max: '2026-08-10T16:00:00.000Z',
      time_zone: 'Asia/Manila',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([]);
  });

  it('returns empty slots if all time is blocked by blackout windows', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        time_zone: 'Asia/Manila',
      },
      {
        rule_type: 'blackout_window',
        date_start: '2026-08-10T01:00:00.000Z',
        date_end: '2026-08-10T04:00:00.000Z',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2026-08-09T16:00:00.000Z',
      time_max: '2026-08-10T16:00:00.000Z',
      time_zone: 'Asia/Manila',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([]);
  });

  it('throws if Google Calendar connection is not found', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockRejectedValue(
      new NotFoundException('Google Calendar connection not found'),
    );

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-03T00:00:00Z',
        time_max: '2024-06-04T00:00:00Z',
        time_zone: 'UTC',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toThrow('Google Calendar connection not found');
  });
});
