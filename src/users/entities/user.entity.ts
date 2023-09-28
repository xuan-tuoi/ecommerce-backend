import { CartEntity } from 'src/cart/entities/cart.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { ProductEntity } from 'src/products/entities/product.entity';
import { ReviewEntity } from 'src/reviews/entities/review.entity';
import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  password: string;

  @Index('email', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  attribute: object;

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

  @OneToMany(() => ProductEntity, (product) => product.user)
  products: ProductEntity[];

  @OneToMany(() => ReviewEntity, (reviews) => reviews.user)
  reviews: ReviewEntity[];

  @OneToOne(() => CartEntity, (cart) => cart.user)
  cart: CartEntity;
}
