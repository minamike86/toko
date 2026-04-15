import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";

import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";
import { ReceiveStockRequest } from "./InventoryService";

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class ReceiveStock {
  constructor(private readonly deps: Deps) { }

  async execute(
    requests: ReceiveStockRequest[],
    actor: ActorContext,
  ): Promise<void> {
    AuthorizationGuard.assertAuthorized(actor, ["ADMIN", "WAREHOUSE"]);

    for (const req of requests) {
      const item = await this.deps.inventoryRepo.findByVariantId(req.variantId);

      if (!item) {
        throw new Error(`Inventory item tidak ditemukan: ${req.variantId}`);
      }

      await this.deps.inventoryRepo.increaseByVariantId(
        req.variantId,
        req.quantity,
      );

      const movement = StockMovement.in({
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