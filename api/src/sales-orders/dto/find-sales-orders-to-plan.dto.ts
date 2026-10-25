import { IsOptional, IsString } from 'class-validator';

export class FindSalesOrdersToPlanDto {
  @IsOptional()
  @IsString()
  city?: string;
}
