import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('keytoken')
export class KeyTokenEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  publicKey: string;

  @Column({ type: 'varchar', nullable: false })
  privateKey: string;

  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  refreshTokenUsed: object;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string;
}
