import { Test, TestingModule } from '@nestjs/testing';
import { TransportOrdersController } from './transport-orders.controller.js';
import { TransportOrdersService } from './transport-orders.service.js';
import { USERS } from '../auth/auth.guard.js';

describe('TransportOrdersController', () => {
  let controller: TransportOrdersController;
  let mockService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    addLines: ReturnType<typeof vi.fn>;
    removeLine: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
    depart: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockService = {
      findAll: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({
        no: 'TO-0001',
        vehicleCode: 'VH-02',
        vehiclePlateNo: 'LT-219-CD',
        vehicleCapacityKg: 2500,
        deliveryDate: '2026-10-25',
        status: 2,
        createdBy: 'diane',
        validatedBy: 'eric',
        totalWeightKg: 2050,
        orders: [],
      }),
      create: vi.fn().mockResolvedValue({ no: 'TO-0005' }),
      addLines: vi.fn().mockResolvedValue({ success: true, added: 2, totalWeightKg: 1500 }),
      removeLine: vi.fn().mockResolvedValue({ success: true }),
      validate: vi.fn().mockResolvedValue({ success: true, status: 1 }),
      depart: vi.fn().mockResolvedValue({ success: true, status: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportOrdersController],
      providers: [
        {
          provide: TransportOrdersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransportOrdersController>(TransportOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    const result = await controller.findAll({});
    expect(mockService.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([]);
  });

  it('should call findOne', async () => {
    const result = await controller.findOne('TO-0001');
    expect(mockService.findOne).toHaveBeenCalledWith('TO-0001');
    expect(result.no).toBe('TO-0001');
  });

  it('should call create', async () => {
    const dto = { vehicleCode: 'VH-01', deliveryDate: '2026-10-28' };
    const result = await controller.create(dto, USERS.diane);
    expect(mockService.create).toHaveBeenCalledWith(dto, USERS.diane);
    expect(result.no).toBe('TO-0005');
  });
});
