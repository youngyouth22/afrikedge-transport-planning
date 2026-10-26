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

@Injectable()
export class SalesOrdersService {
  constructor(private readonly database: DatabaseProvider) {}

  async findToPlan(
    city?: string,
    page?: number,
    limit?: number,
  ): Promise<SalesOrderToPlan[]> {
    const request = this.database.connection.request();

    let query = `
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

    request.input('status', 0);

    if (city?.trim()) {
      query += ` AND so.[Delivery City] = @city`;
      request.input('city', city.trim());
    }

    query += ` ORDER BY so.[No_]`;

    if (page && limit && page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', offset);
      request.input('limit', limit);
    }

    const result = await request.query<SalesOrderToPlan>(query);

    return result.recordset.map((row) => ({
      salesOrderNo: row.salesOrderNo,
      customerNo: row.customerNo,
      customerName: row.customerName,
      deliveryCity: row.deliveryCity,
      totalWeightKg: Number(row.totalWeightKg),
      status: Number(row.status),
    }));
  }
}
