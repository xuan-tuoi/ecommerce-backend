import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductInterface } from 'src/products/product.interface';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { DeleteProductCartDto } from './dto/delete-product-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartEntity } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  public async findOne(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    return cart;
  }

  public async save(cart: CartEntity) {
    return this.cartRepository.save(cart);
  }

  public async deletecart(cart: CartEntity) {
    return this.cartRepository.remove(cart);
  }
  /**
   * @param userId string
   * @returns infor for getting count product in cart
   */
  public async getCartUser(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!cart) {
      return {
        cart_products: [],
        cart_count_product: 0,
      };
    }
    return cart;
  }

  /**
   *
   * @param userId string
   * return information of cart: list product, count product
   */
  public async getCartDetail(userId: string) {
    try {
      const queryBuilder = this.cartRepository
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.user', 'user') // Thay 'user' bằng tên mối quan hệ trong entity CartEntity
        .where('user.id = :userId', { userId });
      const cart = await queryBuilder.getOne();
      if (!cart) {
        return {
          cart_products: [],
          cart_count_product: 0,
        };
      }
      const productList = cart.cart_products;
      const productDetailInfo = productList.map(async (item: any) => {
        const product = await this.productsService.getProductById(
          item.product_id,
        );
        const shop = await this.usersService.getUserById(item.shop_id);
        return {
          quantity: item.quantity,
          product: product,
          shop: shop,
        };
      });
      const productDetail = await Promise.all(productDetailInfo);
      // group product same shop into a object
      const productDetailGroupByShop = productDetail.reduce((acc, cur) => {
        const shopId = cur.shop.username;
        if (acc[shopId]) {
          acc[shopId].products.push({
            id: cur.product.id,
            product_thumbnail: cur.product.product_thumbnail,
            product_name: cur.product.product_name,
            product_price: cur.product.product_price,
            quantityToBuy: cur.quantity,
          });
        } else {
          acc[shopId] = {
            shop: cur.shop,
            products: [
              {
                id: cur.product.id,
                product_thumbnail: cur.product.product_thumbnail,
                product_name: cur.product.product_name,
                product_price: cur.product.product_price,
                quantityToBuy: cur.quantity,
              },
            ],
          };
        }
        return acc;
      }, {});
      return {
        ...cart,
        cart_products: productDetailGroupByShop,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async addToCart(body: AddToCartDto) {
    try {
      const { userId, product } = body;
      const user = await this.usersService.getUserById(userId);
      const cart = await this.cartRepository.findOne({
        where: {
          user: {
            id: userId,
          },
        },
      });

      const { productId, price, quantity, shopId } = product;

      // check sản phẩm còn hàng hay không
      const productInStock = await this.productsService
        .findOne(productId)
        .catch((err) => {
          throw new BadRequestException(err.message);
        });

      if (productInStock.product_quantity === 0) {
        throw new BadRequestException(
          `${productInStock.product_name.slice(0, 30)}... is out of stock`,
        );
      }

      if (!cart) {
        // create new cart for user
        const newCart = new CartEntity();
        newCart.user = user;
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
          cart: newCart,
        };
      }

      // add product to cart
      const isExistProductIndex = cart.cart_products.findIndex(
        (item: {
          product_id: string;
          quantity: number;
          price: number;
          shop_id: string;
        }) => {
          return item.product_id === productId;
        },
      );
      // case 1:  product is already in cart => increase quantity
      if (isExistProductIndex !== -1) {
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
      } else {
        // case 2:
        cart.cart_products.push({
          product_id: productId,
          quantity: quantity,
          price: price,
          shop_id: shopId,
        });
        cart.cart_count_product += 1;
      }
      await this.cartRepository.save(cart);
      return {
        message: 'Add to cart successfully',
        cart: cart,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async updateCart(body: UpdateCartDto) {
    const { productId, quantity, userId } = body;
    // get cart of user
    const cart = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    // update cart
    cart.cart_products = cart.cart_products.map((item: any) => {
      if (item.product_id === productId) {
        item.quantity = quantity;
      }
      return item;
    });
    await this.cartRepository.save(cart);
    return {
      message: 'Update cart successfully',
    };
  }

  // public async deleteProductCartUser(body: DeleteProductCartDto) {
  //   const { productId, userId } = body;
  //   // find cart of user
  //   const cart: any = await this.cartRepository.findOne({
  //     where: {
  //       user: {
  //         id: userId,
  //       },
  //     },
  //   });
  //   if (!cart) {
  //     throw new BadRequestException('Cart not found');
  //   }

  //   // find product in cart
  //   const productIndex = cart.cart_products.findIndex((item: any) => {
  //     return item.product_id === productId;
  //   });
  //   if (productIndex === -1) {
  //     throw new BadRequestException('Product not found');
  //   }
  //   // delete product in cart and decrease cart count product
  //   // TH1: cart have only 1 item => delete cart
  //   if (cart.cart_products.length === 1) {
  //     await this.cartRepository.delete(cart.id);
  //     return {
  //       message: 'Delete product in cart successfully',
  //     };
  //   }
  //   // TH2:  case 1: quantity of product > 1 => decrease quantity
  //   if (cart.cart_products[productIndex].quantity > 1) {
  //     console.log('greater');
  //     cart.cart_products[productIndex].quantity -= 1;
  //   }
  //   // case 2: quantity of product = 1 => delete product in cart
  //   else {
  //     console.log('Equal');
  //     cart.cart_products.splice(productIndex, 1);
  //     cart.cart_count_product -= 1;
  //   }
  //   await this.cartRepository.save(cart);
  //   return {
  //     message: 'Delete product in cart successfully',
  //   };
  // }
  public async deleteProductCartUser(body: DeleteProductCartDto) {
    const { productId, userId } = body;
    // find cart of user
    const cart: any = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    const productIndex = cart.cart_products.findIndex((item: any) => {
      return item.product_id === productId;
    });
    if (productIndex === -1) {
      throw new BadRequestException('Product not found');
    }
    cart.cart_products.splice(productIndex, 1);
    cart.cart_count_product -= 1;
    await this.cartRepository.save(cart);
    return {
      message: 'Delete product in cart successfully',
    };
  }
}
