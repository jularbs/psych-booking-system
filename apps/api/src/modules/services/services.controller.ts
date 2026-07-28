import { Controller, Get, Param, UseGuards, Post, Body, Patch } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { ServicesService } from './services.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listPublic() {
    return this.servicesService.listPublic();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Get('manage')
  listAll() {
    return this.servicesService.listAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.servicesService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.servicesService.deactivate(id);
  }
}
