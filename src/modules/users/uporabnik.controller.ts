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
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { HasPermission } from 'decorators/has-permission.decorator'
import { Uporabnik } from 'entities/uporabnik.entity'
import { isFIleExtensionSafe, removeFile, saveImageToStorage } from 'helpers/imageStorage'
import { PaginatedResult } from 'interfaces/paginated-result.interface'
import { join } from 'path'

import { CreateUporabnikDto } from './dto/create-uporabnik.dto'
import { UpdateUporabnikDto } from './dto/update-uporabnik.dto'
import { UporabnikService } from './uporabnik.service'

@ApiTags('Users')
@Controller('Users')
@UseInterceptors(ClassSerializerInterceptor)
export class UporabnikController {
  constructor(private readonly UporabnikService: UporabnikService) {}

  @ApiCreatedResponse({ description: 'List all Users.' })
  @ApiBadRequestResponse({ description: 'Error for list of Users.' })
  @Get()
  @HasPermission('Users')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('page') page: number): Promise<PaginatedResult<Uporabnik>> {
    return this.UporabnikService.paginate(page, ['role'])
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Uporabnik> {
    return this.UporabnikService.FindById(id)
  }

  @ApiCreatedResponse({ description: 'Creates new User.' })
  @ApiBadRequestResponse({ description: 'Error for creating a new User.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUporabnikDto): Promise<Uporabnik> {
    return this.UporabnikService.create(createUserDto)
  }

  @Post('upload/:id')
  @HttpCode(HttpStatus.CREATED)
  async upload(@UploadedFile() file: Express.Multer.File, @Param('id') id: string): Promise<Uporabnik> {
    const filename = file?.filename

    if (!filename) throw new BadRequestException('File must be a png, jpg/jpeg')

    const imagesFolderPath = join(process.cwd(), 'files')
    const fullImagePath = join(imagesFolderPath + '/' + file.filename)
    if (await isFIleExtensionSafe(fullImagePath)) {
      return this.UporabnikService.updateUserImageId(id, filename)
    }
    removeFile(fullImagePath)
    throw new BadRequestException('File content does not match extension!')
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUporabnikDto): Promise<Uporabnik> {
    return this.UporabnikService.update(id, updateUserDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<Uporabnik> {
    return this.UporabnikService.remove(id)
  }
}
