import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityRulesService } from './availability-rules.service';
import { AvailabilityRulesRepository } from './availability-rules.repository';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../database/database.types';

describe('AvailabilityRulesService', () => {
  let service: AvailabilityRulesService;

  const repository = {
    findById: vi.fn(),
    listByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findByIdForUser: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityRulesService,
        {
          provide: AvailabilityRulesRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AvailabilityRulesService>(AvailabilityRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists rules for current user', async () => {
    const userId = 'user-1';
    const rules = [
      { id: 'rule-1', user_id: userId },
      { id: 'rule-2', user_id: userId },
    ];

    repository.listByUserId.mockResolvedValue(rules);
    const result = await service.listMine(userId);

    expect(result).toEqual(rules);
    expect(repository.listByUserId).toHaveBeenCalledWith(userId);
  });

  it('lists only active rules for current user', async () => {
    const userId = 'user-1';
    const rules = [
      { id: 'rule-1', user_id: userId, is_active: true },
      { id: 'rule-2', user_id: userId, is_active: false },
      { id: 'rule-3', user_id: userId, is_active: true },
    ];

    repository.listByUserId.mockResolvedValue(rules);
    const result = await service.listActiveRulesForUser(userId);

    expect(result).toEqual([
      { id: 'rule-1', user_id: userId, is_active: true },
      { id: 'rule-3', user_id: userId, is_active: true },
    ]);
  });

  it('gets a rule by ID', async () => {
    const ruleId = 'rule-1';
    const rule = { id: ruleId, user_id: 'user-1' };

    repository.findById.mockResolvedValue(rule);
    const result = await service.getById(ruleId);

    expect(result).toEqual(rule);
    expect(repository.findById).toHaveBeenCalledWith(ruleId);
  });

  it('throws not found when rule does not exist', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a weekly window rule', async () => {
    const userId = 'user-1';
    const params: CreateAvailabilityRuleDto = {
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
    };

    const createdRule = { id: 'rule-1', user_id: userId, ...params };
    repository.create.mockResolvedValue(createdRule);

    const result = await service.create(userId, params);

    expect(result).toEqual(createdRule);
    expect(repository.create).toHaveBeenCalledWith({
      user_id: userId,
      ...params,
      description: null,
      date_start: null,
      date_end: null,
      is_active: true,
    });
  });

  it('creates a blackout window rule', async () => {
    const userId = 'user-1';
    const params: CreateAvailabilityRuleDto = {
      rule_type: 'blackout_window',
      date_start: '2024-01-01',
      date_end: '2024-01-07',
    };

    const createdRule = { id: 'rule-2', user_id: userId, ...params };
    repository.create.mockResolvedValue(createdRule);

    const result = await service.create(userId, params);

    expect(result).toEqual(createdRule);
    expect(repository.create).toHaveBeenCalledWith({
      user_id: userId,
      ...params,
      description: null,
      day_of_week: null,
      start_time: null,
      end_time: null,
      is_active: true,
    });
  });

  it('throws error when creating a weekly window rule with missing fields', async () => {
    const userId = 'user-1';
    const params: CreateAvailabilityRuleDto = {
      rule_type: 'weekly_window',
      // Missing day_of_week, start_time, end_time
    };

    await expect(service.create(userId, params)).rejects.toThrow(
      'Weekly window rules require day_of_week, start_time, and end_time',
    );
  });

  it('throws error when creating a blackout window rule with missing fields', async () => {
    const userId = 'user-1';
    const params: CreateAvailabilityRuleDto = {
      rule_type: 'blackout_window',
      // Missing date_start, date_end
    };

    await expect(service.create(userId, params)).rejects.toThrow(
      'Blackout window rules require date_start and date_end',
    );
  });

  it('updates an existing rule', async () => {
    const ruleId = 'rule-1';
    const existingRule = {
      id: ruleId,
      user_id: 'user-1',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      description: null,
      date_start: null,
      date_end: null,
      is_active: true,
    };
    const actor = { userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole };

    const updateParams = {
      description: 'Updated description',
    };

    repository.findByIdForUser
      .mockResolvedValueOnce(existingRule)
      .mockResolvedValueOnce({ ...existingRule, ...updateParams });
    repository.update.mockResolvedValue(undefined);

    const result = await service.update(actor, ruleId, updateParams);

    expect(repository.update).toHaveBeenCalledWith(ruleId, updateParams);

    expect(result).toEqual({ ...existingRule, ...updateParams });
  });

  it('throws not found when updating a non-existent rule', async () => {
    repository.findByIdForUser.mockResolvedValue(undefined);

    await expect(
      service.update({ userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole }, 'missing-id', {
        description: 'test',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws error when updating a weekly window rule with missing fields', async () => {
    const ruleId = 'rule-1';
    const existingRule = {
      id: ruleId,
      user_id: 'user-1',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      description: null,
      date_start: null,
      date_end: null,
      is_active: true,
    };

    repository.findByIdForUser.mockResolvedValue(existingRule);

    await expect(
      service.update({ userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole }, ruleId, {
        rule_type: 'weekly_window',
      }),
    ).rejects.toThrow('Weekly window rules require day_of_week, start_time, and end_time');
  });

  it('throws error when updating a blackout window rule with missing fields', async () => {
    const ruleId = 'rule-2';
    const existingRule = {
      id: ruleId,
      user_id: 'user-1',
      rule_type: 'blackout_window',
      date_start: '2024-01-01',
      date_end: '2024-01-07',
      description: null,
      day_of_week: null,
      start_time: null,
      end_time: null,
      is_active: true,
    };

    repository.findByIdForUser.mockResolvedValue(existingRule);

    await expect(
      service.update({ userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole }, ruleId, {
        rule_type: 'blackout_window',
      }),
    ).rejects.toThrow('Blackout window rules require date_start and date_end');
  });

  it('allows PLATFORM_ADMIN to update any rule', async () => {
    const ruleId = 'rule-1';
    const existingRule = {
      id: ruleId,
      user_id: 'user-2', // Different user
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      description: null,
      date_start: null,
      date_end: null,
      is_active: true,
    };
    const actor = { userId: 'admin-user', role: 'PLATFORM_ADMIN' as UserRole };

    const updateParams = {
      description: 'Admin updated description',
    };

    repository.findById
      .mockResolvedValueOnce(existingRule)
      .mockResolvedValueOnce({ ...existingRule, ...updateParams });
    repository.update.mockResolvedValue(undefined);

    const result = await service.update(actor, ruleId, updateParams);

    expect(repository.update).toHaveBeenCalledWith(ruleId, updateParams);
    expect(result).toEqual({ ...existingRule, ...updateParams });
  });

  it('allows rule owner to update their own rule', async () => {
    const ruleId = 'rule-1';
    const existingRule = {
      id: ruleId,
      user_id: 'user-1',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      description: null,
      date_start: null,
      date_end: null,
      is_active: true,
    };
    const actor = { userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole };

    const updateParams = {
      description: 'Owner updated description',
    };

    repository.findByIdForUser
      .mockResolvedValueOnce(existingRule)
      .mockResolvedValueOnce({ ...existingRule, ...updateParams });
    repository.update.mockResolvedValue(undefined);

    const result = await service.update(actor, ruleId, updateParams);

    expect(repository.update).toHaveBeenCalledWith(ruleId, updateParams);
    expect(result).toEqual({ ...existingRule, ...updateParams });
  });

  it('throws not found when a non-owner tries to update a rule', async () => {
    const ruleId = 'rule-1';

    const actor = { userId: 'user-1', role: 'PSYCHOLOGIST' as UserRole };

    repository.findByIdForUser.mockResolvedValue(undefined);

    await expect(service.update(actor, ruleId, { description: 'test' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
