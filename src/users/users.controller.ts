import { Body, Controller, Post } from '@nestjs/common';
import { Get, Param } from '@nestjs/common/decorators';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() userDto: UserDto) {
    return await this.usersService.createUser(userDto);
  }
}
