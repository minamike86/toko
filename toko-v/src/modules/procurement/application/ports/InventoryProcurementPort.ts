export type ReceiveProcurementStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
};

export interface InventoryProcurementPort {
  receivePurchaseStock(
    requests: ReceiveProcurementStockRequest[],
  ): Promise<void>;
}