import type { ActorContext } from "./Step7DTO";
import { Step7BusinessError } from "../../domain/payable/Step7Errors";

export interface Step7AuthorizationGuard {
  requireAdmin(actor: ActorContext): void;
}

export class DefaultStep7AuthorizationGuard implements Step7AuthorizationGuard {
  requireAdmin(actor: ActorContext): void {
    if (actor.role !== "ADMIN") {
      throw new Step7BusinessError(
        "FORBIDDEN",
        "Only admin can execute supplier payable use case.",
      );
    }
  }
}