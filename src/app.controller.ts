import { Body, Controller, Get, Query } from '@nestjs/common';
import { GetOrderAnalyticsDto } from './app.dto';
import { AppService } from './app.service';

@Controller('/v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/dashboard/overview')
  getDetailDashboad(@Query() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getDetailDashboad(detailDto);
  }

  @Get('/dashboard/order-analytics')
  getOrderAnalytics(@Query() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getOrderAnalytics(detailDto);
  }

  @Get('/dashboard/best-seller')
  getBestSellerProduct(@Query() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getBestSellerProduct(detailDto);
  }

  @Get('/dashboard/user-by-country')
  getUserByCountry(@Query() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getUserByCountry(detailDto);
  }
}
