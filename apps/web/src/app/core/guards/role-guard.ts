import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthzService, type AppRole } from '../auth/authz.service';

export const roleGuard: CanMatchFn = (route) => {
  const authzService = inject(AuthzService);
  const router = inject(Router);

  const roles = (route.data?.['roles'] as AppRole[] | undefined) ?? [];

  if (roles.length === 0) {
    return true;
  }

  if (authzService.hasAnyRole(roles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
