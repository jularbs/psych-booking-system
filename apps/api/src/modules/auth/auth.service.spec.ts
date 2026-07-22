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
    vi.clearAllMocks();
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    jwtService.sign.mockReturnValue('jwtToken');

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
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'existinguser@example.com', password: 'wrongPassword' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns a token if credentials are correct', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password_hash: 'hashedPassword',
      role: 'GUEST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    passwordService.verify.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('jwtToken');

    const result = await service.login({ email: 'user@example.com', password: 'correctPassword' });

    expect(passwordService.verify).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
    expect(result).toEqual({
      access_token: 'jwtToken',

      token_type: 'Bearer',
      expires_in: 3600,
    });
  });
});
