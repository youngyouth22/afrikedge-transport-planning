import { Injectable } from '@nestjs/common';
import sql from 'mssql';
import { DatabaseProvider } from '../database/database.provider.js';
import { UserContext } from '../auth/auth.guard.js';
import { CreateTransportOrderDto } from './dto/create-transport-order.dto.js';
import { AddTransportOrderLinesDto } from './dto/add-transport-order-lines.dto.js';
import { FindTransportOrdersDto } from './dto/find-transport-orders.dto.js';
import { conflict, notFound } from '../common/api-error.js';
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
  sumWeightsKg,
  TransportOrderStatus,
} from './transport-order.rules.js';

export interface TransportOrderSummary {
  no: string;
  vehicleCode: string;
  vehiclePlateNo: string;
  vehicleCapacityKg: number;
  deliveryDate: string;
  status: number;
  createdBy: string;
  validatedBy: string | null;
  ordersCount: number;
  totalWeightKg: number;
}

export interface PaginatedTransportOrders {
  data: TransportOrderSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransportOrderLineDetail {
  salesOrderNo: string;
  customerNo: string;
  customerName: string;
  deliveryCity: string;
  totalWeightKg: number;
  status: number;
}

export interface TransportOrderDetail {
  no: string;
  vehicleCode: string;
  vehiclePlateNo: string;
  vehicleCapacityKg: number;
  deliveryDate: string;
  status: number;
  createdBy: string;
  validatedBy: string | null;
  totalWeightKg: number;
  orders: TransportOrderLineDetail[];
}

@Injectable()
export class TransportOrdersService {
  constructor(private readonly database: DatabaseProvider) {}

  async findAll(query: FindTransportOrdersDto): Promise<PaginatedTransportOrders> {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit ?? 10)));
    const offset = (page - 1) * limit;

    // 1. Total matching count
    const countRequest = this.database.connection.request();
    let countQuery = `
      SELECT COUNT(to_order.[No_]) AS total
      FROM [Transport Order] AS to_order
      WHERE 1 = 1
    `;

    if (query.status !== undefined && query.status !== null) {
      countQuery += ` AND to_order.[Status] = @status`;
      countRequest.input('status', query.status);
    }

    if (query.date?.trim()) {
      countQuery += ` AND to_order.[Delivery Date] = @date`;
      countRequest.input('date', query.date.trim());
    }

    const countRes = await countRequest.query<{ total: number }>(countQuery);
    const total = Number(countRes.recordset[0]?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // 2. Paginated rows
    const request = this.database.connection.request();

    let sqlQuery = `
      SELECT
        to_order.[No_] AS [no],
        to_order.[Vehicle Code] AS vehicleCode,
        v.[Plate No_] AS vehiclePlateNo,
        CAST(v.[Capacity (kg)] AS float) AS vehicleCapacityKg,
        CONVERT(varchar(10), to_order.[Delivery Date], 23) AS deliveryDate,
        to_order.[Status] AS status,
        to_order.[Created By] AS createdBy,
        to_order.[Validated By] AS validatedBy,
        COUNT(tol.[Sales Order No_]) AS ordersCount,
        CAST(ISNULL(SUM(so.[Total Weight (kg)]), 0) AS float) AS totalWeightKg
      FROM [Transport Order] AS to_order
      INNER JOIN [Vehicle] AS v ON to_order.[Vehicle Code] = v.[Code]
      LEFT JOIN [Transport Order Line] AS tol ON to_order.[No_] = tol.[Transport Order No_]
      LEFT JOIN [Sales Order] AS so ON tol.[Sales Order No_] = so.[No_]
      WHERE 1 = 1
    `;

    if (query.status !== undefined && query.status !== null) {
      sqlQuery += ` AND to_order.[Status] = @status`;
      request.input('status', query.status);
    }

    if (query.date?.trim()) {
      sqlQuery += ` AND to_order.[Delivery Date] = @date`;
      request.input('date', query.date.trim());
    }

    sqlQuery += `
      GROUP BY
        to_order.[No_],
        to_order.[Vehicle Code],
        v.[Plate No_],
        v.[Capacity (kg)],
        to_order.[Delivery Date],
        to_order.[Status],
        to_order.[Created By],
        to_order.[Validated By]
      ORDER BY to_order.[Delivery Date] DESC, to_order.[No_] DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', offset);
    request.input('limit', limit);

    const result = await request.query<TransportOrderSummary>(sqlQuery);
    const data = result.recordset.map((row) => ({
      no: row.no,
      vehicleCode: row.vehicleCode,
      vehiclePlateNo: row.vehiclePlateNo,
      vehicleCapacityKg: Number(row.vehicleCapacityKg),
      deliveryDate: row.deliveryDate,
      status: Number(row.status),
      createdBy: row.createdBy,
      validatedBy: row.validatedBy,
      ordersCount: Number(row.ordersCount),
      totalWeightKg: Number(row.totalWeightKg),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(no: string): Promise<TransportOrderDetail> {
    const requestHeader = this.database.connection.request();
    requestHeader.input('no', no);

    const headerQuery = `
      SELECT
        to_order.[No_] AS [no],
        to_order.[Vehicle Code] AS vehicleCode,
        v.[Plate No_] AS vehiclePlateNo,
        CAST(v.[Capacity (kg)] AS float) AS vehicleCapacityKg,
        CONVERT(varchar(10), to_order.[Delivery Date], 23) AS deliveryDate,
        to_order.[Status] AS status,
        to_order.[Created By] AS createdBy,
        to_order.[Validated By] AS validatedBy
      FROM [Transport Order] AS to_order
      INNER JOIN [Vehicle] AS v ON to_order.[Vehicle Code] = v.[Code]
      WHERE to_order.[No_] = @no
    `;

    const headerResult = await requestHeader.query(headerQuery);
    if (headerResult.recordset.length === 0) {
      throw notFound('TRANSPORT_NOT_FOUND', `Ordre de transport "${no}" introuvable.`, { no });
    }

    const header = headerResult.recordset[0];

    const requestLines = this.database.connection.request();
    requestLines.input('no', no);

    const linesQuery = `
      SELECT
        so.[No_] AS salesOrderNo,
        so.[Customer No_] AS customerNo,
        so.[Customer Name] AS customerName,
        so.[Delivery City] AS deliveryCity,
        CAST(so.[Total Weight (kg)] AS float) AS totalWeightKg,
        so.[Status] AS status
      FROM [Transport Order Line] AS tol
      INNER JOIN [Sales Order] AS so ON tol.[Sales Order No_] = so.[No_]
      WHERE tol.[Transport Order No_] = @no
      ORDER BY so.[No_]
    `;

    const linesResult = await requestLines.query<TransportOrderLineDetail>(linesQuery);
    const orders: TransportOrderLineDetail[] = linesResult.recordset.map((row) => ({
      salesOrderNo: row.salesOrderNo,
      customerNo: row.customerNo,
      customerName: row.customerName,
      deliveryCity: row.deliveryCity,
      totalWeightKg: Number(row.totalWeightKg),
      status: Number(row.status),
    }));

    const totalWeightKg = sumWeightsKg(orders.map((o) => o.totalWeightKg));

    return {
      no: header.no,
      vehicleCode: header.vehicleCode,
      vehiclePlateNo: header.vehiclePlateNo,
      vehicleCapacityKg: Number(header.vehicleCapacityKg),
      deliveryDate: header.deliveryDate,
      status: Number(header.status),
      createdBy: header.createdBy,
      validatedBy: header.validatedBy,
      totalWeightKg,
      orders,
    };
  }

  async create(
    dto: CreateTransportOrderDto,
    user: UserContext,
  ): Promise<{ no: string }> {
    const deliveryDateStr = dto.deliveryDate.slice(0, 10);
    assertDeliveryDateNotPast(deliveryDateStr, new Date());

    return this.database.withTransaction(async (transaction) => {
      // 1. Lock and check vehicle
      const reqVehicle = new sql.Request(transaction);
      reqVehicle.input('vehicleCode', dto.vehicleCode);
      const vehicleRes = await reqVehicle.query<{ active: boolean }>(`
        SELECT [Active] AS active
        FROM [Vehicle]
        WHERE [Code] = @vehicleCode
      `);

      assertVehicleUsable(dto.vehicleCode, vehicleRes.recordset[0]);

      // 2. Lock on date/vehicle to prevent double booking race condition
      const reqUnique = new sql.Request(transaction);
      reqUnique.input('vehicleCode', dto.vehicleCode);
      reqUnique.input('deliveryDate', deliveryDateStr);
      const uniqueRes = await reqUnique.query(`
        SELECT 1 FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
        WHERE [Vehicle Code] = @vehicleCode AND [Delivery Date] = @deliveryDate
      `);

      if (uniqueRes.recordset.length > 0) {
        throw conflict(
          'VEHICLE_ALREADY_BOOKED',
          `Un ordre de transport existe déjà pour le véhicule "${dto.vehicleCode}" à la date du ${deliveryDateStr}.`,
          { vehicleCode: dto.vehicleCode, deliveryDate: deliveryDateStr },
        );
      }

      // 3. Generate sequential order number TO-XXXX safely
      const reqMax = new sql.Request(transaction);
      const maxRes = await reqMax.query<{ maxSuffix: number | null }>(`
        SELECT MAX(TRY_CAST(SUBSTRING([No_], 4, 10) AS int)) AS maxSuffix
        FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
        WHERE [No_] LIKE 'TO-%'
      `);

      const newNo = nextTransportOrderNo(maxRes.recordset[0]?.maxSuffix ?? null);

      const reqInsert = new sql.Request(transaction);
      reqInsert.input('no', newNo);
      reqInsert.input('vehicleCode', dto.vehicleCode);
      reqInsert.input('deliveryDate', deliveryDateStr);
      reqInsert.input('createdBy', user.id);

      await reqInsert.query(`
        INSERT INTO [Transport Order] ([No_], [Vehicle Code], [Delivery Date], [Status], [Created By], [Validated By])
        VALUES (@no, @vehicleCode, @deliveryDate, 0, @createdBy, NULL)
      `);

      return { no: newNo };
    }, sql.ISOLATION_LEVEL.SERIALIZABLE);
  }

  async addLines(
    no: string,
    dto: AddTransportOrderLinesDto,
  ): Promise<{ success: boolean; added: number; totalWeightKg: number }> {
    const uniqueOrderNos = normalizeSalesOrderNos(dto.salesOrderNos);

    return this.database.withTransaction(async (transaction) => {
      // 1. Lock transport order header and get vehicle capacity
      const reqOrder = new sql.Request(transaction);
      reqOrder.input('no', no);
      const orderRes = await reqOrder.query<{
        status: number;
        capacityKg: number;
      }>(`
        SELECT
          to_order.[Status] AS status,
          CAST(v.[Capacity (kg)] AS float) AS capacityKg
        FROM [Transport Order] to_order WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN [Vehicle] v ON to_order.[Vehicle Code] = v.[Code]
        WHERE to_order.[No_] = @no
      `);

      if (orderRes.recordset.length === 0) {
        throw notFound('TRANSPORT_NOT_FOUND', `Ordre de transport "${no}" introuvable.`, { no });
      }

      const { status, capacityKg } = orderRes.recordset[0];
      assertTransportIsDraft(no, status);

      // 2. Calculate current weight
      const reqCurrent = new sql.Request(transaction);
      reqCurrent.input('no', no);
      const currentRes = await reqCurrent.query<{ currentWeight: number }>(`
        SELECT CAST(ISNULL(SUM(so.[Total Weight (kg)]), 0) AS float) AS currentWeight
        FROM [Transport Order Line] tol
        INNER JOIN [Sales Order] so ON tol.[Sales Order No_] = so.[No_]
        WHERE tol.[Transport Order No_] = @no
      `);
      const currentWeight = Number(currentRes.recordset[0]?.currentWeight ?? 0);

      // 3. Lock candidate sales orders (UPDLOCK, HOLDLOCK) to prevent concurrent double assignment
      const reqOrders = new sql.Request(transaction);
      const paramNames: string[] = [];
      uniqueOrderNos.forEach((orderNo, idx) => {
        const paramName = `so_${idx}`;
        paramNames.push(`@${paramName}`);
        reqOrders.input(paramName, orderNo);
      });

      const ordersRes = await reqOrders.query<{
        no: string;
        status: number;
        totalWeightKg: number;
      }>(`
        SELECT
          so.[No_] AS [no],
          so.[Status] AS status,
          CAST(so.[Total Weight (kg)] AS float) AS totalWeightKg
        FROM [Sales Order] so WITH (UPDLOCK, HOLDLOCK)
        WHERE so.[No_] IN (${paramNames.join(', ')})
      `);

      // 4. Check if any are already assigned to ANY transport order
      const reqAlready = new sql.Request(transaction);
      uniqueOrderNos.forEach((orderNo, idx) => {
        reqAlready.input(`so_${idx}`, orderNo);
      });
      const alreadyRes = await reqAlready.query<{ salesOrderNo: string }>(`
        SELECT [Sales Order No_] AS salesOrderNo
        FROM [Transport Order Line] WITH (UPDLOCK, HOLDLOCK)
        WHERE [Sales Order No_] IN (${paramNames.join(', ')})
      `);

      const alreadyAssigned = alreadyRes.recordset.map((r) => r.salesOrderNo);

      // Verify business assignment invariants
      assertSalesOrdersAssignable(
        uniqueOrderNos,
        ordersRes.recordset.map((r) => ({
          no: r.no,
          status: Number(r.status),
          totalWeightKg: Number(r.totalWeightKg),
        })),
        alreadyAssigned,
      );

      // 5. Check vehicle capacity
      const additionalWeight = sumWeightsKg(
        ordersRes.recordset.map((o) => Number(o.totalWeightKg)),
      );
      const newTotalWeight = assertWithinCapacity(currentWeight, additionalWeight, capacityKg);

      // 6. Insert lines and update statuses to planned (1)
      for (const orderNo of uniqueOrderNos) {
        const reqInsert = new sql.Request(transaction);
        reqInsert.input('toNo', no);
        reqInsert.input('soNo', orderNo);
        await reqInsert.query(`
          INSERT INTO [Transport Order Line] ([Transport Order No_], [Sales Order No_])
          VALUES (@toNo, @soNo)
        `);
      }

      const reqUpdateStatus = new sql.Request(transaction);
      uniqueOrderNos.forEach((orderNo, idx) => {
        reqUpdateStatus.input(`so_${idx}`, orderNo);
      });
      await reqUpdateStatus.query(`
        UPDATE [Sales Order]
        SET [Status] = 1
        WHERE [No_] IN (${paramNames.join(', ')})
      `);

      return {
        success: true,
        added: uniqueOrderNos.length,
        totalWeightKg: newTotalWeight,
      };
    });
  }

  async removeLine(
    no: string,
    salesOrderNo: string,
  ): Promise<{ success: boolean }> {
    return this.database.withTransaction(async (transaction) => {
      // 1. Check and lock transport status
      const reqOrder = new sql.Request(transaction);
      reqOrder.input('no', no);
      const orderRes = await reqOrder.query<{ status: number }>(`
        SELECT [Status] AS status
        FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
        WHERE [No_] = @no
      `);

      if (orderRes.recordset.length === 0) {
        throw notFound('TRANSPORT_NOT_FOUND', `Ordre de transport "${no}" introuvable.`, { no });
      }

      assertTransportIsDraft(no, Number(orderRes.recordset[0].status));

      // 2. Check line existence
      const reqLine = new sql.Request(transaction);
      reqLine.input('no', no);
      reqLine.input('salesOrderNo', salesOrderNo);
      const lineRes = await reqLine.query(`
        SELECT 1 FROM [Transport Order Line] WITH (UPDLOCK, HOLDLOCK)
        WHERE [Transport Order No_] = @no AND [Sales Order No_] = @salesOrderNo
      `);

      if (lineRes.recordset.length === 0) {
        throw notFound(
          'LINE_NOT_FOUND',
          `La commande "${salesOrderNo}" n'appartient pas à l'ordre de transport "${no}".`,
          { transportNo: no, salesOrderNo },
        );
      }

      // 3. Delete line & restore sales order to status 0
      const reqDelete = new sql.Request(transaction);
      reqDelete.input('no', no);
      reqDelete.input('salesOrderNo', salesOrderNo);
      await reqDelete.query(`
        DELETE FROM [Transport Order Line]
        WHERE [Transport Order No_] = @no AND [Sales Order No_] = @salesOrderNo
      `);

      const reqRestore = new sql.Request(transaction);
      reqRestore.input('salesOrderNo', salesOrderNo);
      await reqRestore.query(`
        UPDATE [Sales Order]
        SET [Status] = 0
        WHERE [No_] = @salesOrderNo
      `);

      return { success: true };
    });
  }

  async validate(
    no: string,
    user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    assertCanValidateRole(user);

    return this.database.withTransaction(async (transaction) => {
      const reqOrder = new sql.Request(transaction);
      reqOrder.input('no', no);
      const orderRes = await reqOrder.query<{ status: number }>(`
        SELECT [Status] AS status
        FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
        WHERE [No_] = @no
      `);

      if (orderRes.recordset.length === 0) {
        throw notFound('TRANSPORT_NOT_FOUND', `Ordre de transport "${no}" introuvable.`, { no });
      }

      const status = Number(orderRes.recordset[0].status);
      if (status !== TransportOrderStatus.DRAFT) {
        assertCanValidate(no, status, 1);
      }

      // Check count of assigned sales orders
      const reqCount = new sql.Request(transaction);
      reqCount.input('no', no);
      const countRes = await reqCount.query<{ lineCount: number }>(`
        SELECT COUNT(*) AS lineCount
        FROM [Transport Order Line] WITH (UPDLOCK, HOLDLOCK)
        WHERE [Transport Order No_] = @no
      `);

      const lineCount = Number(countRes.recordset[0]?.lineCount ?? 0);
      assertCanValidate(no, status, lineCount);

      const reqUpdate = new sql.Request(transaction);
      reqUpdate.input('no', no);
      reqUpdate.input('validatedBy', user.id);
      await reqUpdate.query(`
        UPDATE [Transport Order]
        SET [Status] = 1, [Validated By] = @validatedBy
        WHERE [No_] = @no
      `);

      return { success: true, status: 1 };
    });
  }

  async depart(
    no: string,
    _user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    return this.database.withTransaction(async (transaction) => {
      const reqOrder = new sql.Request(transaction);
      reqOrder.input('no', no);
      const orderRes = await reqOrder.query<{ status: number }>(`
        SELECT [Status] AS status
        FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
        WHERE [No_] = @no
      `);

      if (orderRes.recordset.length === 0) {
        throw notFound('TRANSPORT_NOT_FOUND', `Ordre de transport "${no}" introuvable.`, { no });
      }

      assertCanDepart(no, Number(orderRes.recordset[0].status));

      const reqUpdateOrder = new sql.Request(transaction);
      reqUpdateOrder.input('no', no);
      await reqUpdateOrder.query(`
        UPDATE [Transport Order]
        SET [Status] = 2
        WHERE [No_] = @no
      `);

      const reqUpdateOrders = new sql.Request(transaction);
      reqUpdateOrders.input('no', no);
      await reqUpdateOrders.query(`
        UPDATE so
        SET so.[Status] = 2
        FROM [Sales Order] so
        INNER JOIN [Transport Order Line] tol ON so.[No_] = tol.[Sales Order No_]
        WHERE tol.[Transport Order No_] = @no
      `);

      return { success: true, status: 2 };
    });
  }
}
