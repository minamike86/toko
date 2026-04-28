import { describe, expect, it } from "vitest";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import {
  DuplicatePurchaseItemVariantError,
  PurchaseOrderAlreadyReceivedError,
  PurchaseOrderCannotBeReceivedError,
  PurchaseOrderItemsEmptyError,
  PurchaseOrderStatusInvalidError,
} from "@/modules/procurement/domain/ProcurementErrors";
import { PURCHASE_ORDER_STATUSES } from "@/modules/procurement/domain/PurchaseOrderStatus";

function createItem(params?: {
  id?: string;
  purchaseOrderId?: string;
  variantId?: string;
  quantity?: number;
  unitCost?: number;
}): PurchaseItem {
  return PurchaseItem.create({
    id: params?.id ?? "poi-1",
    purchaseOrderId: params?.purchaseOrderId ?? "po-1",
    productId: "prod-1",
    variantId: params?.variantId ?? "var-1",
    productNameSnapshot: "Benang Katun",
    variantNameSnapshot: "Merah",
    unitSnapshot: "pcs",
    quantity: params?.quantity ?? 2,
    unitCost: params?.unitCost ?? 10000,
  });
}

describe("PurchaseOrder", () => {
  it("creates purchase order with CREATED status", () => {
    const order = PurchaseOrder.create({
      id: "po-1",
      supplierId: "sup-1",
      items: [createItem()],
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
      createdBy: "user-1",
    });

    expect(order.status).toBe(PURCHASE_ORDER_STATUSES.CREATED);
    expect(order.totalQuantity).toBe(2);
    expect(order.totalCost).toBe(20000);
  });

  it("throws when items are empty", () => {
    expect(() =>
      PurchaseOrder.create({
        id: "po-1",
        supplierId: "sup-1",
        items: [],
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
        createdBy: "user-1",
      }),
    ).toThrowError(PurchaseOrderItemsEmptyError);
  });

  it("throws when duplicate variant exists in one purchase order", () => {
    expect(() =>
      PurchaseOrder.create({
        id: "po-1",
        supplierId: "sup-1",
        items: [
          createItem({ id: "poi-1", variantId: "var-1" }),
          createItem({ id: "poi-2", variantId: "var-1" }),
        ],
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
        createdBy: "user-1",
      }),
    ).toThrowError(DuplicatePurchaseItemVariantError);
  });

  it("receives purchase order only once", () => {
    const order = PurchaseOrder.create({
      id: "po-1",
      supplierId: "sup-1",
      items: [createItem()],
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
      createdBy: "user-1",
    });

    order.receive({
      receivedAt: new Date("2026-04-05T00:00:00.000Z"),
      receivedBy: "user-2",
    });

    expect(order.status).toBe(PURCHASE_ORDER_STATUSES.RECEIVED);
    expect(order.receivedBy).toBe("user-2");

    expect(() =>
      order.receive({
        receivedAt: new Date("2026-04-05T01:00:00.000Z"),
        receivedBy: "user-3",
      }),
    ).toThrowError(PurchaseOrderAlreadyReceivedError);
  });

  it("cannot receive canceled purchase order", () => {
    const order = PurchaseOrder.create({
      id: "po-1",
      supplierId: "sup-1",
      items: [createItem()],
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
      createdBy: "user-1",
    });

    order.cancel({
      canceledAt: new Date("2026-04-05T00:00:00.000Z"),
      canceledBy: "user-2",
    });

    expect(() =>
      order.receive({
        receivedAt: new Date("2026-04-05T01:00:00.000Z"),
        receivedBy: "user-3",
      }),
    ).toThrowError(PurchaseOrderCannotBeReceivedError);
  });

  it("throws when rehydrate status is not allowed", () => {
    expect(() =>
      PurchaseOrder.rehydrate({
        id: "po-1",
        supplierId: "sup-1",
        status: "PAID",
        items: [createItem()],
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
        createdBy: "user-1",
        receivedAt: null,
        receivedBy: null,
        canceledAt: null,
        canceledBy: null,
      }),
    ).toThrowError(PurchaseOrderStatusInvalidError);
  });
});