import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SalesOrdersService,
  PaginatedSalesOrdersToPlan,
} from './sales-orders.service.js';
import { FindSalesOrdersToPlanDto } from './dto/find-sales-orders-to-plan.dto.js';

@ApiTags('Sales Orders')
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Get('to-plan')
  @ApiOperation({
    summary: 'Liste paginée des commandes à planifier avec filtre par ville',
  })
  findToPlan(
    @Query() query: FindSalesOrdersToPlanDto,
  ): Promise<PaginatedSalesOrdersToPlan> {
    return this.service.findToPlan(query.city, query.page, query.limit);
  }
}

