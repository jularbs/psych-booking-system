import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GoogleOAuthAuthorizeDto } from './dto/google-oauth-authorize.dto';
import { GoogleOAuthCallbackQueryDto } from './dto/google-oauth-callback-query.dto';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleCalendarProviderService } from './google-calendar-provider.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthStateService } from './google-oauth-state.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('google-calendar')
export class GoogleCalendarOAuthController {
  constructor(
    private readonly oauthService: GoogleOAuthService,
    private readonly providerService: GoogleCalendarProviderService,
    private readonly connectionsService: GoogleCalendarConnectionsService,
    private readonly stateService: GoogleOAuthStateService,
  ) {}

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
  async callback(@Query() query: GoogleOAuthCallbackQueryDto) {
    if (query.error) {
      throw new UnauthorizedException(`Google OAuth failed: ${query.error}`);
    }

    const state = this.stateService.parseState(query.state);
    const tokens = await this.oauthService.exchangeCodeForTokens(query.code);

    if (!tokens.access_token) {
      throw new UnauthorizedException('Google OAuth did not return an access token');
    }

    const profile = await this.providerService.getProfile(tokens.access_token);

    const connection = await this.connectionsService.upsertOAuthConnectionForUser({
      user_id: state.user_id,
      google_email: profile.email,
      provider_subject: profile.sub,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? null,
    });

    return {
      success: true,
      return_to: state.return_to,
      connection_id: connection.id,
    };
  }

  @Get('connections/:id/calendars')
  listCalendars(@Param('id') id: string) {
    return this.connectionsService.listAvailableCalendars(id);
  }
}
