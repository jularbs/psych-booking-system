import { ColumnType, GeneratedAlways } from 'kysely';

export type UserRole = 'PLATFORM_ADMIN' | 'PSYCHOLOGIST' | 'ASSISTANT' | 'PATIENT' | 'GUEST';

export interface UsersTable {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  refresh_token_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServicesTable {
  id: GeneratedAlways<string>;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: string;
  currency: string;
  is_active: boolean;
  created_at: GeneratedAlways<string>;
  updated_at: ColumnType<string, never, string>;
}

export interface Database {
  users: UsersTable;
  services: ServicesTable;
}
