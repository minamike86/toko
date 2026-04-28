import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import type { ActorContext } from "@/shared/system/types/actor-context";
import { UserRole } from "@/modules/user/domain/UserRole";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";

export type InventoryMutationReason = "PROCUREMENT_RECEIVE";

export type ReceiveStockRequest = {
  variantId: string;
  quantity: number;
  reason: InventoryMutationReason;
  referenceId?: string;
};

export class InvalidQuantityError extends Error {
  constructor() {
    super("Receive stock quantity must be greater than zero");
    this.name = "InvalidQuantityError";
  }
}

export class InventoryNotFoundError extends Error {
  constructor(variantId: string) {
    super(`Inventory item not found for variant ${variantId}`);
    this.name = "InventoryNotFoundError";
  }
}

export class InvalidStockReasonError extends Error {
  constructor(reason: string) {
    super(`Invalid receive stock reason: ${reason}`);
    this.name = "InvalidStockReasonError";
  }
}

function assertReason(reason: string): InventoryMutationReason {
  if (reason !== "PROCUREMENT_RECEIVE") {
    throw new InvalidStockReasonError(reason);
  }

  return reason;
}

function assertQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new InvalidQuantityError();
  }

  return quantity;
}

export class ReceiveStock {
  constructor(
    private readonly deps: {
      inventoryRepo: InventoryRepository;
    },
  ) { }

  async execute(
    input: ReceiveStockRequest,
    actorParam: ActorContext,
  ): Promise<void> {
    AuthorizationGuard.assertAuthorized(actorParam, [
      UserRole.ADMIN,
      UserRole.WAREHOUSE,
    ]);

    const quantity = assertQuantity(input.quantity);
    const reason = assertReason(input.reason);

    const inventoryItem = await this.deps.inventoryRepo.findByVariantId(
      input.variantId,
    );

    if (!inventoryItem) {
      throw new InventoryNotFoundError(input.variantId);
    }

    await this.deps.inventoryRepo.increaseByVariantId(
      input.variantId,
      quantity,
    );

    const movement = StockMovement.in({
      productId: null,
      variantId: input.variantId,
      quantity,
      reason,
      origin: "PURCHASE",
      referenceId: input.referenceId,
    });

    await this.deps.inventoryRepo.saveMovement(movement);
  }
}