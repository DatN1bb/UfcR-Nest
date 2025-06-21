import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'entities/user.entity'
import { PostgresErrorCode } from 'helpers/postgresErrorCode.enum'
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { Repository } from 'typeorm'
import { compareHash, hash } from 'utils/bcrypt'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService extends AbstractService<User> {
  constructor(@InjectRepository(User) private readonly UsersRepository: Repository<User>) {
    super(UsersRepository)
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.FindBy({ email: createUserDto.email })
    if (existingUser) {
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const newUser = this.UsersRepository.create({
        ...createUserDto,
      })
      return this.UsersRepository.save(newUser)
    } catch (error) {
      logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new User.')
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = (await this.FindById(id)) as User
    const { email, password, confirm_password, role_id, ...data } = updateUserDto
    if (user.email !== email && email) {
      user.email = email
    }
    if (password && confirm_password) {
      if (password !== confirm_password) {
        throw new BadRequestException('Password do not match.')
      }
      if (await compareHash(password, user.password)) {
        throw new BadRequestException('New password cannot be the same as your old password.')
      }
      user.password = await hash(password)
    }
    if (role_id) {
    }
    try {
      Object.entries(data).map((entry) => {
        user[entry[0]] = entry[1]
      })
      return this.UsersRepository.save(user)
    } catch (error) {
      logging.error(error)
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('User with that email already exists.')
      }
      throw new InternalServerErrorException('Something went wrong while updating the User')
    }
  }

  async updateUserImageId(id: string, avatar: string): Promise<User> {
    const user = await this.FindById(id)
    return this.update(user.id, { avatar })
  }
}
