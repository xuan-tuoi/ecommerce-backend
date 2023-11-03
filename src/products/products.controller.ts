import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import * as Papa from 'papaparse';
import { readFileSync } from 'fs';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { pick, removeUndefined } from 'src/common/utils/helpers';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductsService } from './products.service';
import * as MOCKED_RESPONSE_TS from '../../public/files/skincare_products_clean.json';
import { SimilarProductDto } from './dto/similar-product';

@Controller('v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Lấy 1 sản phẩm đã published theo product_id
   * [USER]
   * @param productId string
   * @returns product
   */
  @Get()
  async getProductById(@Query('id') productId: string) {
    return await this.productsService.getProductById(productId);
  }

  /**
   * Lấy danh sách sản phẩm similar với 1 sản phẩm theo product_id
   * [USER]
   * @param productId string
   * @returns product
   */
  @Get('/similar-product')
  async getSimilarProducts(@Query() queryOptions: SimilarProductDto) {
    return await this.productsService.getSimilarProducts(queryOptions);
  }

  /**
   * lấy danh sách sản phẩm theo brand, category và theo tên sản phẩm
   * @param queryOptions
   * @param pageOptionsDto
   * @returns danh sách product by page
   */
  @Get('/search')
  async searchProducts(
    @Query() queryOptions: SearchProductDto,
    @Query() pageOptionsDto: PageOptionsDto,
    // @Param('userId') userId: string,
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    const listQuery = pick(queryOptions, [
      'product_category',
      'product_shop',
      'search_key',
    ]);

    const userId = queryOptions.user_id;
    return await this.productsService.searchProducts(
      removeUndefined(listQuery),
      options,
      userId,
    );
  }

  /**
   * @returns top 60 sản phẩm bán chạy nhất
   */
  @Get('/best-seller')
  async getBestSellerProducts() {
    return await this.productsService.getBestSellerProducts();
  }

  /**
   * @param shopId string
   * @returns  top 10 sản phẩm bán chạy nhất của shop
   */
  @Get('/best-seller/:shopId')
  async getBestSellerProductsByShopId(@Param('shopId') shopId: string) {
    return await this.productsService.getBestSellerProductsByShopId(shopId);
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

  @Post('/craw-data/website')
  async crawData() {
    // return 'hello';
    return await this.productsService.crawData();
  }

  /**
   * create or update a product
   * [SHOP]
   * @param req
   * @param body
   * @returns product
   */
  @Put()
  @UseInterceptors(AnyFilesInterceptor())
  async createProduct(
    // @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // const user = req['user'];
      const promises = files.map(async (file) => {
        const imgUri = await this.cloudinaryService.uploadImage(file);
        return imgUri;
      });

      const imageUri = await Promise.all(promises);

      // return await this.productsService.createProduct(user, imageUri.url, body);
      return {
        mes: imageUri,
      };
    } catch (error) {
      return new BadRequestException(error.message);
    }
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
