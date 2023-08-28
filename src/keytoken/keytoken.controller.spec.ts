import { Test, TestingModule } from '@nestjs/testing';
import { KeytokenController } from './keytoken.controller';

describe('KeytokenController', () => {
  let controller: KeytokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeytokenController],
    }).compile();

    controller = module.get<KeytokenController>(KeytokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
