import { IsOptional, IsString } from 'class-validator';

export class SimilarProductDto {
  @IsString()
  product_category: string;

  @IsString()
  shop_id: string;

  @IsString()
  product_id: string;
}
