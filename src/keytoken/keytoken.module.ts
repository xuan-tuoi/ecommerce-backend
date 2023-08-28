import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyTokenEntity } from './entities/keytoken.entity';
import { KeytokenController } from './keytoken.controller';
import { KeytokenService } from './keytoken.service';

@Module({
  imports: [TypeOrmModule.forFeature([KeyTokenEntity])],
  controllers: [KeytokenController],
  providers: [KeytokenService],
  exports: [KeytokenService],
})
export class KeytokenModule {}
