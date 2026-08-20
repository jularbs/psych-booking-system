import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('me')
  async listMine(@CurrentUser('sub') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.bookingsService.listMine(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.bookingsService.getById(id);
  }

  @Post()
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateBookingDto) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.bookingsService.create({ user_id: userId, ...dto });
  }
}
