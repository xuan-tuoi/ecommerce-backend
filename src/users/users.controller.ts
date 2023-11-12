import { Body, Controller, Post } from '@nestjs/common';
import { Get, Param, Query } from '@nestjs/common/decorators';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @returns csv file chứa tổng số lượt mua của mỗi user với mỗi thể loại sản phẩm
   */
  @Get('/history')
  async getHistoryOrdersOfUser() {
    return this.usersService.getHistoryOrdersOfUser();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() userDto: UserDto) {
    return await this.usersService.createUser(userDto);
  }

  @Post('crawl-data')
  async crawlDataUser() {
    return await this.usersService.crawlDataUser();
  }
}
