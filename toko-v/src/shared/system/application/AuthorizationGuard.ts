// src/shared/system/application/AuthorizationGuard.ts

import { ActorContext } from "../types/actor-context";
import { UserRole } from "@/modules/user/domain/UserRole";
import { ForbiddenError } from "@/shared/errors/ApplicationError";

export class AuthorizationGuard {
  static assertActorExists(actor?: ActorContext) {
    if (!actor || !actor.actorId) {
      throw new ForbiddenError();
    }
  }

  static assertRole(actor: ActorContext, allowed: UserRole[]) {
    if (!allowed.includes(actor.role)) {
      throw new ForbiddenError();
    }
  }
}