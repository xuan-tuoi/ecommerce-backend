import { Test, TestingModule } from '@nestjs/testing';
import { KeytokenService } from './keytoken.service';

describe('KeytokenService', () => {
  let service: KeytokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeytokenService],
    }).compile();

    service = module.get<KeytokenService>(KeytokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
