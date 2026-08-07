export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  appBaseUrl: string;
}

export function getGoogleOAuthConfig(env: NodeJS.ProcessEnv): GoogleOAuthConfig {
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID ?? '',
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI ?? '',
    scopes: (env.GOOGLE_OAUTH_SCOPES ?? '')
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean),
    appBaseUrl: env.APP_BASE_URL ?? 'http://localhost:4200',
  };
}
