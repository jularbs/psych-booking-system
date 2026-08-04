import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PasswordService } from './password.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { AuthTokenResponse, JwtPayload } from './auth.types';
import { UsersTable } from '../../database/database.types';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async issueAndPersistTokens(user: UsersTable): Promise<AuthTokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('jwtSecret');
    const jwtRefreshSecret = this.configService.get<string>('jwtRefreshSecret');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // 1 hour
      secret: jwtSecret,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      jwtid: randomUUID(),
      secret: jwtRefreshSecret,
    });

    const hashedRefreshToken = this.passwordService.hashRefreshToken(refreshToken);
    await this.usersService.updateRefreshTokenHash(user.id, hashedRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour in seconds
    };
  }

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.usersService.create({
      email: dto.email,
      password_hash: passwordHash,
      role: dto.role,
    });

    return this.issueAndPersistTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordIsValid = await this.passwordService.verify(dto.password, user.password_hash);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAndPersistTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  async me(userId: string): Promise<UsersTable | undefined> {
    return this.usersService.findById(userId);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokenResponse> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await this.passwordService.verifyRefreshToken(
      refreshToken,
      user.refresh_token_hash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAndPersistTokens(user);
  }
}
