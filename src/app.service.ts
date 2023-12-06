import { BadRequestException, Injectable } from '@nestjs/common';
import { GetOrderAnalyticsDto } from './app.dto';
import { OrdersService } from './orders/orders.service';
import { ProductsService } from './products/products.service';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(
    private readonly userService: UsersService,
    private readonly orderService: OrdersService,
    private readonly productService: ProductsService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDetailDashboad(detailDto: GetOrderAnalyticsDto) {
    try {
      const { from, to, userId } = detailDto;
      const infoOverview = await this.orderService.getInfoOrders({
        userId,
        from,
        to,
      });

      return infoOverview;

      // get revenue from DB of all orders from user id = from
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getOrderAnalytics(detailDto: any) {
    try {
      const { from, to, userId } = detailDto;
      const userFound = await this.userService.findOne({ id: userId });

      if (!userFound) {
        throw new BadRequestException('User not found');
      }

      const orderAnalytics = await this.orderService.getOrderAnalytics({
        userId,
        from,
        to,
      });

      return orderAnalytics;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getBestSellerProduct(detailDto: GetOrderAnalyticsDto) {
    try {
      const { from, to, userId } = detailDto;
      const userFound = await this.userService.findOne({ id: userId });
      if (!userFound) {
        throw new BadRequestException('User not found');
      }
      // get top 5 product which has been sold the most
      const bestSellerProduct = await this.productService.getTopFiveProduct(
        userId,
        from,
        to,
      );

      return bestSellerProduct;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getUserByCountry(detailDto: GetOrderAnalyticsDto) {
    try {
      const { from, to, userId } = detailDto;
      const userFound = await this.userService.findOne({ id: userId });
      if (!userFound) {
        throw new BadRequestException('User not found');
      }
      // divide order by country
      const userByCountry = await this.orderService.getUserByCountry({
        userId,
        from,
        to,
      });
      if (userByCountry.length === 0) {
        return [];
      }
      return userByCountry;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
