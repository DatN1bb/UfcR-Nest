import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from 'entities/role.entity'
import { User } from 'entities/user.entity'
import { AuthService } from 'modules/auth/auth.service'
import { RolesService } from 'modules/roles/roles.service'
import { UsersService } from 'modules/users/users.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private UsersService: UsersService,
    private rolesService: RolesService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.get('access', context.getHandler())
    if (!access) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const Usersd = await this.authService.getUsersd(request)
    const User: User = await this.UsersService.FindById(Usersd, ['role'])
    const role: Role = await this.rolesService.FindById(User.role.id, ['permissions'])
    if (request.method === 'GET') {
      return role.permissions.some((p) => p.name === `view_${access}` || p.name === `edit_${access}`)
    }
    return role.permissions.some((p) => p.name === `edit_${access}`)
  }
}
