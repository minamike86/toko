export type IssueStockRequest = {
  productId: string;
  quantity: number; // positif
  reason: string;   // misal "SALE_ORDER"
  referenceId: string; // orderId untuk audit
};

export class InsufficientStockError extends Error {
  constructor(productId: string) {
    super(`Stok tidak mencukupi untuk product ${productId}.`);
    this.name = "InsufficientStockError";
  }
}

export interface InventoryService {
  issueStock(requests: IssueStockRequest[]): Promise<void>;
  returnStock(requests: IssueStockRequest[]): Promise<void>;
}
