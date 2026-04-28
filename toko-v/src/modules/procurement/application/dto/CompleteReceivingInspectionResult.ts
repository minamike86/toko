export type CompleteReceivingInspectionResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "COMPLETED";
  completedAt: Date;
  completedBy: string;
  items: Array<{
    purchaseItemId: string;
    expectedQuantity: number;
    acceptedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
  }>;
};