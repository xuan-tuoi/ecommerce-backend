import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { KeytokenService } from 'src/keytoken/keytoken.service';
import { HEADER } from '../constant';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(
    private readonly keyTokenService: KeytokenService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // b1: check userId in header
    const userId = req.headers[HEADER.CLIENT_ID]?.toString();
    if (!userId) {
      throw new HttpException('UNAUTHORIZED Request', HttpStatus.UNAUTHORIZED);
    }
    // b2. get access token from tokenService ?
    const keyStore = await this.keyTokenService.getKeyToken({ userId });

    if (!keyStore) {
      throw new HttpException('Not found keyStore', HttpStatus.NOT_FOUND);
    }
    if (req.headers[HEADER.REFRESHTOKEN]) {
      try {
        const refreshToken = req.headers[HEADER.REFRESHTOKEN].toString();
        const decoder = await this.jwtService.verifyAsync(refreshToken, {
          secret: keyStore.privateKey,
        });
        if (userId !== decoder.id) {
          throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
        }
        req['keyStore'] = keyStore;
        req['user'] = decoder;
        req['refreshToken'] = refreshToken;
        return next();
      } catch (error) {
        throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
      }
    }
    const accessToken = req.headers[HEADER.AUTHORIZATION]?.toString();
    if (!accessToken) {
      throw new HttpException(
        ' Unauthorization Request ',
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const decoder = await this.jwtService.verifyAsync(accessToken, {
        secret: keyStore.publicKey,
      });

      if (userId !== decoder.id) {
        throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
      }
      req['keyStore'] = keyStore;
      req['user'] = decoder;
      return next();
    } catch (error) {
      throw new HttpException(error, HttpStatus.UNAUTHORIZED);
    }
  }
}
