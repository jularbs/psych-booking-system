import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../database/database.types';

export const ROLES_KEY = 'roles';
export const Roles = (...args: UserRole[]) => SetMetadata(ROLES_KEY, args);
