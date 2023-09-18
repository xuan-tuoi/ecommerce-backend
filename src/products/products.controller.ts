import {
  BadRequestException,
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

@Controller('v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  ) {
    const options = pick(pageOptionsDto, ['page', 'limit', 'sort', 'order']);
    options.limit = options.limit > 100 ? 100 : options.limit;
    const listQuery = pick(queryOptions, [
      'product_category',
      'product_shop',
      'search_key',
    ]);
    return await this.productsService.searchProducts(
      removeUndefined(listQuery),
      options,
    );
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

  @Post('/clone-data')
  @UseInterceptors(
    FileInterceptor('file_asset', {
      storage: diskStorage({
        destination: './files',
      }),
    }),
  )
  async cloneData() {
    const csvFile = readFileSync('files/cosmetics.csv');
    const csvString = csvFile.toString();

    // const parsedCsv = csvString.split('\n').map((row) => row.split(','));
    // const header = parsedCsv[0];
    // const data = parsedCsv.slice(1);
    // const products = data.slice(0, 2).map((row) => {
    //   const product = {};
    //   row.forEach((item, index) => {
    //     product[header[index]] = item;
    //   });
    //   return product;
    // });
    const parsedCsv = await Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().replace('#', '').trim(),
      complete: (results) => results.data,
    });
    return await this.productsService.cloneData(parsedCsv.data);
  }

  @Post('/clone-data-or')
  async cloneDataOr() {
    const data = MOCKED_RESPONSE_TS;
    return await this.productsService.cloneDataV2(data);
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
      console.log('file -------------> ', files);
      // const imageUri = await this.cloudinaryService.uploadImage(
      //   // user.email,
      //   'test',
      //   file,
      // );
      // return await this.productsService.createProduct(user, imageUri.url, body);
      return {
        mes: 'oke',
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
