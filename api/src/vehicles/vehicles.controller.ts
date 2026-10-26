import { Controller, Get } from '@nestjs/common';
import { Vehicle, VehiclesService } from './vehicles.service.js';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  findActive(): Promise<Vehicle[]> {
    return this.service.findActive();
  }
}
