import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classifyCategoryByType } from 'src/common/constant';
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

  public async searchProducts(listQuery: any, pageOptionsDto: PageOptionsDto) {
    const queryBuilder = this.productRepository.createQueryBuilder('products');
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
    queryBuilder
      .leftJoinAndSelect('products.user', 'user')
      .where('products.isDeleted = false')
      .andWhere('products.isPublished = true')
      .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
      .skip(skip)
      .take(pageOptionsDto.limit);
    if (listQuery.product_category) {
      const category =
        listQuery.product_category.charAt(0).toUpperCase() +
        listQuery.product_category.slice(1);
      // category : Facial, Body, Hair
      // những sản phẩm có category là cleaner, toner, moisturizer, serum, mask, sunscreen là Facial
      // những sản phẩm có category là shampoo, conditioner, hair mask, hair oil là Hair
      // những sản phẩm có category là body wash, body lotion, body oil, body scrub, hand cream, foot cream là Body
      const type = classifyCategoryByType.filter((item) => {
        return item.category.includes(category);
      });
      queryBuilder.andWhere(`products.product_category in (:...type)`, {
        type: type[0].type,
      });
    }
    if (listQuery.product_shop) {
      queryBuilder.andWhere(
        `user.username ilike '%${listQuery.product_shop}%'`,
      );
    }

    if (listQuery.search_key) {
      queryBuilder.andWhere(
        `products.product_name ilike '%${listQuery.search_key}%'`,
      );
    }

    const query = queryBuilder.getQuery();

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

  public async cloneData(products: any) {
    const listSize = [
      '3.4 oz/100mL',
      '1.7 oz/50 mL',
      '1 oz/30 mL',
      '0.3 oz/10 mL',
      '0.25 oz/7.5 mL',
      '0.17 oz/5 mL',
      '0.1 oz/3 mL',
      '0.05 oz/1.5 mL',
    ];
    const listUser = [
      {
        id: '85a26cd1-4f5f-4468-b0ce-41118681234b',
        username: 'Bioderma',
      },
      {
        id: '9a420be2-4df3-4595-a500-2211de5a9701',
        username: 'The Ordinary',
      },
    ];
    const promises = products.map(async (product) => {
      const newProduct = {
        product_name: product.name || 'Default product name',
        product_listImages: ['/product/default.png'],
        product_thumbnail: '/product/default.png',
        product_description: product.ingredients,
        product_attribute: {
          size: listSize[Math.floor(Math.random() * listSize.length)],
          dry: product.dry,
          oily: product.oily,
          normal: product.normal,
          sensitive: product.sensitive,
        },
        product_price: product.price,
        product_quantity: Math.floor(Math.random() * 1000) + 1,
        product_category:
          product.label === 'Sun protect' ? 'Body' : product.label,
        product_ratingsAverage:
          product.rank < 4.6 ? +product.rank + 0.4 : product.rank,
        isDraft: false,
        isPublished: true,
        user: listUser[Math.floor(Math.random() * listUser.length)],
      };
      const newProductEntity = await this.productRepository.create(newProduct);
      return await this.productRepository.save(newProductEntity);
    });

    const res = await Promise.all(promises);
    return {
      mess: 'Clone data successfully',
    };
  }

  public async cloneDataV2(products: any) {
    const listSize = [
      '3.4 oz/100mL',
      '1.7 oz/50 mL',
      '1 oz/30 mL',
      '0.3 oz/10 mL',
      '0.25 oz/7.5 mL',
      '0.17 oz/5 mL',
      '0.1 oz/3 mL',
      '0.05 oz/1.5 mL',
    ];

    const promises = products.map(async (product) => {
      const newProduct = {
        product_name: product.name || 'Default product name',
        product_listImages: ['/product/default.png'],
        product_thumbnail: product.product_url.includes('html')
          ? '/product/default.png'
          : product.product_url,
        product_description: product.clean_ingreds[0],
        product_attribute: {
          size: listSize[Math.floor(Math.random() * listSize.length)],
          dry: product.dry || 1,
          oily: product.oily || 1,
          normal: product.normal || 1,
          sensitive: product.sensitive || 1,
        },
        product_price: product.price.substring(1),
        product_quantity: Math.floor(Math.random() * 1000) + 1,
        product_category: product.product_type,
        product_ratingsAverage: Math.floor(Math.random() * (5 - 4.5 + 1) + 4.5),
        isDraft: false,
        isPublished: true,
        user: {
          id: 'db7c6b7e-8e2f-42ee-a63b-332656d82ca2',
          username: `L'Oréal`,
        },
      };
      const newProductEntity = await this.productRepository.create(newProduct);
      return await this.productRepository.save(newProductEntity);
    });
    await Promise.all(promises);
    return {
      message: 'Clone data successfully',
    };
  }
}
