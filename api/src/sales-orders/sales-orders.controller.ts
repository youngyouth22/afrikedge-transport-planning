import { Controller, Get, Query } from '@nestjs/common';
import {
  SalesOrdersService,
  SalesOrderToPlan,
} from './sales-orders.service.js';
import { FindSalesOrdersToPlanDto } from './dto/find-sales-orders-to-plan.dto.js';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Get('to-plan')
  findToPlan(
    @Query() query: FindSalesOrdersToPlanDto,
  ): Promise<SalesOrderToPlan[]> {
    return this.service.findToPlan(query.city);
  }
}
