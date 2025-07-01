import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Uporabnik } from 'entities/uporabnik.entity'

import { UporabnikController } from './uporabnik.controller'
import { UporabnikService } from './uporabnik.service'

@Module({
  imports: [TypeOrmModule.forFeature([Uporabnik])],
  controllers: [UporabnikController],
  providers: [UporabnikService],
  exports: [UporabnikService],
})
export class UporabnikModule {}
