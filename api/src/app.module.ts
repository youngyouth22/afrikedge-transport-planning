import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { SalesOrdersModule } from './sales-orders/sales-orders.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { TransportOrdersModule } from './transport-orders/transport-orders.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    SalesOrdersModule,
    VehiclesModule,
    TransportOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
