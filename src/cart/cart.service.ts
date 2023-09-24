import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductInterface } from 'src/products/product.interface';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartEntity } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}
  public async getCartUser(userId: string) {
    return `This action returns a #${userId} cart`;
  }

  public async addToCart(body: AddToCartDto) {
    try {
      const { userId, product } = body;
      const user = await this.usersService.getUserById(userId);

      const cart = await this.cartRepository.findOne({
        where: { cart_userId: user.id },
      });
      const { productId, price, quantity, shopId } = product;
      if (!cart) {
        // create new cart for user
        const newCart = new CartEntity();
        newCart.cart_userId = user.id;
        newCart.cart_products = [
          {
            product_id: productId,
            quantity: quantity,
            price: price,
            shop_id: shopId,
          },
        ]; // danh sach san pham trong gio hang va so luong
        newCart.cart_count_product = 1; // so luong san pham trong gio hang
        newCart.cart_status = 'active';
        await this.cartRepository.save(newCart);
        return {
          message: 'Add to cart successfully',
        };
      }

      // add product to cart
      const isExsitProduct = cart.cart_products.find(
        (item: {
          product_id: string;
          quantity: number;
          price: number;
          shop_id: string;
        }) => {
          if (item.product_id === productId) {
            return true;
          }
          return false;
        },
      );
      // case 1:  product is already in cart => increase quantity
      if (isExsitProduct) {
        cart.cart_products = cart.cart_products.map(
          (item: {
            product_id: string;
            quantity: number;
            price: number;
            shop_id: string;
          }) => {
            if (item.product_id === productId) {
              item.quantity += quantity;
              return item;
            }
            return item;
          },
        );
        console.log('count', typeof cart.cart_count_product);
        await this.cartRepository.save(cart);
        return {
          message: 'Add to cart successfully',
        };
      } else {
        // case 2:
        cart.cart_products.push({
          product_id: productId,
          quantity: quantity,
          price: price,
          shop_id: shopId,
        });
        cart.cart_count_product += 1;
        await this.cartRepository.save(cart);
        return {
          message: 'Add to cart successfully',
        };
      }
    } catch (error) {
      throw new BadRequestException('Add to cart failed' + error);
    }
  }
}
