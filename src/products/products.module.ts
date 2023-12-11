import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthenticationMiddleware } from 'src/common/middleware/authentication.middleware';
import { KeytokenModule } from 'src/keytoken/keytoken.module';
import { OrderProductModule } from 'src/order_product/order_product.module';
import { UsersModule } from 'src/users/users.module';
import { ProductEntity } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    KeytokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
    UsersModule,
    CloudinaryModule,
    OrderProductModule,
    // OrdersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(
      // Define routes that should use the middleware
      { path: '/v1/products', method: RequestMethod.PUT },
      // {
      //   path: '/v1/products/:productId',
      //   method: RequestMethod.DELETE,
      // },
      // Add more routes here if needed
    );
  }
}
