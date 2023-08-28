import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class ExceptionsLoggerFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
