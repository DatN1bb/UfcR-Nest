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
import { UserData } from 'interfaces/user.interface'
import Logging from 'library/Logging'
import { UsersService } from 'modules/users/users.service'
import { compareHash, hash } from 'utils/bcrypt'

import { RegisterUserDto } from './dto/reigster-user.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<Uporabnik> {
    Logging.info('Validating user...')
    const user = await this.usersService.FindBy({ email })
    if (!user) {
      throw new BadRequestException('Invalid credentials')
    }
    if (!(await compareHash(password, user.password))) {
      throw new BadRequestException('Invalid credentials')
    }

    Logging.info('User is valid.')
    return user
  }

  async register(registerUserDto: RegisterUserDto): Promise<Uporabnik> {
    const hashedPassword = await hash(registerUserDto.password)
    try {
      const user = await this.usersService.create({
        role_id: null,
        ...registerUserDto,
        password: hashedPassword,
      })
      return user
    } catch (error: unknown) {
      Logging.error(error as string | object)
      if (error instanceof Error && 'code' in error && error.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('User with that email already exists.')
      }
      throw new InternalServerErrorException('Something went wrong while registering the user.')
    }
  }

  async generateJwt(user: Uporabnik): Promise<string> {
    return this.jwtService.signAsync({ sub: user.id, name: user.email })
  }

  async user(cookie: string): Promise<Uporabnik> {
    try {
      const data = await this.jwtService.verifyAsync(cookie)
      return this.usersService.FindById(data['id'])
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }

  async login(userFromRequest: Uporabnik, res: Response): Promise<void> {
    const user = await this.usersService.FindById(userFromRequest.id, ['role']) // Remove 'password'
    const accessToken = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN)
    const accessTokenCookie = await this.generateCookie(accessToken, CookieType.ACCESS_TOKEN)
    const refreshToken = await this.generateToken(user.id, user.email, JwtType.REFRESH_TOKEN)
    const refreshTokenCookie = await this.generateCookie(refreshToken, CookieType.REFRESH_TOKEN)
    try {
      await this.updateRtHash(user.id, refreshToken)
      res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]).json({ ...user })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async signout(userId: string, res: Response): Promise<void> {
    const user = await this.usersService.FindById(userId)
    await this.usersService.update(user.id, { refresh_token: null })
    try {
      res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async refreshTokens(req: Request): Promise<Uporabnik> {
    const user = await this.usersService.FindBy({ refresh_token: req.cookies.refresh_token }, ['role'])
    if (!user) {
      throw new ForbiddenException('Invalid refresh token.')
    }
    try {
      await this.jwtService.verifyAsync(user.refresh_token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    const token = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN)
    const cookie = await this.generateCookie(token, CookieType.ACCESS_TOKEN)

    try {
      req.res.setHeader('Set-Cookie', cookie)
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
    return user
  }

  async updateRtHash(userId: string, rt: string): Promise<void> {
    try {
      await this.usersService.update(userId, { refresh_token: rt })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while updating user refresh token.')
    }
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string): Promise<UserData | null> {
    const user = await this.usersService.FindById(userId)
    const isRefreshTokenMatching = await compareHash(refreshToken, user.refresh_token)
    if (isRefreshTokenMatching) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    }
    return null
  }

  async generateToken(userId: string, email: string, type: JwtType): Promise<string> {
    try {
      const payload: TokenPayload = { sub: userId, name: email, type }
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

  async getUserId(request: Request): Promise<string> {
    const user = request.user as Uporabnik
    return user.id
  }
}
