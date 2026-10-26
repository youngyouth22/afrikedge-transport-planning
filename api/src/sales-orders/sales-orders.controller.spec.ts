import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersController } from './sales-orders.controller.js';
import { SalesOrdersService } from './sales-orders.service.js';

describe('SalesOrdersController', () => {
  let controller: SalesOrdersController;
  let service: SalesOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesOrdersController],
      providers: [
        {
          provide: SalesOrdersService,
          useValue: {
            findToPlan: vi.fn().mockResolvedValue({
              data: [
                {
                  salesOrderNo: 'SO-1008',
                  customerNo: 'C0001',
                  customerName: 'Quincaillerie Ndokoti',
                  deliveryCity: 'Douala',
                  totalWeightKg: 430,
                  status: 0,
                },
              ],
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<SalesOrdersController>(SalesOrdersController);
    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return sales orders to plan', async () => {
    const result = await controller.findToPlan({ city: 'Douala' });
    expect(service.findToPlan).toHaveBeenCalledWith('Douala', undefined, undefined);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].salesOrderNo).toBe('SO-1008');
    expect(result.total).toBe(1);
  });

});
