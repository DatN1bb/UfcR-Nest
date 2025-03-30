import { Column, ManyToOne, JoinColumn } from 'typeorm'
import { Base } from './base.entity'
import { Exclude } from 'class-transformer'
import { Role } from './role.entity'

export class User extends Base {
  @Column({ unique: true })
  email: string

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ nullable: true })
  avatar: string

  @Column({ nullable: true })
  @Exclude()
  password: string

  @ManyToOne(() => Role, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null
}
