import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { pick } from 'src/common/utils/helpers';
import { CreateOrderDto } from './dto/create.dto';
import { DeliveredDto } from './dto/delivered.dto';
import { UpdateOrderDto } from './dto/update.dto';
import { OrdersService } from './orders.service';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // get all order of customer
  @Get('/:userId')
  async getAllOrdersOfUser(
    @Param('userId') userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    return this.ordersService.getAllOrdersOfUser(userId, options);
  }

  @Get('shop/:shopId')
  async getAllOrdersOfShop(
    @Param('shopId') shopId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    return this.ordersService.getAllOrdersOfShop(shopId, options);
  }

  @Post('/create')
  async createOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @Post('/crawl-data-order')
  async crawlDataOrder() {
    return this.ordersService.crawlDataOrder();
  }

  @Patch('/update')
  async updateOrder(@Body() body: UpdateOrderDto) {
    return this.ordersService.updateOrder(body);
  }

  @Patch('/update-day')
  async updateDay() {
    return this.ordersService.updateDay();
  }

  @Post('/delivered')
  async delivered(@Body() body: DeliveredDto) {
    return this.ordersService.deliveredOrder(body);
  }
}
