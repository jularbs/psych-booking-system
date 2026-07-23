import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  const usersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateRefreshTokenHash: vi.fn(),
  };

  const passwordService = {
    hash: vi.fn(),
    verify: vi.fn(),
  };

  const jwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  let service: AuthService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: PasswordService,
          useValue: passwordService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register throws conflict if email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({ email: 'existing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register creates a new user and returns a token if email does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);
    passwordService.hash.mockResolvedValue('hashedPassword');
    usersService.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@example.com',
      password_hash: 'hashedPassword',
      role: 'GUEST',
      refresh_token_hash: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    jwtService.sign.mockReturnValueOnce('jwtToken').mockReturnValueOnce('refreshToken');

    const result = await service.register({
      email: 'newuser@example.com',
      password: 'password123!',
    });

    expect(passwordService.hash).toHaveBeenCalledWith('password123!');
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password_hash: 'hashedPassword',
      role: undefined,
    });
    expect(result).toEqual({
      access_token: 'jwtToken',
      refresh_token: 'refreshToken',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('login throws unauthorized if user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);

    await expect(
      service.login({ email: 'nonexistent@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login throws unauthorized if password is incorrect', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'existinguser@example.com',
      password_hash: 'hashedPassword',
      refresh_token_hash: null,
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'existinguser@example.com', password: 'wrongPassword' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login stores refresh token and returns tokens if credentials are correct', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password_hash: 'hashedPassword',
      refresh_token_hash: null,
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    jwtService.sign.mockReturnValueOnce('jwtToken').mockReturnValueOnce('refreshToken');

    const result = await service.login({ email: 'user@example.com', password: 'correctPassword' });

    expect(passwordService.verify).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
    expect(result).toEqual({
      access_token: 'jwtToken',
      refresh_token: 'refreshToken',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('refresh token throws unauthorized if user does not exist', async () => {
    usersService.findById.mockResolvedValue(undefined);

    await expect(service.refresh('missing-user-id', 'someRefreshToken')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh token throws unauthorized if refresh token is missing', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password_hash: 'hashedPassword',
      refresh_token_hash: null,
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await expect(service.refresh('user-id', 'someRefreshToken')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh token throws unauthorized if refresh token is invalid', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password_hash: 'hashedPassword',
      refresh_token_hash: 'hashedRefreshToken',
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(service.refresh('user-id', 'invalidRefreshToken')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh token returns new tokens if refresh token is valid', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password_hash: 'hashedPassword',
      refresh_token_hash: 'hashedRefreshToken',
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValue(true);
    passwordService.hash.mockResolvedValue('new-hashed-refresh-token');
    jwtService.sign.mockReturnValueOnce('newJwtToken').mockReturnValueOnce('newRefreshToken');

    const result = await service.refresh('user-id', 'validRefreshToken');

    expect(passwordService.verify).toHaveBeenCalledWith('validRefreshToken', 'hashedRefreshToken');
    expect(result).toEqual({
      access_token: 'newJwtToken',
      refresh_token: 'newRefreshToken',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('logout clears refresh token hash', async () => {
    await service.logout('user-1');

    expect(usersService.updateRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
  });
});
