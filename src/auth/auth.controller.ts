import {
  Controller,
  HttpCode,
  Post,
  Body,
  Req,
  Res,
  Get,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('/reset-password')
  async getPassword(
    @Body()
    body: {
      newPassword: string;
      id: string;
    },
  ) {
    return await this.authService.getPassword(body);
  }

  @HttpCode(201)
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signup(createUserDto);
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return await this.authService.login(loginDto, res);
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Req() request: Request) {
    return await this.authService.logout(request);
  }

  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(@Req() req: Request) {
    const keyStore = req['keyStore'];
    const user = req['user'];
    const refreshToken = req['refreshToken'];
    return await this.authService.refreshToken({
      keyStore,
      user,
      refreshToken,
    });
  }
}
