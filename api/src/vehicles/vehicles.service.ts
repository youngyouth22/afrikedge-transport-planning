import { Injectable } from '@nestjs/common';
import { DatabaseProvider } from '../database/database.provider.js';

export interface Vehicle {
  code: string;
  plateNo: string;
  capacityKg: number;
  active: boolean;
}

@Injectable()
export class VehiclesService {
  constructor(private readonly database: DatabaseProvider) {}

  async findActive(): Promise<Vehicle[]> {
    const request = this.database.connection.request();

    const query = `
      SELECT
        v.[Code] AS code,
        v.[Plate No_] AS plateNo,
        CAST(v.[Capacity (kg)] AS float) AS capacityKg,
        v.[Active] AS active
      FROM [Vehicle] AS v
      WHERE v.[Active] = 1
      ORDER BY v.[Code]
    `;

    const result = await request.query<Vehicle>(query);
    return result.recordset.map((row) => ({
      code: row.code,
      plateNo: row.plateNo,
      capacityKg: Number(row.capacityKg),
      active: Boolean(row.active),
    }));
  }
}
