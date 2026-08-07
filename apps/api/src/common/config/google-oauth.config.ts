export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
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
  };
}
