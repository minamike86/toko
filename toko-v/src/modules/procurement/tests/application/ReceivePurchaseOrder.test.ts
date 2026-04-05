import { describe, expect, it } from "vitest";
import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { InventoryProcurementPort } from "@/modules/procurement/application/ports/InventoryProcurementPort";
import { UserRole } from "@/modules/user/domain/UserRole";
import { NotFoundError, ForbiddenError } from "@/shared/errors/ApplicationError";

class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly items = new Map<string, PurchaseOrder>();
  private itemSeq = 0;

  nextId(): string {
    return "po-1";
  }

  nextItemId(): string {
    this.itemSeq++;
    return `poi-${this.itemSeq}`;
  }

  async save(order: PurchaseOrder): Promise<void> {
    this.items.set(order.id, order);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.items.get(id) ?? null;
  }

  seed(order: PurchaseOrder) {
    this.items.set(order.id, order);
  }
}

class FakeInventoryPort implements InventoryProcurementPort {
  public calls: any[] = [];

  async receivePurchaseStock(requests: any[]): Promise<void> {
    this.calls.push(requests);
  }
}

function createOrder(repo: InMemoryPurchaseOrderRepository): PurchaseOrder {
  const orderId = repo.nextId();
  const item = PurchaseItem.create({
    id: repo.nextItemId(),
    purchaseOrderId: orderId,
    productId: "prod-1",
    variantId: "var-1",
    productNameSnapshot: "A",
    variantNameSnapshot: "A1",
    unitSnapshot: "pcs",
    quantity: 2,
    unitCost: 100,
  });

  return PurchaseOrder.create({
    id: orderId,
    supplierId: "sup-1",
    items: [item],
    createdAt: new Date(),
    createdBy: "user-1",
  });
}

describe("ReceivePurchaseOrder", () => {
  it("calls inventory and marks PO as RECEIVED", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const inventory = new FakeInventoryPort();

    const order = createOrder(repo);
    repo.seed(order);

    const useCase = new ReceivePurchaseOrder(repo, inventory);

    const result = await useCase.execute(
      { purchaseOrderId: order.id },
      { actorId: "user-1", role: UserRole.ADMIN },
    );

    expect(inventory.calls.length).toBe(1);
    expect(result.status).toBe("RECEIVED");
  });

  it("throws when purchase order not found", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const inventory = new FakeInventoryPort();

    const useCase = new ReceivePurchaseOrder(repo, inventory);

    await expect(
      useCase.execute(
        { purchaseOrderId: "missing" },
        { actorId: "user-1", role: UserRole.ADMIN },
      ),
    ).rejects.toThrowError(NotFoundError);
  });

  it("rejects unauthorized actor", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const inventory = new FakeInventoryPort();

    const order = createOrder(repo);
    repo.seed(order);

    const useCase = new ReceivePurchaseOrder(repo, inventory);

    await expect(
      useCase.execute(
        { purchaseOrderId: order.id },
        { actorId: "user-1", role: UserRole.SALES },
      ),
    ).rejects.toThrowError(ForbiddenError);
  });
});
