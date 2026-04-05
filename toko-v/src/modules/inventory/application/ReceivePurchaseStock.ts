import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";
import { NotFoundError } from "@/shared/errors/ApplicationError";

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
  constructor(private readonly deps: Deps) {}

  async execute(requests: ReceivePurchaseStockInput[]): Promise<void> {
    for (const req of requests) {
      AuthorizationGuard.assertActorExists(req.actor);
      AuthorizationGuard.assertRole(req.actor, ["ADMIN", "WAREHOUSE"]);

      const item = await this.deps.inventoryRepo.findByVariantId(req.variantId);

      if (!item) {
        throw new NotFoundError("InventoryItem", req.variantId);
      }

      await this.deps.inventoryRepo.increaseByVariantId(
        req.variantId,
        req.quantity,
      );

      const movement = StockMovement.in({
        variantId: req.variantId,
        quantity: req.quantity,
        reason: req.reason,
        origin: "PURCHASE",
        referenceId: req.referenceId,
      });

      await this.deps.inventoryRepo.saveMovement(movement);
    }
  }
}
