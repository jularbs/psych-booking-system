import { Inject, Injectable } from '@nestjs/common';
import { KYSELY } from '../../database/database.module';
import { Database, BookingsTable } from '../../database/database.types';
import { Kysely, Insertable, Selectable } from 'kysely';

@Injectable()
export class BookingsRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  findById(id: string): Promise<Selectable<BookingsTable> | undefined> {
    return this.db.selectFrom('bookings').selectAll().where('id', '=', id).executeTakeFirst();
  }

  listByUserId(userId: string): Promise<Selectable<BookingsTable>[]> {
    return this.db.selectFrom('bookings').selectAll().where('user_id', '=', userId).execute();
  }

  async create(params: Insertable<BookingsTable>): Promise<Selectable<BookingsTable>> {
    const [createdBooking] = await this.db
      .insertInto('bookings')
      .values(params)
      .returningAll()
      .execute();

    return createdBooking;
  }
}
