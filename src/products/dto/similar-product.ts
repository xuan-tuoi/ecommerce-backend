import { IsString } from 'class-validator';

export class SimilarProductDto {
  @IsString()
  product_id: string;

  limit: number;
}
