import { Test, TestingModule } from '@nestjs/testing';
import { TrainingModelService } from './training_model.service';

describe('TrainingModelService', () => {
  let service: TrainingModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingModelService],
    }).compile();

    service = module.get<TrainingModelService>(TrainingModelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
