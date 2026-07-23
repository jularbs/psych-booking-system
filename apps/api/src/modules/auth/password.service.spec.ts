import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password and verify it correctly', async () => {
    const plainPassword = 'mySecretPassword';
    const hashedPassword = await service.hash(plainPassword);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toEqual(plainPassword);
    expect(await service.verify(plainPassword, hashedPassword)).toBe(true);
  });

  it('should return false for incorrect password verification', async () => {
    const plainPassword = 'mySecretPassword';
    const hashedPassword = await service.hash(plainPassword);

    expect(await service.verify('wrongPassword', hashedPassword)).toBe(false);
  });
});
