import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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
import { mappingCategory } from 'src/common/utils';
import { OrderProductService } from 'src/order_product/order_product.service';
import { User } from 'src/users/user.interface';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { SimilarProductDto } from './dto/similar-product';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { ProductInterface } from './product.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly userService: UsersService,
    private readonly orderProductService: OrderProductService,
  ) {}

  public async save(product: ProductEntity) {
    return await this.productRepository.save(product);
  }

  public async findOne(productId: string): Promise<ProductInterface> {
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

  public async getAllProduct() {
    try {
      const products = await this.productRepository.find({
        where: {
          isDeleted: false,
        },
      });
      return products;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
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

  public async getProductById(productId: string): Promise<any> {
    const value: any = await this.cacheManager.get('productInfomation');
    if (value) {
      if (value[productId]) {
        return value[productId];
      }
    }
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
    await this.cacheManager.set('productInfomation', {
      ...value,
      [productId]: product,
    });
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
      pageOptionsDto,
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
        listQuery.search_key ||
        userId === 'undefined'
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
            queryBuilderLastPage.andWhere(
              `products.product_category in (:...type)`,
              {
                type: type[0].type,
              },
            );
          }
          if (listQuery.product_shop) {
            queryBuilderLastPage.andWhere(
              `user.username ilike '%${listQuery.product_shop}%'`,
            );
          }

          if (listQuery.search_key) {
            queryBuilderLastPage.andWhere(
              `products.product_name ilike '%${listQuery.search_key}%'`,
            );
          }
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
    try {
      const listProduct = await this.productRepository.query(
        `select * from (select product_id , sum(quantity) as quantity
        from order_product
        group by product_id 
        order by sum(quantity) desc) as A , products
        where A.product_id = products.id
        and products.is_published = true
        and products.is_deleted = false
        order by A.quantity desc
        limit 60
        `,
      );
      if (listProduct.length === 0) {
        const resutlt = await this.productRepository.query(
          `select * 
            from products
            order by created_at desc
            limit 60`,
        );
        return resutlt;
      }
      return listProduct;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async deleteProduct(productId: string) {
    const product = await this.getProductById(productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // xóa reviews của product
    await this.productRepository.query(`
      delete from reviews
      where product_id = '${productId}'
    `);

    // await this.productRepository.delete({
    //   id: product.id,
    // });
    //update isDeleted = true
    await this.productRepository.query(`
      update products
      set is_deleted = true
      where id = '${productId}'
    `);

    return {
      message: 'Delete product successfully',
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
    try {
      const result = await axios
        .get(
          `${process.env.FLASK_SERVER}/recommend?productId=${queryOptions.product_id}&minN=${queryOptions.limit}`,
        )
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          // console.log('err', err);
        });
      const listProductId = result.data;
      const listPromises = listProductId.map(async (productId: string) => {
        const product = await this.productRepository.findOne({
          where: {
            id: productId,
          },
          relations: ['user'],
        });
        if (!product) {
          return null;
        }
        return product;
      });

      const listProductData = await Promise.all(listPromises);
      return listProductData;
    } catch (error) {
      throw new Error(error);
    }
    // http://127.0.0.1:5000/recommend?productId=4599d40a-4909-4378-84d8-1cc5a5a49911&minN=8
  }

  public async getBestSellerProductsByShopId(shopId: string) {
    try {
      const listProduct = await this.productRepository.query(
        `select * from (select product_id , sum(quantity) as quantity
        from order_product
        group by product_id 
        order by sum(quantity) desc) as A , products
        where A.product_id = products.id
        and products.user_id='${shopId}'
        and products.is_published = true
        and products.is_deleted = false
        order by A.quantity desc
        limit 10
        `,
      );
      if (listProduct.length === 0) {
        const resutlt = await this.productRepository.query(
          `select * 
            from products
            where products.user_id='${shopId}'
            order by created_at desc
            limit 10`,
        );
        return resutlt;
      }
      return listProduct;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async updateInforProduct(body: UpdateProductDto) {
    try {
      // find product by id
      const foundProduct = await this.productRepository.findOne({
        where: {
          id: body.product_id,
        },
      });
      if (!foundProduct) {
        throw new BadRequestException('Product not found');
      }

      // update product
      const updatedProduct = await this.productRepository.save({
        ...foundProduct,
        ...body,
      });
      // update cache product
      const value: any = await this.cacheManager.get('productInfomation');
      await this.cacheManager.set('productInfomation', {
        ...value,
        [body.product_id]: updatedProduct,
      });
      return updatedProduct;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getAdminProduct(listQuery: any, pageOptionsDto: PageOptionsDto) {
    try {
      const queryBuilder =
        this.productRepository.createQueryBuilder('products');
      const skip = (pageOptionsDto.page - 1) * pageOptionsDto.limit;
      queryBuilder
        .where('products.isDeleted = false')
        .andWhere('products.isPublished = true')
        .orderBy(`products.${pageOptionsDto.sort}`, pageOptionsDto.order)
        .skip(skip)
        .take(pageOptionsDto.limit); // lấy data của 6 page

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

      return {
        pageMetaDto,
        listProduct,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getRecommendProducts(userId: string, n: number) {
    try {
      const user = await this.userService.getUserById(userId);
      const url = process.env.FLASK_SERVER + '/recommend-for-user';
      // const url = 'http://127.0.0.1:5000' + '/recommend-for-user';
      const result = await axios.get(url, {
        params: {
          userId: user.id,
          n: n,
        },
      });
      const response = result.data;
      if (Object.keys(response.data).length === 0) {
        console.log('THIS IS NEW USER');
        return await this.getBestSellerProducts();
      }

      const productPerCategory = 60 / n;
      const listProduct = [];

      for (const key in response.data) {
        console.log('key', response.data[key]);
        const products = await this.productRepository.query(
          `select * from products
          where product_category = '${mappingCategory(response.data[key])}'
          and is_published = true
          and is_deleted = false
          order by created_at desc
          OFFSET  ${Math.floor(Math.random() * 100) + 1}
          limit ${productPerCategory}
        `,
        );
        listProduct.push(...products);
      }
      return listProduct;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async traningModel() {
    try {
      const url = process.env.FLASK_SERVER + '/trainUserKmeans';
      await axios.get(url);
      return {
        message: 'Training model successfully',
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async exportData() {
    const query = `select products.id, product_price, product_quantity , product_category, product_ratings_average , product_name , user_id
    from products `;
    return await this.productRepository.query(query);
  }

  public async getTotalProductOfUser(userId: string) {
    try {
      const query = `select count(*) from products where user_id = '${userId}'`;
      const result = await this.productRepository.query(query);
      return +result[0].count;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getTopFiveProduct(userId: string, from, to) {
    try {
      const query = `select A.sold , A.rating, products.*  from 
        (select product_id , sum(quantity) as sold, AVG(product_ratings_average) as rating from orders , order_product, products
        where orders.id = order_product.order_id 
        and order_product.product_id = products.id
        and products.user_id='${userId}'
        and orders.created_at between '${from}' and '${to}'
        group by product_id
        order by sum(quantity) desc
        limit 5) as A , products 
        where A.product_id = products.id`;
      const result = await this.productRepository.query(query);
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
