import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const appRoutes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'booking',
        canMatch: [roleGuard],
        data: {
          roles: ['PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT'],
        },
        loadComponent: () =>
          import('./features/booking/pages/booking-home.component').then(
            (m) => m.BookingHomeComponent,
          ),
      },
      {
        path: 'services/manage',
        canMatch: [roleGuard],
        data: {
          roles: ['PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT'],
        },
        loadComponent: () =>
          import('./features/services/pages/services-manage/services-manage.component').then(
            (m) => m.ServicesManageComponent,
          ),
      },
      {
        path: 'admin',
        canMatch: [roleGuard],
        data: {
          roles: ['PLATFORM_ADMIN'],
        },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
