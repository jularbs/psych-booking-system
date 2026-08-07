import { Injectable, UnauthorizedException } from '@nestjs/common';

interface GoogleOAuthStatePayload {
  user_id: string;
  return_to?: string;
}

@Injectable()
export class GoogleOAuthStateService {
  createState(payload: GoogleOAuthStatePayload): string {
    return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  }

  parseState(state: string): GoogleOAuthStatePayload {
    try {
      const parsed = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf-8'),
      ) as GoogleOAuthStatePayload;

      if (!parsed.user_id || !parsed.return_to) {
        throw new Error('Invalid state payload');
      }

      return parsed;
    } catch {
      throw new UnauthorizedException('Invalid OAuth state');
    }
  }
}
