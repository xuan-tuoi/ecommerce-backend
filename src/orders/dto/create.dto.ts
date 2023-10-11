import { IsObject, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  userId: string;

  products: any;

  orderCheckout: any;

  orderShipping: any;

  orderPayment: any;
}
