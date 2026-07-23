import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, PasswordService.SALT_ROUNDS);
  }

  async verify(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
