export type RegisterGoodsArrivalResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "ARRIVED";
  arrivedAt: Date;
  arrivedBy: string;
};