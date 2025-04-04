import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { HasPermission } from 'decorators/has-permission.decorator'
import { Uporabnik } from 'entities/user.entity'
import { isFIleExtensionSafe, removeFile, saveImageToStorage } from 'helpers/imageStorage'
import { PaginatedResult } from 'interfaces/paginated-result.interface'
import { join } from 'path'

import { CreateUporabnikDto } from './dto/create-user.dto'
import { UpdateUporabnikDto } from './dto/update-user.dto'
import { UporabnikiService } from './users.service'

@ApiTags('Uporabniki')
@Controller('Uporabniki')
@UseInterceptors(ClassSerializerInterceptor)
export class UporabnikiController {
  constructor(private readonly uporabnikiService: UporabnikiService) {}

  @ApiCreatedResponse({ description: 'List all uporabniki.' })
  @ApiBadRequestResponse({ description: 'Error for list of uporabniki.' })
  @Get()
  @HasPermission('uporabniki')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('page') page: number): Promise<PaginatedResult<Uporabnik>> {
    return this.uporabnikiService.paginate(page, ['role'])
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Uporabnik> {
    return this.uporabnikiService.FindById(id)
  }

  @ApiCreatedResponse({ description: 'Creates new Uporabnik.' })
  @ApiBadRequestResponse({ description: 'Error for creating a new Uporabnik.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUporabnikDto: CreateUporabnikDto): Promise<Uporabnik> {
    return this.uporabnikiService.create(createUporabnikDto)
  }

  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('avatar', saveImageToStorage))
  @HttpCode(HttpStatus.CREATED)
  async upload(@UploadedFile() file: Express.Multer.File, @Param('id') id: string): Promise<Uporabnik> {
    const filename = file?.filename

    if (!filename) throw new BadRequestException('File must be a png, jpg/jpeg')

    const imagesFolderPath = join(process.cwd(), 'files')
    const fullImagePath = join(imagesFolderPath + '/' + file.filename)
    if (await isFIleExtensionSafe(fullImagePath)) {
      return this.uporabnikiService.updateUporabnikImageId(id, filename)
    }
    removeFile(fullImagePath)
    throw new BadRequestException('File content does not match extension!')
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateUporabnikDto: UpdateUporabnikDto): Promise<Uporabnik> {
    return this.uporabnikiService.update(id, updateUporabnikDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<Uporabnik> {
    return this.uporabnikiService.remove(id)
  }
}
