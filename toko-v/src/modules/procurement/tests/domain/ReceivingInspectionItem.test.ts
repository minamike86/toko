import { describe, expect, it } from "vitest";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import {
  ReceivingInspectionQuantityInvalidError,
  ReceivingInspectionQuantityUnresolvedError,
} from "../../domain/ReceivingInspectionErrors";

describe("ReceivingInspectionItem", () => {
  it("creates item with valid expected quantity", () => {
    const item = ReceivingInspectionItem.create({
      purchaseItemId: "purchase-item-1",
      variantId: "variant-1",
      expectedQuantity: 10,
    });

    expect(item.purchaseItemId).toBe("purchase-item-1");
    expect(item.variantId).toBe("variant-1");
    expect(item.expectedQuantity).toBe(10);
    expect(item.acceptedQuantity).toBe(0);
    expect(item.quarantinedQuantity).toBe(0);
    expect(item.rejectedQuantity).toBe(0);
  });

  it("rejects non-positive expected quantity", () => {
    expect(() =>
      ReceivingInspectionItem.create({
        purchaseItemId: "purchase-item-1",
        variantId: "variant-1",
        expectedQuantity: 0,
      }),
    ).toThrow(ReceivingInspectionQuantityInvalidError);
  });

  it("records inspection result when quantity allocation matches expected quantity", () => {
    const item = ReceivingInspectionItem.create({
      purchaseItemId: "purchase-item-1",
      variantId: "variant-1",
      expectedQuantity: 10,
    });

    item.recordResult({
      acceptedQuantity: 7,
      quarantinedQuantity: 2,
      rejectedQuantity: 1,
      notes: "mixed condition",
    });

    expect(item.acceptedQuantity).toBe(7);
    expect(item.quarantinedQuantity).toBe(2);
    expect(item.rejectedQuantity).toBe(1);
    expect(item.notes).toBe("mixed condition");
  });

  it("rejects negative result quantity", () => {
    const item = ReceivingInspectionItem.create({
      purchaseItemId: "purchase-item-1",
      variantId: "variant-1",
      expectedQuantity: 10,
    });

    expect(() =>
      item.recordResult({
        acceptedQuantity: -1,
        quarantinedQuantity: 0,
        rejectedQuantity: 0,
        notes: null,
      }),
    ).toThrow(ReceivingInspectionQuantityInvalidError);
  });

  it("rejects unresolved quantity allocation", () => {
    const item = ReceivingInspectionItem.create({
      purchaseItemId: "purchase-item-1",
      variantId: "variant-1",
      expectedQuantity: 10,
    });

    expect(() =>
      item.recordResult({
        acceptedQuantity: 5,
        quarantinedQuantity: 2,
        rejectedQuantity: 1,
        notes: null,
      }),
    ).toThrow(ReceivingInspectionQuantityUnresolvedError);
  });
});