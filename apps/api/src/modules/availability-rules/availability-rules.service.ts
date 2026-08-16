import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AvailabilityRulesRepository } from './availability-rules.repository';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { UserRole } from '../../database/database.types';
import { DEFAULT_SCHEDULING_TIMEZONE } from '../availability/availability.constants';

@Injectable()
export class AvailabilityRulesService {
  constructor(private readonly availabilityRulesRepository: AvailabilityRulesRepository) {}

  listMine(id: string) {
    return this.availabilityRulesRepository.listByUserId(id);
  }

  async getById(id: string) {
    const rule = await this.availabilityRulesRepository.findById(id);

    if (!rule) {
      throw new NotFoundException('Availability rule not found');
    }

    return rule;
  }

  async getByIdForUser(id: string, userId: string) {
    const ownedRule = await this.availabilityRulesRepository.findByIdForUser(id, userId);

    if (ownedRule) {
      return ownedRule;
    }

    throw new NotFoundException('Availability rule not found for this user');
  }

  async getByIdForActor(id: string, actor: { userId: string; role: UserRole }) {
    if (actor.role === 'PLATFORM_ADMIN') {
      return this.getById(id);
    }

    return this.getByIdForUser(id, actor.userId);
  }

  async create(user_id: string, params: CreateAvailabilityRuleDto) {
    const normalizedParams = this.normalizeRuleParams(params);
    this.validateRuleShape(normalizedParams);

    return this.availabilityRulesRepository.create({
      user_id: user_id,
      rule_type: normalizedParams.rule_type as 'weekly_window' | 'blackout_window',
      description: normalizedParams.description ?? null,
      day_of_week: normalizedParams.day_of_week ?? null,
      start_time: normalizedParams.start_time ?? null,
      time_zone: normalizedParams.time_zone ?? null,
      end_time: normalizedParams.end_time ?? null,
      date_start: normalizedParams.date_start ?? null,
      date_end: normalizedParams.date_end ?? null,
      is_active: normalizedParams.is_active ?? true,
    });
  }

  async update(
    actor: { userId: string; role: UserRole },
    id: string,
    params: UpdateAvailabilityRuleDto,
  ) {
    const existing = await this.getByIdForActor(id, actor);

    if (!existing) throw new NotFoundException('Availability rule not found');

    const normalizedParams = this.normalizeRuleParams(params);
    this.validateRuleShape(normalizedParams);

    await this.availabilityRulesRepository.update(id, normalizedParams);

    return this.getByIdForActor(id, actor);
  }

  async listActiveRulesForUser(userId: string) {
    const rules = await this.availabilityRulesRepository.listByUserId(userId);
    return rules.filter((rule) => rule.is_active);
  }

  private normalizeRuleParams(
    params: CreateAvailabilityRuleDto | UpdateAvailabilityRuleDto,
  ): CreateAvailabilityRuleDto | UpdateAvailabilityRuleDto {
    if (params.rule_type === 'weekly_window') {
      return {
        ...params,
        time_zone: params.time_zone ?? DEFAULT_SCHEDULING_TIMEZONE,
        date_start: null,
        date_end: null,
      };
    } else if (params.rule_type === 'blackout_window') {
      return {
        ...params,
        day_of_week: null,
        start_time: null,
        end_time: null,
        time_zone: null,
      };
    }

    return params;
  }

  private validateRuleShape(params: CreateAvailabilityRuleDto | UpdateAvailabilityRuleDto) {
    if (params.rule_type === 'weekly_window') {
      if (
        params.day_of_week === undefined ||
        params.start_time === undefined ||
        params.end_time === undefined ||
        params.time_zone === undefined
      ) {
        throw new BadRequestException(
          'Weekly window rules require day_of_week, start_time, end_time, and time_zone',
        );
      }
    } else if (params.rule_type === 'blackout_window') {
      if (params.date_start === undefined || params.date_end === undefined) {
        throw new BadRequestException('Blackout window rules require date_start and date_end');
      }
    }
  }
}
