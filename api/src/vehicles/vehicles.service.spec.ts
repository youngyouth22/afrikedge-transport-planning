import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service.js';
import { DatabaseProvider } from '../database/database.provider.js';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let mockRequest: {
    query: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockRequest = {
      query: vi.fn().mockResolvedValue({
        recordset: [
          {
            code: 'VH-01',
            plateNo: 'LT-482-AB',
            capacityKg: 1500,
            active: true,
          },
        ],
      }),
    };

    const mockDatabaseProvider = {
      connection: {
        request: vi.fn().mockReturnValue(mockRequest),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: DatabaseProvider,
          useValue: mockDatabaseProvider,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return active vehicles', async () => {
    const vehicles = await service.findActive();
    expect(mockRequest.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE v.[Active] = 1'),
    );
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].code).toBe('VH-01');
    expect(vehicles[0].capacityKg).toBe(1500);
  });
});
