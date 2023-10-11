import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  userId: string; // shop id

  @IsString()
  voucher_name: string;

  @IsString()
  voucher_code: string;

  @IsString()
  voucher_description: string;

  @IsString()
  voucher_type: string;

  @IsNumber()
  voucher_value: number;

  voucher_start_date: Date;

  voucher_end_date: Date;

  @IsNumber()
  voucher_max_use: number;

  @IsNumber()
  voucher_uses_count: number;

  @IsArray()
  @IsOptional()
  voucher_users_used: string[];

  @IsNumber()
  voucher_max_use_per_user: number;

  @IsNumber()
  voucher_min_order_value: number;
}
