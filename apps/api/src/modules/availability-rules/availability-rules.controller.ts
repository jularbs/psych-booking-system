import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AvailabilityRulesService } from './availability-rules.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UserRole } from '../../database/database.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('availability-rules')
export class AvailabilityRulesController {
  constructor(private readonly availabilityRulesService: AvailabilityRulesService) {}

  @Get('me')
  listMine(@CurrentUser('sub') user_id: string | undefined) {
    if (!user_id) {
      throw new UnauthorizedException('User ID is not available in the request context.');
    }

    return this.availabilityRulesService.listMine(user_id);
  }

  @Post()
  async create(
    @CurrentUser('sub') user_id: string | undefined,
    @Body() dto: CreateAvailabilityRuleDto,
  ) {
    if (!user_id) {
      throw new UnauthorizedException('User ID is not available in the request context.');
    }

    return this.availabilityRulesService.create(user_id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') userId: string | undefined,
    @CurrentUser('role') role: UserRole | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityRuleDto,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User ID or role is not available in the request context.');
    }

    return this.availabilityRulesService.update({ userId, role }, id, dto);
  }
}
