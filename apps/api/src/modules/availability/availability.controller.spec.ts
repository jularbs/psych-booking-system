import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { UnauthorizedException } from '@nestjs/common';
import { AvailabilitySlotValidationService } from './availability-slot-validation.service';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  const slotsGenerationService = {
    querySlots: vi.fn(),
  };

  const slotsValidationService = {
    validateSlot: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilitySlotGenerationService,
          useValue: slotsGenerationService,
        },
        {
          provide: AvailabilitySlotValidationService,
          useValue: slotsValidationService,
        },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  it('queries slots for the current user', async () => {
    slotsGenerationService.querySlots.mockResolvedValue([
      { start: '2024-06-03T09:00:00Z', end: '2024-06-03T09:30:00Z' },
      { start: '2024-06-03T09:30:00Z', end: '2024-06-03T10:00:00Z' },
    ]);

    const userId = 'user-1';
    const dto = {
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    };

    const result = await controller.querySlots(userId, dto);

    expect(result).toEqual([
      { start: '2024-06-03T09:00:00Z', end: '2024-06-03T09:30:00Z' },
      { start: '2024-06-03T09:30:00Z', end: '2024-06-03T10:00:00Z' },
    ]);
    expect(slotsGenerationService.querySlots).toHaveBeenCalledWith({ user_id: userId, ...dto });
  });

  it('validates a slot for the current user', async () => {
    slotsValidationService.validateSlot.mockResolvedValue({ isValid: true, reason: null });

    const result = await controller.validateSlot('user-1', {
      start: '2024-06-03T09:00:00Z',
      end: '2024-06-03T09:30:00Z',
    });
    expect(result).toEqual({ isValid: true, reason: null });
  });

  it('throws UnauthorizedException if userId is missing', () => {
    const dto = {
      time_min: '2024-06-03T00:00:00Z',
      time_max: '2024-06-04T00:00:00Z',
      slot_duration_minutes: 30,
      slot_interval_minutes: 30,
    };

    expect(() => controller.querySlots(null as unknown as string, dto)).toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException if userId is missing for validateSlot', () => {
    const dto = {
      start: '2024-06-03T09:00:00Z',
      end: '2024-06-03T09:30:00Z',
    };

    expect(() => controller.validateSlot(null as unknown as string, dto)).toThrow(
      UnauthorizedException,
    );

    expect(slotsValidationService.validateSlot).not.toHaveBeenCalled();
  });
});
