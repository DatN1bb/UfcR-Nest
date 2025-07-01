import { Column, Entity } from 'typeorm'

import { Base } from './base.entity'

@Entity()
export class Match_ups extends Base {
  @Column()
  borec1: string

  @Column()
  borec2: string

  @Column()
  winning_odds: number
}
