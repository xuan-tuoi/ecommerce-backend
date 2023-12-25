import { IsString } from 'class-validator';

export class DeliveredDto {
  @IsString()
  orderId: string;
}
