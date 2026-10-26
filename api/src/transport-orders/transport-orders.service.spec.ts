import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransportOrdersService } from './transport-orders.service.js';
import { DatabaseProvider } from '../database/database.provider.js';
import { USERS } from '../auth/auth.guard.js';

describe('TransportOrdersService (Business Rules)', () => {
  let service: TransportOrdersService;
  let mockRequest: any;
  let mockDatabaseProvider: any;

  beforeEach(async () => {
    mockRequest = {
      input: vi.fn().mockReturnThis(),
      query: vi.fn(),
    };

    mockDatabaseProvider = {
      connection: {
        request: vi.fn().mockReturnValue(mockRequest),
        // Pour les transactions sql.Transaction(pool)
      },
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
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-existing vehicle', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await expect(
        service.create(
          { vehicleCode: 'INVALID', deliveryDate: tomorrow },
          USERS.diane,
        ),
      ).rejects.toThrow(NotFoundException);
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
      ).rejects.toThrow(BadRequestException);
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
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Rule 8: Validation of Transport Order', () => {
    it('should reject dispatcher (Diane) attempting validation', async () => {
      await expect(service.validate('TO-0003', USERS.diane)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject validation of non-draft order', async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ status: 1 }], // already validated
      });

      await expect(service.validate('TO-0002', USERS.eric)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject validation of empty transport order', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ status: 0 }] }) // draft
        .mockResolvedValueOnce({ recordset: [{ lineCount: 0 }] }); // 0 lines

      await expect(service.validate('TO-0004', USERS.eric)).rejects.toThrow(
        BadRequestException,
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
        BadRequestException,
      );
    });
  });
});
