export type FinalizeInspectionAcceptanceResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  purchaseOrderStatus: "RECEIVED";
  acceptedItems: Array<{
    purchaseItemId: string;
    variantId: string;
    acceptedQuantity: number;
  }>;
  finalizedAt: Date;
  finalizedBy: string;
};