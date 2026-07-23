import { Controller, Post, Get, Req, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshJwtGuard } from '../../common/guards/refresh-jwt.guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user?: { sub?: string } }) {
    const userid = req.user?.sub;

    if (!userid) {
      throw new UnauthorizedException('User ID not found in request');
    }
    const user = await this.authService.me(userid);

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refresh(@Req() req: { user?: { sub?: string; refreshToken?: string } }) {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;

    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Refresh token not found in request');
    }

    return this.authService.refresh(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.authService.logout(userId);

    return {
      success: true,
    };
  }
}
