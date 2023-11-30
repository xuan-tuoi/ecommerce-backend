import { BaseEntity } from 'src/common/entities/base.entity';
import { OrderProductEntity } from 'src/order_product/entities/orderProduct.entity';
import { ReviewEntity } from 'src/reviews/entities/review.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity('products')
export class ProductEntity extends BaseEntity {
  @Column({ type: 'float', nullable: false, default: 0 })
  product_price: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  product_original_price: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  product_quantity: number;

  @Column({ type: 'varchar', nullable: false })
  product_category: string;

  @Column({
    type: 'enum',
    enum: ['inStock', 'outOfStock', 'preOrder'],
    default: 'inStock',
  })
  product_status: string;

  @Column({
    type: 'float',
    default: 5,
  })
  product_ratingsAverage: number;

  @Column({ type: 'jsonb', nullable: true })
  product_listImages: string[];

  @Column({ type: 'varchar', nullable: true, default: '' })
  product_thumbnail: string;

  @Column({ type: 'jsonb', nullable: false })
  product_attribute: object;

  @Column({ default: true, select: true })
  isDraft: boolean;

  @Column({ default: true, select: true })
  isPublished: boolean;

  @Column({ type: 'varchar', nullable: false })
  product_name: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  product_description: string;

  @ManyToOne(() => UserEntity, (user) => user.products)
  user: UserEntity;

  @OneToMany(() => ReviewEntity, (reviews) => reviews.product)
  reviews: ReviewEntity[];

  @OneToMany(() => OrderProductEntity, (orderProduct) => orderProduct.product)
  orderProduct: OrderProductEntity[];
}
