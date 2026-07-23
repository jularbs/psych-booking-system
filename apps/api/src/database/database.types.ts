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

export interface Database {
  users: UsersTable;
}
