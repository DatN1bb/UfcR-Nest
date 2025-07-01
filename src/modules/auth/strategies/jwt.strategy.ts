import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Uporabnik } from 'entities/uporabnik.entity'
import { Request } from 'express'
import { TokenPayload } from 'interfaces/auth.interface'
import { UporabnikService } from 'modules/users/uporabnik.service'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private UporabnikService: UporabnikService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    })
  }
  async validate(payload: TokenPayload): Promise<Uporabnik> {
    return this.UporabnikService.FindById(payload.sub)
  }
}
