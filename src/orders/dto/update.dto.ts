import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  order_shipping: any;

  order_status: string;

  @IsString()
  @IsNotEmpty()
  order_id: string;
}