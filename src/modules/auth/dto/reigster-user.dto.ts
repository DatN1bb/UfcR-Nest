import { IsEmail, IsEmpty, IsNotEmpty, IsOptional, Matches } from 'class-validator'
import { Match } from 'decorators/match.decorator' // Ensure the correct path to the Match decorator

export class RegisterUserDto {
  @IsOptional()
  username?: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @Matches(/^(?=.*\d)(?=.*[a-zA-Z]).{6,}$/, {
    message: 'Password must have at least one number, one letter, and be longer than 5 characters.',
  })
  password?: string

  @IsNotEmpty()
  @Match(RegisterUserDto, (dto) => dto.password, { message: 'Passwords do not match.' })
  confirm_password: string
}
