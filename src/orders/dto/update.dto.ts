import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderDto {
  time_delivery: Date;
  order_checkout: any;
  order_shipping: any;
  order_payment: any;
  order_status: string;

  @IsString()
  @IsNotEmpty()
  order_id: string;
}
