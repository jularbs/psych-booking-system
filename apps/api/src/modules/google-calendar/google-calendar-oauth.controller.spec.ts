import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarOAuthController } from './google-calendar-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleOAuthStateService } from './google-oauth-state.service';
import { GoogleCalendarProviderService } from './google-calendar-provider.service';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleOAuthRedirectService } from './google-oauth-redirect.service';

describe('GoogleCalendarOAuthController', () => {
  let controller: GoogleCalendarOAuthController;

  const oauthService = {
    buildAuthorizationUrl: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    getAppBaseUrl: vi.fn(),
  };

  const providersService = {
    getProfile: vi.fn(),
  };

  const connectionService = {
    upsertOAuthConnectionForUser: vi.fn(),
    listAvailableCalendars: vi.fn(),
  };

  const stateService = {
    createState: vi.fn(),
    parseState: vi.fn(),
  };

  const redirectService = {
    buildSuccessRedirectUrl: vi.fn(),
    buildErrorRedirectUrl: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleCalendarOAuthController],
      providers: [
        { provide: GoogleOAuthService, useValue: oauthService },
        { provide: GoogleCalendarProviderService, useValue: providersService },
        { provide: GoogleCalendarConnectionsService, useValue: connectionService },
        { provide: GoogleOAuthStateService, useValue: stateService },
        { provide: GoogleOAuthRedirectService, useValue: redirectService },
      ],
    }).compile();

    controller = module.get<GoogleCalendarOAuthController>(GoogleCalendarOAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the authorization URL when calling the authorize endpoint', async () => {
    stateService.createState.mockReturnValue('mocked-state');
    oauthService.buildAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/o/oauth2/v2/auth?x=1',
    );

    const result = await controller.authorize('user-1', {
      return_to: 'google-calendar/connection',
    });

    expect(stateService.createState).toHaveBeenCalledWith({
      user_id: 'user-1',
      return_to: 'google-calendar/connection',
    });
    expect(oauthService.buildAuthorizationUrl).toHaveBeenCalledWith('mocked-state');
    expect(result).toEqual({
      authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?x=1',
    });
  });

  it('throws an error when authorize has no user', async () => {
    await expect(
      controller.authorize(undefined, {
        return_to: 'google-calendar/connection',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('redirects successfully after oauth callback', async () => {
    const res = {
      redirect: vi.fn(),
    };
    oauthService.getAppBaseUrl.mockReturnValue('http://localhost:4200');
    stateService.parseState.mockReturnValue({
      user_id: 'user-1',
      return_to: 'google-calendar/connection',
    });

    oauthService.exchangeCodeForTokens.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expiry_date: 3600,
      scope: 'openid email profile',
      id_token: 'id-token',
    });

    providersService.getProfile.mockResolvedValue({
      sub: 'google-sub-123',
      email: 'staff@gmail.com',
    });

    connectionService.upsertOAuthConnectionForUser.mockResolvedValue({
      id: 'connection-id',
    });

    await controller.callback(
      {
        code: 'auth-code',
        state: 'mocked-state',
      },
      res as never,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      redirectService.buildSuccessRedirectUrl(
        'http://localhost:4200',
        'google-calendar/connection',
        'connection-id',
      ),
    );
  });

  it('redirects with error after oauth callback if there is an error in the query', async () => {
    const res = {
      redirect: vi.fn(),
    };
    oauthService.getAppBaseUrl.mockReturnValue('http://localhost:4200');
    redirectService.buildErrorRedirectUrl.mockReturnValue(
      'http://localhost:4200/google-calendar/connection?oauth=error&reason=access_denied',
    );

    await controller.callback(
      {
        error: 'access_denied',
        code: 'auth-code',
        state: 'mocked-state',
      },
      res as never,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      redirectService.buildErrorRedirectUrl(
        'http://localhost:4200',
        '/google-calendar/connection',
        'access_denied',
      ),
    );
  });

  it('lists calendars for a connection', async () => {
    connectionService.listAvailableCalendars.mockResolvedValue([
      { id: 'calendar-1', summary: 'Work Calendar' },
      { id: 'calendar-2', summary: 'Personal Calendar' },
    ]);

    const result = await controller.listCalendars('connection-id');

    expect(connectionService.listAvailableCalendars).toHaveBeenCalledWith('connection-id');
    expect(result).toEqual([
      { id: 'calendar-1', summary: 'Work Calendar' },
      { id: 'calendar-2', summary: 'Personal Calendar' },
    ]);
  });
});
