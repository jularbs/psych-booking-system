import { Inject, Injectable } from '@nestjs/common';
import { KYSELY } from '../../database/database.module';
import { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import { Database, GoogleCalendarConnectionsTable } from '../../database/database.types';

@Injectable()
export class GoogleCalendarConnectionsRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<Selectable<GoogleCalendarConnectionsTable> | undefined> {
    return this.db
      .selectFrom('google_calendar_connections')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByUserId(
    userId: string,
  ): Promise<Selectable<GoogleCalendarConnectionsTable> | undefined> {
    return this.db
      .selectFrom('google_calendar_connections')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  async create(
    params: Insertable<GoogleCalendarConnectionsTable>,
  ): Promise<Selectable<GoogleCalendarConnectionsTable>> {
    return this.db
      .insertInto('google_calendar_connections')
      .values(params)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, params: Updateable<GoogleCalendarConnectionsTable>): Promise<void> {
    await this.db
      .updateTable('google_calendar_connections')
      .set({ ...params, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .execute();
  }
}
