import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthRedirectService } from './google-oauth-redirect.service';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GoogleOAuthAuthorizeDto } from './dto/google-oauth-authorize.dto';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleCalendarProviderService } from './google-calendar-provider.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthStateService } from './google-oauth-state.service';
@Controller('google-calendar')
export class GoogleCalendarOAuthController {
  constructor(
    private readonly oauthService: GoogleOAuthService,
    private readonly providerService: GoogleCalendarProviderService,
    private readonly connectionsService: GoogleCalendarConnectionsService,
    private readonly stateService: GoogleOAuthStateService,
    private readonly redirectService: GoogleOAuthRedirectService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Post('oauth/authorize')
  async authorize(
    @CurrentUser('sub') user_id: string | undefined,
    @Body() dto: GoogleOAuthAuthorizeDto,
  ) {
    if (!user_id) {
      throw new UnauthorizedException('Unauthorized');
    }

    const state = this.stateService.createState({
      user_id,
      return_to: dto.return_to ?? '/google-calendar/connection',
    });

    return {
      authorization_url: this.oauthService.buildAuthorizationUrl(state),
    };
  }

  @Get('oauth/callback')
  async callback(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ) {
    const appBaseUrl = this.oauthService.getAppBaseUrl();

    const code = this.getSingleQueryValue(query.code);
    const state = this.getSingleQueryValue(query.state);
    const error = this.getSingleQueryValue(query.error);

    if (error) {
      const fallbackReturnTo = '/google-calendar/connection';
      const redirectUrl = this.redirectService.buildErrorRedirectUrl(
        appBaseUrl,
        fallbackReturnTo,
        error,
      );

      res.redirect(302, redirectUrl);
      return;
    }

    if (!code || !state) {
      const redirectUrl = this.redirectService.buildErrorRedirectUrl(
        appBaseUrl,
        '/google-calendar/connection',
        'missing_code_or_state',
      );

      res.redirect(302, redirectUrl);
      return;
    }

    try {
      const parsedState = this.stateService.parseState(state);
      const tokens = await this.oauthService.exchangeCodeForTokens(code);

      if (!tokens.access_token) {
        const redirectUrl = this.redirectService.buildErrorRedirectUrl(
          appBaseUrl,
          parsedState.return_to ?? '/google-calendar/connection',
          'missing_access_token',
        );

        res.redirect(302, redirectUrl);
        return;
      }

      const profile = await this.providerService.getProfile(tokens.access_token);

      const connection = await this.connectionsService.upsertOAuthConnectionForUser({
        user_id: parsedState.user_id,
        google_email: profile.email,
        provider_subject: profile.sub,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope ?? null,
      });

      const redirectUrl = this.redirectService.buildSuccessRedirectUrl(
        appBaseUrl,
        parsedState.return_to ?? '/google-calendar/connection',
        connection.id,
      );

      res.redirect(302, redirectUrl);
    } catch {
      const redirectUrl = this.redirectService.buildErrorRedirectUrl(
        appBaseUrl,
        '/google-calendar/connection',
        'oauth_callback_failed',
      );

      res.redirect(302, redirectUrl);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Get('connections/:id/calendars')
  listCalendars(@Param('id') id: string) {
    return this.connectionsService.listAvailableCalendars(id);
  }

  private getSingleQueryValue(value: string | string[] | undefined): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      return typeof first === 'string' && first.trim().length > 0 ? first : null;
    }

    return null;
  }
}
