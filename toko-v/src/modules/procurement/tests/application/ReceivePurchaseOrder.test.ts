import { describe, expect, it } from "vitest";

import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import { InventoryProcurementPort } from "@/modules/procurement/application/ports/InventoryProcurementPort";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
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

class FakeInventoryProcurementPort implements InventoryProcurementPort {
  public readonly calls: Array<
    Array<{
      variantId: string;
      quantity: number;
      reason: string;
      referenceId: string;
    }>
  > = [];

  async receivePurchaseStock(
    requests: Array<{
      variantId: string;
      quantity: number;
      reason: string;
      referenceId: string;
    }>,
  ): Promise<void> {
    this.calls.push(requests);
  }
}

class FailingInventoryProcurementPort implements InventoryProcurementPort {
  async receivePurchaseStock(): Promise<void> {
    throw new Error("INVENTORY_FAILED");
  }
}

class FailingSavePurchaseOrderRepository
  extends InMemoryPurchaseOrderRepository
  implements PurchaseOrderRepository {
  async save(): Promise<void> {
    throw new Error("SAVE_FAILED");
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

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(repository, inventoryPort);

    const result = await useCase.execute(
      { purchaseOrderId: order.id },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(inventoryPort.calls).toHaveLength(1);
    expect(inventoryPort.calls[0]).toEqual([
      {
        variantId: "var-1",
        quantity: 2,
        reason: "PURCHASE_RECEIVE",
        referenceId: order.id,
      },
    ]);
    expect(result.status).toBe("RECEIVED");
    expect(result.receivedBy).toBe("user-1");
  });

  it("throws when purchase order is not found", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();

    const useCase = new ReceivePurchaseOrder(repository, inventoryPort);

    await expect(
      useCase.execute(
        { purchaseOrderId: "missing-po" },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(NotFoundError);
  });

  it("rejects sales actor", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(repository, inventoryPort);

    await expect(
      useCase.execute(
        { purchaseOrderId: order.id },
        {
          actorId: "sales-1",
          role: UserRole.SALES,
        },
      ),
    ).rejects.toThrowError(ForbiddenError);
  });

  it("does not save purchase order when inventory fails", async () => {
    const repository = new InMemoryPurchaseOrderRepository();
    const inventoryPort = new FailingInventoryProcurementPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(repository, inventoryPort);

    await expect(
      useCase.execute(
        { purchaseOrderId: order.id },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError("INVENTORY_FAILED");

    const persisted = await repository.findById(order.id);
    expect(persisted?.status).toBe("CREATED");
    expect(persisted?.receivedAt).toBeNull();
    expect(persisted?.receivedBy).toBeNull();
  });

  it("propagates save failure after inventory succeeds", async () => {
    const repository = new FailingSavePurchaseOrderRepository();
    const inventoryPort = new FakeInventoryProcurementPort();

    const order = createPurchaseOrder(repository);
    repository.seed(order);

    const useCase = new ReceivePurchaseOrder(repository, inventoryPort);

    await expect(
      useCase.execute(
        { purchaseOrderId: order.id },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError("SAVE_FAILED");

    expect(inventoryPort.calls).toHaveLength(1);
  });
});