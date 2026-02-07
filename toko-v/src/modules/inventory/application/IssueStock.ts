import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";
import { InsufficientStockError } from "./InventoryService";

export type IssueStockRequest = {
  productId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};

export class IssueStock {
  constructor(
    private readonly inventoryRepo: InventoryRepository
  ) {}

  async execute(requests: IssueStockRequest[]): Promise<void> {
    for (const req of requests) {
      const item = await this.inventoryRepo.find(req.productId);

if (!item || !item.canFulfill(req.quantity)) {
  throw new InsufficientStockError(req.productId);
}


      await this.inventoryRepo.decrease(req.productId, req.quantity);

      const movement = StockMovement.out(
        req.productId,
        req.quantity,
        req.reason,
        req.referenceId
      );

      await this.inventoryRepo.saveMovement(movement);
    }
  }
}
