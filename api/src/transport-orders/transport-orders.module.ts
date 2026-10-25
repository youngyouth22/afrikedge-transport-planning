import { Module } from '@nestjs/common';
import { TransportOrdersController } from './transport-orders.controller.js';
import { TransportOrdersService } from './transport-orders.service.js';

@Module({
  controllers: [TransportOrdersController],
  providers: [TransportOrdersService]
})
export class TransportOrdersModule {}
