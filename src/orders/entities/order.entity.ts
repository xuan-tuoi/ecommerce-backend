import { BaseEntity } from 'src/common/entities/base.entity';
import { OrderProductEntity } from 'src/order_product/entities/orderProduct.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ type: 'jsonb', nullable: false }) // chứa totalPrice , totalDiscount, feeShip
  order_checkout: object;

  @Column({ type: 'jsonb', nullable: false }) // chứa thông tin street, city, state, country
  order_shipping: object;

  @Column({ type: 'jsonb', nullable: false })
  order_payment: object;

  @Column({
    type: 'varchar',
    enum: ['pending', 'packaged', 'shipping', 'cancelled', 'delivered'],
    default: 'pending',
  })
  order_status: string;

  @ManyToOne(() => UserEntity, (user) => user.order)
  @JoinColumn() //
  user: UserEntity;

  @Column({
    type: 'timestamp with time zone',
    default: null,
  })
  time_delivery: Date;

  @OneToMany(() => OrderProductEntity, (orderProduct) => orderProduct.order)
  orderProduct: OrderProductEntity[];
}
