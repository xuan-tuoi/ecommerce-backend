import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { DeleteReviewDto } from './dto/delete-review.dto';
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
      review: {
        id: foundReview.id,
        rating: foundReview.review_ratings,
        review_content: foundReview.review_content,
        createdAt: foundReview.createdAt,
        updatedAt: foundReview.updatedAt,
        parentId: foundReview.parentCommentId,
        comment_left: foundReview.comment_left,
        comment_right: foundReview.comment_right,
      },
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
      .leftJoinAndSelect('reviews.user', 'user')
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
    const listReviewData = reviews.map((review: any) => {
      return {
        id: review.id,
        createdAt: review.createdAt,
        content: review.review_content,
        rating: review.review_ratings,
        user: {
          id: review.user.id,
          username: review.user.username,
          email: review.user.email,
          avatar: review.user.avatar,
        },
      };
    });
    const pageDto: PageDto<any> = new PageDto(listReviewData, pageMetaDto);
    return pageDto;
  }

  async getMaxRightValue(productId: string) {
    const queryBuilder = this.reviewRepository.createQueryBuilder('reviews');
    queryBuilder
      .select('MAX(reviews.comment_right)', 'max_right')
      .where('reviews.product_id = :productId', { productId: productId });
    const maxRightValue = await queryBuilder.getRawOne();
    if (maxRightValue && maxRightValue.max_right !== null) {
      return maxRightValue.max_right + 1;
    }
    return 1;
  }

  public async createReview(reviewDto: CreateReviewDto) {
    //create new review
    const foundUser = await this.userService.getUserById(reviewDto.userId);
    const foundProduct = await this.productService.getProductById(
      reviewDto.productId,
    );
    const newReview = this.reviewRepository.create({
      review_content: reviewDto.content,
      review_ratings: reviewDto.rating,
      user: foundUser,
      product: foundProduct,
      parentCommentId: reviewDto.parentCommentId,
    });
    // logic xử lí reply comment
    let rightValue;
    if (reviewDto.parentCommentId) {
      const parentComment = await this.reviewRepository.findOne({
        where: { id: reviewDto.parentCommentId, isDeleted: false },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      rightValue = parentComment.comment_right;
      // update comments
      // update comment_right of comments that have comment_right >= rightValue
      await this.reviewRepository.query(
        `UPDATE reviews SET comment_right = comment_right + 2 WHERE comment_right >= ${rightValue} AND product_id = '${reviewDto.productId}'`,
      );
      // update comment_left of comments that have comment_left >= rightValue
      await this.reviewRepository.query(
        `UPDATE reviews SET comment_left = comment_left + 2 WHERE comment_left >= ${rightValue} AND product_id = '${reviewDto.productId}'`,
      );
    } else {
      rightValue = await this.getMaxRightValue(reviewDto.productId);
    }
    // save new comment
    newReview.comment_left = rightValue;
    newReview.comment_right = rightValue + 1;
    await this.reviewRepository.save(newReview);
    return {
      id: newReview.id,
      createdAt: newReview.createdAt,
      content: newReview.review_content,
      rating: newReview.review_ratings,
      user: {
        id: newReview.user.id,
        username: newReview.user.username,
        email: newReview.user.email,
      },
      comment_left: newReview.comment_left,
      comment_right: newReview.comment_right,
      parentCommentId: newReview.parentCommentId,
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

  public async getReviewsByParentId(productId, parentId, options) {
    if (parentId) {
      const foundParentComment = await this.reviewRepository.findOne({
        where: { id: parentId, isDeleted: false },
      });
      if (!foundParentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      // lấy ra những comment con của parentId
      const queryBuilder = this.reviewRepository.createQueryBuilder('reviews');
      queryBuilder
        .leftJoinAndSelect('reviews.user', 'user')
        .where('reviews.product = :productId', { productId: productId })
        .andWhere('reviews.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('reviews.parentCommentId = :parentId', {
          parentId: parentId,
        })
        .orderBy(`reviews.${options.sort}`, options.order);
      const reviews = await queryBuilder.getMany();
      const listReviewData = reviews.map(async (review: any) => {
        // lấy ra tổng số lượng con của comment hiện tại
        const totalChildren = await this.reviewRepository
          .createQueryBuilder('reviews')
          .where('reviews.product = :productId', { productId: productId })
          .andWhere('reviews.isDeleted = :isDeleted', { isDeleted: false })
          .andWhere('reviews.comment_left > :leftValue', {
            leftValue: review.comment_left,
          })
          .andWhere('reviews.comment_right < :rightValue', {
            rightValue: review.comment_right,
          })
          .getCount();
        return {
          id: review.id,
          createdAt: review.createdAt,
          content: review.review_content,
          rating: review.review_ratings,
          user: {
            id: review.user.id,
            username: review.user.username,
            email: review.user.email,
            avatar: review.user.avatar,
          },
          totalReply: totalChildren,
        };
      });
      return await Promise.all(listReviewData);
    }
    //nếu không có parentId tức là đây là comment cha , sẽ phải map và lấy ra tất cả các comment con của nó
    const reviews = await this.reviewRepository.find({
      where: {
        product: {
          id: productId,
        },
        parentCommentId: IsNull(),
        isDeleted: false,
      },
      relations: ['user'],
      order: {
        comment_left: 'ASC',
      },
    });

    const listReviewData = reviews.map(async (review: any) => {
      const totalChildren = await this.reviewRepository
        .createQueryBuilder('reviews')
        .where('reviews.product = :productId', { productId: productId })
        .andWhere('reviews.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('reviews.comment_left > :leftValue', {
          leftValue: review.comment_left,
        })
        .andWhere('reviews.comment_right < :rightValue', {
          rightValue: review.comment_right,
        })
        .getCount();
      return {
        id: review.id,
        createdAt: review.createdAt,
        content: review.review_content,
        rating: review.review_ratings,
        user: {
          id: review.user.id,
          username: review.user.username,
          email: review.user.email,
          avatar: review.user.avatar,
        },
        totalReply: totalChildren,
      };
    });
    return await Promise.all(listReviewData);
  }

  public async updateReview(reviewId: string, content: string) {
    try {
      // find review
      const foundReview = await this.reviewRepository.findOne({
        where: { id: reviewId, isDeleted: false },
      });
      if (!foundReview) {
        throw new NotFoundException('Review not found');
      }
      // update review
      foundReview.review_content = content;
      await this.reviewRepository.save(foundReview);
      return {
        message: 'Update review successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  public async deleteReviewAndChild(deleteReviewDto: DeleteReviewDto) {
    try {
      const { productId, reviewId } = deleteReviewDto;
      // found product by id
      const foundProduct = await this.productService.getProductById(productId);

      // found review by id
      const foundReview = await this.reviewRepository.findOne({
        where: { id: reviewId, isDeleted: false },
      });
      if (!foundReview) {
        throw new NotFoundException('Review not found');
      }
      // 1. Xác định leftValue và rightValue của review cần xóa
      const leftValue = foundReview.comment_left;
      const rightValue = foundReview.comment_right;
      // 2. Tính chiều rộng
      const width = rightValue - leftValue + 1;
      // 3. Xóa comment và tất cả các comment con của review
      await this.reviewRepository.query(
        `DELETE FROM reviews WHERE comment_left >= ${leftValue} AND comment_right <= ${rightValue} AND product_id = '${productId}'`,
      );

      // 4. Cập nhật lại comment_left và comment_right của các comment còn lại
      await this.reviewRepository.query(
        `UPDATE reviews SET comment_left = CASE WHEN comment_left > ${leftValue} THEN comment_left - ${width} ELSE comment_left END, comment_right = CASE WHEN comment_right > ${rightValue} THEN comment_right - ${width} ELSE comment_right END WHERE comment_left > ${leftValue} AND comment_right < ${rightValue} AND product_id = '${productId}'`,
      );
      return {
        message: 'Delete review successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
