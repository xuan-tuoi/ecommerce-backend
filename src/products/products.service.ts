import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { User } from 'src/users/user.interface';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly userService: UsersService,
  ) {}
  public async createProduct(
    user: User,
    imageUri: string,
    body: CreateProductDto,
  ) {
    if (body.product_id) {
      // update sản phẩm
      const product = await this.productRepository
        .findOne({
          where: { id: body.product_id },
        })
        .catch((err) => {
          throw new BadRequestException(err.message);
        });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      const updatedProduct = await this.productRepository.save({
        ...product,
        ...body,
      });
      return updatedProduct;
    }
    // không có id product => tạo sản phẩm mới
    const shop = await this.userService.getUserById(user.id);
    const newProduct = await this.productRepository.create({
      ...body,
      product_thumbnail: imageUri,
      user: shop,
      product_price: +body.product_price,
    });
    await this.productRepository.save(newProduct);
    return newProduct;
  }

  public async getProductById(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, isDeleted: false, isPublished: true },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    return product;
  }

  public async getProductsByShopId(shopId: string, options: PageOptionsDto) {
    try {
      const skip = (options.page - 1) * options.limit;
      const foundShop = await this.userService.getUserById(shopId);
      const queryBuilder =
        this.productRepository.createQueryBuilder('products');
      queryBuilder
        .leftJoinAndSelect('products.user', 'user')
        .where('user.id = :id', { id: foundShop.id })
        .andWhere('products.isDeleted = false')
        // .andWhere('products.isPublished = true')
        .orderBy(`products.${options.sort}`, options.order)
        .skip(skip)
        .take(options.limit);

      const countItem: number = await queryBuilder.getCount();
      const listProducts = await queryBuilder.getMany();

      console.log('listProducts', listProducts);

      const pageMetaDto: PageMetaDto = new PageMetaDto({
        itemCount: countItem,
        pageOptionsDto: options,
      });
      const pageDto: PageDto<any> = new PageDto(listProducts, pageMetaDto);
      return pageDto;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async searchProducts(
    listQuery: SearchProductDto,
    pageOptionsDto: PageOptionsDto,
  ) {
    console.log('listQuery', listQuery);
    console.log('pageOptionsDto', pageOptionsDto);
    const queryBuilder = this.productRepository.createQueryBuilder('products');
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
    queryBuilder
      .leftJoinAndSelect('products.user', 'user')
      .where('products.isDeleted = false')
      .andWhere('products.isPublished = true')
      .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
      .skip(skip)
      .take(pageOptionsDto.limit);
    if (listQuery.product_name) {
      queryBuilder.andWhere(
        `products.product_name ilike '%${listQuery.product_name}%'`,
      );
    }
    if (listQuery.product_category) {
      const category =
        listQuery.product_category.charAt(0).toUpperCase() +
        listQuery.product_category.slice(1);
      queryBuilder.andWhere(`products.product_category = '${category}'`);
    }
    if (listQuery.product_shop) {
      queryBuilder.andWhere(
        `products.product_shop ilike '%${listQuery.product_shop}%'`,
      );
    }

    const query = queryBuilder.getQuery();
    console.log('query', query);

    const countItem: number = await queryBuilder.getCount();
    const listProducts = await queryBuilder.getMany();

    const pageMetaDto: PageMetaDto = new PageMetaDto({
      pageOptionsDto: pageOptionsDto,
      itemCount: countItem,
    });
    const pageDto: PageDto<any> = new PageDto(listProducts, pageMetaDto);
    return pageDto;
  }

  public async deleteProduct(productId: string) {
    const product = await this.getProductById(productId);
    await this.productRepository.delete({
      id: product.id,
    });
    return {
      message: 'Delete product successfully',
    };
  }
}
