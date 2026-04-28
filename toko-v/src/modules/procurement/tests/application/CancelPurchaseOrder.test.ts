import { describe, expect, it } from "vitest";

import { CancelPurchaseOrder } from "@/modules/procurement/application/use-cases/CancelPurchaseOrder";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PURCHASE_ORDER_STATUSES } from "@/modules/procurement/domain/PurchaseOrderStatus";
import { PurchaseOrderCannotBeCanceledError } from "@/modules/procurement/domain/ProcurementErrors";
import {
  ForbiddenError,
  NotFoundError,
} from "@/shared/errors/ApplicationError";

class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly store = new Map<string, PurchaseOrder>();

  nextId(): string {
    return "PO-NEXT-ID";
  }

  nextItemId(): string {
    return "PO-ITEM-NEXT-ID";
  }

  async save(order: PurchaseOrder): Promise<void> {
    this.store.set(order.id, order);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.store.get(id) ?? null;
  }
}

function makePurchaseItem(params?: {
  id?: string;
  purchaseOrderId?: string;
  variantId?: string;
  quantity?: number;
  unitCost?: number;
}): PurchaseItem {
  return PurchaseItem.create({
    id: params?.id ?? "POI-001",
    purchaseOrderId: params?.purchaseOrderId ?? "PO-001",
    productId: "PROD-001",
    variantId: params?.variantId ?? "VAR-001",
    productNameSnapshot: "Produk A",
    variantNameSnapshot: "Varian A",
    unitSnapshot: "pcs",
    quantity: params?.quantity ?? 5,
    unitCost: params?.unitCost ?? 10000,
  });
}

function makeCreatedPurchaseOrder(id = "PO-001"): PurchaseOrder {
  return PurchaseOrder.create({
    id,
    supplierId: "SUP-001",
    items: [
      makePurchaseItem({
        purchaseOrderId: id,
      }),
    ],
    createdAt: new Date("2026-04-06T10:00:00.000Z"),
    createdBy: "ADMIN-001",
  });
}

function makeReceivedPurchaseOrder(id = "PO-RECEIVED-001"): PurchaseOrder {
  return PurchaseOrder.rehydrate({
    id,
    supplierId: "SUP-001",
    status: PURCHASE_ORDER_STATUSES.RECEIVED,
    items: [
      makePurchaseItem({
        id: "POI-RECEIVED-001",
        purchaseOrderId: id,
      }),
    ],
    createdAt: new Date("2026-04-06T10:00:00.000Z"),
    createdBy: "ADMIN-001",
    receivedAt: new Date("2026-04-06T11:00:00.000Z"),
    receivedBy: "WAREHOUSE-001",
    canceledAt: null,
    canceledBy: null,
  });
}

describe("CancelPurchaseOrder", () => {
  it("cancels CREATED purchase order", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const order = makeCreatedPurchaseOrder("PO-001");
    await repo.save(order);

    const useCase = new CancelPurchaseOrder({
      purchaseOrderRepo: repo,
    });

    const result = await useCase.execute({
      purchaseOrderId: "PO-001",
      actor: {
        actorId: "ADMIN-001",
        role: "ADMIN",
      },
    });

    expect(result.purchaseOrderId).toBe("PO-001");
    expect(result.status).toBe(PURCHASE_ORDER_STATUSES.CANCELED);
    expect(result.canceledBy).toBe("ADMIN-001");
    expect(result.canceledAt).toBeInstanceOf(Date);

    const saved = await repo.findById("PO-001");
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe(PURCHASE_ORDER_STATUSES.CANCELED);
    expect(saved?.canceledBy).toBe("ADMIN-001");
    expect(saved?.canceledAt).toBeInstanceOf(Date);
  });

  it("rejects cancel when purchase order is RECEIVED", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const order = makeReceivedPurchaseOrder("PO-RECEIVED-001");
    await repo.save(order);

    const useCase = new CancelPurchaseOrder({
      purchaseOrderRepo: repo,
    });

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-RECEIVED-001",
        actor: {
          actorId: "ADMIN-001",
          role: "ADMIN",
        },
      }),
    ).rejects.toBeInstanceOf(PurchaseOrderCannotBeCanceledError);
  });

  it("rejects unauthorized role", async () => {
    const repo = new InMemoryPurchaseOrderRepository();
    const order = makeCreatedPurchaseOrder("PO-002");
    await repo.save(order);

    const useCase = new CancelPurchaseOrder({
      purchaseOrderRepo: repo,
    });

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-002",
        actor: {
          actorId: "WAREHOUSE-001",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects when purchase order is not found", async () => {
    const repo = new InMemoryPurchaseOrderRepository();

    const useCase = new CancelPurchaseOrder({
      purchaseOrderRepo: repo,
    });

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-NOT-FOUND",
        actor: {
          actorId: "ADMIN-001",
          role: "ADMIN",
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});