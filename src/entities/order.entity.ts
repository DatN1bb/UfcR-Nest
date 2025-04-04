import { Exclude, Expose } from 'class-transformer'
import { Column, Entity } from 'typeorm'

import { Base } from './base.entity'

@Entity()
export class Order extends Base {
  @Column()
  @Exclude()
  username: string

  @Column()
  email: string

  @Expose()
  get name(): string {
    return `${this.username}`
  }
}
