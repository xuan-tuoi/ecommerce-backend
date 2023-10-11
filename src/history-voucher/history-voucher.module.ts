import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { HistoryVoucherEntity } from './entities/historyVoucher.entity';
import { HistoryVoucherService } from './history-voucher.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoryVoucherEntity]), UsersModule],
  providers: [HistoryVoucherService],
  exports: [HistoryVoucherService],
})
export class HistoryVoucherModule {}
