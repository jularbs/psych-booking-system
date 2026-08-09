import { Body, Controller, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { GoogleCalendarAvailabilityService } from './google-calendar-availability.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryGoogleCalendarAvailabilityDto } from './dto/query-google-calendar-availability.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('google-calendar/availability')
export class GoogleCalendarAvailabilityController {
  constructor(private readonly availabilityService: GoogleCalendarAvailabilityService) {}

  @Post('query')
  queryAvailability(
    @CurrentUser('sub') userId: string | undefined,
    @Body() dto: QueryGoogleCalendarAvailabilityDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.availabilityService.queryMyAvailability({
      user_id: userId,
      time_min: dto.time_min,
      time_max: dto.time_max,
      time_zone: dto.time_zone,
    });
  }
}
