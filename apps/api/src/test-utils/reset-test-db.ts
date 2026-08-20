import { Kysely, sql } from 'kysely';

import { Database } from '../database/database.types';

const TABLES = [
  'services',
  'users',
  'google_calendar_connections',
  'availability_rules',
  'bookings',
] as const;

export async function resetTestDb(db: Kysely<Database>) {
  for (const table of TABLES) {
    await sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`).execute(db);
  }
}
