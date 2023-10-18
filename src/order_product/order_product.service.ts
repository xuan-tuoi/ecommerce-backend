import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { createOrderProduct } from 'src/common/interfaces/createOrderProduct.interface';
import { ProductsService } from 'src/products/products.service';
import { User } from 'src/users/user.interface';
import { Repository } from 'typeorm';
import { OrderProductEntity } from './entities/orderProduct.entity';

@Injectable()
export class OrderProductService {
  constructor(
    @InjectRepository(OrderProductEntity)
    private readonly orderProductRepository: Repository<OrderProductEntity>,
  ) {}

  public async createOrderProduct(orderProductBody: createOrderProduct) {
    try {
      const { quantity, order, product } = orderProductBody;
      const newOrderProduct = this.orderProductRepository.create({
        quantity,
      });
      newOrderProduct.order = order;
      newOrderProduct.product = product;
      await this.orderProductRepository.save(newOrderProduct);
      return {
        message: 'Create order product successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async getBestSellerProduct(pageOptionsDto: PageOptionsDto) {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
    const queryBuilder =
      this.orderProductRepository.createQueryBuilder('order_product');
    queryBuilder
      .select('order_product.product_id')
      .groupBy('order_product.product_id')
      .orderBy('SUM(order_product.quantity)', 'DESC')
      .skip(skip)
      .take(pageOptionsDto.limit * 6);
    const listBestSellerProduct = await queryBuilder.getMany();
    return listBestSellerProduct;
  }

  public async getTop4BestSellerProduct() {
    const queryBuilder =
      this.orderProductRepository.createQueryBuilder('order_product');
    queryBuilder
      .select('order_product.product_id')
      .groupBy('order_product.product_id')
      .orderBy('SUM(order_product.quantity)', 'DESC')
      .take(4);
    const query = queryBuilder.getQuery();
    console.log('query', query);
    const top4SellerProduct = await queryBuilder.getRawMany();
    return top4SellerProduct;
  }

  public async getAllOrderProductsOfOrder(orderId: string) {
    const queryBuilder =
      this.orderProductRepository.createQueryBuilder('order_product');
    const listOrderProduct = await queryBuilder
      .leftJoinAndSelect('order_product.product', 'product')
      .where('order_product.order_id = :orderId', { orderId })
      .andWhere('order_product.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('product.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    return listOrderProduct;
  }

  public async getHistoryOrder(userId: string) {
    const queryBuilder =
      this.orderProductRepository.createQueryBuilder('order_product');
    const listOrderProduct = await queryBuilder
      .leftJoinAndSelect('order_product.product', 'products')
      .leftJoin('order_product.order', 'orders')
      .andWhere(`orders.user_id = '${userId}'`)
      .getMany();
    // TH user mới sẽ chưa có order nào => listOrderProduct = []
    return listOrderProduct;
  }
}
