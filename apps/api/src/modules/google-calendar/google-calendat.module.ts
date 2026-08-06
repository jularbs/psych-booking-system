import { Module } from '@nestjs/common';

import { GoogleCalendarConnectionsController } from './google-calendar-connections.controller';
import { GoogleCalendarConnectionsRepository } from './google-calendar-connections.repository';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';

@Module({
  controllers: [GoogleCalendarConnectionsController],
  providers: [GoogleCalendarConnectionsRepository, GoogleCalendarConnectionsService],
  exports: [GoogleCalendarConnectionsService],
})
export class GoogleCalendarModule {}
