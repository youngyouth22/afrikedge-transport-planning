import { describe, it, expect } from 'vitest';
import {
  assertCanDepart,
  assertCanValidate,
  assertCanValidateRole,
  assertDeliveryDateNotPast,
  assertSalesOrdersAssignable,
  assertTransportIsDraft,
  assertVehicleUsable,
  assertWithinCapacity,
  nextTransportOrderNo,
  normalizeSalesOrderNos,
  SalesOrderStatus,
  TransportOrderStatus,
} from './transport-order.rules.js';
import { USERS } from '../auth/auth.guard.js';
import { ApiError } from '../common/api-error.js';

describe('Transport Order Business Rules (Pure Functions)', () => {
  describe('assertDeliveryDateNotPast', () => {
    it('should allow today and future dates', () => {
      const now = new Date('2026-10-26T10:00:00Z');
      expect(() => assertDeliveryDateNotPast('2026-10-26', now)).not.toThrow();
      expect(() => assertDeliveryDateNotPast('2026-10-27', now)).not.toThrow();
    });

    it('should reject past dates with DELIVERY_DATE_IN_PAST', () => {
      const now = new Date('2026-10-26T10:00:00Z');
      expect(() => assertDeliveryDateNotPast('2026-10-25', now)).toThrow(ApiError);
      try {
        assertDeliveryDateNotPast('2026-10-25', now);
      } catch (e: any) {
        expect(e.code).toBe('DELIVERY_DATE_IN_PAST');
        expect(e.getStatus()).toBe(400);
      }
    });
  });

  describe('assertVehicleUsable', () => {
    it('should allow active vehicle', () => {
      expect(() => assertVehicleUsable('VH-01', { active: true })).not.toThrow();
    });

    it('should reject non-existent vehicle with VEHICLE_NOT_FOUND', () => {
      expect(() => assertVehicleUsable('VH-99', undefined)).toThrow(ApiError);
      try {
        assertVehicleUsable('VH-99', undefined);
      } catch (e: any) {
        expect(e.code).toBe('VEHICLE_NOT_FOUND');
        expect(e.getStatus()).toBe(404);
      }
    });

    it('should reject inactive vehicle with VEHICLE_INACTIVE', () => {
      expect(() => assertVehicleUsable('VH-07', { active: false })).toThrow(ApiError);
      try {
        assertVehicleUsable('VH-07', { active: false });
      } catch (e: any) {
        expect(e.code).toBe('VEHICLE_INACTIVE');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('assertTransportIsDraft', () => {
    it('should allow modification of draft transport (status 0)', () => {
      expect(() => assertTransportIsDraft('TO-0001', TransportOrderStatus.DRAFT)).not.toThrow();
    });

    it('should reject modification of validated or departed transports with TRANSPORT_NOT_DRAFT', () => {
      expect(() => assertTransportIsDraft('TO-0002', TransportOrderStatus.VALIDATED)).toThrow(ApiError);
      expect(() => assertTransportIsDraft('TO-0003', TransportOrderStatus.DEPARTED)).toThrow(ApiError);
      try {
        assertTransportIsDraft('TO-0002', TransportOrderStatus.VALIDATED);
      } catch (e: any) {
        expect(e.code).toBe('TRANSPORT_NOT_DRAFT');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('normalizeSalesOrderNos', () => {
    it('should trim and deduplicate ids', () => {
      expect(normalizeSalesOrderNos([' SO-1001 ', 'SO-1002', 'SO-1001'])).toEqual([
        'SO-1001',
        'SO-1002',
      ]);
    });

    it('should reject empty selection with EMPTY_SELECTION', () => {
      expect(() => normalizeSalesOrderNos([])).toThrow(ApiError);
      expect(() => normalizeSalesOrderNos(['  ', ''])).toThrow(ApiError);
      try {
        normalizeSalesOrderNos([]);
      } catch (e: any) {
        expect(e.code).toBe('EMPTY_SELECTION');
        expect(e.getStatus()).toBe(400);
      }
    });
  });

  describe('assertSalesOrdersAssignable', () => {
    it('should allow valid orders in status 0 not already assigned', () => {
      expect(() =>
        assertSalesOrdersAssignable(
          ['SO-1008', 'SO-1009'],
          [
            { no: 'SO-1008', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 430 },
            { no: 'SO-1009', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 380 },
          ],
          [],
        ),
      ).not.toThrow();
    });

    it('should reject missing orders with SALES_ORDERS_NOT_FOUND', () => {
      expect(() =>
        assertSalesOrdersAssignable(
          ['SO-1008', 'SO-9999'],
          [{ no: 'SO-1008', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 430 }],
          [],
        ),
      ).toThrow(ApiError);
      try {
        assertSalesOrdersAssignable(
          ['SO-1008', 'SO-9999'],
          [{ no: 'SO-1008', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 430 }],
          [],
        );
      } catch (e: any) {
        expect(e.code).toBe('SALES_ORDERS_NOT_FOUND');
        expect(e.getStatus()).toBe(404);
      }
    });

    it('should reject orders not in status 0 with SALES_ORDERS_NOT_TO_PLAN', () => {
      expect(() =>
        assertSalesOrdersAssignable(
          ['SO-1001'],
          [{ no: 'SO-1001', status: SalesOrderStatus.PLANNED, totalWeightKg: 850 }],
          [],
        ),
      ).toThrow(ApiError);
      try {
        assertSalesOrdersAssignable(
          ['SO-1001'],
          [{ no: 'SO-1001', status: SalesOrderStatus.PLANNED, totalWeightKg: 850 }],
          [],
        );
      } catch (e: any) {
        expect(e.code).toBe('SALES_ORDERS_NOT_TO_PLAN');
        expect(e.getStatus()).toBe(409);
      }
    });

    it('should reject already assigned orders with SALES_ORDERS_ALREADY_ASSIGNED', () => {
      expect(() =>
        assertSalesOrdersAssignable(
          ['SO-1008'],
          [{ no: 'SO-1008', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 430 }],
          ['SO-1008'],
        ),
      ).toThrow(ApiError);
      try {
        assertSalesOrdersAssignable(
          ['SO-1008'],
          [{ no: 'SO-1008', status: SalesOrderStatus.TO_PLAN, totalWeightKg: 430 }],
          ['SO-1008'],
        );
      } catch (e: any) {
        expect(e.code).toBe('SALES_ORDERS_ALREADY_ASSIGNED');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('assertWithinCapacity', () => {
    it('should allow weight within or exactly equal to capacity', () => {
      expect(assertWithinCapacity(500, 500, 1000)).toBe(1000);
      expect(assertWithinCapacity(500, 400.5, 1000)).toBe(900.5);
    });

    it('should reject excess weight with CAPACITY_EXCEEDED (409)', () => {
      expect(() => assertWithinCapacity(800, 430, 1000)).toThrow(ApiError);
      try {
        assertWithinCapacity(800, 430, 1000);
      } catch (e: any) {
        expect(e.code).toBe('CAPACITY_EXCEEDED');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('assertCanValidateRole', () => {
    it('should allow Eric (LOGISTICS_MANAGER) to validate', () => {
      expect(() => assertCanValidateRole(USERS.eric)).not.toThrow();
    });

    it('should reject Diane (DISPATCHER) with ROLE_FORBIDDEN (403)', () => {
      expect(() => assertCanValidateRole(USERS.diane)).toThrow(ApiError);
      try {
        assertCanValidateRole(USERS.diane);
      } catch (e: any) {
        expect(e.code).toBe('ROLE_FORBIDDEN');
        expect(e.getStatus()).toBe(403);
      }
    });
  });

  describe('assertCanValidate', () => {
    it('should allow validating a draft with at least 1 order', () => {
      expect(() => assertCanValidate('TO-0001', TransportOrderStatus.DRAFT, 2)).not.toThrow();
    });

    it('should reject validating empty transport with TRANSPORT_EMPTY', () => {
      expect(() => assertCanValidate('TO-0001', TransportOrderStatus.DRAFT, 0)).toThrow(ApiError);
      try {
        assertCanValidate('TO-0001', TransportOrderStatus.DRAFT, 0);
      } catch (e: any) {
        expect(e.code).toBe('TRANSPORT_EMPTY');
        expect(e.getStatus()).toBe(409);
      }
    });

    it('should reject validating non-draft transport with TRANSPORT_NOT_DRAFT', () => {
      expect(() => assertCanValidate('TO-0001', TransportOrderStatus.VALIDATED, 2)).toThrow(ApiError);
      try {
        assertCanValidate('TO-0001', TransportOrderStatus.VALIDATED, 2);
      } catch (e: any) {
        expect(e.code).toBe('TRANSPORT_NOT_DRAFT');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('assertCanDepart', () => {
    it('should allow departure for validated transport', () => {
      expect(() => assertCanDepart('TO-0002', TransportOrderStatus.VALIDATED)).not.toThrow();
    });

    it('should reject departure for draft or departed transport with TRANSPORT_NOT_VALIDATED', () => {
      expect(() => assertCanDepart('TO-0001', TransportOrderStatus.DRAFT)).toThrow(ApiError);
      try {
        assertCanDepart('TO-0001', TransportOrderStatus.DRAFT);
      } catch (e: any) {
        expect(e.code).toBe('TRANSPORT_NOT_VALIDATED');
        expect(e.getStatus()).toBe(409);
      }
    });
  });

  describe('nextTransportOrderNo', () => {
    it('should generate TO-0001 when no orders exist', () => {
      expect(nextTransportOrderNo(null)).toBe('TO-0001');
      expect(nextTransportOrderNo(0)).toBe('TO-0001');
    });

    it('should increment correctly beyond single digits and past TO-9999', () => {
      expect(nextTransportOrderNo(4)).toBe('TO-0005');
      expect(nextTransportOrderNo(99)).toBe('TO-0100');
      expect(nextTransportOrderNo(9999)).toBe('TO-10000');
    });
  });
});
