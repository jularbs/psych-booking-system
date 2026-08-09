import { ColumnType, GeneratedAlways } from 'kysely';

export const USER_ROLES = [
  'PLATFORM_ADMIN',
  'PSYCHOLOGIST',
  'ASSISTANT',
  'PATIENT',
  'GUEST',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const GOOGLE_CALENDAR_CONNECTION_STATUS = ['pending', 'active', 'revoked', 'error'] as const;

export type GoogleCalendarConnectionStatus = (typeof GOOGLE_CALENDAR_CONNECTION_STATUS)[number];

export const AVAILABILITY_RULE_TYPES = ['weekly_window', 'blackout_window'] as const;

export type AvailabilityRuleType = (typeof AVAILABILITY_RULE_TYPES)[number];

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

export interface GoogleCalendarConnectionsTable {
  id: GeneratedAlways<string>;
  user_id: string;
  google_email: string;
  provider_subject: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  scope: string | null;
  calendar_id: string | null;
  calendar_summary: string | null;
  sync_token: string | null;
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_expiration: string | null;
  status: GoogleCalendarConnectionStatus;
  last_synced_at: string | null;
  created_at: GeneratedAlways<string>;
  updated_at: ColumnType<string, never, string>;
}

export interface AvailabilityRulesTable {
  id: GeneratedAlways<string>;
  user_id: string;
  rule_type: AvailabilityRuleType;
  description: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  date_start: string | null;
  date_end: string | null;
  is_active: boolean;
  created_at: GeneratedAlways<string>;
  updated_at: ColumnType<string, never, string>;
}
export interface Database {
  users: UsersTable;
  services: ServicesTable;
  google_calendar_connections: GoogleCalendarConnectionsTable;
  availability_rules: AvailabilityRulesTable;
}
