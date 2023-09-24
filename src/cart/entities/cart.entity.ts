import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('carts')
export class CartEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    default: 'active',
    enum: ['active', 'completed', 'failed', 'pending'],
  })
  cart_status;

  @Column({ type: 'int', nullable: false, default: 0 })
  cart_count_product: number;

  @Column({ type: 'jsonb', nullable: false, default: [] })
  cart_products: object[];

  @Column({ type: 'varchar', nullable: false, default: '' })
  cart_userId: string;
}
