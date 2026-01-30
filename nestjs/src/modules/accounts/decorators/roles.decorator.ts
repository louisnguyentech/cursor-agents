import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '../schemas/account.schema';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles);
