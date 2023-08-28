import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { pick } from 'src/common/utils/helpers';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductsService } from './products.service';

@Controller('v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Tìm kiếm sản phẩm theo tên
   */
  @Get('/search')
  async searchProducts(
    @Query() queryOptions: SearchProductDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    const listQuery = pick(queryOptions, [
      'product_name',
      'product_category',
      'product_shop',
    ]);
    return await this.productsService.searchProducts(listQuery, options);
  }

  /**
   *  Lấy tất cả sản phẩm đã published của 1 shop theo shopId
   * [USER]
   * @param shopId string
   * @returns {
   * data: ProductEntity[],
   * total: number,
   * page: number,
   * limit: number,
   * }
   */

  @Get('/shop/:shopId')
  async getProductsByShopId(
    @Param('shopId') shopId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    return await this.productsService.getProductsByShopId(shopId, options);
  }

  /**
   * Lấy 1 sản phẩm đã published theo product_id
   * [USER]
   * @param productId string
   * @returns product
   */
  @Get('/:productId')
  async getProductById(@Param('productId') productId: string) {
    return await this.productsService.getProductById(productId);
  }

  /**
   * create or update a product
   * [SHOP]
   * @param req
   * @param body
   * @returns product
   */
  @Put()
  // @UseInterceptors(FileInterceptor('image'))
  async createProduct(
    // @UploadedFile() image: Express.Multer.File,
    @Req() req: Request,
    @Body() body: CreateProductDto,
  ) {
    const user = req['user'];
    console.log('user', user);
    // const imageUri = await this.cloudinaryService.uploadImageFromBase64(
    //   `ecommerce/user.username`,
    //   base64,
    // );
    const imageUri = '';
    return await this.productsService.createProduct(user, imageUri, body);

    /**
 *  image: 
 * "fieldname": "image",
    "originalname": "garnier.png",
    "encoding": "7bit",
    "mimetype": "image/png",
    "buffer"
 */
  }

  /**
   * delete a product by product_id
   * @param productId string
   * @returns  message: 'Delete product successfully'
   */
  @Delete('/:productId')
  async deleteProduct(@Param('productId') productId: string) {
    return await this.productsService.deleteProduct(productId);
  }
}
