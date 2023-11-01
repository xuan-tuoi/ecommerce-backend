import { BaseEntity } from 'src/common/entities/base.entity';
import { ProductEntity } from 'src/products/entities/product.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('reviews')
export class ReviewEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  review_content: string;

  @Column({ type: 'float', nullable: true })
  review_ratings: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  parentCommentId: string;

  @Column({ type: 'int', nullable: true })
  comment_left: number;

  @Column({ type: 'int', nullable: true })
  comment_right: number;

  @ManyToOne(() => UserEntity, (user) => user.reviews)
  user: UserEntity;

  @ManyToOne(() => ProductEntity, (product) => product.reviews)
  product: ProductEntity;
}
