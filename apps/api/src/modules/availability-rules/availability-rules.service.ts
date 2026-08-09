import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AvailabilityRulesRepository } from './availability-rules.repository';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';

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

  async create(user_id: string, params: CreateAvailabilityRuleDto) {
    this.validateRuleShape(params);

    return this.availabilityRulesRepository.create({
      user_id: user_id,
      rule_type: params.rule_type,
      description: params.description ?? null,
      day_of_week: params.day_of_week ?? null,
      start_time: params.start_time ?? null,
      end_time: params.end_time ?? null,
      date_start: params.date_start ?? null,
      date_end: params.date_end ?? null,
      is_active: params.is_active ?? true,
    });
  }

  async update(id: string, params: UpdateAvailabilityRuleDto) {
    const existing = await this.availabilityRulesRepository.findById(id);

    if (!existing) throw new NotFoundException('Availability rule not found');

    this.validateRuleShape(params);

    await this.availabilityRulesRepository.update(id, params);

    return this.getById(id);
  }

  async listActiveRulesForUser(userId: string) {
    const rules = await this.availabilityRulesRepository.listByUserId(userId);
    return rules.filter((rule) => rule.is_active);
  }

  private validateRuleShape(params: CreateAvailabilityRuleDto | UpdateAvailabilityRuleDto) {
    if (params.rule_type === 'weekly_window') {
      if (
        params.day_of_week === undefined ||
        params.start_time === undefined ||
        params.end_time === undefined
      ) {
        throw new BadRequestException(
          'Weekly window rules require day_of_week, start_time, and end_time',
        );
      }
    } else if (params.rule_type === 'blackout_window') {
      if (params.date_start === undefined || params.date_end === undefined) {
        throw new BadRequestException('Blackout window rules require date_start and date_end');
      }
    }
  }
}
