import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { DeleteProductCartDto } from './dto/delete-product-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('v1/carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCartUser(@Query('userId') userId: string) {
    return this.cartService.getCartUser(userId);
  }

  @Get('/detail')
  async getCartDetail(@Query('userId') userId: string) {
    return this.cartService.getCartDetail(userId);
  }

  @Patch('/update')
  async updateCart(@Body() body: UpdateCartDto) {
    return this.cartService.updateCart(body);
  }

  @Put()
  async addToCart(@Body() body: AddToCartDto) {
    return this.cartService.addToCart(body);
  }

  @Delete()
  async deleteProductCartUser(@Body() body: DeleteProductCartDto) {
    return this.cartService.deleteProductCartUser(body);
  }
}
