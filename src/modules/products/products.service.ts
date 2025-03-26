import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Permission } from 'entities/permission.entity'
import { Product } from 'entities/product.entity '
import { Role } from 'entities/role.entity'
import logging from 'library/Logging'
import { AbstractService } from 'modules/common/abstract.service'
import { CreateUpdateRoleDto } from 'modules/roles/dto/create-update-role.dto'
import { Repository } from 'typeorm'
import { CreateUpdateProductDto } from './dto/create-update-product.dto'

@Injectable()
export class ProductsService extends AbstractService {
  constructor(@InjectRepository(Product) private readonly productsRepository: Repository<Product>) {
    super(productsRepository)
  }

  async create(createProductDto: CreateUpdateProductDto): Promise<Product> {
    try {
      const product = this.productsRepository.create(createProductDto)
      return this.productsRepository.save(product)
    } catch (error) {
      logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new permission.')
    }
  }

  async update(productId: string, updateProductDto: CreateUpdateProductDto): Promise<Product> {
    const product = (await this.FindById(productId)) as Product
    try {
      product.title = updateProductDto.title
      product.description = updateProductDto.description
      product.price = updateProductDto.price
      product.image = updateProductDto.image
      return this.productsRepository.save(product)
    } catch (error) {
      logging.error(error)
      throw new InternalServerErrorException('Something went wrong while updating the product.')
    }
  }

  async updateProductImage(id: string, image: string): Promise<Product> {
    const product = await this.FindById(id)
    return this.update(product.id, { ...product, image })
  }
}
