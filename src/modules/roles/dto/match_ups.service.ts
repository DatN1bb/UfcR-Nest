import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Match_ups } from 'entities/match_ups.entity'
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { Repository } from 'typeorm'
import { CreateUpdateMatch_upsDto } from './create-update-match_ups.dto'

@Injectable()
export class Match_upsService extends AbstractService<Match_ups> {
  create: any
  constructor(@InjectRepository(Match_ups) private readonly Match_upsRepository: Repository<Match_ups>) {
    super(Match_upsRepository)
  }

  async update(
    Match_upsId: string,
    updateMatch_upsDto: CreateUpdateMatch_upsDto,
    permissionsIds: { id: string }[],
  ): Promise<Match_ups> {
    const Match_ups = (await this.FindById(Match_upsId)) as Match_ups
    try {
      Match_ups.borec1 = updateMatch_upsDto.borec1
      Match_ups.borec2 = updateMatch_upsDto.borec2
      Match_ups.winning_odds = updateMatch_upsDto.winning_odds
      return this.Match_upsRepository.save(Match_ups)
    } catch (error) {
      logging.error(error)
      throw new InternalServerErrorException('Something went wrong while updating the role.')
    }
  }
}
