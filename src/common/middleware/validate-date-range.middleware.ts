import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ValidateDateRangeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { from, to } = req.query;
    console.log('from', from);
    console.log('to', to);
    if (from && to) {
      const fromDate = new Date(from as string);
      const toDate = new Date(to as string);

      if (fromDate > toDate) {
        throw new BadRequestException(
          'From date must be less than or equal to to date',
        );
      }
    }

    next();
  }
}
