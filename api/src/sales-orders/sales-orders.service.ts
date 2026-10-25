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

  async findToPlan(city?: string): Promise<SalesOrderToPlan[]> {
    const request = this.database.connection.request();

    let query = `
      SELECT
        so.[No_] AS salesOrderNo,
        so.[Customer No_] AS customerNo,
        so.[Customer Name] AS customerName,
        so.[Delivery City] AS deliveryCity,
        so.[Total Weight (kg)] AS totalWeightKg,
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

    const result = await request.query<SalesOrderToPlan>(query);

    return result.recordset;
  }
}
