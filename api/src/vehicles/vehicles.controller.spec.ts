import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let mockService: {
    findActive: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockService = {
      findActive: vi.fn().mockResolvedValue([
        {
          code: 'VH-01',
          plateNo: 'LT-482-AB',
          capacityKg: 1500,
          active: true,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return active vehicles from service', async () => {
    const result = await controller.findActive();
    expect(mockService.findActive).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('VH-01');
  });
});
