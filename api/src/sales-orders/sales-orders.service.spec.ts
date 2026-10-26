import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersService } from './sales-orders.service.js';
import { DatabaseProvider } from '../database/database.provider.js';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let mockRequest: {
    input: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockRequest = {
      input: vi.fn(),
      query: vi.fn().mockResolvedValue({
        recordset: [
          {
            salesOrderNo: 'SO-1008',
            customerNo: 'C0001',
            customerName: 'Quincaillerie Ndokoti',
            deliveryCity: 'Douala',
            totalWeightKg: 430,
            status: 0,
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
        SalesOrdersService,
        {
          provide: DatabaseProvider,
          useValue: mockDatabaseProvider,
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should query sales orders with status 0 without city filter', async () => {
    mockRequest.query
      .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
      .mockResolvedValueOnce({
        recordset: [
          {
            salesOrderNo: 'SO-1008',
            customerNo: 'C0001',
            customerName: 'Quincaillerie Ndokoti',
            deliveryCity: 'Douala',
            totalWeightKg: 430,
            status: 0,
          },
        ],
      });

    const result = await service.findToPlan();
    expect(mockRequest.input).toHaveBeenCalledWith('status', 0);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.data[0].salesOrderNo).toBe('SO-1008');
  });

  it('should include city filter parameter when provided', async () => {
    mockRequest.query
      .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
      .mockResolvedValueOnce({
        recordset: [
          {
            salesOrderNo: 'SO-1008',
            customerNo: 'C0001',
            customerName: 'Quincaillerie Ndokoti',
            deliveryCity: 'Douala',
            totalWeightKg: 430,
            status: 0,
          },
        ],
      });

    const result = await service.findToPlan('Douala');
    expect(mockRequest.input).toHaveBeenCalledWith('status', 0);
    expect(mockRequest.input).toHaveBeenCalledWith('city', 'Douala');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

});
