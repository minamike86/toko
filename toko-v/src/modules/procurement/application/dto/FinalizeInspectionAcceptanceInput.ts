import { ReceivingInspectionActor } from "./ReceivingInspectionActor";

export type FinalizeInspectionAcceptanceInput = {
  receivingInspectionId: string;
  finalizedAt: Date;
  actor: ReceivingInspectionActor;
};