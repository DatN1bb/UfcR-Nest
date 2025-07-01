import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { Match_ups } from 'entities/match_ups.entity'
import { PaginatedResult } from 'interfaces/paginated-result.interface'

import { Match_upsService } from './match_ups.service'
import { CreateUpdateMatch_upsDto } from './create-update-match_ups.dto'

@Controller('Match_ups')
export class Match_upsController {
  constructor(private Match_upsService: Match_upsService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Match_ups[]> {
    return this.Match_upsService.FindAll(['permissions'])
  }

  @Get('/paginated')
  @HttpCode(HttpStatus.OK)
  async paginated(@Query('page') page: number): Promise<PaginatedResult<Match_ups>> {
    return this.Match_upsService.paginate(page, ['permissions'])
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Match_ups> {
    return this.Match_upsService.FindById(id, ['permissions'])
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMatch_upsDto: CreateUpdateMatch_upsDto,
    @Body('permissions') permissionsIds: string[],
  ): Promise<Match_ups> {
    /*
            [1,2]
            [{id: 1}, {id: 2}]
            */
    return this.Match_upsService.create(
      createMatch_upsDto,
      permissionsIds.map((id) => ({
        id,
      })),
    )
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateMatch_upsDto: CreateUpdateMatch_upsDto,
    @Body('permissions') permissionsIds: string[],
  ): Promise<Match_ups> {
    return this.Match_upsService.update(
      id,
      updateMatch_upsDto,
      permissionsIds.map((id) => ({
        id,
      })),
    )
  }
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<Match_ups> {
    return this.Match_upsService.remove(id)
  }
}
