import * as dotenv from 'dotenv';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { TrainingModelModule } from './training_model/training_model.module';
import { AuthenticationMiddleware } from './common/middleware/authentication.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ValidateDateRangeMiddleware } from './common/middleware/validate-date-range.middleware';

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
    TypeOrmModule.forRoot({
      type: 'postgres',
      ssl: true, // ssl is stand for Secure Sockets Layer - a global standard security technology that enables encrypted communication between a web browser and a web server
      ...defaultOptions,
      autoLoadEntities: true,
    }),
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
    TrainingModelModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware, ValidateDateRangeMiddleware)
      .forRoutes(
        // Define routes that should use the middleware
        {
          path: '/v1/dashboard/overview',
          method: RequestMethod.GET,
        },
        {
          path: '/v1/dashboard/order-analytics',
          method: RequestMethod.GET,
        },
        {
          path: '/v1/dashboard/best-seller',
          method: RequestMethod.GET,
        },
        {
          path: '/v1/dashboard/user-by-country',
          method: RequestMethod.GET,
        },
        // Add more routes here if needed
      );
  }
}
