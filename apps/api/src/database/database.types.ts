import { Generated } from 'kysely';

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
  id: Generated<string>;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: string;
  currency: string;
  is_active: boolean;
  created_at: Generated<string>;
  updated_at: Generated<string> | string;
}

export interface Database {
  users: UsersTable;
  services: ServicesTable;
}
