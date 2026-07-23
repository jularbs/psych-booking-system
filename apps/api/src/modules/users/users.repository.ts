import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KYSELY } from '../../database/database.module';
import { Database, UserRole, UsersTable } from '../../database/database.types';
import { randomUUID } from 'crypto';
@Injectable()
export class UsersRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  findByEmail(email: string): Promise<UsersTable | undefined> {
    return this.db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
  }

  findById(id: string): Promise<UsersTable | undefined> {
    return this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(params: {
    email: string;
    password_hash: string;
    role?: UserRole;
  }): Promise<UsersTable> {
    const now = new Date().toISOString();

    const newUser: UsersTable = {
      id: randomUUID(),
      email: params.email.toLowerCase(),
      password_hash: params.password_hash,
      role: params.role ?? 'GUEST',
      refresh_token_hash: null,
      created_at: now,
      updated_at: now,
    };

    await this.db.insertInto('users').values(newUser).execute();

    return newUser;
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ refresh_token_hash: refreshTokenHash, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }
}
