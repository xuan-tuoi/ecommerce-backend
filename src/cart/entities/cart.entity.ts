import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('carts')
export class CartEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    default: 'active',
    enum: ['active', 'comple ted', 'failed', 'pending'],
  })
  cart_status: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  cart_count_product: number;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  cart_products: object[];

  @OneToOne(() => UserEntity, { nullable: true })
  @JoinColumn()
  user: UserEntity;
}
