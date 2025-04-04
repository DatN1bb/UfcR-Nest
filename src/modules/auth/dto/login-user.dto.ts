import { IsEmail, IsNotEmpty } from 'class-validator'

export class LoginUporabnikDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  password: string
}
