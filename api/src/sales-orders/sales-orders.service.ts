import { Injectable } from '@nestjs/common';
import { DatabaseProvider } from '../database/database.provider.js';

export interface SalesOrderToPlan {
  salesOrderNo: string;
  customerNo: string;
  customerName: string;
  deliveryCity: string;
  totalWeightKg: number;
  status: number;
}

export interface PaginatedSalesOrdersToPlan {
  data: SalesOrderToPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SalesOrdersService {
  constructor(private readonly database: DatabaseProvider) {}

  async findToPlan(
    city?: string,
    pageParam?: number,
    limitParam?: number,
  ): Promise<PaginatedSalesOrdersToPlan> {
    const page = Math.max(1, Number(pageParam ?? 1));
    const limit = Math.max(1, Math.min(100, Number(limitParam ?? 10)));
    const offset = (page - 1) * limit;

    // 1. Total matching records
    const countRequest = this.database.connection.request();
    countRequest.input('status', 0);

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM [Sales Order] AS so
      WHERE so.[Status] = @status
    `;

    if (city?.trim() && city.trim().toLowerCase() !== 'all') {
      countQuery += ` AND so.[Delivery City] = @city`;
      countRequest.input('city', city.trim());
    }

    const countResult = await countRequest.query<{ total: number }>(countQuery);
    const total = Number(countResult.recordset[0]?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // 2. Paginated rows with deterministic sorting
    const dataRequest = this.database.connection.request();
    dataRequest.input('status', 0);
    dataRequest.input('offset', offset);
    dataRequest.input('limit', limit);

    let dataQuery = `
      SELECT
        so.[No_] AS salesOrderNo,
        so.[Customer No_] AS customerNo,
        so.[Customer Name] AS customerName,
        so.[Delivery City] AS deliveryCity,
        CAST(so.[Total Weight (kg)] AS float) AS totalWeightKg,
        so.[Status] AS status
      FROM [Sales Order] AS so
      WHERE so.[Status] = @status
    `;

    if (city?.trim() && city.trim().toLowerCase() !== 'all') {
      dataQuery += ` AND so.[Delivery City] = @city`;
      dataRequest.input('city', city.trim());
    }

    dataQuery += `
      ORDER BY so.[No_] ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const result = await dataRequest.query<SalesOrderToPlan>(dataQuery);

    const data = result.recordset.map((row) => ({
      salesOrderNo: row.salesOrderNo,
      customerNo: row.customerNo,
      customerName: row.customerName,
      deliveryCity: row.deliveryCity,
      totalWeightKg: Number(row.totalWeightKg),
      status: Number(row.status),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

