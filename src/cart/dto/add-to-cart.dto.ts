import { IsObject, IsString } from 'class-validator';

export class AddToCartDto {
  @IsString()
  userId: string;

  @IsObject()
  product: {
    productId: string;
    shopId: string;
    quantity: number;
    price: number;
  };
}
