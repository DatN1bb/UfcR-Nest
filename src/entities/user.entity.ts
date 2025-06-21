import { Exclude } from 'class-transformer'
import { Column, Entity } from 'typeorm'

import { Base } from './base.entity'

@Entity()
export class User extends Base {
  @Column({ nullable: true })
  username: string

  @Column({ unique: true })
  email: string

  @Column({ nullable: true })
  @Exclude()
  password: string

  @Column({ nullable: true })
  @Exclude()
  refresh_token?: string
}
