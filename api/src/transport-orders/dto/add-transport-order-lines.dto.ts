import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AddTransportOrderLinesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  salesOrderNos: string[];
}
