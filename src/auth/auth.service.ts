import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Response,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { RoleOfuser, saltOrRounds } from 'src/common/constant';
import { KeytokenService } from 'src/keytoken/keytoken.service';
import { randomBytes } from 'crypto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/user.interface';
import { Request } from 'express';
import { KeyToken } from 'src/keytoken/keyToken.interface';
import { LoginDto } from './dto/login.dto';
dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly keyTokenService: KeytokenService,
  ) {}

  async createTokenPair(payload, publicKey, privateKey) {
    try {
      const accessToken = await this.jwtService.sign(payload, {
        secret: publicKey,
      });
      const refreshToken = await this.jwtService.sign(payload, {
        secret: privateKey,
      });

      this.jwtService.verify(accessToken, {
        secret: publicKey,
      });
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async signup(user: CreateUserDto) {
    try {
      const existUser = await this.userService
        .findOne({ email: user.email })
        .catch((error) => {
          throw new BadRequestException(error);
        });
      if (existUser) {
        return new BadRequestException('Email already exists');
      }
      //regex email must have contain @ and .com
      const regex = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;
      if (!regex.test(user.email)) {
        return new BadRequestException('Email is not valid');
      }
      // hash password
      const passwordHash = await bcrypt.hash(user.password, saltOrRounds);
      const newUser = await this.userService.createUser({
        ...user,
        password: passwordHash,
        role: user.role === 'user' ? RoleOfuser.USER : RoleOfuser.SHOP,
      });

      if (newUser) {
        const privateKey = randomBytes(16).toString();
        const publicKey = randomBytes(16).toString();

        const keyStore = await this.keyTokenService.createKeyToken({
          privateKey: privateKey.toString(),
          publicKey: publicKey.toString(),
          userId: newUser.id,
        });
        if (!keyStore) {
          return new Error('Create key token fail');
        }

        //create token and refreshToken
        const token = await this.createTokenPair(
          {
            id: newUser.id,
            email: newUser.email,
          },
          publicKey.toString(),
          privateKey.toString(),
        );
        return {
          user: newUser,
          token: {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            maxAge: new Date(
              new Date().getTime() + +process.env.JWT_EXPIRATION_TIME * 1000,
            ),
          },
        };
      }
    } catch (error) {
      return new Error(error);
    }
  }

  async login(loginDto: LoginDto, @Response() res) {
    try {
      const { email, password, rememberPassword } = loginDto;
      const foundShop = await this.userService.findOne({
        email: email,
      });
      if (!foundShop) {
        return res.status(404).send({ message: 'User not found' });
      }
      //check password
      const isMatch = await bcrypt.compare(password, foundShop.password);
      if (!isMatch) {
        return res.status(404).send({ message: 'password does not match' });
      }
      // create publickey and privatekey
      const privatekey = randomBytes(32).toString();
      const publickey = randomBytes(32).toString();
      const token = await this.createTokenPair(
        {
          id: foundShop.id,
          email: foundShop.email,
          username: foundShop.username,
        },
        publickey,
        privatekey,
      );
      console.log('-----------login---- token is ---', token);
      await this.keyTokenService.createKeyToken({
        privateKey: privatekey,
        publicKey: publickey,
        userId: foundShop.id,
        refreshToken: token.refreshToken,
      });
      // set userId to Header
      res.setHeader('x-client-id', foundShop.id);
      // set authorization to Header
      res.setHeader('authorization', token.accessToken);
      // return user, token
      return res.status(200).json({
        user: {
          rememberPassword,
          ...foundShop,
        },
        token: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          maxAge: new Date(
            new Date().getTime() +
              +process.env.JWT_EXPIRATION_TIME_TWO_MINUTES * 1000,
          ),
        },
      });
    } catch (error) {
      return res.status(500).send({ message: 'An error occurred' });
    }
  }

  async logout(req: Request) {
    const keyStore = req['keyStore'];
    // delete keyStore
    await this.keyTokenService.deleteKeyToken({
      id: keyStore.id,
    });
    return {
      message: 'logout success',
    };
  }

  async refreshToken({
    keyStore,
    user,
    refreshToken,
  }: {
    keyStore: KeyToken;
    user: User;
    refreshToken: string;
  }) {
    const { id, email } = user;
    if (keyStore.refreshTokenUsed.includes(refreshToken)) {
      // xoa refreshToken
      await this.keyTokenService.deleteKeyToken({
        id: keyStore.id,
      });
      throw new BadRequestException('Refresh token has been used');
    }
    if (keyStore.refreshToken !== refreshToken) {
      throw new BadRequestException('Shop not registered');
    }
    const foundShop = await this.userService.findOne({
      id,
    });
    if (!foundShop) {
      throw new BadRequestException('Shop not registered');
    }
    // tạo 1 cặp token mới
    const tokens = await this.createTokenPair(
      {
        id,
        email,
      },
      keyStore.publicKey,
      keyStore.privateKey,
    );
    //update keytoken cũ trong DB
    await this.keyTokenService.updateKeyToken({
      id: keyStore.id,
      refreshTokenUsed: [...keyStore.refreshTokenUsed, refreshToken],
      newRefreshToken: tokens.refreshToken,
    });
    return {
      user: {
        ...foundShop,
      },
      token: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        maxAge: new Date(
          new Date().getTime() +
            +process.env.JWT_REFRESH_EXPIRATION_TIME * 1000,
        ),
      },
    };
  }
}
