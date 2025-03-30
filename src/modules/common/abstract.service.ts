import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { PaginatedResult } from 'interfaces/paginated-result.interface'
import Logging from 'library/Logging'
import { FindOptionsWhere, Repository } from 'typeorm'

@Injectable()
export abstract class AbstractService<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async FindAll(relations: string[] = []): Promise<T[]> {
    try {
      return await this.repository.find({ relations })
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while retrieving the list of elements.')
    }
  }

  async FindBy(condition: Partial<T>, relations: string[] = []): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where: condition as FindOptionsWhere<T>,
        relations,
      })
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException(
        `Something went wrong while searching for an element with condition: ${JSON.stringify(condition)}`,
      )
    }
  }

  async FindById(id: string, relations: string[] = []): Promise<T> {
    try {
      const element = await this.repository.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
        relations,
      })
      if (!element) {
        throw new BadRequestException(`Cannot find element with id: ${id}`)
      }
      return element
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException(`Something went wrong while searching for an element with id: ${id}.`)
    }
  }

  async remove(id: string): Promise<T> {
    const element = await this.FindById(id)
    try {
      return await this.repository.remove(element)
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while deleting an element.')
    }
  }

  async paginate(page = 1, relations: string[] = []): Promise<PaginatedResult<T>> {
    const take = 10

    // Validate page number
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than or equal to 1.')
    }

    try {
      const [data, total] = await this.repository.findAndCount({
        take,
        skip: (page - 1) * take,
        relations,
      })

      return {
        data,
        meta: {
          total,
          page,
          last_page: Math.ceil(total / take),
        },
      }
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while retrieving paginated elements.')
    }
  }
}
