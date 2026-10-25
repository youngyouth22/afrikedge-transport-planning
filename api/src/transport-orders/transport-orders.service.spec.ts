import { Test, TestingModule } from '@nestjs/testing';
import { TransportOrdersService } from './transport-orders.service.js';

describe('TransportOrdersService', () => {
  let service: TransportOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportOrdersService],
    }).compile();

    service = module.get<TransportOrdersService>(TransportOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
