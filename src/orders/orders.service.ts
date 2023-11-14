import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartService } from 'src/cart/cart.service';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { HistoryVoucherService } from 'src/history-voucher/history-voucher.service';
import { OrderProductService } from 'src/order_product/order_product.service';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { VoucherService } from 'src/voucher/voucher.service';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create.dto';
import { UpdateOrderDto } from './dto/update.dto';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly userService: UsersService,
    private readonly productService: ProductsService,
    private readonly cartService: CartService,
    private readonly orderProductService: OrderProductService,
    private readonly historyVoucherService: HistoryVoucherService,
    private readonly voucherService: VoucherService,
  ) {}

  public async createOrder(body: CreateOrderDto) {
    try {
      const { userId, products, orderShipping, orderCheckout, orderPayment } =
        body;

      // find user, cart of user by userId
      const user = await this.userService.getUserById(userId);
      const cart = await this.cartService.findOne(userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      // check product:
      /**
       * - Sản phẩm trong giỏ có tồn tại hay không ?
       * - Sản phẩm trong giỏ có cái nào hết hàng hay không
       * - Số lượng sản phẩm trong giỏ có lớn hơn số lượng sản phẩm trong kho hay không ?
       * 
       * if (!product) {
            throw new Error(`Product ${item.product_name} not found`);
          }
          if (product.product_quantity < quantity) {
            throw new Error(`Product ${item.product_name} out of stock`);
          } else
       */
      const productPromise = products.map(async (item: any) => {
        const product = await this.productService
          .findOne(item.id)
          .catch((err) => {
            throw new HttpException(
              `Product ${item.product_name} not found or maybe deleted by shop owner`,
              HttpStatus.BAD_REQUEST,
            );
          });
        if (product.product_quantity === 0) {
          throw new BadRequestException(
            `${item.product_name.slice(0, 20)}... out of stock`,
          );
        } else if (product.product_quantity < item.quantityToBuy) {
          throw new BadRequestException(
            `${item.product_name.slice(0, 20)}... have only ${
              product.product_quantity
            } left`,
          );
        } else {
          return product;
        }
      });
      await Promise.all(productPromise);

      // save thông tin order vào trong order table
      const newOrder = new OrderEntity();
      newOrder.user = user;
      newOrder.order_shipping = orderShipping;
      newOrder.order_checkout = {
        totalPrice: orderCheckout.totalPrice,
      };
      newOrder.order_payment = orderPayment;

      // nếu user có sử dụng voucher discount hoặc voucher freeShip thì lưu vào history voucher
      if (orderCheckout.voucherId) {
        const voucher = await this.voucherService.findOne(
          orderCheckout.voucherId,
        );

        newOrder.order_checkout['voucher'] = voucher;
        await this.historyVoucherService.saveVoucherUsedIntoHistoryVoucher(
          voucher,
          user,
        );
      }
      if (orderCheckout.voucherFreeShipId) {
        const voucher = await this.voucherService.findOne(
          orderCheckout.voucherFreeShipId,
        );

        newOrder.order_checkout['voucherFreeShip'] = voucher;
        await this.historyVoucherService.saveVoucherUsedIntoHistoryVoucher(
          voucher,
          user,
        );
      }

      // delete products in cart after create order
      const cartProducts = cart.cart_products.filter((item: any) => {
        const isExist = products.find((product: any) => {
          return product.id === item.product_id;
        });
        return !isExist;
      });
      if (cartProducts.length === 0) {
        await this.cartService.deletecart(cart);
      } else {
        cart.cart_products = cartProducts;
        cart.cart_count_product = cartProducts.length;
        await this.cartService.save(cart);
      }

      const tmp = this.orderRepository.create(newOrder);
      const order = await this.orderRepository.save(tmp);
      // save thông tin product , quantity vào trong order product table
      await Promise.all(
        products.map(async (item: any) => {
          const product = await this.productService.findOne(item.id);
          const quantity = item.quantityToBuy;
          if (product.product_quantity === quantity) {
            product.product_status = 'outOfStock';
          }
          product.product_quantity = product.product_quantity - quantity;
          await this.productService.save(product);
          const orderProduct =
            await this.orderProductService.createOrderProduct({
              product,
              quantity,
              order,
            });
          return orderProduct;
        }),
      );
      return order;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  public async getAllOrdersOfUser(
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ) {
    const user = await this.userService.getUserById(userId);

    const queryBuilder = this.orderRepository.createQueryBuilder('orders');
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
    // lấy ra những đơn hàng của user với limit và offset
    queryBuilder
      .leftJoinAndSelect('orders.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      // .skip(skip)
      // .take(pageOptionsDto.limit)
      .orderBy(`orders.${pageOptionsDto.sort}`, pageOptionsDto.order);

    // lấy ra tổng số lượng đơn hàng của user
    const total = await queryBuilder.getCount();
    const listOrders = await queryBuilder.getMany();

    // map to order and get list Product of each order
    const listOrdersWithProducts = listOrders.map(async (order: any) => {
      const listOrderProducts =
        await this.orderProductService.getAllOrderProductsOfOrder(order.id);

      const listProducts = listOrderProducts.map(async (orderProduct: any) => {
        const product = orderProduct.product;
        const quantity = orderProduct.quantity;
        const productInfo = await this.productService.getProductById(
          product.id,
        );
        return {
          ...productInfo,
          quantityToBuy: quantity,
        };
      });
      order.products = await Promise.all(listProducts);
      return order;
    });

    const listOrdersWithProductsResolved = await Promise.all(
      listOrdersWithProducts,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto,
      itemCount: total,
    });
    return { data: listOrdersWithProductsResolved, pageMetaDto };
  }

  public async updateOrder(body: UpdateOrderDto) {
    try {
      const orderId = body.order_id;
      const order = await this.orderRepository
        .findOne({
          where: { id: orderId },
        })
        .catch((err) => {
          throw new HttpException(
            `Order ${orderId} not found`,
            HttpStatus.BAD_REQUEST,
          );
        });
      if (!order) {
        throw new Error('Order not found');
      }

      if (body.time_delivery) {
        order.time_delivery = body.time_delivery;
      }

      if (body.order_checkout) {
        order.order_checkout = body.order_checkout;
      }

      if (body.order_shipping) {
        order.order_shipping = body.order_shipping;
      }

      if (body.order_payment) {
        order.order_payment = body.order_payment;
      }

      if (body.order_status) {
        order.order_status = body.order_status;
      }

      await this.orderRepository.save(order);
      return order;
    } catch (error) {
      console.log('error', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  public async crawlDataOrder() {
    try {
      const listUser = await this.userService.getAllCustomer();
      const listProduct = await this.productService.getAllProduct();
      const promise = listUser.map(async (user) => {
        const productRandomId =
          listProduct[Math.floor(Math.random() * listProduct.length)];
        const product = await this.productService.getProductById(
          productRandomId.id,
        );

        const order_shipping = [
          {
            name: 'Giao hàng tiết kiệm',
            city: 'Hồ Chí Minh',
          },
          {
            city: 'Hà Nội',
            phone: '1900 545 436',
          },
          {
            city: 'Đà Nẵng',
            phone: '1900 545 436',
          },
          {
            city: 'Hải Phòng',
            phone: '1900 545 436',
          },
          {
            city: 'Cần Thơ',
            phone: '1900 545 436',
          },
          {
            city: 'Bình Dương',
            phone: '1900 545 436',
          },
          {
            city: 'Đồng Nai',
            phone: '1900 545 436',
          },
        ];

        const order_payment = {
          paymentData: {
            cardName: '',
            cardNumber: '',
          },
          paymentMethod: 'money',
        };

        const quantity = Math.floor(Math.random() * 34);

        const order_checkout = {
          totalPrice: product.product_price * quantity,
        };

        const newOrder = await this.orderRepository.save({
          order_shipping: order_shipping[Math.floor(Math.random() * 4)],
          order_payment,
          user,
          order_status: ['pending', 'packaged', 'shipping', 'cancelled'][
            Math.floor(Math.random() * 4)
          ],
          order_checkout,
        });

        await this.orderProductService.createOrderProduct({
          product,
          quantity,
          order: newOrder,
        });
        return newOrder;
      });
      return await Promise.all(promise);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
