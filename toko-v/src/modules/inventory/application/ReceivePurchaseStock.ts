import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { ActorContext } from "@/shared/system/types/actor-context";

import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";

export type ReceivePurchaseStockInput = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
  actor: ActorContext;
};

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class ReceivePurchaseStock {
  constructor(private readonly deps: Deps) { }

  async execute(requests: ReceivePurchaseStockInput[]): Promise<void> {
    for (const request of requests) {
      AuthorizationGuard.assertAuthorized(request.actor, ["ADMIN", "WAREHOUSE"]);

      const inventoryItem = await this.deps.inventoryRepo.findByVariantId(
        request.variantId,
      );

      if (!inventoryItem) {
        throw new NotFoundError("InventoryItem", request.variantId);
      }

      await this.deps.inventoryRepo.increaseByVariantId(
        request.variantId,
        request.quantity,
      );

      const movement = StockMovement.in({
        variantId: request.variantId,
        quantity: request.quantity,
        reason: request.reason,
        origin: "PURCHASE",
        referenceId: request.referenceId,
      });

      await this.deps.inventoryRepo.saveMovement(movement);
    }
  }
}