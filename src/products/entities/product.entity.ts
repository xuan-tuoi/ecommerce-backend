import { BaseEntity } from 'src/common/entities/base.entity';
import { ReviewEntity } from 'src/reviews/entities/review.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity('products')
export class ProductEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  product_name: string;

  @Column({ type: 'jsonb', nullable: true })
  product_listImages: string[];

  @Column({ type: 'varchar', nullable: true, default: '' })
  product_thumbnail: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  product_description: string;

  @Column({ type: 'jsonb', nullable: false })
  product_attribute: object;

  @Column({ type: 'float', nullable: false, default: 0 })
  product_price: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  product_quantity: number;

  @Column({ type: 'enum', nullable: false, enum: ['Facial', 'Body', 'Hair'] })
  product_category: string;

  @Column({
    type: 'float',
    default: 4.5,
  })
  product_ratingsAverage: number;

  @Column({ default: true, select: true })
  isDraft: boolean;

  @Column({ default: true, select: true })
  isPublished: boolean;

  @ManyToOne(() => UserEntity, (user) => user.products)
  user: UserEntity;

  @OneToMany(() => ReviewEntity, (reviews) => reviews.product)
  reviews: ReviewEntity[];
}
