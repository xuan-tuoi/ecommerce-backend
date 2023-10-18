import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateCartDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productId: string;
}
