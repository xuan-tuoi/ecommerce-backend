import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteProductCartDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
}
