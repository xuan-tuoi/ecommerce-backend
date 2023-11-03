import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { pick } from 'src/common/utils/helpers';
import { CreateReviewDto } from './dto/create-review.dto';
import { DeleteReviewDto } from './dto/delete-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('v1/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @Get()
  async getReviewsByParentId(
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('productId') productId: string,
    @Query('parentId') parentId: string,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    return await this.reviewService.getReviewsByParentId(
      productId,
      parentId,
      options,
    );
  }

  /**
   * get all reviews product of a shop
   * @param shopId  string
   * @param pageOptionsDto  PageOptionsDto
   * @returns
   */
  @Get('/shop/:shopId')
  async getAllReviewsOfShop(
    @Param('shopId') shopId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    return await this.reviewService.getAllReviewsOfShop(shopId, options);
  }

  /**
   *  get a review by reviewId
   * @param reviewId string
   * @returns  review
   */
  @Get('/:reviewId')
  async getReviewById(@Param('reviewId') reviewId: string) {
    return await this.reviewService.getReviewById(reviewId);
  }

  /**
   * get all reviews product of a product
   * @param productId  string
   * @param pageOptionsDto  PageOptionsDto
   * @returns  {
   * data: ReviewEntity[],
   * total: number,
   * page: number,
   * limit: number,
   * }
   */
  @Get('/product/:productId')
  async getAllReviewsOfProduct(
    @Param('productId') productId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    return await this.reviewService.getAllReviewsOfProduct(productId, options);
  }

  @Post()
  async creasteReview(@Body() createReviewDto: CreateReviewDto) {
    return await this.reviewService.createReview(createReviewDto);
  }

  @Patch('/:reviewId')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body('content') content: string,
  ) {
    console.log('reviewId', reviewId, 'content', content);
    return await this.reviewService.updateReview(reviewId, content);
  }

  @Delete('/:reviewId')
  async deleteReview(@Param('reviewId') reviewId: string) {
    return await this.reviewService.deleteReview(reviewId);
  }

  @Delete()
  async deleteReviewAndChild(@Body() deleteReviewDto: DeleteReviewDto) {
    return await this.reviewService.deleteReviewAndChild(deleteReviewDto);
  }
}
