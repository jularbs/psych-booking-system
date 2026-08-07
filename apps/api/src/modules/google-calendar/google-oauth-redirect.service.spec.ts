import { Test, TestingModule } from '@nestjs/testing';
import { GoogleOAuthRedirectService } from './google-oauth-redirect.service';

describe('GoogleOAuthRedirectService', () => {
  let service: GoogleOAuthRedirectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleOAuthRedirectService],
    }).compile();

    service = module.get<GoogleOAuthRedirectService>(GoogleOAuthRedirectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds success redirect url', () => {
    const result = service.buildSuccessRedirectUrl(
      'http://localhost:4200',
      '/google-calendar/connection',
      'conn-1',
    );

    expect(result).toBe(
      'http://localhost:4200/google-calendar/connection?oauth=success&connectionId=conn-1',
    );
  });

  it('builds error redirect url', () => {
    const result = service.buildErrorRedirectUrl(
      'http://localhost:4200',
      '/google-calendar/connection',
      'access_denied',
    );

    expect(result).toBe(
      'http://localhost:4200/google-calendar/connection?oauth=error&reason=access_denied',
    );
  });
});
