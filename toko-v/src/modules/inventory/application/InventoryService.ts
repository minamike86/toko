

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



export interface InventoryService {
  issueStock(requests: IssueStockRequest[]): Promise<void>;
  returnStock(requests: IssueStockRequest[]): Promise<void>;
}
