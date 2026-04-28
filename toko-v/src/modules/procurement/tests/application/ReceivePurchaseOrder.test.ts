import { describe, expect, it } from "vitest";
import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import type { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import type {
  InventoryProcurementPort,
  ReceiveProcurementStockInput,
} from "@/modules/procurement/application/ports/InventoryProcurementPort";
import type { ProcurementUnitNormalizationPort } from "@/shared/application/unit-normalization/procurement-unit-normalization.port";
import { ProcurementNormalizationError } from "@/shared/application/unit-normalization/procurement-unit-normalization.errors";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { UserRole } from "@/modules/user/domain/UserRole";
import {
  ForbiddenError,
  NotFoundError,
} from "@/shared/errors/ApplicationError";

class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly items = new Map<string, PurchaseOrder>();
  private itemSequence = 0;

  nextId(): string {
    return "po-1";
  }

  nextItemId(): string {
    this.itemSequence += 1;
    return `poi-${this.itemSequence}`;
  }

  async save(order: PurchaseOrder): Promise<void> {
    this.items.set(order.id, order);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.items.get(id) ?? null;
  }

  seed(order: PurchaseOrder): void {
    this.items.set(order.id, order);
  }
}

class FailingSavePurchaseOrderRepository
  extends InMemoryPurchaseOrderRepository
  implements PurchaseOrderRepository {
  override async save(): Promise<void> {
    throw new Error("SAVE_FAILED");
  }
}

class FakeInventoryProcurementPort implements InventoryProcurementPort {
  readonly calls: ReceiveProcurementStockInput[] = [];

  async receiveProcurementStock(
    input: ReceiveProcurementStockInput,
  ): Promise<void> {
    this.calls.push(input);
  }
}

class FailingInventoryProcurementPort implements InventoryProcurementPort {
  async receiveProcurementStock(): Promise<void> {
    throw new Error("INVENTORY_FAILED");
  }
}

class IdentityNormalizationPort implements ProcurementUnitNormalizationPort {
  async normalizeProcurementItem(input: {
    variantId: string;
    transactionUnit: string;
    transactionQuantity: number;
    referenceId: string;
  }): Promise<{
    variantId: string;
    transactionUnit: string;
    transactionQuantity: number;
    canonicalUnit: string;
    canonicalQuantity: number;
    referenceId: string;
  }> {
    return {
      variantId: input.variantId,
      transactionUnit: input.transactionUnit,
      transactionQuantity: input.transactionQuantity,
      canonicalUnit: input.transactionUnit,
      canonicalQuantity: input.transactionQuantity,
      referenceId: input.referenceId,
    };
  }
}

class FailingNormalizationPort implements ProcurementUnitNormalizationPort {
  async normalizeProcurementItem(): Promise<never> {
    throw new ProcurementNormalizationError(
      "CONVERSION_RULE_NOT_FOUND",
      "Missing conversion rule",
    );
  }
}

function createPurchaseOrder(
  repository: PurchaseOrderRepository,
): PurchaseOrder {
  const purchaseOrderId = repository.nextId();

  const item = PurchaseItem.create({
    id: repository.nextItemId(),
    purchaseOrderId,
    productId: "prod-1",
    variantId: "var-1",
    productNameSnapshot: "Benang Katun",
    variantNameSnapshot: "Merah",
    unitSnapshot: "pcs",
    quantity: 2,
    unitCost: 10000,
  });

  return PurchaseOrder.create({
    id: purchaseOrderId,
    supplierId: "sup-1",
    items: [item],
    createdAt: new Date("2026-04-05T00:00:00.000Z"),
    createdBy: "user-create",
  });
}

describe("ReceivePurchaseOrder", () => {
  it("receives purchase order after inventory succeeds", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();
    const normalizationPort = new IdentityNormalizationPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    const result = await useCase.execute({
      purchaseOrderId: order.id,
      actor: {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    });

    expect(inventoryPort.calls).toHaveLength(1);
    expect(inventoryPort.calls[0]).toEqual({
      items: [
        {
          variantId: "var-1",
          quantity: 2,
          reason: "PROCUREMENT_RECEIVE",
          referenceId: order.id,
        },
      ],
    });
    expect(result.id).toBe(order.id);
    expect(result.status).toBe("RECEIVED");
    expect(result.receivedBy).toBe("user-1");
    expect(result.totalQuantity).toBe(2);
    expect(result.totalTransactionQuantity).toBe(2);
  });

  it("throws when purchase order is not found", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();
    const normalizationPort = new IdentityNormalizationPort();

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    await expect(
      useCase.execute({
        purchaseOrderId: "missing-po",
        actor: {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      }),
    ).rejects.toThrowError(NotFoundError);

    expect(inventoryPort.calls).toHaveLength(0);
  });

  it("rejects sales actor", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();
    const normalizationPort = new IdentityNormalizationPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    await expect(
      useCase.execute({
        purchaseOrderId: order.id,
        actor: {
          actorId: "sales-1",
          role: UserRole.SALES,
        },
      }),
    ).rejects.toThrowError(ForbiddenError);

    expect(inventoryPort.calls).toHaveLength(0);
  });

  it("does not save purchase order when inventory fails", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FailingInventoryProcurementPort();
    const normalizationPort = new IdentityNormalizationPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    await expect(
      useCase.execute({
        purchaseOrderId: order.id,
        actor: {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      }),
    ).rejects.toThrowError("INVENTORY_FAILED");

    const persisted = await repository.findById(order.id);
    expect(persisted?.status).toBe("CREATED");
    expect(persisted?.receivedAt).toBeNull();
    expect(persisted?.receivedBy).toBeNull();
  });

  it("propagates save failure after inventory succeeds", async () => {
    const repository = new FailingSavePurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();
    const normalizationPort = new IdentityNormalizationPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    await expect(
      useCase.execute({
        purchaseOrderId: order.id,
        actor: {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      }),
    ).rejects.toThrowError("SAVE_FAILED");

    expect(inventoryPort.calls).toHaveLength(1);
    expect(inventoryPort.calls[0]).toEqual({
      items: [
        {
          variantId: "var-1",
          quantity: 2,
          reason: "PROCUREMENT_RECEIVE",
          referenceId: order.id,
        },
      ],
    });
  });

  it("stops before inventory call when normalization fails", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();
    const normalizationPort = new FailingNormalizationPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(
      repository,
      normalizationPort,
      inventoryPort,
    );

    await expect(
      useCase.execute({
        purchaseOrderId: order.id,
        actor: {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      }),
    ).rejects.toMatchObject({
      code: "CONVERSION_RULE_NOT_FOUND",
    });

    expect(inventoryPort.calls).toHaveLength(0);
  });
});