import { Inject, Injectable } from '@nestjs/common';

import { Database, AvailabilityRulesTable } from '../../database/database.types';
import { KYSELY } from '../../database/database.module';
import { Insertable, Kysely, Selectable, Updateable } from 'kysely';

@Injectable()
export class AvailabilityRulesRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  findById(id: string): Promise<Selectable<AvailabilityRulesTable> | undefined> {
    return this.db
      .selectFrom('availability_rules')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<AvailabilityRulesTable> | undefined> {
    return this.db
      .selectFrom('availability_rules')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  listByUserId(userId: string): Promise<Selectable<AvailabilityRulesTable>[]> {
    return this.db
      .selectFrom('availability_rules')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
  }

  async create(
    params: Insertable<AvailabilityRulesTable>,
  ): Promise<Selectable<AvailabilityRulesTable>> {
    const [createdRule] = await this.db
      .insertInto('availability_rules')
      .values(params)
      .returningAll()
      .execute();

    return createdRule;
  }

  async update(id: string, params: Updateable<AvailabilityRulesTable>): Promise<void> {
    await this.db
      .updateTable('availability_rules')
      .set({ ...params, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
