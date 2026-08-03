import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Kysely } from 'kysely';

import { AppModule } from '../app/app.module';
import { Database } from '../database/database.types';
import { KYSELY } from '../database/database.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';

const testEnvPath = resolve(process.cwd(), '.env.test');

if (existsSync(testEnvPath)) {
  loadEnv({ path: testEnvPath, override: false });
}
export interface TestAppContext {
  app: INestApplication;
  db: Kysely<Database>;
}

export async function createTestApp(): Promise<TestAppContext> {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = testingModule.createNestApplication();
  const db = app.get<Kysely<Database>>(KYSELY);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.init();

  return {
    app,
    db,
  };
}
