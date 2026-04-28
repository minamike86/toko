import { describe, expect, it, vi } from "vitest";
import {
  CheckInventoryConsistency,
  InventoryConsistencyTargetNotFoundError,
} from "@/modules/inventory/application/CheckInventoryConsistency";
import type {
  InventoryRepository,
  StockMovementReadModel,
} from "@/modules/inventory/domain/InventoryRepository";

type Snapshot = NonNullable<
  Awaited<ReturnType<InventoryRepository["findByVariantId"]>>
>;

type InventoryRepositoryMock = {
  findByVariantId: ReturnType<typeof vi.fn<InventoryRepository["findByVariantId"]>>;
  listMovementsByVariantId: ReturnType<
    typeof vi.fn<InventoryRepository["listMovementsByVariantId"]>
  >;
  increaseByVariantId: ReturnType<
    typeof vi.fn<InventoryRepository["increaseByVariantId"]>
  >;
  decreaseByVariantId: ReturnType<
    typeof vi.fn<InventoryRepository["decreaseByVariantId"]>
  >;
  saveMovement: ReturnType<typeof vi.fn<InventoryRepository["saveMovement"]>>;
};

function createInventoryRepoMock(params?: {
  snapshot?: Snapshot | null;
  movements?: ReadonlyArray<StockMovementReadModel>;
}): InventoryRepository & InventoryRepositoryMock {
  const repo: InventoryRepository & InventoryRepositoryMock = {
    findByVariantId: vi
      .fn<InventoryRepository["findByVariantId"]>()
      .mockResolvedValue(params?.snapshot ?? null),

    listMovementsByVariantId: vi
      .fn<InventoryRepository["listMovementsByVariantId"]>()
      .mockResolvedValue(params?.movements ?? []),

    increaseByVariantId: vi
      .fn<InventoryRepository["increaseByVariantId"]>()
      .mockResolvedValue(undefined),

    decreaseByVariantId: vi
      .fn<InventoryRepository["decreaseByVariantId"]>()
      .mockResolvedValue(undefined),

    saveMovement: vi
      .fn<InventoryRepository["saveMovement"]>()
      .mockResolvedValue(undefined),
  };

  return repo;
}

describe("CheckInventoryConsistency", () => {
  it("returns CONSISTENT when snapshot equals IN minus OUT", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result).toEqual({
      variantId,
      actualQuantity: 7,
      expectedQuantity: 7,
      difference: 0,
      isConsistent: true,
      status: "CONSISTENT",
      movementCount: 2,
    });
  });

  it("returns INCONSISTENT when snapshot mismatches movement sum", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(8),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result).toEqual({
      variantId,
      actualQuantity: 8,
      expectedQuantity: 7,
      difference: 1,
      isConsistent: false,
      status: "INCONSISTENT",
      movementCount: 2,
    });
  });

  it("returns CONSISTENT when snapshot is zero and movement list is empty", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(0),
      movements: [],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result).toEqual({
      variantId,
      actualQuantity: 0,
      expectedQuantity: 0,
      difference: 0,
      isConsistent: true,
      status: "CONSISTENT",
      movementCount: 0,
    });
  });

  it("returns INCONSISTENT when snapshot is non-zero and movement list is empty", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(5),
      movements: [],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result).toEqual({
      variantId,
      actualQuantity: 5,
      expectedQuantity: 0,
      difference: 5,
      isConsistent: false,
      status: "INCONSISTENT",
      movementCount: 0,
    });
  });

  it("returns LIMITED when movement contains ADJUST", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "ADJUST", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result).toEqual({
      variantId,
      actualQuantity: 7,
      expectedQuantity: null,
      difference: null,
      isConsistent: false,
      status: "LIMITED",
      movementCount: 2,
      limitationReason:
        "ADJUST movement is transitional and direction is not explicit.",
    });
  });

  it("returns LIMITED when all movements are ADJUST", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "ADJUST", quantity: 7 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result.status).toBe("LIMITED");
    expect(result.expectedQuantity).toBeNull();
    expect(result.difference).toBeNull();
    expect(result.isConsistent).toBe(false);
    expect(result.movementCount).toBe(1);
    expect(result.limitationReason).toBe(
      "ADJUST movement is transitional and direction is not explicit.",
    );
  });

  it("returns LIMITED when movement type is unsupported", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "UNKNOWN", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result.status).toBe("LIMITED");
    expect(result.expectedQuantity).toBeNull();
    expect(result.difference).toBeNull();
    expect(result.isConsistent).toBe(false);
    expect(result.movementCount).toBe(2);
    expect(result.limitationReason).toBe(
      "Unsupported movement type for strict reconciliation: UNKNOWN",
    );
  });

  it("throws InventoryConsistencyTargetNotFoundError when snapshot is not found", async () => {
    const variantId = "VAR-404";
    const repo = createInventoryRepoMock({
      snapshot: null,
      movements: [],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    await expect(useCase.execute({ variantId })).rejects.toBeInstanceOf(
      InventoryConsistencyTargetNotFoundError,
    );

    await expect(useCase.execute({ variantId })).rejects.toMatchObject({
      name: "InventoryConsistencyTargetNotFoundError",
      variantId,
      message: `Inventory consistency target not found: ${variantId}`,
    });
  });

  it("does not mutate snapshot quantity", async () => {
    const variantId = "VAR-001";
    const snapshot = createSnapshot(7);

    const repo = createInventoryRepoMock({
      snapshot,
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const before = snapshot.getQuantity();

    await useCase.execute({ variantId });

    const after = snapshot.getQuantity();

    expect(after).toBe(before);
    expect(after).toBe(7);
  });

  it("does not call write methods", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    await useCase.execute({ variantId });

    expect(repo.increaseByVariantId).not.toHaveBeenCalled();
    expect(repo.decreaseByVariantId).not.toHaveBeenCalled();
    expect(repo.saveMovement).not.toHaveBeenCalled();
  });

  it("returns INCONSISTENT when snapshot is manually tampered", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(99),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result.status).toBe("INCONSISTENT");
    expect(result.isConsistent).toBe(false);
    expect(result.actualQuantity).toBe(99);
    expect(result.expectedQuantity).toBe(7);
    expect(result.difference).toBe(92);
  });

  it("returns INCONSISTENT when movement is injected without snapshot update", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
        movement({ id: "m-3", variantId, type: "OUT", quantity: 1 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    const result = await useCase.execute({ variantId });

    expect(result.status).toBe("INCONSISTENT");
    expect(result.isConsistent).toBe(false);
    expect(result.actualQuantity).toBe(7);
    expect(result.expectedQuantity).toBe(6);
    expect(result.difference).toBe(1);
    expect(result.movementCount).toBe(3);
  });

  it("reads snapshot and movements exactly once", async () => {
    const variantId = "VAR-001";
    const repo = createInventoryRepoMock({
      snapshot: createSnapshot(7),
      movements: [
        movement({ id: "m-1", variantId, type: "IN", quantity: 10 }),
        movement({ id: "m-2", variantId, type: "OUT", quantity: 3 }),
      ],
    });

    const useCase = new CheckInventoryConsistency({ inventoryRepo: repo });

    await useCase.execute({ variantId });

    expect(repo.findByVariantId).toHaveBeenCalledTimes(1);
    expect(repo.findByVariantId).toHaveBeenCalledWith(variantId);
    expect(repo.listMovementsByVariantId).toHaveBeenCalledTimes(1);
    expect(repo.listMovementsByVariantId).toHaveBeenCalledWith(variantId);
  });
});

function createSnapshot(quantity: number): Snapshot {
  return {
    getQuantity(): number {
      return quantity;
    },
  } as Snapshot;
}

function movement(params: {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  productId?: string | null;
  origin?: string;
  reason?: string;
  referenceId?: string | null;
  occurredAt?: Date;
}): StockMovementReadModel {
  return {
    id: params.id,
    productId: params.productId ?? "PROD-001",
    variantId: params.variantId,
    type: params.type,
    origin: params.origin ?? "LEGACY",
    quantity: params.quantity,
    reason: params.reason ?? "test",
    referenceId: params.referenceId ?? null,
    occurredAt: params.occurredAt ?? new Date("2026-04-16T00:00:00.000Z"),
  };
}