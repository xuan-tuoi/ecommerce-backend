import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { VoucherEntity } from 'src/voucher/entities/voucher.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('history-voucher')
export class HistoryVoucherEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @Column({ type: 'varchar', nullable: false })
  voucherId: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  voucher_max_use_per_day: number;

  @ManyToOne(() => UserEntity, (user) => user.historyVoucher)
  user: UserEntity;

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.historyVoucher)
  voucher: VoucherEntity;
}
