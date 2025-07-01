import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Uporabnik } from 'entities/uporabnik.entity'
import { PostgresErrorCode } from 'helpers/postgresErrorCode.enum'
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { Repository } from 'typeorm'
import { compareHash, hash } from 'utils/bcrypt'

import { CreateUporabnikDto } from './dto/create-uporabnik.dto'
import { UpdateUporabnikDto } from './dto/update-uporabnik.dto'

@Injectable()
export class UporabnikService extends AbstractService<Uporabnik> {
  updateUserImageId(id: string, filename: string): Uporabnik | PromiseLike<Uporabnik> {
    throw new Error('Method not implemented.')
  }
  constructor(@InjectRepository(Uporabnik) private readonly UporabnikRepository: Repository<Uporabnik>) {
    super(UporabnikRepository)
  }

  async create(createUserDto: CreateUporabnikDto): Promise<Uporabnik> {
    const existingUser = await this.FindBy({ email: createUserDto.email })
    if (existingUser) {
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const newUser = this.UporabnikRepository.create({
        ...createUserDto,
      })
      return this.UporabnikRepository.save(newUser)
    } catch (error) {
      logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new User.')
    }
  }

  async update(id: string, updateUserDto: UpdateUporabnikDto): Promise<Uporabnik> {
    const user = (await this.FindById(id)) as Uporabnik
    const { email, password, confirm_password, ...data } = updateUserDto
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
    return this.UporabnikRepository.save(user)
  }
  catch(error) {
    logging.error(error)
    if (error?.code === PostgresErrorCode.UniqueViolation) {
      throw new BadRequestException('User with that email already exists.')
    }
    throw new InternalServerErrorException('Something went wrong while updating the User')
  }
}
