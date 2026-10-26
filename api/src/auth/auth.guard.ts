import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { forbidden, unauthorized } from '../common/api-error.js';

export enum UserRole {
  DISPATCHER = 'DISPATCHER',
  LOGISTICS_MANAGER = 'LOGISTICS_MANAGER',
}

export interface UserContext {
  id: string;
  name: string;
  role: UserRole;
}

/**
 * Demo identity mapping required by the assessment. Roles are resolved on the
 * server from the X-User-Id header only; a client can never supply its own role.
 * This is NOT authentication: any caller can claim either identity.
 */
export const USERS: Readonly<Record<string, UserContext>> = {
  diane: { id: 'diane', name: 'Diane', role: UserRole.DISPATCHER },
  eric: { id: 'eric', name: 'Eric', role: UserRole.LOGISTICS_MANAGER },
};

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

type RequestWithUser = Request & { user?: UserContext };

/**
 * Resolves the user from the raw header value.
 * Missing or unknown identities are rejected with 401 so that no request is
 * silently attributed to a default user.
 */
export function resolveUserFromHeader(userIdHeader?: string | string[]): UserContext {
  const rawId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
  const userId = rawId?.trim().toLowerCase();

  if (!userId) {
    throw unauthorized('USER_ID_MISSING', "L'en-tête X-User-Id est obligatoire (diane ou eric).");
  }

  const user = Object.hasOwn(USERS, userId) ? USERS[userId] : undefined;
  if (!user) {
    throw unauthorized('USER_UNKNOWN', `Utilisateur "${userId}" non reconnu.`, { userId });
  }

  return user;
}

/**
 * Resolves the current user for every request of the guarded controller and
 * enforces optional @Roles() metadata.
 */
@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = resolveUserFromHeader(request.headers['x-user-id']);
    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw forbidden(
        'ROLE_FORBIDDEN',
        `Action réservée au(x) rôle(s) ${requiredRoles.join(', ')}. Rôle actuel : ${user.role}.`,
        { requiredRoles, currentRole: user.role },
      );
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user ?? resolveUserFromHeader(request.headers['x-user-id']);
  },
);
