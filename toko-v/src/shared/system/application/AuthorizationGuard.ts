import { ActorContext } from "../types/actor-context";
import { UserRole } from "@/modules/user/domain/UserRole";
import { ForbiddenError } from "@/shared/errors/ApplicationError";

export class AuthorizationGuard {
  static assertAuthorized(
    actor: ActorContext | undefined,
    allowed: UserRole[],
  ): ActorContext {
    if (!actor || !actor.actorId.trim()) {
      throw new ForbiddenError();
    }

    if (!allowed.includes(actor.role)) {
      throw new ForbiddenError();
    }

    return actor;
  }
}