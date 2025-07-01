import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Uporabnik } from 'entities/uporabnik.entity'
import { AuthService } from 'modules/auth/auth.service'
import { UporabnikService } from 'modules/users/uporabnik.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private UporabnikService: UporabnikService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.get('access', context.getHandler())
    if (!access) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const Uporabnikid = await this.authService.getUporabnikid(request)
    const Uporabnik: Uporabnik = await this.UporabnikService.FindById(Uporabnikid, ['role'])
  }
}
