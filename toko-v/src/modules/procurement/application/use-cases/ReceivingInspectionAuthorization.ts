import { ReceivingInspectionActor } from "../dto/ReceivingInspectionActor";
import { ForbiddenReceivingInspectionActionError } from "./ReceivingInspectionApplicationErrors";

export function assertReceivingInspectionActorAllowed(
  actor: ReceivingInspectionActor,
): void {
  if (actor.role !== "WAREHOUSE" && actor.role !== "ADMIN") {
    throw new ForbiddenReceivingInspectionActionError();
  }

  if (actor.actorId.trim() === "") {
    throw new ForbiddenReceivingInspectionActionError();
  }
}