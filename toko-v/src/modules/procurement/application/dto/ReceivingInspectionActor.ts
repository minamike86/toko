export type ReceivingInspectionActorRole = "WAREHOUSE" | "ADMIN";

export type ReceivingInspectionActor = {
  actorId: string;
  role: ReceivingInspectionActorRole;
};