import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Uporabnik } from 'entities/user.entity'
import { Request, Response } from 'express'
import { PostgresErrorCode } from 'helpers/postgresErrorCode.enum'
import { CookieType, JwtType, TokenPayload } from 'interfaces/auth.interface'
import { UporabnikData } from 'interfaces/user.interface'
import Logging from 'library/Logging'
import { UporabnikiService } from 'modules/users/users.service'
import { compareHash, hash } from 'utils/bcrypt'

import { RegisterUporabnikDto } from './dto/reigster-user.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly uporabnikiService: UporabnikiService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUporabnik(email: string, password: string): Promise<Uporabnik> {
    Logging.info('Validating uporabnik...')
    const uporabnik = await this.uporabnikiService.FindBy({ email })
    if (!uporabnik) {
      throw new BadRequestException('Invalid credentials')
    }
    if (!(await compareHash(password, uporabnik.password))) {
      throw new BadRequestException('Invalid credentials')
    }

    Logging.info('Uporabnik is valid.')
    return uporabnik
  }

  async register(registerUporabnikDto: RegisterUporabnikDto): Promise<Uporabnik> {
    const hashedPassword = await hash(registerUporabnikDto.password)
    try {
      const uporabnik = await this.uporabnikiService.create({
        role_id: null,
        ...registerUporabnikDto,
        password: hashedPassword,
      })
      return uporabnik
    } catch (error: unknown) {
      Logging.error(error as string | object)
      if (error instanceof Error && 'code' in error && error.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('Uporabnik with that email already exists.')
      }
      throw new InternalServerErrorException('Something went wrong while registering the uporabnik.')
    }
  }

  async generateJwt(uporabnik: Uporabnik): Promise<string> {
    return this.jwtService.signAsync({ sub: uporabnik.id, name: uporabnik.email })
  }

  async uporabnik(cookie: string): Promise<Uporabnik> {
    try {
      const data = await this.jwtService.verifyAsync(cookie)
      return this.uporabnikiService.FindById(data['id'])
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }

  async login(uporabnikFromRequest: Uporabnik, res: Response): Promise<void> {
    const uporabnik = await this.uporabnikiService.FindById(uporabnikFromRequest.id, ['role']) // Remove 'password'
    const accessToken = await this.generateToken(uporabnik.id, uporabnik.email, JwtType.ACCESS_TOKEN)
    const accessTokenCookie = await this.generateCookie(accessToken, CookieType.ACCESS_TOKEN)
    const refreshToken = await this.generateToken(uporabnik.id, uporabnik.email, JwtType.REFRESH_TOKEN)
    const refreshTokenCookie = await this.generateCookie(refreshToken, CookieType.REFRESH_TOKEN)
    try {
      await this.updateRtHash(uporabnik.id, refreshToken)
      res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]).json({ ...uporabnik })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async signout(uporabnikId: string, res: Response): Promise<void> {
    const uporabnik = await this.uporabnikiService.FindById(uporabnikId)
    await this.uporabnikiService.update(uporabnik.id, { refresh_token: null })
    try {
      res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async refreshTokens(req: Request): Promise<Uporabnik> {
    const uporabnik = await this.uporabnikiService.FindBy({ refresh_token: req.cookies.refresh_token }, ['role'])
    if (!uporabnik) {
      throw new ForbiddenException('Invalid refresh token.')
    }
    try {
      await this.jwtService.verifyAsync(uporabnik.refresh_token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    const token = await this.generateToken(uporabnik.id, uporabnik.email, JwtType.ACCESS_TOKEN)
    const cookie = await this.generateCookie(token, CookieType.ACCESS_TOKEN)

    try {
      req.res.setHeader('Set-Cookie', cookie)
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
    return uporabnik
  }

  async updateRtHash(uporabnikId: string, rt: string): Promise<void> {
    try {
      await this.uporabnikiService.update(uporabnikId, { refresh_token: rt })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while updating uporabnik refresh token.')
    }
  }

  async getUporabnikIfRefreshTokenMatches(refreshToken: string, uporabnikId: string): Promise<UporabnikData | null> {
    const uporabnik = await this.uporabnikiService.FindById(uporabnikId)
    const isRefreshTokenMatching = await compareHash(refreshToken, uporabnik.refresh_token)
    if (isRefreshTokenMatching) {
      return {
        id: uporabnik.id,
        username: uporabnik.username,
        email: uporabnik.email,
      }
    }
    return null
  }

  async generateToken(uporabnikId: string, email: string, type: JwtType): Promise<string> {
    try {
      const payload: TokenPayload = { sub: uporabnikId, name: email, type }
      let token: string
      switch (type) {
        case JwtType.ACCESS_TOKEN:
          token = await this.jwtService.signAsync(payload)
          break
        case JwtType.REFRESH_TOKEN:
          token = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: `${this.configService.get('JWT_REFRESH_SECRET_EXPIRES')}s`,
          })
          break
        default:
          throw new BadRequestException('Invalid token type.')
      }
      return token
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while generating a new token.')
    }
  }

  async generateCookie(token: string, type: CookieType): Promise<string> {
    try {
      let cookie: string
      switch (type) {
        case CookieType.ACCESS_TOKEN:
          cookie = `access_token=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
            'JWT_SECRET_EXPIRES',
          )}; SameSite=strict`
          break
        case CookieType.REFRESH_TOKEN:
          cookie = `refresh_token=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
            'JWT_REFRESH_SECRET_EXPIRES',
          )}; SameSite=strict`
          break
        default:
          throw new BadRequestException('Invalid cookie type.')
      }
      return cookie
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while generating a new cookie.')
    }
  }

  getCookiesForSignOut(): string[] {
    return ['access_token=; HttpOnly; Path=/; Max-Age=0', 'refresh_token=; HttpOnly; Path=/; Max-Age=0']
  }

  async getUporabnikId(request: Request): Promise<string> {
    const uporabnik = request.user as Uporabnik
    return uporabnik.id
  }
}
