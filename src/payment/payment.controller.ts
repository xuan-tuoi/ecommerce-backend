import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';

@Controller('v1/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('/success')
  async success() {
    return this.paymentService.success();
  }

  @Get('/fail')
  async fail() {
    return this.paymentService.fail();
  }

  @Post('/checkout')
  async createPaymentUrl(@Req() request: Request, @Res() response: Response) {
    return this.paymentService.createPaymentUrl(request, response);
  }
}
