import { CartEntity } from 'src/cart/entities/cart.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { HistoryVoucherEntity } from 'src/history-voucher/entities/historyVoucher.entity';
import { OrderEntity } from 'src/orders/entities/order.entity';
import { ProductEntity } from 'src/products/entities/product.entity';
import { ReviewEntity } from 'src/reviews/entities/review.entity';
import { VoucherEntity } from 'src/voucher/entities/voucher.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Index('email', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({
    type: 'varchar',
    nullable: false,
    enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
    default: 'ACTIVE',
  })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  @Column({ type: 'varchar', nullable: true })
  verify: boolean;

  @Column({
    type: 'varchar',
    nullable: false,
    enum: ['ADMIN', 'USER', 'SHOP'],
  })
  role: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  attribute: object;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ type: 'varchar', nullable: true })
  age: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @OneToMany(() => ProductEntity, (product) => product.user)
  products: ProductEntity[];

  @OneToMany(() => ReviewEntity, (reviews) => reviews.user)
  reviews: ReviewEntity[];

  @OneToOne(() => CartEntity, (cart) => cart.user)
  cart: CartEntity;

  @OneToMany(() => OrderEntity, (order) => order.user)
  order: OrderEntity;

  @OneToMany(() => VoucherEntity, (voucher) => voucher.shop)
  shopVouchers: VoucherEntity[];

  @OneToMany(
    () => HistoryVoucherEntity,
    (historyVoucher) => historyVoucher.user,
  )
  historyVoucher: HistoryVoucherEntity[];

  @ManyToMany(() => VoucherEntity, (voucher) => voucher.buyer)
  @JoinTable({
    name: 'voucher_user',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  vouchers: VoucherEntity[];
}
