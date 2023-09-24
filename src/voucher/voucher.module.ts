import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherEntity } from './entities/voucher.entity';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherEntity])],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
