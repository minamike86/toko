import { ReceivingInspectionActor } from "./ReceivingInspectionActor";

export type RegisterGoodsArrivalInput = {
  purchaseOrderId: string;
  arrivedAt: Date;
  notes: string | null;
  actor: ReceivingInspectionActor;
};