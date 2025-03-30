import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common'
import { Order } from 'entities/order.entity'
import { Response } from 'express'
import { PaginatedResult } from 'interfaces/paginated-result.interface'

import { OrdersService } from './orders.service'

@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('page') page: number): Promise<PaginatedResult<Order>> {
    return this.ordersService.paginate(page, ['order_items'])
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async export(@Res() response: Response): Promise<void> {
    return this.ordersService.export(response)
  }

  @Get('chart')
  async chart(): Promise<{ date: string; sum: string }[]> {
    return this.ordersService.chart()
  }
}
