import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Permission } from 'entities/permission.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
