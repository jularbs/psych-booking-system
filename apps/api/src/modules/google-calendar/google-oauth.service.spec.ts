import { GoogleOAuthService } from './google-oauth.service';

describe('GoogleOauthService', () => {
  let service: GoogleOAuthService;

  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ],
    appBaseUrl: 'http://localhost:4200',
  };

  const oauthClientFactory = {
    create: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleOAuthService(config, oauthClientFactory as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds authorization url with scope string', () => {
    const generateAuthUrl = vi
      .fn()
      .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?x=1');

    oauthClientFactory.create.mockReturnValue({
      generateAuthUrl,
    });

    const url = service.buildAuthorizationUrl('state-123');
    expect(generateAuthUrl).toHaveBeenCalledWith({
      access_type: 'offline',
      include_granted_scopes: true,
      response_type: 'code',
      scope:
        'openid email profile https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.freebusy',
      state: 'state-123',
      prompt: 'consent',
    });
    expect(url).toContain('https://accounts.google.com/o/oauth2');
  });

  it('exchanges code for tokens correctly', async () => {
    const getToken = vi.fn().mockResolvedValue({
      tokens: {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expiry_date: 1234567890,
        scope:
          'openid email profile https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.freebusy',
      },
    });

    oauthClientFactory.create.mockReturnValue({ getToken });

    const tokens = await service.exchangeCodeForTokens('auth-code-123');

    expect(tokens.access_token).toBe('access-token-123');
    expect(tokens.refresh_token).toBe('refresh-token-456');
  });
});
