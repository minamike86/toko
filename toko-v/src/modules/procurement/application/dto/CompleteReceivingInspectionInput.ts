import { ReceivingInspectionActor } from "./ReceivingInspectionActor";

export type CompleteReceivingInspectionInput = {
  receivingInspectionId: string;
  completedAt: Date;
  items: Array<{
    purchaseItemId: string;
    acceptedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
    notes: string | null;
  }>;
  actor: ReceivingInspectionActor;
};