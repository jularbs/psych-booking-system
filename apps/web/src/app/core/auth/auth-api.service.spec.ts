import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientService } from '../api/api-client.service';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  const apiClientMock = {
    post: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: apiClientMock }],
    });

    service = TestBed.inject(AuthApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calls /auth/login with the provided payload', () => {
    const payload = { email: 'alice@example.com', password: 'Password123!' };
    const response = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    apiClientMock.post.mockReturnValue(of(response));

    service.login(payload).subscribe();

    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/login', payload);
  });

  it('returns the api client response observable', async () => {
    const payload = { email: 'alice@example.com', password: 'Password123!' };
    const response = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    apiClientMock.post.mockReturnValue(of(response));

    await expect(firstValueFrom(service.login(payload))).resolves.toEqual(response);
  });
});
