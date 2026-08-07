import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { GoogleCalendarConnectionStatus } from '../../database/database.types';
import { GoogleCalendarConnectionsRepository } from './google-calendar-connections.repository';

@Injectable()
export class GoogleCalendarConnectionsService {
  constructor(private readonly repository: GoogleCalendarConnectionsRepository) {}

  async getByUserId(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async getById(id: string) {
    const connection = await this.repository.findById(id);
    if (!connection) {
      throw new NotFoundException(`Google Calendar connection with ID ${id} not found.`);
    }
    return connection;
  }

  async create(params: {
    user_id: string;
    google_email: string;
    provider_subject: string;
    status?: GoogleCalendarConnectionStatus;
  }) {
    const existing = await this.repository.findByUserId(params.user_id);
    if (existing) {
      throw new ConflictException(
        `Google Calendar connection for user ID ${params.user_id} already exists.`,
      );
    }

    return this.repository.create({
      ...params,
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      scope: null,
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      last_synced_at: null,
      status: params.status ?? 'pending',
    });
  }

  async updateCalendarSelection(
    id: string,
    params: {
      calendar_id: string;
      calendar_summary: string;
    },
  ) {
    await this.getById(id); // Ensure the connection exists
    await this.repository.update(id, { ...params, status: 'active' });

    return this.getById(id); // Return the updated connection
  }

  async revoke(id: string) {
    await this.getById(id);

    await this.repository.update(id, { status: 'revoked' });
    return this.getById(id); // Return the updated connection
  }
}
