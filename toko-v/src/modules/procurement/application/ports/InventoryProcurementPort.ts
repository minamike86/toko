export type ProcurementInventoryMutationReason = "PROCUREMENT_RECEIVE";

export type ReceiveProcurementStockItem = {
  variantId: string;
  quantity: number;
  reason: ProcurementInventoryMutationReason;
  referenceId: string;
};

export type ReceiveProcurementStockInput = {
  items: ReceiveProcurementStockItem[];
};

export interface InventoryProcurementPort {
  receiveProcurementStock(input: ReceiveProcurementStockInput): Promise<void>;
}