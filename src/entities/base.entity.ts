import { Expose } from 'class-transformer'
import { IsUUID } from 'class-validator'
import { PrimaryGeneratedColumn } from 'typeorm'

export class Base {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  @Expose()
  id: string
}
