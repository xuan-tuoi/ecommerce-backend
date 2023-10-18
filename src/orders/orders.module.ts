import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
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
export class OrdersModule {}
