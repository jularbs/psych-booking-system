import { Controller, Get, Post, Body, UnauthorizedException, UseGuards, Req } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshJwtGuard } from '../../common/guards/refresh-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthenticatedUser = {
  sub: string;
  email: string;
  role: string;
  refreshToken?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  refresh(@Req() req: { user?: { sub?: string; refreshToken?: string } }) {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;

    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.authService.refresh(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser('sub') userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.authService.logout(userId);

    return {
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.authService.me(userId);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
  @Get('staff-area')
  staffArea(@CurrentUser() user?: AuthenticatedUser) {
    return {
      message: 'Staff access granted',
      user: {
        id: user?.sub,
        email: user?.email,
        role: user?.role,
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @Get('admin-area')
  adminArea(@CurrentUser() user?: AuthenticatedUser) {
    return {
      message: 'Admin access granted',
      user: {
        id: user?.sub,
        email: user?.email,
        role: user?.role,
      },
    };
  }
}
