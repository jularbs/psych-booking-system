import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Kysely } from 'kysely';
import { Pool } from 'pg';

import { AppModule } from '../app/app.module';
import { Database } from '../database/database.types';
import { KYSELY } from '../database/database.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';

const testEnvPath = resolve(process.cwd(), '.env.test');

if (existsSync(testEnvPath)) {
  loadEnv({ path: testEnvPath, override: true });
}

const bootstrappedDatabaseUrls = new Map<string, Promise<void>>();

function getWorkspaceRoot(fromDir: string): string {
  let current = fromDir;

  while (true) {
    if (existsSync(resolve(current, 'nx.json'))) {
      return current;
    }

    const parent = resolve(current, '..');
    if (parent === current) {
      throw new Error('Unable to locate workspace root (nx.json not found).');
    }

    current = parent;
  }
}

function getWorkerId(): string {
  return process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? '1';
}

function toWorkerDatabaseUrl(baseDatabaseUrl: string): string {
  const parsed = new URL(baseDatabaseUrl);
  const baseDbName = parsed.pathname.replace(/^\/+/, '');

  if (!baseDbName) {
    throw new Error('DATABASE_URL must include a database name in the path.');
  }

  parsed.pathname = `/${baseDbName}_w${getWorkerId()}`;
  return parsed.toString();
}

async function ensureDatabaseExists(connectionString: string): Promise<void> {
  const parsed = new URL(connectionString);
  const databaseName = parsed.pathname.replace(/^\/+/, '');

  parsed.pathname = '/postgres';

  const adminPool = new Pool({ connectionString: parsed.toString() });

  try {
    const existing = await adminPool.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [databaseName],
    );

    if (existing.rows[0]?.exists) {
      return;
    }

    const escapedName = databaseName.replace(/"/g, '""');
    await adminPool.query(`CREATE DATABASE "${escapedName}"`);
  } finally {
    await adminPool.end();
  }
}

function runMigrations(connectionString: string): void {
  const workspaceRoot = getWorkspaceRoot(process.cwd());
  const result = spawnSync('dbmate', ['--url', connectionString, 'up'], {
    cwd: workspaceRoot,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `dbmate migration failed for ${connectionString}\n${result.stdout}\n${result.stderr}`,
    );
  }
}

async function ensureWorkerDatabaseReady(): Promise<void> {
  const baseDatabaseUrl = process.env.DATABASE_URL;

  if (!baseDatabaseUrl) {
    throw new Error('DATABASE_URL is required for integration tests.');
  }

  const workerDatabaseUrl = toWorkerDatabaseUrl(baseDatabaseUrl);
  process.env.DATABASE_URL = workerDatabaseUrl;

  const existing = bootstrappedDatabaseUrls.get(workerDatabaseUrl);
  if (existing) {
    await existing;
    return;
  }

  const bootstrapPromise = (async () => {
    await ensureDatabaseExists(workerDatabaseUrl);
    runMigrations(workerDatabaseUrl);
  })();

  bootstrappedDatabaseUrls.set(workerDatabaseUrl, bootstrapPromise);
  await bootstrapPromise;
}

export interface TestAppContext {
  app: INestApplication;
  db: Kysely<Database>;
}

export async function createTestApp(): Promise<TestAppContext> {
  await ensureWorkerDatabaseReady();

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
