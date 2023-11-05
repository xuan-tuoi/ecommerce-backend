import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationMiddleware } from 'src/common/middleware/authentication.middleware';
import { HistoryVoucherModule } from 'src/history-voucher/history-voucher.module';
import { KeytokenModule } from 'src/keytoken/keytoken.module';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { VoucherEntity } from './entities/voucher.entity';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoucherEntity]),
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
    HistoryVoucherModule,
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(
      // Define routes that should use the middleware
      { path: '/v1/vouchers/create', method: RequestMethod.POST },
      { path: '/v1/vouchers/update', method: RequestMethod.PATCH },
      {
        path: '/v1/vouchers/:id',
        method: RequestMethod.DELETE,
      },
      // Add more routes here if needed
    );
  }
}
