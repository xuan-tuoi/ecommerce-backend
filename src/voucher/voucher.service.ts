import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HistoryVoucherService } from 'src/history-voucher/history-voucher.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { CollectVoucherDto } from './dto/collect-voucher.dto';
import { CreateVoucherDto } from './dto/create.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherEntity } from './entities/voucher.entity';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly vouchersRepository: Repository<VoucherEntity>,
    private readonly userService: UsersService,
    private readonly historyVoucherService: HistoryVoucherService,
  ) {}

  async findOne(id: string) {
    const voucher = await this.vouchersRepository.findOne({
      where: { id: id, voucher_status: 'active', isDeleted: false },
    });
    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }
    return voucher;
  }

  async findVoucherById(id: string) {
    const voucher = await this.vouchersRepository.findOne({
      where: { id: id, voucher_status: 'active', isDeleted: false },
    });
    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }
    return voucher;
  }

  async createVoucher(body: CreateVoucherDto) {
    const userID = body.userId;
    const user = await this.userService.getUserById(userID);

    if (user.role !== 'SHOP') {
      throw new Error('Permission denied');
    }
    const voucher_start_date = new Date(body.voucher_start_date);

    const voucher_end_date = new Date(body.voucher_end_date);

    const newVoucher = {
      shop: user,
      // buyer: null,
      voucher_name: body.voucher_name,
      voucher_code: body.voucher_code,
      voucher_description: body.voucher_description,
      voucher_type: body.voucher_type,
      voucher_value: body.voucher_value,
      voucher_start_date: voucher_start_date,
      voucher_end_date: voucher_end_date,
      voucher_max_use: body.voucher_max_use,
      voucher_uses_count: body.voucher_uses_count,
      voucher_users_used: body.voucher_users_used,
      voucher_max_use_per_user: body.voucher_max_use_per_user,
      voucher_min_order_value: body.voucher_min_order_value,
    };

    const result = await this.vouchersRepository.save(newVoucher);
    return result;
  }

  async collectVoucher(body: CollectVoucherDto) {
    try {
      const { userId, voucherId } = body;
      const user = await this.userService.getUserById(userId);
      const voucher = await this.findVoucherById(voucherId);
      //check voucher còn hay hết
      if (voucher.voucher_max_use <= 0) {
        throw new Error('Voucher is out of uses');
      }

      // check voucher còn hạn hay hết hạn
      const today = new Date();
      if (
        today < voucher.voucher_start_date ||
        today > voucher.voucher_end_date
      ) {
        throw new Error('Voucher is expired');
      }
      const queryBuilder =
        this.vouchersRepository.createQueryBuilder('vouchers');

      // check user đã collect voucher này chưa
      const voucherFound = await queryBuilder
        .leftJoinAndSelect('vouchers.buyer', 'buyer')
        .where('buyer.id = :userId', { userId: userId })
        .andWhere('vouchers.id = :voucherId', { voucherId: voucherId })
        .getOne();

      if (voucherFound) {
        return {
          mess: 'You have already collected this voucher',
        };
      }

      // update number of voucher uses incase user not collected this voucher
      voucher.voucher_uses_count += 1;
      voucher.voucher_max_use -= 1;

      // check voucher còn hay hết
      if (voucher.voucher_max_use <= 0) {
        voucher.voucher_status = 'deactive';
      }

      // add voucher to user
      await queryBuilder.relation('buyer').of(voucher).add(user);

      // // Lưu thay đổi vào cơ sở dữ liệu
      await this.vouchersRepository.save(voucher);

      return {
        mess: 'Collect voucher successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async applyVoucher(body: ApplyVoucherDto) {
    try {
      const { userId, voucherId } = body;
      const user = await this.userService.getUserById(userId);
      // tìm voucher chứa userId và voucherId trong bảng user_voucher
      const queryBuilder =
        this.vouchersRepository.createQueryBuilder('voucher');
      const voucher = await queryBuilder
        .leftJoinAndSelect('voucher.buyer', 'buyer')
        .where('buyer.id = :userId', { userId: userId })
        .andWhere('voucher.id = :voucherId', { voucherId: voucherId })
        .getOne();
      if (!voucher) {
        throw new BadRequestException('Voucher not found');
      }
      // Lưu thông tin voucher được sử dụng vào HistoryVoucher
      await this.historyVoucherService.saveVoucherUsedIntoHistoryVoucher(
        voucher,
        user,
      );
      // xóa voucher của user khi dùng voucher
      await queryBuilder.relation('buyer').of(voucher).remove(user);
      return {
        message: 'Apply voucher successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getVouchersByShopId(shopId: string, userId: string) {
    try {
      // find all voucher of shop
      const vouchers = await this.vouchersRepository.find({
        where: {
          shop: {
            id: shopId,
          },
          isDeleted: false,
        },
      });
      // Nếu có userId thì sẽ get ra danh sách voucher và check voucher đó đã được user collect hay chưa

      if (!userId || userId === 'null') {
        return vouchers.map((voucher) => {
          return {
            ...voucher,
            isCollected: false,
          };
        });
      } else {
        // find all voucher which is collected by user\
        const queryBuilder =
          this.vouchersRepository.createQueryBuilder('voucher');
        const vouchersCollected = await queryBuilder
          .leftJoinAndSelect('voucher.buyer', 'buyer')
          .where('buyer.id = :userId', { userId: userId })
          .orderBy('voucher.created_at', 'DESC')
          .getMany();

        const listVoucher = vouchers.map((voucher) => {
          const checkVoucher = vouchersCollected.find((voucherCollected) => {
            return voucherCollected.id === voucher.id;
          });
          if (checkVoucher) {
            return {
              ...voucher,
              isCollected: true,
            };
          } else {
            return {
              ...voucher,
              isCollected: false,
            };
          }
        });
        return listVoucher;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getVoucherByCode(code: string) {
    const voucher = await this.vouchersRepository.findOne({
      where: {
        voucher_code: code,
        isDeleted: false,
      },
    });
    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }
    return voucher;
  }

  /**
   * @param userId string
   * @returns  danh sách voucher của user
   */
  async getVouchersByUserId(userId: string) {
    try {
      const queryBuilder =
        this.vouchersRepository.createQueryBuilder('voucher');
      const vouchers = await queryBuilder
        .leftJoinAndSelect('voucher.buyer', 'buyer')
        .where('buyer.id = :userId', { userId: userId })
        .andWhere('voucher.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('voucher.voucher_status = :voucherStatus', {
          voucherStatus: 'active',
        })
        .andWhere('voucher.voucher_max_use > 0')
        .andWhere('voucher.voucher_end_date > :today', {
          today: new Date(),
        })
        .getMany();
      // chia 2 loại : freeship và storewide
      // nếu freeship lọc ra voucher có giá trị cao nhất
      // nếu storewide lọc ra voucher có giá trị cao nhất và có thời hạn sử dụng gần nhất
      const freeshipVouchers = vouchers.filter((voucher) => {
        return voucher.voucher_scope === 'freeship';
      });
      const storewideVouchers = vouchers.filter((voucher) => {
        return voucher.voucher_scope === 'storewide';
      });
      const freeShipMaxValueVoucher = freeshipVouchers.find((voucher) => {
        return (
          voucher.voucher_value ===
          Math.max(...freeshipVouchers.map((voucher) => voucher.voucher_value))
        );
      });

      const storewideMaxValueVoucher = storewideVouchers.find((voucher) => {
        return (
          voucher.voucher_value ===
          Math.max(...storewideVouchers.map((voucher) => voucher.voucher_value))
        );
      });

      return {
        freeShipMaxValueVoucher,
        storewideMaxValueVoucher,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteVoucher(id: string) {
    try {
      // found voucher
      const voucher = await this.vouchersRepository.find({
        where: {
          id: id,
        },
      });

      if (!voucher) {
        throw new BadRequestException('Voucher not found');
      }

      // xóa voucher trong bảng voucher_user
      await this.vouchersRepository.query(`
        DELETE FROM voucher_user
        WHERE vouchers_id = '${id}'
      `);

      // xóa voucher trong bảng history-voucher
      await this.vouchersRepository.query(`
        DELETE FROM "history-voucher"
        WHERE voucher_id = '${id}'
      `);

      // xóa voucher trong bảng voucher
      await this.vouchersRepository.delete(id);

      return {
        message: 'Delete voucher successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateVoucher(body: UpdateVoucherDto) {
    try {
      const voucher = await this.vouchersRepository.findOne({
        where: {
          id: body.id,
        },
      });
      if (!voucher) {
        throw new BadRequestException('Voucher not found');
      }
      await this.vouchersRepository.save({
        ...voucher,
        ...body,
      });
      return {
        message: 'Update voucher successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
