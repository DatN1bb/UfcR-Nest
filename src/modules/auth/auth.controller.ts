import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { Public } from 'decorators/public.decorator'
import { Uporabnik } from 'entities/uporabnik.entity'
import { Request, Response } from 'express'
import { RequestWithUporabnik } from 'interfaces/auth.interface'

import { AuthService } from './auth.service'
import { RegisterUporabnikDto } from './dto/reigster-uporabnik.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUporabnikDto): Promise<Uporabnik> {
    return this.authService.register(body)
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: RequestWithUporabnik, @Res({ passthrough: true }) res: Response): Promise<Uporabnik> {
    console.log('uporabnik login', req.user)
    const access_token = await this.authService.generateJwt(req.user as Uporabnik)
    res.cookie('access_token', access_token, { httpOnly: true })
    return req.uporabnik
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async Uporabnik(@Req() req: Request): Promise<Uporabnik> {
    const cookie = req.cookies['access_token']
    return this.authService.Uporabnik(cookie)
  }
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signout(@Res({ passthrough: true }) res: Response): Promise<{ msg: string }> {
    res.clearCookie('access_token')
    return { msg: 'ok' }
  }
}
