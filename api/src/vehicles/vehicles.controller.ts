import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Vehicle, VehiclesService } from './vehicles.service.js';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de tous les véhicules actifs' })
  findActive(): Promise<Vehicle[]> {
    return this.service.findActive();
  }
}

