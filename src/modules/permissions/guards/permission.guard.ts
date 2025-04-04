import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from 'entities/role.entity'
import { Uporabnik } from 'entities/user.entity'
import { AuthService } from 'modules/auth/auth.service'
import { RolesService } from 'modules/roles/roles.service'
import { UporabnikiService } from 'modules/users/users.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private uporabnikiService: UporabnikiService,
    private rolesService: RolesService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.get('access', context.getHandler())
    if (!access) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const uporabnikId = await this.authService.getUporabnikId(request)
    const uporabnik: Uporabnik = await this.uporabnikiService.FindById(uporabnikId, ['role'])
    const role: Role = await this.rolesService.FindById(uporabnik.role.id, ['permissions'])
    if (request.method === 'GET') {
      return role.permissions.some((p) => p.name === `view_${access}` || p.name === `edit_${access}`)
    }
    return role.permissions.some((p) => p.name === `edit_${access}`)
  }
}
