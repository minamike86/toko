import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";

import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";

export type AdjustStockInput = {
  variantId: string;
  newQuantity: number;
  reason: string;
};

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class AdjustStock {
  constructor(private readonly deps: Deps) { }

  async execute(input: AdjustStockInput, actor: ActorContext): Promise<void> {
    AuthorizationGuard.assertAuthorized(actor, ["ADMIN", "WAREHOUSE"]);

    if (input.newQuantity < 0) {
      throw new Error(`newQuantity tidak boleh negatif: ${input.newQuantity}`);
    }

    const item = await this.deps.inventoryRepo.findByVariantId(input.variantId);

    if (!item) {
      throw new Error(`Inventory tidak ditemukan: ${input.variantId}`);
    }

    const currentQuantity = item.getQuantity();
    const delta = input.newQuantity - currentQuantity;

    if (delta === 0) {
      return;
    }

    if (delta > 0) {
      await this.deps.inventoryRepo.increaseByVariantId(input.variantId, delta);
    } else {
      await this.deps.inventoryRepo.decreaseByVariantId(
        input.variantId,
        Math.abs(delta),
      );
    }

    const movement = StockMovement.adjust({
      variantId: input.variantId,
      quantity: Math.abs(delta),
      reason: input.reason,
      origin: "MANUAL_ADJUSTMENT",
    });

    await this.deps.inventoryRepo.saveMovement(movement);
  }
}