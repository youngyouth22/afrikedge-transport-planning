import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  TransportOrdersService,
  TransportOrderDetail,
  TransportOrderSummary,
} from './transport-orders.service.js';
import { CreateTransportOrderDto } from './dto/create-transport-order.dto.js';
import { AddTransportOrderLinesDto } from './dto/add-transport-order-lines.dto.js';
import { FindTransportOrdersDto } from './dto/find-transport-orders.dto.js';
import {
  CurrentUser,
  Roles,
  RolesGuard,
  UserRole,
} from '../auth/auth.guard.js';
import type { UserContext } from '../auth/auth.guard.js';

@Controller('transport-orders')
@UseGuards(RolesGuard)
export class TransportOrdersController {
  constructor(private readonly service: TransportOrdersService) {}

  @Get()
  findAll(
    @Query() query: FindTransportOrdersDto,
  ): Promise<TransportOrderSummary[]> {
    return this.service.findAll(query);
  }

  @Get(':no')
  findOne(@Param('no') no: string): Promise<TransportOrderDetail> {
    return this.service.findOne(no);
  }

  @Post()
  create(
    @Body() dto: CreateTransportOrderDto,
    @CurrentUser() user: UserContext,
  ): Promise<{ no: string }> {
    return this.service.create(dto, user);
  }

  @Post(':no/lines')
  addLines(
    @Param('no') no: string,
    @Body() dto: AddTransportOrderLinesDto,
  ): Promise<{ success: boolean; added: number; totalWeightKg: number }> {
    return this.service.addLines(no, dto);
  }

  @Delete(':no/lines/:salesOrderNo')
  removeLine(
    @Param('no') no: string,
    @Param('salesOrderNo') salesOrderNo: string,
  ): Promise<{ success: boolean }> {
    return this.service.removeLine(no, salesOrderNo);
  }

  @Post(':no/validate')
  @Roles(UserRole.LOGISTICS_MANAGER)
  validate(
    @Param('no') no: string,
    @CurrentUser() user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    return this.service.validate(no, user);
  }

  @Post(':no/depart')
  depart(
    @Param('no') no: string,
    @CurrentUser() user: UserContext,
  ): Promise<{ success: boolean; status: number }> {
    return this.service.depart(no, user);
  }
}
