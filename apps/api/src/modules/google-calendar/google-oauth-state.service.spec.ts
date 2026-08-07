import { Test, TestingModule } from '@nestjs/testing';
import { GoogleOAuthStateService } from './google-oauth-state.service';

describe('GoogleOAuthStateService', () => {
  let service: GoogleOAuthStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleOAuthStateService],
    }).compile();

    service = module.get<GoogleOAuthStateService>(GoogleOAuthStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and validates oauth state', async () => {
    const state = service.createState({
      user_id: 'user-1',
      return_to: '/google-calendar/connection',
    });

    const parsed = service.parseState(state);

    expect(parsed).toEqual({
      user_id: 'user-1',
      return_to: '/google-calendar/connection',
    });
  });

  it('throws error for invalid state', async () => {
    const invalidState = 'invalid-state';

    expect(() => service.parseState(invalidState)).toThrow();
  });
});
