import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { CartModule } from 'src/cart/cart.module';
import { OrderProductModule } from 'src/order_product/order_product.module';
import { HistoryVoucherModule } from 'src/history-voucher/history-voucher.module';
import { VoucherModule } from 'src/voucher/voucher.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationMiddleware } from 'src/common/middleware/authentication.middleware';
import { KeytokenModule } from 'src/keytoken/keytoken.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
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
    ProductsModule,
    CartModule,
    OrderProductModule,
    HistoryVoucherModule,
    VoucherModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(
      // Define routes that should use the middleware
      { path: '/v1/orders/create', method: RequestMethod.POST },
      { path: '/v1/orders/update', method: RequestMethod.PATCH },
    );
  }
}
