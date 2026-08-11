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
        { provide: AvailabilityRulesService, useValue: availabilityRulesService },
        {
          provide: GoogleCalendarAvailabilityService,
          useValue: googleCalendarAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<AvailabilitySlotGenerationService>(AvailabilitySlotGenerationService);
  });

  it('generates slots from weekly windows excluding google busy blocks', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [
        { start: '2024-06-03T10:00:00Z', end: '2024-06-03T11:00:00Z' },
        { start: '2024-06-03T15:00:00Z', end: '2024-06-03T16:00:00Z' },
      ],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      time_zone: 'UTC',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([
      { start: '2024-06-03T09:00:00.000Z', end: '2024-06-03T09:30:00.000Z' },
      { start: '2024-06-03T09:30:00.000Z', end: '2024-06-03T10:00:00.000Z' },
      { start: '2024-06-03T11:00:00.000Z', end: '2024-06-03T11:30:00.000Z' },
      { start: '2024-06-03T11:30:00.000Z', end: '2024-06-03T12:00:00.000Z' },
      { start: '2024-06-03T12:00:00.000Z', end: '2024-06-03T12:30:00.000Z' },
      { start: '2024-06-03T12:30:00.000Z', end: '2024-06-03T13:00:00.000Z' },
      { start: '2024-06-03T13:00:00.000Z', end: '2024-06-03T13:30:00.000Z' },
      { start: '2024-06-03T13:30:00.000Z', end: '2024-06-03T14:00:00.000Z' },
      { start: '2024-06-03T14:00:00.000Z', end: '2024-06-03T14:30:00.000Z' },
      { start: '2024-06-03T14:30:00.000Z', end: '2024-06-03T15:00:00.000Z' },
      { start: '2024-06-03T16:00:00.000Z', end: '2024-06-03T16:30:00.000Z' },
      { start: '2024-06-03T16:30:00.000Z', end: '2024-06-03T17:00:00.000Z' },
    ]);
  });

  it('excludes blackout windows from generated slots', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
      {
        rule_type: 'blackout_window',
        date_start: '2024-06-03T12:00:00Z',
        date_end: '2024-06-03T13:00:00Z',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

    const result = await service.querySlots({
      user_id: 'user-1',
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      time_zone: 'UTC',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    });

    expect(result.slots).toEqual([
      { start: '2024-06-03T09:00:00.000Z', end: '2024-06-03T09:30:00.000Z' },
      { start: '2024-06-03T09:30:00.000Z', end: '2024-06-03T10:00:00.000Z' },
      { start: '2024-06-03T10:00:00.000Z', end: '2024-06-03T10:30:00.000Z' },
      { start: '2024-06-03T10:30:00.000Z', end: '2024-06-03T11:00:00.000Z' },
      { start: '2024-06-03T11:00:00.000Z', end: '2024-06-03T11:30:00.000Z' },
      { start: '2024-06-03T11:30:00.000Z', end: '2024-06-03T12:00:00.000Z' },
      { start: '2024-06-03T13:00:00.000Z', end: '2024-06-03T13:30:00.000Z' },
      { start: '2024-06-03T13:30:00.000Z', end: '2024-06-03T14:00:00.000Z' },
      { start: '2024-06-03T14:00:00.000Z', end: '2024-06-03T14:30:00.000Z' },
      { start: '2024-06-03T14:30:00.000Z', end: '2024-06-03T15:00:00.000Z' },
      { start: '2024-06-03T15:00:00.000Z', end: '2024-06-03T15:30:00.000Z' },
      { start: '2024-06-03T15:30:00.000Z', end: '2024-06-03T16:00:00.000Z' },
      { start: '2024-06-03T16:00:00.000Z', end: '2024-06-03T16:30:00.000Z' },
      { start: '2024-06-03T16:30:00.000Z', end: '2024-06-03T17:00:00.000Z' },
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

  it('returns empty slots if all time is blocked by busy times', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [{ start: '2024-06-03T09:00:00Z', end: '2024-06-03T17:00:00Z' }],
    });

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

  it('returns empty slots if all time is blocked by blackout windows', async () => {
    availabilityRulesService.listActiveRulesForUser.mockResolvedValue([
      {
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
      {
        rule_type: 'blackout_window',
        date_start: '2024-06-03T09:00:00Z',
        date_end: '2024-06-03T17:00:00Z',
      },
    ]);

    googleCalendarAvailabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'primary',
      busy_times: [],
    });

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
