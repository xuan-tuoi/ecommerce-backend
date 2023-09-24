import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('voucher')
export class VoucherEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  voucher_name: string;

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

  @Column({ type: 'int', nullable: false })
  voucher_value: number;

  @Column({ type: Date, nullable: false })
  voucher_start_date: Date;

  @Column({ type: Date, nullable: false })
  voucher_end_date: Date;

  @Column({ type: 'int', nullable: false })
  voucher_max_use: number; // số lượng voucher có thể sử dụng

  @Column({ type: 'int', nullable: false })
  voucher_uses_count: number; // số lượng voucher đã được sủ dụng

  @Column({ type: 'jsonb', nullable: true, default: null })
  voucher_users_used: string[]; // danh sách user đã sử dụng voucher

  @Column({ type: 'int', nullable: false })
  voucher_max_use_per_user: number; // số lượng voucher cho mỗi user

  @Column({ type: 'int', nullable: false })
  voucher_min_order_value: number; // giá trị đơn hàng tối thiểu để sử dụng voucher
}
