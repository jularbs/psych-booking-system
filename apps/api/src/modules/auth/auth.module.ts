import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { UsersModule } from '../users/users.module';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RefreshJwtStrategy } from './refresh-jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: parseInt(process.env.JWT_ACCESS_TTL ?? '3600') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy, RefreshJwtStrategy],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
