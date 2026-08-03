import { Kysely, sql } from 'kysely';

import { Database } from '../database/database.types';

const TABLES = ['services', 'users'];

export async function resetTestDb(db: Kysely<Database>) {
  for (const table of TABLES) {
    await sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`).execute(db);
  }
}
