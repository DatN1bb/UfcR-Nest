import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { User } from 'entities/user.entity'
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
    private readonly UsersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    Logging.info('Validating User...')
    const user = await this.UsersService.FindBy({ email })
    if (!User) {
      throw new BadRequestException('Invalid credentials')
    }
    if (!(await compareHash(password, user.password))) {
      throw new BadRequestException('Invalid credentials')
    }

    Logging.info('Useris valid.')
    return user
  }

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const hashedPassword = await hash(registerUserDto.password)
    try {
      const user = await this.UsersService.create({
        role_id: null,
        ...registerUserDto,
        password: hashedPassword,
      })
      return user
    } catch (error: unknown) {
      Logging.error(error as string | object)
      if (error instanceof Error && 'code' in error && error.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('Userwith that email already exists.')
      }
      throw new InternalServerErrorException('Something went wrong while registering the User.')
    }
  }

  async generateJwt(User: User): Promise<string> {
    return this.jwtService.signAsync({ sub: User.id, name: User.email })
  }

  async User(cookie: string): Promise<User> {
    try {
      const data = await this.jwtService.verifyAsync(cookie)
      return this.UsersService.FindById(data['id'])
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }

  async login(UserFromRequest: User, res: Response): Promise<void> {
    const user = await this.UsersService.FindById(UserFromRequest.id, ['role']) // Remove 'password'
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

  async signout(Usersd: string, res: Response): Promise<void> {
    const user = await this.UsersService.FindById(Usersd)
    await this.UsersService.update(user.id, { refresh_token: null })
    try {
      res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async refreshTokens(req: Request): Promise<User> {
    const user = await this.UsersService.FindBy({ refresh_token: req.cookies.refresh_token }, ['role'])
    if (!User) {
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

  async updateRtHash(Usersd: string, rt: string): Promise<void> {
    try {
      await this.UsersService.update(Usersd, { refresh_token: rt })
    } catch (error: unknown) {
      Logging.error(error as string | object)
      throw new InternalServerErrorException('Something went wrong while updating userrefresh token.')
    }
  }

  async getUsersfRefreshTokenMatches(refreshToken: string, Usersd: string): Promise<UserData | null> {
    const user = await this.UsersService.FindById(Usersd)
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

  async generateToken(Usersd: string, email: string, type: JwtType): Promise<string> {
    try {
      const payload: TokenPayload = { sub: Usersd, name: email, type }
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

  async getUsersd(request: Request): Promise<string> {
    const user = request.user as User
    return user.id
  }
}
