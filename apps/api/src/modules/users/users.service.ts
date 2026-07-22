import { Injectable } from '@nestjs/common';

import { UserRole, UsersTable } from '../../database/database.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<UsersTable | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UsersTable | undefined> {
    return this.usersRepository.findById(id);
  }

  create(params: { email: string; password_hash: string; role?: UserRole }): Promise<UsersTable> {
    return this.usersRepository.create(params);
  }
}
