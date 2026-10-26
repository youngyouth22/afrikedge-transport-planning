import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateTransportOrderDto {
  @IsString()
  @IsNotEmpty()
  vehicleCode: string;

  @IsDateString()
  deliveryDate: string;
}
