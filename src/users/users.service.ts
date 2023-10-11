import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findOne(options?: object): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: options,
      });
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository
      .findOne({
        where: { id },
      })
      .catch((err) => {
        throw new BadRequestException(err);
      });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async createUser(userDto) {
    if (!userDto.username) {
      userDto.username = userDto.email;
    }
    const user = await this.usersRepository.save(userDto).catch((err) => {
      throw new BadRequestException(err);
    });
    return user;
  }

  async updateUser(id: string, userDto) {
    const user = await this.getUserById(id);
    const updatedUser = await this.usersRepository
      .save({ ...user, ...userDto })
      .catch((err) => {
        throw new BadRequestException(err);
      });
    return updatedUser;
  }

  async save(user: User): Promise<User> {
    return await this.usersRepository.save(user);
  }
}
