import { IsString } from 'class-validator';

export class CollectVoucherDto {
  @IsString()
  userId: string; // user id

  @IsString()
  voucherId: string;
}
