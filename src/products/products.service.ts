import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { JSDOM } from 'jsdom';

import { classifyCategoryByType } from 'src/common/constant';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageOptionsDto } from 'src/common/dto/pageOptions.dto';
import { OrdersService } from 'src/orders/orders.service';
import { OrderProductService } from 'src/order_product/order_product.service';
import { User } from 'src/users/user.interface';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { SimilarProductDto } from './dto/similar-product';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly userService: UsersService,
    private readonly orderProductService: OrderProductService,
  ) {}

  public async save(product: ProductEntity) {
    return await this.productRepository.save(product);
  }

  public async findOne(productId: string) {
    if (!productId) {
      throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);
    }
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        isDeleted: false,
      },
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);
    }
    return product;
  }

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
      where: {
        id: productId,
        isDeleted: false,
        isPublished: true,
      },
      relations: ['user'], // lấy thông tin của shop
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

  public async getProductByHistoryOrder(
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ) {
    const listOrder: any = await this.orderProductService.getHistoryOrder(
      userId,
    );
    if (listOrder.length > 0) {
      const listProduct = listOrder.map((order) => order.product);
      const category = listProduct.map((product) => product.product_category);
      const prices = listProduct.map((product) => product.product_price);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      // lọc ra những sản phẩm có cùng category với những sản phẩm đã mua trước đó
      // và có giá tiền nằm trong khoảng giá của những sản phẩm đã mua trước đó
      const queryBuilder =
        this.productRepository.createQueryBuilder('products');
      queryBuilder
        .leftJoinAndSelect('products.user', 'user')
        .where('products.product_category IN (:...category)', {
          category,
        })
        .andWhere('products.product_price BETWEEN :minPrice AND :maxPrice', {
          minPrice,
          maxPrice,
        })
        .andWhere('products.isDeleted = false')
        .andWhere('products.isPublished = true')
        .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
        .skip((pageOptionsDto.page - 1) * pageOptionsDto.limit)
        .take(pageOptionsDto.limit * 5); // load 5 page
      const listSimilarProducts = await queryBuilder.getMany();
      return listSimilarProducts;
    }
    return [];
  }

  public async getBestSellerProduct(pageOptionsDto: PageOptionsDto) {
    const limit = pageOptionsDto.limit;

    const bestSellerProducts =
      await this.orderProductService.getBestSellerProduct(pageOptionsDto);
    if (bestSellerProducts.length <= 0) {
      return [];
    } else {
      const listBestSellerProducts = [...bestSellerProducts];
      const restLimit = limit - bestSellerProducts.length;
      if (restLimit > 0) {
        const remainingProducts = await this.productRepository
          .createQueryBuilder('product')
          .select('product.id', 'product_id')
          .where('product.id NOT IN (:...ids)', {
            ids: bestSellerProducts.map((p) => p.id),
          })
          .limit(restLimit)
          .getRawMany();
        listBestSellerProducts.push(...remainingProducts);
      }

      const listPromise = bestSellerProducts.map(
        async (item: { id: string }) => {
          const product = await this.productRepository
            .findOne({
              where: {
                id: item.id,
                isDeleted: false,
                isPublished: true,
              },
              relations: ['user'],
            })
            .catch((err) => {
              throw new BadRequestException(err.message);
            });

          if (!product) {
            return null;
          }
          return product;
        },
      );
      const listProducts = await Promise.all(listPromise);
      return listProducts;
    }
  }

  public async searchProducts(
    listQuery: any,
    pageOptionsDto: PageOptionsDto,
    userId: string,
  ) {
    try {
      const queryBuilder =
        this.productRepository.createQueryBuilder('products');
      const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
      queryBuilder
        .leftJoinAndSelect('products.user', 'user')
        .where('products.isDeleted = false')
        .andWhere('products.isPublished = true')
        .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
        .skip(skip)
        .take(pageOptionsDto.limit * 5); // lấy data của 6 page
      let isApplyMachineLearning = true;

      if (
        listQuery.product_category ||
        listQuery.product_shop ||
        listQuery.search_key
      ) {
        isApplyMachineLearning = false;
      }
      let listProduct: any = [];

      if (isApplyMachineLearning) {
        // gợi ý sản phẩm cho người dùng thay vì lấy ra các sản phẩm trong db
        // gợi ý theo 3 tiêu chí sau :
        // - Dựa trên lịch sử mua hàng của người dùng: với TH người dùng chưa mua hàng thì sẽ gợi ý các sản phẩm bán chạy nhất
        // - Sắp xếp theo top các sản phẩm bán chạy nhất
        // - Sử dụng machine learning phân loại đối tượng người dùng, và gợi ý sản phẩm phù hợp với đối tượng đó
        const stragegy = ['history', 'best-seller', 'machine-learning'];
        const random = Math.floor(Math.random() * stragegy.length);
        const strategy = stragegy[0];
        if (strategy === 'history') {
          listProduct = await this.getProductByHistoryOrder(
            userId,
            pageOptionsDto,
          );

          if (listProduct.length === 0) {
            listProduct = await this.getBestSellerProduct(pageOptionsDto);
            if (listProduct.length === 0) {
              const restLimit = pageOptionsDto.limit * 5 - listProduct.length;
              if (restLimit > 0) {
                const queryBuilder =
                  this.productRepository.createQueryBuilder('product');
                queryBuilder
                  .leftJoinAndSelect('product.user', 'user')
                  .skip(skip)
                  .take(restLimit);
                const remainingProducts = await queryBuilder.getMany();
                listProduct.push(...remainingProducts);
              }
            }
          } else {
            const restLimit = pageOptionsDto.limit * 5 - listProduct.length;
            if (restLimit > 0) {
              const remainingProducts = await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.user', 'user')
                .where('product.id NOT IN (:...ids)', {
                  ids: listProduct.map((p) => p.id),
                })
                .skip(skip)
                .limit(restLimit)
                .getMany();
              listProduct.push(...remainingProducts);
            }
          }
        } else if (strategy === 'best-seller') {
          listProduct = await this.getBestSellerProduct(pageOptionsDto);
        } else {
          // ...
        }

        // xử lí tách thành từng page sau khi có listProduct
        const countItem: number = await queryBuilder.getCount();
        const pageMetaDto: PageMetaDto = new PageMetaDto({
          pageOptionsDto: pageOptionsDto,
          itemCount: countItem,
        });

        const toalPage = Math.ceil(countItem / pageOptionsDto.limit);

        const datas = [];
        if (listProduct.length > 0) {
          for (let i = 0; i < listProduct.length; i += pageOptionsDto.limit) {
            datas.push(listProduct.slice(i, i + pageOptionsDto.limit));
          }
        }

        const result = datas.map((item, index) => {
          return {
            page: pageOptionsDto.page + index,
            data: item,
          };
        });

        if (toalPage > 5) {
          const skip = (toalPage - 1) * pageOptionsDto.limit;
          const queryBuilderLastPage =
            this.productRepository.createQueryBuilder('products');
          queryBuilderLastPage
            .leftJoinAndSelect('products.user', 'user')
            .where('products.isDeleted = false')
            .andWhere('products.isPublished = true')
            .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
            .skip(skip)
            .take(pageOptionsDto.limit);
          const listProductsLastPage = await queryBuilderLastPage.getMany();
          result.push({
            page: toalPage,
            data: listProductsLastPage,
          });
        }

        return {
          result,
          pageMetaDto,
        };
      } else {
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

        const countItem: number = await queryBuilder.getCount();
        const listProduct = await queryBuilder.getMany();

        const pageMetaDto: PageMetaDto = new PageMetaDto({
          pageOptionsDto: pageOptionsDto,
          itemCount: countItem,
        });

        const toalPage = Math.ceil(countItem / pageOptionsDto.limit);

        const datas = [];
        if (listProduct.length > 0) {
          for (let i = 0; i < listProduct.length; i += pageOptionsDto.limit) {
            datas.push(listProduct.slice(i, i + pageOptionsDto.limit));
          }
        }

        const result = datas.map((item, index) => {
          return {
            page: pageOptionsDto.page + index,
            data: item,
          };
        });

        // if totalPage > 5 -> load page cuối cùng
        if (toalPage > 5) {
          const skip = (toalPage - 1) * pageOptionsDto.limit;
          const queryBuilderLastPage =
            this.productRepository.createQueryBuilder('products');
          queryBuilderLastPage
            .leftJoinAndSelect('products.user', 'user')
            .where('products.isDeleted = false')
            .andWhere('products.isPublished = true')
            .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
            .skip(skip)
            .take(pageOptionsDto.limit);
          const listProductsLastPage = await queryBuilderLastPage.getMany();
          result.push({
            page: toalPage,
            data: listProductsLastPage,
          });
        }

        return {
          result,
          pageMetaDto,
        };
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getBestSellerProducts() {
    let top4SellerProduct =
      await this.orderProductService.getTop4BestSellerProduct();
    // nếu là mảng rỗng thì sẽ lấy 4 sản phẩm bất kì trong DB
    if (top4SellerProduct.length === 0) {
      const queryBuilder =
        this.productRepository.createQueryBuilder('products');
      queryBuilder
        .leftJoinAndSelect('products.user', 'user')
        .where('products.isDeleted = false')
        .andWhere('products.isPublished = true')
        .orderBy(`products.createdAt`, 'DESC')
        .take(4);
      const listProducts = await queryBuilder.getMany();
      return listProducts;
    } else {
      // nếu không đủ 4 item thì sẽ lấy thêm item từ DB
      if (top4SellerProduct.length < 4) {
        const queryBuilder2 =
          this.productRepository.createQueryBuilder('products');
        queryBuilder2
          .leftJoinAndSelect('products.user', 'user')
          .where('products.isDeleted = false')
          .andWhere('products.isPublished = true')
          .orderBy(`products.createdAt`, 'DESC')
          .take(4 - top4SellerProduct.length);
        const listProducts2 = await queryBuilder2.getMany();
        top4SellerProduct = top4SellerProduct.concat(listProducts2);
      }
      const promise = top4SellerProduct.map(async (item) => {
        const product = await this.getProductById(item.product_id);
        return product;
      });
      const listProducts = await Promise.all(promise);
      return listProducts;
    }
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

  // functions for clone and craw data from other website
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

    const promises = products.slice(0, 130).map(async (product) => {
      console.log(
        '🚀 ~ file: product.service.ts ~ line 256 ~ ProductService ~ product',
        product,
      );
      const newProduct = {
        product_name: product.product_name || 'Default product name',
        product_listImages: ['/product/default.png'],
        product_thumbnail: product.product_url,
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

  public async crawData() {
    const categoryList = [
      // 'Body Lotion',
      // 'Bath Salts',
      // 'Body Wash',
      'Mist',
      // 'Toner',
      // 'Exfoliator',
      // 'Hair',
      // 'Balm',
      // 'Eye cream',
      // 'Peptide',
      // 'Face Mask',
      // 'Mask',
      // 'HA',
      // 'Cream',
      // 'Gel',
      // 'Serum',
      // 'Moisturizer',
      // 'Cleanser',
      // 'Sun cream',
      // 'Sunscreen',
      // 'Cleansing oil',
    ];
    try {
      const baseUrl =
        'https://www.lookfantastic.com/brands/versace/all-versace.list';
      const response = await axios.get(baseUrl);
      const htmlData = response.data;

      // Sử dụng jsdom để phân tích HTML
      const { window } = new JSDOM(htmlData);
      const document = window.document;
      const listProductWrapper = document.querySelector('.productListProducts');
      const listProduct = listProductWrapper.querySelectorAll(
        '.productListProducts_product:not(.sponsoredProductsLis)',
      ); // include 45 items

      console.log('listProduct.length -----------------> ', listProduct.length);

      const listPromises = Array.from(listProduct)
        // .slice(0, 1)
        .map(async (product: HTMLElement, index: number) => {
          console.log('--------------------START AT INDEX------', index);
          let imgSrc =
            'https://climate.onep.go.th/wp-content/uploads/2020/01/default-image.jpg';
          if (product.querySelector('img')) {
            imgSrc = product.querySelector('img').src;
          }
          const name = product
            .querySelector('.productBlock_productName')
            .textContent.trim();

          // check if product exist by name
          const productExist = await this.productRepository.findOne({
            where: {
              product_name: name,
            },
          });
          if (productExist) {
            return {
              message: 'Product exist',
            };
          }

          const priceTmp = product.querySelector(
            '.productBlock_priceValue',
          ).textContent; // $7.90
          // rank random from 4.5 to 5
          const rank = Math.floor(Math.random() * (5 - 4.5 + 1) + 4.5);

          const price = +priceTmp.substring(1) * 25616;
          const category =
            categoryList[Math.floor(Math.random() * categoryList.length) || 0];
          // const size = listSize[Math.floor(Math.random() * listSize.length)];
          const quantity = product.querySelector('.productBlock_reviewCount')
            ? product.querySelector('.productBlock_reviewCount').textContent
            : 50;

          const user = {
            // id: '9a420be2-4df3-4595-a500-2211de5a9701',
            // username: 'The Ordinary',
            // id: '85a26cd1-4f5f-4468-b0ce-41118681234b',
            // username: 'Bioderma',
            id: 'db7c6b7e-8e2f-42ee-a63b-332656d82ca2',
            username: `L'Oréal`,
          };
          // fetch to get detail info of product
          const productUrl = product
            .querySelector('.productBlock_link')
            .getAttribute('href');
          const productUrlFull = `https://www.lookfantastic.com${productUrl}`;
          const productResponse = await axios.get(productUrlFull);
          const productHtmlData = productResponse.data;
          const { window: productWindow } = new JSDOM(productHtmlData);
          const productDocument = productWindow.document;
          let description = '';
          let cleanIngredients = '';
          let useage = '';

          // get list image preview
          const listImagePreview = productDocument.querySelectorAll(
            'li.athenaProductImageCarousel_listItem',
          );

          // https://static.thcdn.com/images/large/webp//productimg/1600/1600/12753472-1314927999939659.jpg
          // https://static.thcdn.com/images/small/webp//productimg/130/130/12753472-1314927999939659.jpg

          const listImage = Array.from(listImagePreview).map(
            (preview: HTMLElement) => {
              if (!preview.querySelector('img')) {
                return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJzRGkvN9WVysP2_3AbXtdgTegy9mEELt2yFirxQymBg&s';
              }
              const url = preview.querySelector('img').src;
              const urlLarge = url.replace('130/130', '1600/1600');
              return urlLarge;
            },
          );
          const descriptionWrapper = productDocument.querySelector(
            '.productDescription_contentPropertyListItem_synopsis',
          );
          if (descriptionWrapper) {
            const listDescription = descriptionWrapper.querySelectorAll('p');
            description = Array.from(listDescription)
              .map((item: HTMLElement) => item.textContent)
              .join('/ENTER/');
          }

          const useageWrapper = productDocument.querySelector(
            '.productDescription_contentPropertyListItem_directions',
          );
          if (useageWrapper) {
            let listUseage = useageWrapper.querySelectorAll('li');
            if (listUseage.length === 0) {
              listUseage = useageWrapper.querySelectorAll('p');
            }

            useage = Array.from(listUseage)
              .map((item: HTMLElement) => item.textContent)
              .join('/ENTER/');
          }

          const cleanIngredientsWrapper = productDocument.querySelector(
            '.productDescription_contentPropertyListItem_ingredients',
          );
          if (cleanIngredientsWrapper) {
            let listCleanIngredients =
              cleanIngredientsWrapper.querySelectorAll('li');
            if (listCleanIngredients.length === 0) {
              listCleanIngredients =
                cleanIngredientsWrapper.querySelectorAll('p');
            }

            cleanIngredients = Array.from(listCleanIngredients)
              .map((item: HTMLElement) => item.textContent)
              .join('/ENTER/');
          }

          const originalPriceElement = productDocument.querySelector(
            '.productBlock_priceBlockWrapper .productBlock_rrpValue', // rrp = recommended retail price
          );

          let product_original_price = price;

          if (originalPriceElement) {
            const originalPrice =
              +originalPriceElement.textContent.substring(1);
            console.log(
              'originalPrice :::::::::::::::',
              originalPriceElement.textContent,
            );
            product_original_price = originalPrice * 25616;
          }
          // create product and save to db
          const newProduct: any = {
            product_name: name,
            product_listImages: listImage,
            product_thumbnail: imgSrc,
            product_description: description,
            product_attribute: {
              // size,
              cleanIngredients,
              useage,
            },
            product_price: price,
            product_original_price: product_original_price,
            product_quantity: quantity,
            product_category: category,
            product_ratingsAverage: rank,
            isDraft: false,
            isPublished: true,
            user,
          };

          const benefitWrapper = productDocument.querySelector(
            '.productDescription_contentPropertyListItem_strengthDetail',
          );

          if (benefitWrapper) {
            const listBenefit = benefitWrapper.querySelectorAll('li');
            const benefits = Array.from(listBenefit)
              .map((item: HTMLElement) => item.textContent)
              .join('ENTER');
            newProduct.product_attribute.benefits = benefits;
          }

          const newProductEntity = this.productRepository.create(newProduct);
          await this.productRepository.save(newProductEntity);
          return newProductEntity;
        });
      const listProductData = await Promise.all(listPromises);
      return {
        message: listProductData,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  public async getSimilarProducts(queryOptions: SimilarProductDto) {
    const { product_id, shop_id, product_category } = queryOptions;
    const queryBuilder = this.productRepository.createQueryBuilder('products');
    queryBuilder
      .leftJoinAndSelect('products.user', 'user')
      .where('products.id != :product_id', {
        product_id,
      })
      .andWhere(`products.product_category = '${product_category}'`)
      .andWhere(`user.id = '${shop_id}'`)
      .andWhere('products.isPublished = true')
      .andWhere('products.isDeleted = false')
      .orderBy('products.product_ratingsAverage', 'DESC')
      .take(5);
    const listProduct = await queryBuilder.getMany();
    return listProduct;
  }
}
