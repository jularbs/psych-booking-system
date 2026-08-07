import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

export interface GoogleOAuthClientLike {
  generateAuthUrl(options: Record<string, unknown>): string;
  getToken(code: string): Promise<{
    tokens: {
      access_token?: string | null;
      refresh_token?: string | null;
      expiry_date?: number | null;
      scope?: string | null;
      id_token?: string | null;
    };
  }>;
}

export interface GoogleOAuthClientFactory {
  create(): GoogleOAuthClientLike;
}

export interface GoogleOAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export const GOOGLE_OAUTH_RUNTIME_CONFIG = 'GOOGLE_OAUTH_RUNTIME_CONFIG';
export const GOOGLE_OAUTH_CLIENT_FACTORY = 'GOOGLE_OAUTH_CLIENT_FACTORY';

@Injectable()
export class GoogleOAuthService {
  constructor(
    @Inject(GOOGLE_OAUTH_RUNTIME_CONFIG) private readonly config: GoogleOAuthRuntimeConfig,
    @Inject(GOOGLE_OAUTH_CLIENT_FACTORY)
    private readonly oauthClientFactory: GoogleOAuthClientFactory,
  ) {}

  buildAuthorizationUrl(state: string): string {
    this.assertConfigured();
    const client = this.oauthClientFactory.create();

    return client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      response_type: 'code',
      state,
      prompt: 'consent',
    });
  }

  async exchangeCodeForTokens(code: string): Promise<{
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    scope?: string | null;
    id_token?: string | null;
  }> {
    this.assertConfigured();
    const client = this.oauthClientFactory.create();
    const response = await client.getToken(code);

    return {
      access_token: response.tokens.access_token ?? null,
      refresh_token: response.tokens.refresh_token ?? null,
      expiry_date: response.tokens.expiry_date ?? null,
      scope: response.tokens.scope ?? null,
      id_token: response.tokens.id_token ?? null,
    };
  }

  private assertConfigured(): void {
    if (
      !this.config.clientId ||
      !this.config.clientSecret ||
      !this.config.redirectUri ||
      this.config.scopes.length === 0
    ) {
      throw new InternalServerErrorException('Google OAuth is not configured properly');
    }
  }
}
