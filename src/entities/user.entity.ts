import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { Base } from './base.entity'
import { Role } from './role.entity'

@Entity()
export class Uporabnik extends Base {
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

  @ManyToOne(() => Role, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null
}
