import { UserRole } from '../../database/database.types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}
