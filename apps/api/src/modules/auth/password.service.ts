import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  constructor(private readonly configService: ConfigService) {}

  private getJwtRefreshSecret(): string {
    const secret = this.configService.get<string>('jwtRefreshSecret');
    if (!secret) {
      throw new Error('JWT refresh secret is not defined in the environment variables.');
    }
    return secret;
  }

  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, PasswordService.SALT_ROUNDS);
  }

  async verify(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', this.getJwtRefreshSecret()).update(refreshToken).digest('hex');
  }

  verifyRefreshToken(refreshToken: string, hashedRefreshToken: string): boolean {
    const computedHash = this.hashRefreshToken(refreshToken);

    try {
      return timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hashedRefreshToken, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
