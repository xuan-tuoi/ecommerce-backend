import { Body, Controller, Post } from '@nestjs/common';
import { Get, Param, Patch, Query } from '@nestjs/common/decorators';
import { UpdateUserDto } from './dto/update-user.dto';
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

  @Get('/shop')
  getShopByName(@Query('name') name: string) {
    return this.usersService.getShopByName(name);
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

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() userDto: UpdateUserDto) {
    return await this.usersService.updateUser(id, userDto);
  }
}
