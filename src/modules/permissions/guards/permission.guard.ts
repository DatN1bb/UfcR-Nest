import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { User } from 'entities/user.entity'
import { AuthService } from 'modules/auth/auth.service'
import { UsersService } from 'modules/users/users.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService, private UsersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.get('access', context.getHandler())
    if (!access) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const Usersd = await this.authService.getUsersd(request)
    const User: User = await this.UsersService.FindById(Usersd, ['role'])
  }
}
