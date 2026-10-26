import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sql from 'mssql';
import { DatabaseProvider } from '../database/database.provider.js';
import { UserContext, UserRole } from '../auth/auth.guard.js';
import { CreateTransportOrderDto } from './dto/create-transport-order.dto.js';
import { AddTransportOrderLinesDto } from './dto/add-transport-order-lines.dto.js';
import { FindTransportOrdersDto } from './dto/find-transport-orders.dto.js';

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

  async findAll(query: FindTransportOrdersDto): Promise<TransportOrderSummary[]> {
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
    `;

    if (query.page && query.limit && query.page > 0 && query.limit > 0) {
      const offset = (query.page - 1) * query.limit;
      sqlQuery += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', offset);
      request.input('limit', query.limit);
    }

    const result = await request.query<TransportOrderSummary>(sqlQuery);
    return result.recordset.map((row) => ({
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
      throw new NotFoundException(`Ordre de transport "${no}" introuvable.`);
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

    const totalWeightKg = orders.reduce((sum, order) => sum + order.totalWeightKg, 0);

    return {
      no: header.no,
      vehicleCode: header.vehicleCode,
      vehiclePlateNo: header.vehiclePlateNo,
      vehicleCapacityKg: Number(header.vehicleCapacityKg),
      deliveryDate: header.deliveryDate,
      status: Number(header.status),
      createdBy: header.createdBy,
      validatedBy: header.validatedBy,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      orders,
    };
  }

  async create(
    dto: CreateTransportOrderDto,
    user: UserContext,
  ): Promise<{ no: string }> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const deliveryDateStr = dto.deliveryDate.slice(0, 10);

    if (deliveryDateStr < todayStr) {
      throw new BadRequestException(
        'La date de livraison ne peut pas être dans le passé.',
      );
    }

    // Vérifier l'existence et l'état du véhicule
    const reqVehicle = this.database.connection.request();
    reqVehicle.input('vehicleCode', dto.vehicleCode);
    const vehicleRes = await reqVehicle.query<{ active: boolean }>(`
      SELECT [Active] AS active
      FROM [Vehicle]
      WHERE [Code] = @vehicleCode
    `);

    if (vehicleRes.recordset.length === 0) {
      throw new NotFoundException(`Véhicule "${dto.vehicleCode}" introuvable.`);
    }

    if (!vehicleRes.recordset[0].active) {
      throw new BadRequestException(
        `Le véhicule "${dto.vehicleCode}" est hors service.`,
      );
    }

    // Vérifier l'unicité du véhicule par date
    const reqUnique = this.database.connection.request();
    reqUnique.input('vehicleCode', dto.vehicleCode);
    reqUnique.input('deliveryDate', deliveryDateStr);
    const uniqueRes = await reqUnique.query(`
      SELECT 1 FROM [Transport Order]
      WHERE [Vehicle Code] = @vehicleCode AND [Delivery Date] = @deliveryDate
    `);

    if (uniqueRes.recordset.length > 0) {
      throw new ConflictException(
        `Un ordre de transport existe déjà pour le véhicule "${dto.vehicleCode}" à la date du ${deliveryDateStr}.`,
      );
    }

    // Générer le numéro suivant TO-XXXX
    const reqMax = this.database.connection.request();
    const maxRes = await reqMax.query<{ maxNo: string | null }>(`
      SELECT MAX([No_]) AS maxNo FROM [Transport Order]
    `);

    let nextIndex = 1;
    if (maxRes.recordset[0]?.maxNo) {
      const parts = maxRes.recordset[0].maxNo.split('-');
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextIndex = num + 1;
      }
    }

    const newNo = `TO-${String(nextIndex).padStart(4, '0')}`;

    const reqInsert = this.database.connection.request();
    reqInsert.input('no', newNo);
    reqInsert.input('vehicleCode', dto.vehicleCode);
    reqInsert.input('deliveryDate', deliveryDateStr);
    reqInsert.input('createdBy', user.id);

    await reqInsert.query(`
      INSERT INTO [Transport Order] ([No_], [Vehicle Code], [Delivery Date], [Status], [Created By], [Validated By])
      VALUES (@no, @vehicleCode, @deliveryDate, 0, @createdBy, NULL)
    `);

    return { no: newNo };
  }

  async addLines(
    no: string,
    dto: AddTransportOrderLinesDto,
  ): Promise<{ success: boolean; added: number; totalWeightKg: number }> {
    const rawIds = dto.salesOrderNos.map((id) => id.trim()).filter(Boolean);
    const uniqueOrderNos = Array.from(new Set(rawIds));

    if (uniqueOrderNos.length === 0) {
      throw new BadRequestException(
        'Veuillez sélectionner au moins une commande de vente valide.',
      );
    }

    // Vérifier l'ordre de transport
    const reqOrder = this.database.connection.request();
    reqOrder.input('no', no);
    const orderRes = await reqOrder.query<{
      status: number;
      capacityKg: number;
    }>(`
      SELECT
        to_order.[Status] AS status,
        CAST(v.[Capacity (kg)] AS float) AS capacityKg
      FROM [Transport Order] to_order
      INNER JOIN [Vehicle] v ON to_order.[Vehicle Code] = v.[Code]
      WHERE to_order.[No_] = @no
    `);

    if (orderRes.recordset.length === 0) {
      throw new NotFoundException(`Ordre de transport "${no}" introuvable.`);
    }

    const { status, capacityKg } = orderRes.recordset[0];
    if (status !== 0) {
      throw new BadRequestException(
        "Impossible d'ajouter des commandes à un ordre qui n'est plus au statut Brouillon.",
      );
    }

    // Démarrer une transaction SQL pour garantir l'atomicité
    const transaction = new sql.Transaction(this.database.connection);
    await transaction.begin();

    try {
      // 1. Calculer le poids actuellement affecté
      const reqCurrent = new sql.Request(transaction);
      reqCurrent.input('no', no);
      const currentRes = await reqCurrent.query<{ currentWeight: number }>(`
        SELECT CAST(ISNULL(SUM(so.[Total Weight (kg)]), 0) AS float) AS currentWeight
        FROM [Transport Order Line] tol
        INNER JOIN [Sales Order] so ON tol.[Sales Order No_] = so.[No_]
        WHERE tol.[Transport Order No_] = @no
      `);
      const currentWeight = Number(currentRes.recordset[0]?.currentWeight ?? 0);

      // 2. Vérifier les commandes à affecter
      // Construction de paramètres sécurisés
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
        FROM [Sales Order] so
        WHERE so.[No_] IN (${paramNames.join(', ')})
      `);

      if (ordersRes.recordset.length !== uniqueOrderNos.length) {
        throw new NotFoundException(
          'Une ou plusieurs commandes sélectionnées sont introuvables.',
        );
      }

      // Vérifier que toutes les commandes sont au statut 0 (À planifier)
      const invalidStatusOrders = ordersRes.recordset.filter(
        (o) => Number(o.status) !== 0,
      );
      if (invalidStatusOrders.length > 0) {
        throw new BadRequestException(
          `Les commandes suivantes ne sont pas au statut "À planifier" (0) : ${invalidStatusOrders.map((o) => o.no).join(', ')}.`,
        );
      }

      // Vérifier qu'aucune commande n'est déjà présente dans Transport Order Line
      const reqAlready = new sql.Request(transaction);
      uniqueOrderNos.forEach((orderNo, idx) => {
        reqAlready.input(`so_${idx}`, orderNo);
      });
      const alreadyRes = await reqAlready.query<{ salesOrderNo: string }>(`
        SELECT [Sales Order No_] AS salesOrderNo
        FROM [Transport Order Line]
        WHERE [Sales Order No_] IN (${paramNames.join(', ')})
      `);

      if (alreadyRes.recordset.length > 0) {
        throw new ConflictException(
          `Certaines commandes sont déjà associées à un transport : ${alreadyRes.recordset.map((r) => r.salesOrderNo).join(', ')}.`,
        );
      }

      // 3. Contrôle de capacité
      const additionalWeight = ordersRes.recordset.reduce(
        (sum, o) => sum + Number(o.totalWeightKg),
        0,
      );
      const newTotalWeight = currentWeight + additionalWeight;

      if (newTotalWeight > capacityKg) {
        const excess = Math.round((newTotalWeight - capacityKg) * 100) / 100;
        throw new BadRequestException(
          `La capacité maximale du véhicule (${capacityKg} kg) serait dépassée de ${excess} kg.`,
        );
      }

      // 4. Insérer les lignes et mettre à jour le statut des commandes vers 1 (Planifiée)
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

      await transaction.commit();

      return {
        success: true,
        added: uniqueOrderNos.length,
        totalWeightKg: Math.round(newTotalWeight * 100) / 100,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async removeLine(
    no: string,
    salesOrderNo: string,
  ): Promise<{ success: boolean }> {
    const reqOrder = this.database.connection.request();
    reqOrder.input('no', no);
    const orderRes = await reqOrder.query<{ status: number }>(`
      SELECT [Status] AS status
      FROM [Transport Order]
      WHERE [No_] = @no
    `);

    if (orderRes.recordset.length === 0) {
      throw new NotFoundException(`Ordre de transport "${no}" introuvable.`);
    }

    if (Number(orderRes.recordset[0].status) !== 0) {
      throw new BadRequestException(
        "Impossible de retirer une commande d'un ordre qui n'est plus au statut Brouillon.",
      );
    }

    // Vérifier que la ligne existe
    const reqLine = this.database.connection.request();
    reqLine.input('no', no);
    reqLine.input('salesOrderNo', salesOrderNo);
    const lineRes = await reqLine.query(`
      SELECT 1 FROM [Transport Order Line]
      WHERE [Transport Order No_] = @no AND [Sales Order No_] = @salesOrderNo
    `);

    if (lineRes.recordset.length === 0) {
      throw new NotFoundException(
        `La commande "${salesOrderNo}" n'appartient pas à cet ordre de transport.`,
      );
    }

    const transaction = new sql.Transaction(this.database.connection);
    await transaction.begin();

    try {
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

      await transaction.commit();
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async validate(
    no: string,
    user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    if (user.role !== UserRole.LOGISTICS_MANAGER) {
      throw new ForbiddenException(
        'Seul un Logistics Manager peut valider un ordre de transport.',
      );
    }

    const reqOrder = this.database.connection.request();
    reqOrder.input('no', no);
    const orderRes = await reqOrder.query<{ status: number }>(`
      SELECT [Status] AS status
      FROM [Transport Order]
      WHERE [No_] = @no
    `);

    if (orderRes.recordset.length === 0) {
      throw new NotFoundException(`Ordre de transport "${no}" introuvable.`);
    }

    if (Number(orderRes.recordset[0].status) !== 0) {
      throw new BadRequestException(
        "Seul un ordre au statut Brouillon (0) peut être validé.",
      );
    }

    // Vérifier qu'il y a au moins une commande
    const reqCount = this.database.connection.request();
    reqCount.input('no', no);
    const countRes = await reqCount.query<{ lineCount: number }>(`
      SELECT COUNT(*) AS lineCount
      FROM [Transport Order Line]
      WHERE [Transport Order No_] = @no
    `);

    const lineCount = Number(countRes.recordset[0]?.lineCount ?? 0);
    if (lineCount === 0) {
      throw new BadRequestException(
        'Un ordre de transport doit contenir au moins une commande pour être validé.',
      );
    }

    const reqUpdate = this.database.connection.request();
    reqUpdate.input('no', no);
    reqUpdate.input('validatedBy', user.id);
    await reqUpdate.query(`
      UPDATE [Transport Order]
      SET [Status] = 1, [Validated By] = @validatedBy
      WHERE [No_] = @no
    `);

    return { success: true, status: 1 };
  }

  async depart(
    no: string,
    _user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    const reqOrder = this.database.connection.request();
    reqOrder.input('no', no);
    const orderRes = await reqOrder.query<{ status: number }>(`
      SELECT [Status] AS status
      FROM [Transport Order]
      WHERE [No_] = @no
    `);

    if (orderRes.recordset.length === 0) {
      throw new NotFoundException(`Ordre de transport "${no}" introuvable.`);
    }

    if (Number(orderRes.recordset[0].status) !== 1) {
      throw new BadRequestException(
        'Seul un ordre validé (1) peut être marqué comme parti.',
      );
    }

    const transaction = new sql.Transaction(this.database.connection);
    await transaction.begin();

    try {
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

      await transaction.commit();
      return { success: true, status: 2 };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
