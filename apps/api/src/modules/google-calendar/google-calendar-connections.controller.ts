import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateCalendarSelectionDto } from './dto/update-calendar-selection.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('google-calendar/connections')
export class GoogleCalendarConnectionsController {
  constructor(private readonly service: GoogleCalendarConnectionsService) {}

  @Get('me')
  async getMine(@CurrentUser('sub') userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID is missing');
    }

    return this.service.getByUserId(userId);
  }

  @Post()
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateConnectionDto) {
    if (!userId) {
      throw new UnauthorizedException('User ID is missing');
    }

    return this.service.create({
      user_id: userId,
      google_email: dto.google_email,
      provider_subject: dto.provider_subject,
    });
  }

  @Patch(':id/calendar-selection')
  updateCalendarSelection(@Param('id') id: string, @Body() dto: UpdateCalendarSelectionDto) {
    return this.service.updateCalendarSelection(id, dto);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.service.revoke(id);
  }
}
