import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Uporabnik } from 'entities/uporabnik.entity'
import { Strategy } from 'passport-local'

import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    })
  }
  async validate(email: string, password: string): Promise<Uporabnik> {
    return this.authService.validateUporabnik(email, password)
  }
}
