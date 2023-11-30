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
  getDetailDashboad(@Body() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getDetailDashboad(detailDto);
  }

  @Get('/dashboard/order-analytics')
  getOrderAnalytics(@Body() detailDto: GetOrderAnalyticsDto) {
    return this.appService.getOrderAnalytics(detailDto);
  }

  @Get('/dashboard/best-seller')
  getBestSellerProduct(@Query('userId') userId: string) {
    return this.appService.getBestSellerProduct(userId);
  }
}
