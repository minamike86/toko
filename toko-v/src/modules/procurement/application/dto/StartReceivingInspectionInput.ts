import { ReceivingInspectionActor } from "./ReceivingInspectionActor";

export type StartReceivingInspectionInput = {
  receivingInspectionId: string;
  startedAt: Date;
  actor: ReceivingInspectionActor;
};