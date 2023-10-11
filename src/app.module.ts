import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnakeNamingStrategy } from './common/stragegy/snake-naming.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionsLoggerFilter } from './common/utils/exceptionLogger.filter';
import { UsersModule } from './users/users.module';
import { KeytokenModule } from './keytoken/keytoken.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ReviewsModule } from './reviews/reviews.module';
import { VoucherModule } from './voucher/voucher.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CartModule } from './cart/cart.module';
import { HistoryVoucherModule } from './history-voucher/history-voucher.module';
import { OrdersModule } from './orders/orders.module';
import { OrderProductModule } from './order_product/order_product.module';

dotenv.config();

const defaultOptions = {
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  namingStrategy: new SnakeNamingStrategy(),
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60, // seconds
      limit: 10,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // host: 'localhost',
      // port: 5432,
      // username: 'postgres',
      // password: 'xuantuoi01',
      // database: 'ecommerce',
      // synchronize: true,
      ...defaultOptions,
      autoLoadEntities: true,
    }),
    UsersModule,
    KeytokenModule,
    AuthModule,
    ProductsModule,
    CloudinaryModule,
    ReviewsModule,
    VoucherModule,
    CartModule,
    HistoryVoucherModule,
    OrdersModule,
    OrderProductModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ExceptionsLoggerFilter,
    },
  ],
})
export class AppModule {}
