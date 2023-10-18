import { BaseEntity } from 'src/common/entities/base.entity';
import { HistoryVoucherEntity } from 'src/history-voucher/entities/historyVoucher.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  voucher_name: string;

  @Column({
    type: 'varchar',
    nullable: false,
    default: 'active',
    enum: ['active', 'deactive'],
  })
  voucher_status: string;

  @Column({ type: 'varchar', nullable: false })
  voucher_code: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  voucher_description: string;

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed_amount'],
    default: 'fixed_amount',
  })
  voucher_type: string;

  @Column({
    type: 'enum',
    enum: ['storewide', 'freeship'],
    default: 'storewide',
  })
  voucher_scope: string;

  @Column({ type: 'int', nullable: false })
  voucher_value: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  voucher_start_date: Date;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  voucher_end_date: Date;

  @Column({ type: 'int', nullable: false })
  voucher_max_use: number; // số lượng voucher có thể sử dụng

  @Column({ type: 'int', nullable: false })
  voucher_uses_count: number; // số lượng voucher đã được sủ dụng

  // @Column({ type: 'jsonb', nullable: true, default: null })
  // voucher_users_used: string[]; // danh sách user đã sử dụng voucher

  @Column({ type: 'int', nullable: false })
  voucher_max_use_per_user: number; // số lượng voucher cho mỗi user

  @Column({ type: 'int', nullable: false })
  voucher_min_order_value: number; // giá trị đơn hàng tối thiểu để sử dụng voucher

  @OneToMany(
    () => HistoryVoucherEntity,
    (historyVoucher) => historyVoucher.voucher,
  )
  historyVoucher: HistoryVoucherEntity[];

  @ManyToOne(() => UserEntity, (user) => user.shopVouchers)
  shop: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.vouchers)
  buyer: UserEntity[];

  // thêm 1 thuộc tính liên quan đến hạn chế số lần dùng 1 voucher của user. Ví dụ như user freeship 15k thì chỉ cho dùng 3 lần trong 1 ngày thôi
}
