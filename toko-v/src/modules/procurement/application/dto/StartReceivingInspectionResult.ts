export type StartReceivingInspectionResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "UNDER_INSPECTION";
  startedAt: Date;
  startedBy: string;
};