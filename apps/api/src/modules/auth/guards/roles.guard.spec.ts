import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole, UserStatus, WorkshopRole } from '@prisma/client';
import { Roles } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user.type';
import { RolesGuard } from './roles.guard';

/**
 * Builds an authenticated user with the given workshop role.
 */
function buildUser(workshopRole: WorkshopRole): AuthUser {
  return {
    id: 'user-1',
    email: 'user@taller.test',
    name: 'Usuario',
    platformRole: PlatformRole.NONE,
    status: UserStatus.ACTIVE,
    workshopId: 'workshop-1',
    workshopRole,
    role: workshopRole,
  };
}

@Roles(WorkshopRole.OWNER)
class TestController {
  open() {}

  @Roles(WorkshopRole.OWNER, WorkshopRole.ADMIN)
  managers() {}
}

class UnrestrictedController {
  open() {}
}

/**
 * Builds a minimal HTTP execution context for the given handler name.
 */
function buildContext(
  controller: new () => object,
  handlerName: string,
  user?: AuthUser,
): ExecutionContext {
  const prototype = controller.prototype as Record<string, unknown>;

  return {
    getHandler: () => prototype[handlerName],
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows routes without @Roles metadata', () => {
    const context = buildContext(
      UnrestrictedController,
      'open',
      buildUser(WorkshopRole.OPERATOR),
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('applies controller-level roles when the method has none', () => {
    const owner = buildContext(
      TestController,
      'open',
      buildUser(WorkshopRole.OWNER),
    );
    const admin = buildContext(
      TestController,
      'open',
      buildUser(WorkshopRole.ADMIN),
    );

    expect(guard.canActivate(owner)).toBe(true);
    expect(() => guard.canActivate(admin)).toThrow(ForbiddenException);
  });

  it('lets method-level roles override controller-level roles', () => {
    const admin = buildContext(
      TestController,
      'managers',
      buildUser(WorkshopRole.ADMIN),
    );
    const operator = buildContext(
      TestController,
      'managers',
      buildUser(WorkshopRole.OPERATOR),
    );

    expect(guard.canActivate(admin)).toBe(true);
    expect(() => guard.canActivate(operator)).toThrow(ForbiddenException);
  });

  it('checks workshopRole and ignores the legacy role alias', () => {
    const user = {
      ...buildUser(WorkshopRole.OPERATOR),
      role: WorkshopRole.OWNER,
    };
    const context = buildContext(TestController, 'managers', user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies restricted routes when no user was attached', () => {
    const context = buildContext(TestController, 'managers');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
