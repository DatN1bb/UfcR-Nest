import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Uporabnik } from 'entities/user.entity'

import { UporabnikiController } from './users.controller'
import { UporabnikiService } from './users.service'

@Module({
  imports: [TypeOrmModule.forFeature([Uporabnik])],
  controllers: [UporabnikiController],
  providers: [UporabnikiService],
  exports: [UporabnikiService],
})
export class UporabnikiModule {}
