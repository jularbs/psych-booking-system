import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleOAuthRedirectService {
  buildSuccessRedirectUrl(appBaseUrl: string, returnTo: string, connectionId: string): string {
    const url = new URL(returnTo, appBaseUrl);
    url.searchParams.set('oauth', 'success');
    url.searchParams.set('connectionId', connectionId);

    return url.toString();
  }

  buildErrorRedirectUrl(appBaseUrl: string, returnTo: string, reason: string): string {
    const url = new URL(returnTo, appBaseUrl);
    url.searchParams.set('oauth', 'error');
    url.searchParams.set('reason', reason);

    return url.toString();
  }
}
