import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserData } from 'interfaces/user.interface'
import { PostgresErrorCode } from 'helpers/postgresErrorCode.enum'
import { CookieType, JwtType, TokenPayload } from 'interfaces/auth.interface'
import Logging from 'library/Logging'
import { UsersService } from 'modules/users/users.service'
import { compareHash, hash } from 'utils/bcrypt'
import { RegisterUserDto } from './dto/reigster-user.dto'
import { User } from 'entities/user.entity'
import { Request, Response } from 'express'

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<User> {
    Logging.info('Validating user...')
    const user = await this.usersService.FindBy({ email: email })
    if (!user) {
      throw new BadRequestException('Invalid credentials')
    }
    if (!(await compareHash(password, user.password))) {
      throw new BadRequestException('Invalid credentials')
    }

    Logging.info('User is valid.')
    return user
  }

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const hashedPassword = await hash(registerUserDto.password)
    const user = await this.usersService.create({
      role_id: null,
      ...registerUserDto,
      password: hashedPassword,
    })
    return user
  }

  async generateJwt(user: User): Promise<string> {
    return this.jwtService.signAsync({ sub: user.id, name: user.email })
  }

  async user(cookie: string): Promise<User> {
    const data = await this.jwtService.verifyAsync(cookie)
    return this.usersService.FindById(data['id'])
  }

  async getUserId(request: Request): Promise<string> {
    const user = request.user as User
    return user.id
  }
  async login(userFromRequest: User, res: Response): Promise<void> {
    const { password, ...user } = await this.usersService.FindById(userFromRequest.id, ['role'])
    const accessToken = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN)
    const accessTokenCookie = await this.generateCookie(accessToken, CookieType.ACCESS_TOKEN)
    const refreshToken = await this.generateToken(user.id, user.email, JwtType.REFRESH_TOKEN)
    const refreshTokenCookie = await this.generateCookie(refreshToken, CookieType.REFRESH_TOKEN)
    try {
      await this.updateRtHash(user.id, refreshToken)
      res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]).json({ ...user })
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async signout(userId: string, res: Response): Promise<void> {
    const user = await this.usersService.FindById(userId)
    await this.usersService.update(user.id, { refresh_token: null })
    try {
      res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
    }
  }

  async refreshTokens(req: Request): Promise<User> {
    const user = await this.usersService.FindBy({ refresh_token: req.cookies.refresh_token }, ['role'])
    if (!user) {
      throw new ForbiddenException()
    }
    try {
      await this.jwtService.verifyAsync(user.refresh_token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      })
    } catch (error) {
      Logging.error(error)
      throw new UnauthorizedException('Something went wrong while refreshing tokens.')
    }

    const token = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN)
    const cookie = await this.generateCookie(token, CookieType.ACCESS_TOKEN)
  }
}
