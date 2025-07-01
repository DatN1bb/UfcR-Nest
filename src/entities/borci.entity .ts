import { Column, Entity } from 'typeorm'

import { Base } from './base.entity'

@Entity()
export class Borci extends Base {
  @Column()
  ime: string

  @Column()
  record: number

  @Column({ nullable: true })
  starost: number

  @Column()
  velikost: number

  @Column()
  teza: number

  @Column()
  reach: number
}
