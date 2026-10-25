import { Test, TestingModule } from '@nestjs/testing';
import { TransportOrdersController } from './transport-orders.controller.js';

describe('TransportOrdersController', () => {
  let controller: TransportOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportOrdersController],
    }).compile();

    controller = module.get<TransportOrdersController>(
      TransportOrdersController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
