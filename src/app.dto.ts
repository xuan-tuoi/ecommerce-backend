import { IsString } from 'class-validator';

export class GetOrderAnalyticsDto {
  @IsString()
  userId: string; // user id

  @IsString()
  from: string; // user id

  @IsString()
  to: string;
}
