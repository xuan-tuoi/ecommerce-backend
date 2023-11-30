import { IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  gender: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;
}
