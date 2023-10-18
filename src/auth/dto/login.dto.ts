import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  rememberPassword: boolean;
}
