import {
  InventoryRepository,
  StockMovementReadModel,
} from "../domain/InventoryRepository";

export type CheckInventoryConsistencyInput = {
  variantId: string;
};

export type InventoryConsistencyStatus =
  | "CONSISTENT"
  | "INCONSISTENT"
  | "LIMITED";

export type CheckInventoryConsistencyResult = {
  variantId: string;
  actualQuantity: number;
  expectedQuantity: number | null;
  difference: number | null;
  isConsistent: boolean;
  status: InventoryConsistencyStatus;
  movementCount: number;
  limitationReason?: string;
};

export class InventoryConsistencyTargetNotFoundError extends Error {
  readonly name = "InventoryConsistencyTargetNotFoundError";

  constructor(readonly variantId: string) {
    super(`Inventory consistency target not found: ${variantId}`);
  }
}

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class CheckInventoryConsistency {
  constructor(private readonly deps: Deps) { }

  async execute(
    input: CheckInventoryConsistencyInput,
  ): Promise<CheckInventoryConsistencyResult> {
    const snapshot = await this.deps.inventoryRepo.findByVariantId(input.variantId);

    if (!snapshot) {
      throw new InventoryConsistencyTargetNotFoundError(input.variantId);
    }

    const movements = await this.deps.inventoryRepo.listMovementsByVariantId(
      input.variantId,
    );

    const limitationReason = this.detectLimitation(movements);
    const actualQuantity = snapshot.getQuantity();

    if (limitationReason) {
      return {
        variantId: input.variantId,
        actualQuantity,
        expectedQuantity: null,
        difference: null,
        isConsistent: false,
        status: "LIMITED",
        movementCount: movements.length,
        limitationReason,
      };
    }

    const expectedQuantity = this.calculateExpectedQuantity(movements);
    const difference = actualQuantity - expectedQuantity;
    const isConsistent = difference === 0;

    return {
      variantId: input.variantId,
      actualQuantity,
      expectedQuantity,
      difference,
      isConsistent,
      status: isConsistent ? "CONSISTENT" : "INCONSISTENT",
      movementCount: movements.length,
    };
  }

  private detectLimitation(
    movements: ReadonlyArray<StockMovementReadModel>,
  ): string | undefined {
    for (const movement of movements) {
      if (movement.type === "ADJUST") {
        return "ADJUST movement is transitional and direction is not explicit.";
      }

      if (movement.type !== "IN" && movement.type !== "OUT") {
        return `Unsupported movement type for strict reconciliation: ${movement.type}`;
      }
    }

    return undefined;
  }

  private calculateExpectedQuantity(
    movements: ReadonlyArray<StockMovementReadModel>,
  ): number {
    let expectedQuantity = 0;

    for (const movement of movements) {
      if (movement.type === "IN") {
        expectedQuantity += movement.quantity;
        continue;
      }

      expectedQuantity -= movement.quantity;
    }

    return expectedQuantity;
  }
}