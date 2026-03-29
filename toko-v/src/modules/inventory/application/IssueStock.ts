import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";
import { InsufficientStockError, IssueStockRequest } from "./InventoryService";

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class IssueStock {
  constructor(private readonly deps: Deps) { }

  async execute(requests: IssueStockRequest[]): Promise<void> {
    for (const req of requests) {
      const item = await this.deps.inventoryRepo.findByVariantId(req.variantId);

      if (!item || !item.canFulfill(req.quantity)) {
        throw new InsufficientStockError(req.variantId);
      }

      await this.deps.inventoryRepo.decreaseByVariantId(
        req.variantId,
        req.quantity,
      );

      const movement = StockMovement.out({
        variantId: req.variantId,
        quantity: req.quantity,
        reason: req.reason,
        origin: "LEGACY",
        referenceId: req.referenceId,
      });

      await this.deps.inventoryRepo.saveMovement(movement);
    }
  }
}