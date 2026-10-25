import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller.js';
import { SalesOrdersService } from './sales-orders.service.js';

@Module({
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService]
})
export class SalesOrdersModule {}
