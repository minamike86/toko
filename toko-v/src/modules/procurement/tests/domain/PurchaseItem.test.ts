import { describe, expect, it } from "vitest";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import {
  PurchaseItemQuantityInvalidError,
  PurchaseItemSnapshotInvalidError,
  PurchaseItemUnitCostInvalidError,
} from "@/modules/procurement/domain/ProcurementErrors";

describe("PurchaseItem", () => {
  it("calculates subtotal from quantity multiplied by unit cost", () => {
    const item = PurchaseItem.create({
      id: "poi-1",
      purchaseOrderId: "po-1",
      productId: "prod-1",
      variantId: "var-1",
      productNameSnapshot: "Benang Katun",
      variantNameSnapshot: "Merah",
      unitSnapshot: "pcs",
      quantity: 3,
      unitCost: 12000,
    });

    expect(item.subtotalCost).toBe(36000);
  });

  it("throws when quantity is zero or negative", () => {
    expect(() =>
      PurchaseItem.create({
        id: "poi-1",
        purchaseOrderId: "po-1",
        productId: "prod-1",
        variantId: "var-1",
        productNameSnapshot: "Benang Katun",
        variantNameSnapshot: "Merah",
        unitSnapshot: "pcs",
        quantity: 0,
        unitCost: 12000,
      }),
    ).toThrowError(PurchaseItemQuantityInvalidError);
  });

  it("throws when unit cost is negative", () => {
    expect(() =>
      PurchaseItem.create({
        id: "poi-1",
        purchaseOrderId: "po-1",
        productId: "prod-1",
        variantId: "var-1",
        productNameSnapshot: "Benang Katun",
        variantNameSnapshot: "Merah",
        unitSnapshot: "pcs",
        quantity: 1,
        unitCost: -1,
      }),
    ).toThrowError(PurchaseItemUnitCostInvalidError);
  });

  it("throws when rehydrate subtotal is inconsistent", () => {
    expect(() =>
      PurchaseItem.rehydrate({
        id: "poi-1",
        purchaseOrderId: "po-1",
        productId: "prod-1",
        variantId: "var-1",
        productNameSnapshot: "Benang Katun",
        variantNameSnapshot: "Merah",
        unitSnapshot: "pcs",
        quantity: 2,
        unitCost: 10000,
        subtotalCost: 12345,
      }),
    ).toThrowError(PurchaseItemSnapshotInvalidError);
  });
});