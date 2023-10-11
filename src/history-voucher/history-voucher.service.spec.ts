import { Test, TestingModule } from '@nestjs/testing';
import { HistoryVoucherService } from './history-voucher.service';

describe('HistoryVoucherService', () => {
  let service: HistoryVoucherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryVoucherService],
    }).compile();

    service = module.get<HistoryVoucherService>(HistoryVoucherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
