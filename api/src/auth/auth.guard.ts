import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  CanActivate,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  DISPATCHER = 'DISPATCHER',
  LOGISTICS_MANAGER = 'LOGISTICS_MANAGER',
}

export interface UserContext {
  id: string;
  name: string;
  role: UserRole;
}

export const USERS: Record<string, UserContext> = {
  diane: {
    id: 'diane',
    name: 'Diane',
    role: UserRole.DISPATCHER,
  },
  eric: {
    id: 'eric',
    name: 'Eric',
    role: UserRole.LOGISTICS_MANAGER,
  },
};

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export function resolveUserFromHeader(userIdHeader?: string | string[]): UserContext {
  const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
  const normalizedId = userId?.trim().toLowerCase();

  if (normalizedId) {
    const user = USERS[normalizedId];
    if (user) {
      return user;
    }
    throw new ForbiddenException(
      `Utilisateur "${normalizedId}" non reconnu.`,
    );
  }

  // Diane par défaut si l'en-tête est omis
  return USERS.diane;
}


export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    const userIdHeader = request.headers['x-user-id'];
    return resolveUserFromHeader(userIdHeader);
  },
);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = resolveUserFromHeader(request.headers['x-user-id']);

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Action réservée aux profils: ${requiredRoles.join(', ')}. Votre rôle actuel est ${user.role}.`,
      );
    }

    return true;
  }
}
