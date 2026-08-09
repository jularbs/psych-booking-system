import { ConflictException, Injectable } from '@nestjs/common';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleCalendarAdapterService } from './google-calendar-adapter.service';

@Injectable()
export class GoogleCalendarAvailabilityService {
  constructor(
    private readonly connectionService: GoogleCalendarConnectionsService,
    private readonly adapterService: GoogleCalendarAdapterService,
  ) {}

  async queryMyAvailability(params: {
    user_id: string;
    time_min: string;
    time_max: string;
    time_zone?: string;
  }) {
    const connection = await this.connectionService.getByUserId(params.user_id);

    if (!connection) {
      throw new ConflictException('Google Calendar connection not found for the user.');
    }

    if (connection.status !== 'active') {
      throw new ConflictException('Google Calendar connection is not active.');
    }

    if (!connection.access_token) {
      throw new ConflictException('Google Calendar connection does not have an access token.');
    }

    if (!connection.calendar_id) {
      throw new ConflictException('Google Calendar connection does not have a calendar ID.');
    }

    const busyCalendarTimes = await this.adapterService.getBusyTimes(connection.access_token, {
      calendar_ids: [connection.calendar_id],
      time_min: params.time_min,
      time_max: params.time_max,
      time_zone: params.time_zone ?? null,
    });

    return {
      calendar_id: connection.calendar_id,
      busy_times: busyCalendarTimes[connection.calendar_id] ?? [],
    };
  }
}
