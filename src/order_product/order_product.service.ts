import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createOrderProduct } from 'src/common/interfaces/createOrderProduct.interface';
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
}
