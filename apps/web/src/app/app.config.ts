import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { API_BASE_URL } from './core/api/api.config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { SessionBootstrapService } from './core/auth/session-bootstrap.service';

function initializeSession(): Promise<unknown> {
  const sessionBootstrapService = inject(SessionBootstrapService);
  return firstValueFrom(sessionBootstrapService.bootstrap(), { defaultValue: null });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideAppInitializer(initializeSession),
  ],
};
