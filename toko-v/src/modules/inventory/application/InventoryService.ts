export type IssueStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
};

export type ReceiveStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};

export class InsufficientStockError extends Error {
  constructor(variantId: string) {
    super(`Stok tidak mencukupi untuk variant ${variantId}.`);
    this.name = "InsufficientStockError";
  }
}

export interface InventoryService {
  issueStock(requests: IssueStockRequest[]): Promise<void>;
  returnStock(requests: IssueStockRequest[]): Promise<void>;
}
