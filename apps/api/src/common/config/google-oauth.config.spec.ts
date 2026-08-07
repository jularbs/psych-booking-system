import { getGoogleOAuthConfig } from './google-oauth.config';
describe('getGoogleOAuthConfig', () => {
  it('parses google oauth config from env', () => {
    const result = getGoogleOAuthConfig({
      GOOGLE_OAUTH_CLIENT_ID: 'test-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_OAUTH_REDIRECT_URI: 'http://localhost:3000/callback',
      GOOGLE_OAUTH_SCOPES:
        'openid,email,profile,https://www.googleapis.com/auth/calendar.calendarlist.readonly,https://www.googleapis.com/auth/calendar.freebusy',
    });

    expect(result).toEqual({
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
    });
  });
});
