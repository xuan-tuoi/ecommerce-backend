import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsString()
  @IsNotEmpty()
  product_thumbnail: string;

  @IsString()
  @IsNotEmpty()
  product_description: string;

  @IsNotEmpty()
  @IsNumber()
  product_price: number;

  @IsNotEmpty()
  @IsNumber()
  product_quantity: number;

  @IsString()
  @IsNotEmpty()
  product_category: string;

  @IsString()
  @IsNotEmpty()
  base64: string;

  @IsNotEmpty()
  @Min(1, { message: 'Rating must be greater than 1' })
  @Max(5, { message: 'Rating must be less than 5' })
  product_ratingsAverage: number;
}
