export interface InspectionFlowPolicy {
  isEnabledForPurchaseOrder(purchaseOrderId: string): Promise<boolean>;
}