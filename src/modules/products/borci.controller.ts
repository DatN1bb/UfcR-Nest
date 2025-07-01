import {
  BadRequestException,
  Body,
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
import { Controller } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Borci } from 'entities/borci.entity '
import { isFIleExtensionSafe, removeFile, saveImageToStorage } from 'helpers/imageStorage'
import { PaginatedResult } from 'interfaces/paginated-result.interface'
import { join } from 'path'

import { CreateUpdateBorciDto } from './dto/create-update-borci.dto'
import { BorciService } from './borci.service'

@Controller('Borci')
export class BorciController {
  constructor(private readonly BorciService: BorciService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('page') page: number): Promise<PaginatedResult<Borci>> {
    return this.BorciService.paginate(page)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Borci> {
    return this.BorciService.FindById(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBorciDto: CreateUpdateBorciDto): Promise<Borci> {
    return this.BorciService.create(createBorciDto)
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', saveImageToStorage))
  @HttpCode(HttpStatus.CREATED)
  async upload(@UploadedFile() file: Express.Multer.File, @Param('id') BorciId: string): Promise<Borci> {
    const filename = file?.filename

    if (!filename) throw new BadRequestException('File must be a png, jpg/jpeg')

    const imagesFolderPath = join(process.cwd(), 'files')
    const fullImagePath = join(imagesFolderPath + '/' + file.filename)
    if (await isFIleExtensionSafe(fullImagePath)) {
      return this.BorciService.updateBorciImage(BorciId, filename)
    }
    removeFile(fullImagePath)
    throw new BadRequestException('File content does not match extension!')
  }

  @Patch(' :id ')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateBorciDto: CreateUpdateBorciDto): Promise<Borci> {
    return this.BorciService.update(id, updateBorciDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<Borci> {
    return this.BorciService.remove(id)
  }
}
