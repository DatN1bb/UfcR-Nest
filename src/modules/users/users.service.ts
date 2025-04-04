import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Uporabnik } from 'entities/user.entity'
import { PostgresErrorCode } from 'helpers/postgresErrorCode.enum'
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { Repository } from 'typeorm'
import { compareHash, hash } from 'utils/bcrypt'

import { CreateUporabnikDto } from './dto/create-user.dto'
import { UpdateUporabnikDto } from './dto/update-user.dto'

@Injectable()
export class UporabnikiService extends AbstractService<Uporabnik> {
  constructor(@InjectRepository(Uporabnik) private readonly UporabnikiRepository: Repository<Uporabnik>) {
    super(UporabnikiRepository)
  }

  async create(createUporabnikDto: CreateUporabnikDto): Promise<Uporabnik> {
    const uporabnik = await this.FindBy({ email: createUporabnikDto.email })
    if (uporabnik) {
      throw new BadRequestException('Uporabnik with that email already exists.')
    }
    try {
      const newUporabnik = this.UporabnikiRepository.create({
        ...createUporabnikDto,
        role: { id: createUporabnikDto.role_id },
      })
      return this.UporabnikiRepository.save(newUporabnik)
    } catch (error) {
      logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new Uporabnik.')
    }
  }

  async update(id: string, updateUporabnikDto: UpdateUporabnikDto): Promise<Uporabnik> {
    const uporabnik = (await this.FindById(id)) as Uporabnik
    const { email, password, confirm_password, role_id, ...data } = updateUporabnikDto
    if (uporabnik.email !== email && email) {
      uporabnik.email = email
    }
    if (password && confirm_password) {
      if (password !== confirm_password) {
        throw new BadRequestException('Password do not match.')
      }
      if (await compareHash(password, uporabnik.password)) {
        throw new BadRequestException('New password cannot be the same as your old password.')
      }
      uporabnik.password = await hash(password)
    }
    if (role_id) {
      uporabnik.role = { ...uporabnik.role, id: role_id }
    }
    try {
      Object.entries(data).map((entry) => {
        uporabnik[entry[0]] = entry[1]
      })
      return this.UporabnikiRepository.save(uporabnik)
    } catch (error) {
      logging.error(error)
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('Uporabnik with that email already exists.')
      }
      throw new InternalServerErrorException('Something went wrong while updating the Uporabnik')
    }
  }

  async updateUporabnikImageId(id: string, avatar: string): Promise<Uporabnik> {
    const uporabnik = await this.FindById(id)
    return this.update(uporabnik.id, { avatar })
  }
}
