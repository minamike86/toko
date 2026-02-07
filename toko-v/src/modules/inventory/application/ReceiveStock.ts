import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";

export type ReceiveStockRequest = {
  productId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};

export class ReceiveStock {
  constructor(
    private readonly inventoryRepo: InventoryRepository
  ) {}

  async execute(requests: ReceiveStockRequest[]): Promise<void> {
    for (const req of requests) {
      await this.inventoryRepo.increase(req.productId, req.quantity);

      const movement = StockMovement.in(
        req.productId,
        req.quantity,
        req.reason,
        req.referenceId
      );

      await this.inventoryRepo.saveMovement(movement);
    }
  }
}
