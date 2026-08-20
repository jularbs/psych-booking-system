import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { AvailabilityRulesService } from '../availability-rules/availability-rules.service';
import { GoogleCalendarAvailabilityService } from '../google-calendar/google-calendar-availability.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';

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

  it('query slots in Asia/Manila timezone and returns UTC slots', async () => {
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
      busy_times: [
        {
          start: DateTime.fromISO('2026-08-10T10:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
          end: DateTime.fromISO('2026-08-10T10:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
        },
      ],
    });

    const timeMin = DateTime.fromISO('2026-08-10T00:00', { zone: 'Asia/Manila' }).toISO();
    const timeMax = DateTime.fromISO('2026-08-11T00:00', { zone: 'Asia/Manila' }).toISO();

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: timeMin as string,
      time_max: timeMax as string,
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([
      {
        start: DateTime.fromISO('2026-08-10T09:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T09:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
      {
        start: DateTime.fromISO('2026-08-10T09:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T10:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
      {
        start: DateTime.fromISO('2026-08-10T10:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T11:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
      {
        start: DateTime.fromISO('2026-08-10T11:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T11:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
      {
        start: DateTime.fromISO('2026-08-10T11:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T12:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
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
        date_start: DateTime.fromISO('2026-08-10T10:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        date_end: DateTime.fromISO('2026-08-10T12:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        time_zone: 'Asia/Manila',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: DateTime.fromISO('2026-08-10T00:00', { zone: 'Asia/Manila' }).toISO() as string,
      time_max: DateTime.fromISO('2026-08-11T00:00', { zone: 'Asia/Manila' }).toISO() as string,
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([
      {
        start: DateTime.fromISO('2026-08-10T09:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T09:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
      {
        start: DateTime.fromISO('2026-08-10T09:30', { zone: 'Asia/Manila' }).toUTC().toISO(),
        end: DateTime.fromISO('2026-08-10T10:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
    ]);
  });

  it('throws if invalid time_min and time_max is provided', async () => {
    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-04T00:00:00Z',
        time_max: '2024-06-03T00:00:00Z',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: 'invalid-date',
        time_max: '2024-06-03T00:00:00Z', // Invalid date
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-03T00:00:00Z',
        time_max: 'invalid-date', // Invalid date
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.querySlots({
        user_id: 'user-1',
        time_min: '2024-06-03T00:00',
        time_max: '2024-06-04T00:00',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns empty slots if no availability rules are found', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([]);
    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([]);
  });

  it('returns empty slots if all time is blocked by busy times', async () => {
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
          start: DateTime.fromISO('2026-08-10T09:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
          end: DateTime.fromISO('2026-08-10T12:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        },
      ],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: DateTime.fromISO('2026-08-10T09:00', { zone: 'Asia/Manila' })
        .toUTC()
        .toISO() as string,
      time_max: DateTime.fromISO('2026-08-10T12:00', { zone: 'Asia/Manila' })
        .toUTC()
        .toISO() as string,
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
        date_start: DateTime.fromISO('2026-08-10T00:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
        date_end: DateTime.fromISO('2026-08-11T00:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: DateTime.fromISO('2026-08-10T08:00', { zone: 'Asia/Manila' })
        .toUTC()
        .toISO() as string,
      time_max: DateTime.fromISO('2026-08-10T17:00', { zone: 'Asia/Manila' })
        .toUTC()
        .toISO() as string,
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
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      }),
    ).rejects.toThrow('Google Calendar connection not found');
  });
});
