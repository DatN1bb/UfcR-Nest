import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Borci } from 'entities/borci.entity '
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { Repository } from 'typeorm'

import { CreateUpdateBorciDto } from './dto/create-update-borci.dto'

@Injectable()
export class BorciService extends AbstractService<Borci> {
  constructor(@InjectRepository(Borci) private readonly BorciRepository: Repository<Borci>) {
    super(BorciRepository)
  }

  async create(createBorciDto: CreateUpdateBorciDto): Promise<Borci> {
    try {
      const borci = this.BorciRepository.create(createBorciDto)
      return this.BorciRepository.save(borci)
    } catch (error) {
      logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new permission.')
    }
  }

  async update(BorciId: string, updateBorciDto: CreateUpdateBorciDto): Promise<Borci> {
    const borci = (await this.FindById(BorciId)) as Borci
    try {
      borci.ime = updateBorciDto.ime
      borci.record = updateBorciDto.record
      borci.starost = updateBorciDto.starost
      borci.velikost = updateBorciDto.velikost
      borci.teza = updateBorciDto.teza
      borci.reach = updateBorciDto.reach
      return this.BorciRepository.save(borci)
    } catch (error) {
      logging.error(error)
      throw new InternalServerErrorException('Something went wrong while updating the fighter.')
    }
  }

  async updateBorciImage(id: string, image: string): Promise<Borci> {
    const borci = await this.FindById(id)
    return this.update(borci.id, { ...borci })
  }
}
