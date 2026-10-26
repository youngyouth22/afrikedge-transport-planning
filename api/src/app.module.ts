import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { SalesOrdersModule } from './sales-orders/sales-orders.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { TransportOrdersModule } from './transport-orders/transport-orders.module.js';

@Module({
  imports: [

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
