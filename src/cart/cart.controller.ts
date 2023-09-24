import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('v1/carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCartUser(@Query('userId') userId: string) {
    return this.cartService.getCartUser(userId);
  }

  @Put()
  async addToCart(@Body() body: AddToCartDto) {
    return this.cartService.addToCart(body);
  }
}
