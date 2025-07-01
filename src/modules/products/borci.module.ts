import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Borci } from 'entities/borci.entity '

import { BorciController } from './borci.controller'
import { BorciService } from './borci.service'

@Module({
  imports: [TypeOrmModule.forFeature([Borci])],
  controllers: [BorciController],
  providers: [BorciService],
})
export class BorciModule {}
