import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { SessionBootstrapService } from './core/auth/session-bootstrap.service';
import { API_BASE_URL } from './core/api/api.config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor, authRefreshInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideAppInitializer(() => {
      const sessionBootstrapService = inject(SessionBootstrapService);
      return sessionBootstrapService.bootstrap();
    }),
  ],
};
