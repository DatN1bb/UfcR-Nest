import { IsNotEmpty } from 'class-validator'

export class CreateUpdateMatch_upsDto {
  @IsNotEmpty()
  borec1?: string

  @IsNotEmpty()
  borec2?: string

  @IsNotEmpty()
  winning_odds?: number
}
