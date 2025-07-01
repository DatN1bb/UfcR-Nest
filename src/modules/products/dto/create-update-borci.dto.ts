import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateUpdateBorciDto {
  @IsNotEmpty()
  ime: string

  @IsNotEmpty()
  record: number

  @IsNotEmpty()
  starost: number

  @IsOptional()
  velikost: number

  @IsNotEmpty()
  teza: number

  @IsNotEmpty()
  reach: number
}
