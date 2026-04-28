import { ValidationError } from "@/shared/errors/ApplicationError";
import type { ActorContext } from "@/shared/system/types/actor-context";
import { UserRole } from "@/modules/user/domain/UserRole";

type ActorPayload = {
  actorId?: unknown;
  role?: unknown;
};

export function parseActorContext(payload: unknown): ActorContext {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Actor context is required.");
  }

  const { actorId, role } = payload as ActorPayload;

  if (typeof actorId !== "string" || actorId.trim() === "") {
    throw new ValidationError("Actor ID is required.");
  }

  if (
    role !== UserRole.ADMIN &&
    role !== UserRole.SALES &&
    role !== UserRole.WAREHOUSE
  ) {
    throw new ValidationError("Actor role is invalid.");
  }

  return {
    actorId,
    role,
  };
}