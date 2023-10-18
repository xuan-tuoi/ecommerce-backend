import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchProductDto {
  @IsString()
  @IsOptional()
  product_category: string;

  @IsString()
  @IsOptional()
  product_shop: string;

  @IsString()
  @IsOptional()
  search_key: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
