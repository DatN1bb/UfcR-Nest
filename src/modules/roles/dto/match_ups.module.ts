import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Match_ups } from 'entities/match_ups.entity'

import { Match_upsController } from './match_ups.controller'
import { Match_upsService } from './match_ups.service'

@Module({
  imports: [TypeOrmModule.forFeature([Match_ups])],
  controllers: [Match_upsController],
  providers: [Match_upsService],
  exports: [Match_upsService],
})
export class Match_upsModule {}
