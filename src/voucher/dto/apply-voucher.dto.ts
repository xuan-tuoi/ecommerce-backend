import { IsString } from 'class-validator';

export class ApplyVoucherDto {
  @IsString()
  userId: string; // user id

  @IsString()
  voucherId: string;
}
