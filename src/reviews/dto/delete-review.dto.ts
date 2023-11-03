import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteReviewDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  reviewId: string;
}
