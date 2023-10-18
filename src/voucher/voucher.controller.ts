import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { CollectVoucherDto } from './dto/collect-voucher.dto';
import { CreateVoucherDto } from './dto/create.dto';
import { VoucherService } from './voucher.service';

@Controller('v1/vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get('')
  async getVouchersByShopId(
    @Query('shopId') shopId: string,
    @Query('userId') userId: string,
  ) {
    if (!shopId) {
      throw new Error('ShopId is required');
    }
    return this.voucherService.getVouchersByShopId(shopId, userId);
  }

  @Get('/:voucherCode')
  async getVoucherByCode(@Param('voucherCode') voucherCode: string) {
    return this.voucherService.getVoucherByCode(voucherCode);
  }

  @Get('/user/:userId')
  async getVouchersByUserId(@Param('userId') userId: string) {
    return this.voucherService.getVouchersByUserId(userId);
  }

  @Post('/create')
  async createVoucher(@Body() body: CreateVoucherDto) {
    return this.voucherService.createVoucher(body);
  }

  @Post('/collect')
  async collectVoucher(@Body() body: CollectVoucherDto) {
    return this.voucherService.collectVoucher(body);
  }

  @Post('/apply-voucher')
  async applyVoucher(@Body() body: ApplyVoucherDto) {
    return this.voucherService.applyVoucher(body);
  }
}
