import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly userService: UsersService,
    private readonly productService: ProductsService,
  ) {}

  public async getAllReviewsOfShop(
    shopId: string,
    pageOptionDto: PageOptionsDto,
  ) {
    const skip = (pageOptionDto.page - 1) * pageOptionDto.limit;
    const foundShop = await this.userService.getUserById(shopId);
    const queryBuilder = this.reviewRepository.createQueryBuilder('reviews');
    queryBuilder
      .leftJoinAndSelect('reviews.user', 'user')
      .where('reviews.shopId = :shopId', { shopId: foundShop.id })
      .andWhere('reviews.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy(`products.${pageOptionDto.sort}`, pageOptionDto.order)
      .skip(skip)
      .take(pageOptionDto.limit);

    const [reviews, reviewsCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto: PageMetaDto = new PageMetaDto({
      pageOptionsDto: pageOptionDto,
      itemCount: reviewsCount,
    });
    const pageDto: PageDto<any> = new PageDto(reviews, pageMetaDto);
    return pageDto;
  }

  public async getReviewById(reviewId: string) {
    const foundReview = await this.reviewRepository
      .findOne({
        where: { id: reviewId, isDeleted: false },
        relations: ['user', 'product'],
      })
      .catch((err) => {
        throw new BadRequestException(err.message);
      });

    if (!foundReview) {
      throw new NotFoundException('Review not found');
    }
    return {
      review: foundReview,
      user: {
        id: foundReview.user.id,
        username: foundReview.user.username,
        email: foundReview.user.email,
      },
      product: {
        id: foundReview.product.id,
        name: foundReview.product.product_name,
        price: foundReview.product.product_price,
        thumbnail: foundReview.product.product_thumbnail,
      },
    };
  }

  public async getAllReviewsOfProduct(
    productId: string,
    options: PageOptionsDto,
  ) {
    const foundProduct = await this.productService.getProductById(productId);
    const skip = (options.page - 1) * options.limit;
    const queryBuilder = this.reviewRepository.createQueryBuilder('reviews');
    queryBuilder
      .leftJoinAndSelect('reviews.product', 'product')
      .where('product.id = :id', { id: foundProduct.id })
      .andWhere('reviews.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .orderBy(`reviews.${options.sort}`, options.order)
      .skip(skip)
      .take(options.limit);

    const [reviews, reviewsCount] = await queryBuilder.getManyAndCount();
    const pageMetaDto: PageMetaDto = new PageMetaDto({
      pageOptionsDto: options,
      itemCount: reviewsCount,
    });
    const pageDto: PageDto<any> = new PageDto(reviews, pageMetaDto);
    return pageDto;
  }

  public async createReview(reviewDto: CreateReviewDto) {
    const foundUser = await this.userService.getUserById(reviewDto.userId);
    const foundProduct = await this.productService.getProductById(
      reviewDto.productId,
    );
    const newReview = this.reviewRepository.create({
      ...reviewDto,
      user: foundUser,
      product: foundProduct,
    });
    await this.reviewRepository.save(newReview);
    return {
      review: newReview,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
      product: {
        id: foundProduct.id,
        name: foundProduct.product_name,
        price: foundProduct.product_price,
        thumbnail: foundProduct.product_thumbnail,
      },
    };
  }

  public async deleteReview(reviewId: string) {
    const foundReview = await this.reviewRepository.findOne({
      where: { id: reviewId, isDeleted: false },
    });
    if (!foundReview) {
      throw new NotFoundException('Review not found');
    }
    await this.reviewRepository.delete({
      id: reviewId,
    });
    return {
      message: 'Delete review successfully',
    };
  }
}
