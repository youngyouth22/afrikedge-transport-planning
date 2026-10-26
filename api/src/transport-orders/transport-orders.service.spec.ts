import { Test, TestingModule } from '@nestjs/testing';
import sql from 'mssql';
import { TransportOrdersService } from './transport-orders.service.js';
import { DatabaseProvider } from '../database/database.provider.js';
import { USERS } from '../auth/auth.guard.js';
import { ApiError } from '../common/api-error.js';

describe('TransportOrdersService (Integration with DB Provider)', () => {
  let service: TransportOrdersService;
  let mockRequest: any;
  let mockDatabaseProvider: any;

  beforeEach(async () => {
    mockRequest = {
      input: vi.fn().mockReturnThis(),
      query: vi.fn(),
    };

    vi.spyOn(sql.Request.prototype, 'input').mockImplementation(function (this: any, ...args: any[]) {
      mockRequest.input(...args);
      return this;
    });

    vi.spyOn(sql.Request.prototype, 'query').mockImplementation(function (...args: any[]) {
      return mockRequest.query(...args);
    });

    mockDatabaseProvider = {
      connection: {
        request: vi.fn().mockReturnValue(mockRequest),
      },
      withTransaction: vi.fn().mockImplementation(async (work: any) => {
        return work({});
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportOrdersService,
        {
          provide: DatabaseProvider,
          useValue: mockDatabaseProvider,
        },
      ],
    }).compile();

    service = module.get<TransportOrdersService>(TransportOrdersService);
  });

  describe('Rule 1 & 2: Creation of Transport Order', () => {
    it('should reject past delivery dates', async () => {
      await expect(
        service.create(
          { vehicleCode: 'VH-01', deliveryDate: '2020-01-01' },
          USERS.diane,
        ),
      ).rejects.toThrow(ApiError);
    });

    it('should reject non-existing vehicle', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await expect(
        service.create(
          { vehicleCode: 'INVALID', deliveryDate: tomorrow },
          USERS.diane,
        ),
      ).rejects.toThrow(ApiError);
    });

    it('should reject inactive vehicle', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ active: false }],
      });

      await expect(
        service.create(
          { vehicleCode: 'VH-07', deliveryDate: tomorrow },
          USERS.diane,
        ),
      ).rejects.toThrow(ApiError);
    });

    it('should reject duplicate vehicle on same delivery date', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ active: true }] }) // vehicle exists
        .mockResolvedValueOnce({ recordset: [{ 1: 1 }] }); // duplicate exists

      await expect(
        service.create(
          { vehicleCode: 'VH-01', deliveryDate: tomorrow },
          USERS.diane,
        ),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('Rule 3, 4, 5, 7: Bulk Assignment & Vehicle Capacity', () => {
    it('should reject assignment to a non-draft transport order', async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ status: 1, capacityKg: 2000 }], // Already validated
      });

      await expect(
        service.addLines('TO-0002', { salesOrderNos: ['SO-1008'] }),
      ).rejects.toThrow(ApiError);
    });

    it('should reject orders not in status 0 (To Plan)', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0, capacityKg: 2000 }] }) // Order is draft
        .mockResolvedValueOnce({ recordset: [{ currentWeight: 500 }] }) // Current weight
        .mockResolvedValueOnce({
          recordset: [
            { no: 'SO-1001', status: 2, totalWeightKg: 850 }, // Status 2 != 0
          ],
        })
        .mockResolvedValueOnce({ recordset: [] }); // not in Lines

      await expect(
        service.addLines('TO-0003', { salesOrderNos: ['SO-1001'] }),
      ).rejects.toThrow(ApiError);
    });

    it('should reject orders already assigned to another transport', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0, capacityKg: 2000 }] }) // Order is draft
        .mockResolvedValueOnce({ recordset: [{ currentWeight: 500 }] }) // Current weight
        .mockResolvedValueOnce({
          recordset: [{ no: 'SO-1008', status: 0, totalWeightKg: 430 }],
        })
        .mockResolvedValueOnce({
          recordset: [{ salesOrderNo: 'SO-1008' }], // Already assigned
        });

      await expect(
        service.addLines('TO-0003', { salesOrderNos: ['SO-1008'] }),
      ).rejects.toThrow(ApiError);
    });

    it('should reject assignment when cumulative weight exceeds vehicle capacity', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0, capacityKg: 1000 }] }) // Capacity = 1000kg
        .mockResolvedValueOnce({ recordset: [{ currentWeight: 800 }] }) // Current = 800kg
        .mockResolvedValueOnce({
          recordset: [{ no: 'SO-1008', status: 0, totalWeightKg: 430 }], // +430kg = 1230kg > 1000kg
        })
        .mockResolvedValueOnce({ recordset: [] }); // Not yet assigned

      await expect(
        service.addLines('TO-0003', { salesOrderNos: ['SO-1008'] }),
      ).rejects.toThrow(ApiError);
    });

    it('should succeed and commit transaction when assignment is valid', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0, capacityKg: 2000 }] }) // Capacity = 2000kg
        .mockResolvedValueOnce({ recordset: [{ currentWeight: 500 }] }) // Current = 500kg
        .mockResolvedValueOnce({
          recordset: [{ no: 'SO-1008', status: 0, totalWeightKg: 430 }], // +430kg = 930kg <= 2000kg
        })
        .mockResolvedValueOnce({ recordset: [] }) // None already assigned
        .mockResolvedValueOnce({ rowsAffected: [1] }) // Line insert
        .mockResolvedValueOnce({ rowsAffected: [1] }); // Status update to 1

      const result = await service.addLines('TO-0003', {
        salesOrderNos: ['SO-1008'],
      });

      expect(result.success).toBe(true);
      expect(result.added).toBe(1);
      expect(result.totalWeightKg).toBe(930);
    });
  });

  describe('Rule 6: Removing Sales Order from Draft Transport', () => {
    it('should reject removal if transport is not in draft status', async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ status: 1 }], // Validated
      });

      await expect(
        service.removeLine('TO-0002', 'SO-1003'),
      ).rejects.toThrow(ApiError);
    });

    it('should reject removal if line is not part of transport', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0 }] }) // Draft
        .mockResolvedValueOnce({ recordset: [] }); // Line not found

      await expect(
        service.removeLine('TO-0003', 'SO-9999'),
      ).rejects.toThrow(ApiError);
    });

    it('should remove line and restore sales order status to 0 atomically', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0 }] }) // Draft
        .mockResolvedValueOnce({ recordset: [{ 1: 1 }] }) // Line exists
        .mockResolvedValueOnce({ rowsAffected: [1] }) // Line delete
        .mockResolvedValueOnce({ rowsAffected: [1] }); // Status restore to 0

      const result = await service.removeLine('TO-0003', 'SO-1006');
      expect(result.success).toBe(true);
    });
  });

  describe('Rule 8: Validation of Transport Order', () => {
    it('should reject dispatcher (Diane) attempting validation', async () => {
      await expect(service.validate('TO-0003', USERS.diane)).rejects.toThrow(
        ApiError,
      );
    });

    it('should reject validation of non-draft order', async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ status: 1 }], // already validated
      });

      await expect(service.validate('TO-0002', USERS.eric)).rejects.toThrow(
        ApiError,
      );
    });

    it('should reject validation of empty transport order', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0 }] }) // draft
        .mockResolvedValueOnce({ recordset: [{ lineCount: 0 }] }); // 0 lines

      await expect(service.validate('TO-0004', USERS.eric)).rejects.toThrow(
        ApiError,
      );
    });

    it('should allow Eric (Logistics Manager) to validate a non-empty draft', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0 }] }) // draft
        .mockResolvedValueOnce({ recordset: [{ lineCount: 2 }] }) // 2 lines
        .mockResolvedValueOnce({ rowsAffected: [1] }); // update

      const result = await service.validate('TO-0003', USERS.eric);
      expect(result.success).toBe(true);
      expect(result.status).toBe(1);
    });
  });

  describe('Rule 9: Departure of Transport Order', () => {
    it('should reject departure if order is not in validated status', async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ status: 0 }], // still draft
      });

      await expect(service.depart('TO-0003', USERS.diane)).rejects.toThrow(
        ApiError,
      );
    });

    it('should allow departure for validated transport and transition orders to status 2', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 1 }] }) // Validated
        .mockResolvedValueOnce({ rowsAffected: [1] }) // Order status -> 2
        .mockResolvedValueOnce({ rowsAffected: [2] }); // Lines status -> 2

      const result = await service.depart('TO-0002', USERS.diane);
      expect(result.success).toBe(true);
      expect(result.status).toBe(2);
    });
  });

  describe('Pagination: findAll Transport Orders', () => {
    it('should return paginated transport orders with total count and pages', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 5 }] })
        .mockResolvedValueOnce({
          recordset: [
            {
              no: 'TO-0001',
              vehicleCode: 'VH-02',
              vehiclePlateNo: 'LT-219-CD',
              vehicleCapacityKg: 2500,
              deliveryDate: '2026-10-25',
              status: 2,
              createdBy: 'diane',
              validatedBy: 'eric',
              ordersCount: 2,
              totalWeightKg: 2050,
            },
          ],
        });

      const res = await service.findAll({ page: 1, limit: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(5);
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.totalPages).toBe(1);
    });
  });
});
