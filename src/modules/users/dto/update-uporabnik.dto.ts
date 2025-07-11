import { IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator'
import { Match } from 'decorators/match.decorator'

export class UpdateUporabnikDto {
  @IsOptional()
  username?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  refresh_token?: string

  @ValidateIf((o) => typeof o.password === 'string' && o.password.length > 0)
  @IsOptional()
  @Matches(/^(?=.*\d)[A-Za-z.\s_-]+[\w~@#$%^&*+=`|{}:;!.?"()[\]-]{6,}/, {
    message:
      'Password must have at least one number, lower or upper case letter and it has to be longer than 5 characters',
  })
  password?: string

  @ValidateIf((o) => typeof o.confirm_password === 'string' && o.confirm_password.length > 0)
  @IsOptional()
  @Match(UpdateUporabnikDto, (field) => field.password, { message: 'Passwords do not match.' })
  confirm_password?: string
}
