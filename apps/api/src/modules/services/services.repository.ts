import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, Selectable } from 'kysely';
import { KYSELY } from '../../database/database.module';
import { Database, ServicesTable } from '../../database/database.types';

@Injectable()
export class ServicesRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  listAll(): Promise<Selectable<ServicesTable>[]> {
    return this.db.selectFrom('services').selectAll().orderBy('created_at', 'desc').execute();
  }

  listActive(): Promise<Selectable<ServicesTable>[]> {
    return this.db
      .selectFrom('services')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .execute();
  }

  findById(id: string): Promise<Selectable<ServicesTable> | undefined> {
    return this.db.selectFrom('services').selectAll().where('id', '=', id).executeTakeFirst();
  }

  findBySlug(slug: string): Promise<Selectable<ServicesTable> | undefined> {
    return this.db.selectFrom('services').selectAll().where('slug', '=', slug).executeTakeFirst();
  }

  create(service: Insertable<ServicesTable>): Promise<Selectable<ServicesTable>> {
    return this.db.insertInto('services').values(service).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: string, service: Partial<Insertable<ServicesTable>>): Promise<void> {
    await this.db
      .updateTable('services')
      .set({ ...service, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
