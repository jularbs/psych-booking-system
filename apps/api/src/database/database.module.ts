import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { Database } from './database.types';
export const KYSELY = Symbol('KYSELY_DB');
@Global()
@Module({
  providers: [
    {
      provide: KYSELY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('databaseUrl');
        return new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString,
              max: 10,
            }),
          }),
        });
      },
    },
  ],
  exports: [KYSELY],
})
export class DatabaseModule {}
