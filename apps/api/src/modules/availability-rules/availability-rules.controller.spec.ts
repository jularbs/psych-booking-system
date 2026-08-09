import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityRulesController } from './availability-rules.controller';
import { AvailabilityRulesService } from './availability-rules.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';

describe('AvailabilityRulesController', () => {
  let controller: AvailabilityRulesController;

  const service = {
    listMine: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityRulesController],
      providers: [
        {
          provide: AvailabilityRulesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AvailabilityRulesController>(AvailabilityRulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lists rules for current user', async () => {
    const userId = 'user-1';
    const rules = [
      { id: 'rule-1', user_id: userId },
      { id: 'rule-2', user_id: userId },
    ];

    service.listMine.mockResolvedValue(rules);
    const result = await controller.listMine(userId);

    expect(result).toEqual(rules);
    expect(service.listMine).toHaveBeenCalledWith(userId);
  });

  it('throws when current user is missing', async () => {
    expect(() => controller.listMine(undefined)).toThrow(UnauthorizedException);
  });

  it('creates a new rule for current user', async () => {
    const userId = 'user-1';
    const dto: CreateAvailabilityRuleDto = {
      description: 'New rule',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
    };
    const createdRule = { id: 'rule-1', user_id: userId, ...dto };

    service.create.mockResolvedValue(createdRule);
    const result = await controller.create(userId, dto);

    expect(result).toEqual(createdRule);
    expect(service.create).toHaveBeenCalledWith(userId, dto);
  });

  it('throws when creating a rule with missing current user', async () => {
    const dto: CreateAvailabilityRuleDto = {
      description: 'New rule',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
    };

    await expect(controller.create(undefined, dto)).rejects.toThrow(UnauthorizedException);
  });

  it('updates an existing rule', async () => {
    const ruleId = 'rule-1';
    const updateParams = { description: 'Updated description' };
    const existingRule = {
      id: ruleId,
      user_id: 'user-1',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      date_start: null,
      date_end: null,
      is_active: true,
    };

    service.update.mockResolvedValue({ ...existingRule, ...updateParams });
    const result = await controller.update(ruleId, updateParams);

    expect(result).toEqual({ ...existingRule, ...updateParams });
    expect(service.update).toHaveBeenCalledWith(ruleId, updateParams);
  });

  it('throws when updating a rule that does not exist', async () => {
    const ruleId = 'missing-id';
    const updateParams = { description: 'Updated description' };

    service.update.mockRejectedValue(new NotFoundException('Availability rule not found'));
    await expect(controller.update(ruleId, updateParams)).rejects.toThrow(NotFoundException);
    expect(service.update).toHaveBeenCalledWith(ruleId, updateParams);
  });

  it('throws when updating a rule with invalid parameters', async () => {
    const ruleId = 'rule-1';
    const updateParams: UpdateAvailabilityRuleDto = { rule_type: 'weekly_window' }; // Missing required fields

    service.update.mockRejectedValue(
      new Error('Weekly window rules require day_of_week, start_time, and end_time'),
    );
    await expect(controller.update(ruleId, updateParams)).rejects.toThrow(
      'Weekly window rules require day_of_week, start_time, and end_time',
    );
    expect(service.update).toHaveBeenCalledWith(ruleId, updateParams);
  });
});
