import { IsOptional, IsString } from 'class-validator';

export class SearchProductDto {
  @IsString()
  @IsOptional()
  product_name: string;

  @IsString()
  @IsOptional()
  product_category: string;

  @IsString()
  @IsOptional()
  product_shop: string;
}
