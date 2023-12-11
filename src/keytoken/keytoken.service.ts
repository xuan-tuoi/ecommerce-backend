import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyTokenEntity } from './entities/keytoken.entity';

@Injectable()
export class KeytokenService {
  constructor(
    @InjectRepository(KeyTokenEntity)
    private readonly keyTokenEntity: Repository<KeyTokenEntity>,
  ) {}

  public async getKeyToken({ userId }: { userId: string }) {
    try {
      const keyToken = await this.keyTokenEntity.findOne({
        where: {
          userId,
        },
      });
      return keyToken;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // save token and key to DB
  public async createKeyToken({
    privateKey,
    publicKey,
    userId,
    refreshToken,
  }: {
    privateKey: string;
    publicKey: string;
    userId: string;
    refreshToken?: string;
  }) {
    try {
      const isExistKeyToken = await this.keyTokenEntity.findOne({
        where: {
          userId,
        },
      });
      if (isExistKeyToken) {
        await this.keyTokenEntity.update(isExistKeyToken.id, {
          privateKey,
          publicKey,
          refreshToken,
        });
        return;
      }
      const tokens = await this.keyTokenEntity.save({
        privateKey,
        publicKey,
        userId,
        refreshToken,
      });
      return tokens;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async updateKeyToken({ id, refreshTokenUsed, newRefreshToken }) {
    try {
      return await this.keyTokenEntity.update(id, {
        refreshTokenUsed,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async deleteKeyToken({ id }: { id: string }) {
    try {
      return await this.keyTokenEntity.delete({
        id,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
