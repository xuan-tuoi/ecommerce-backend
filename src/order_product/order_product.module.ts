import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { OrderProductEntity } from './entities/orderProduct.entity';
import { OrderProductService } from './order_product.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderProductEntity]), UsersModule],
  providers: [OrderProductService],
  exports: [OrderProductService],
})
export class OrderProductModule {}
