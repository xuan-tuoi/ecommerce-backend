import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.interface';
import { Voucher } from 'src/voucher/voucher.interface';
import { Repository } from 'typeorm';
import { HistoryVoucherEntity } from './entities/historyVoucher.entity';

@Injectable()
export class HistoryVoucherService {
  constructor(
    @InjectRepository(HistoryVoucherEntity)
    private readonly historyVoucherRepository: Repository<HistoryVoucherEntity>,
  ) {}

  async saveVoucherUsedIntoHistoryVoucher(voucher: Voucher, user: User) {
    try {
      const voucherFound = await this.historyVoucherRepository.findOne({
        where: { userId: user.id, voucherId: voucher.id },
        relations: ['voucher'],
      });
      // nếu tồn tại rồi , kiểm tra max_use :
      // 1. nhỏ hơn 3 thì tăng lên 1
      // 2. lớn hơn 3 : nhưng ngày hiện tại khác ngày đã sử dụng thì reset về 1, còn nếu sử dụng trong cùng 1 ngày thì không cho sử dụng nữa và trả về lỗi
      // Nếu chưa tồn tại => tạo mới và set max_use = 1
      if (voucherFound) {
        if (voucherFound.voucher.voucher_scope === 'freeship') {
          if (voucherFound.voucher_max_use_per_day <= 3) {
            voucherFound.voucher_max_use_per_day += 1;
            await this.historyVoucherRepository.save(voucherFound);
          } else {
            const today = new Date();
            if (today.getDate() === voucherFound.updatedAt.getDate()) {
              throw new BadRequestException(
                'Your voucher FREESHIP has been used max 3 times today',
              );
            } else {
              voucherFound.voucher_max_use_per_day = 1;
              await this.historyVoucherRepository.save(voucherFound);
            }
          }
        }
        // nếu là voucher discount thì sẽ check xem họ dùng hết lượt hay chưa
        // nếu chưa thì tăng lên 1
        // nếu đã hết lượt thì trả về lỗi
        if (voucherFound.voucher.voucher_scope === 'storewide') {
          if (
            voucherFound.voucher_max_use_per_day <=
            voucherFound.voucher.voucher_max_use_per_user
          ) {
            voucherFound.voucher_max_use_per_day += 1;
            await this.historyVoucherRepository.save(voucherFound);
          } else {
            throw new BadRequestException(
              'Your voucher DISCOUNT has been used max times',
            );
          }
        }
      } else {
        const newHistoryVoucher = this.historyVoucherRepository.create({
          userId: user.id,
          voucherId: voucher.id,
          voucher_max_use_per_day: 1,
        });
        await this.historyVoucherRepository.save(newHistoryVoucher);
      }
      return {
        message: 'Save voucher used into history voucher successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
