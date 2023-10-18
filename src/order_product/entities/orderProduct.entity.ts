import { BaseEntity } from 'src/common/entities/base.entity';
import { OrderEntity } from 'src/orders/entities/order.entity';
import { ProductEntity } from 'src/products/entities/product.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('order_product')
export class OrderProductEntity extends BaseEntity {
  @Column({ type: 'int', nullable: true, default: 1 })
  quantity: number;

  // @Column({ type: 'varchar', nullable: false })
  // productId: string;

  // @Column({ type: 'varchar', nullable: false })
  // orderId: string;

  @ManyToOne(() => ProductEntity, (product) => product.orderProduct)
  product: ProductEntity;

  @ManyToOne(() => OrderEntity, (order) => order.orderProduct)
  order: OrderEntity;
}
