import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  product_price: number;
  product_original_price: number;
  product_quantity: number;
  product_category: string;
  product_status: string;
  product_ratingsAverage: number;
  product_listImages: string[];
  product_thumbnail: string;
  product_attribute: object;
  isDraft: boolean;
  isPublished: boolean;
  product_name: string;
  product_description: string;
}
