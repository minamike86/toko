import { describe, expect, it } from "vitest";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import {
  ReceivingInspectionQuantityUnresolvedError,
  ReceivingInspectionStatusInvalidError,
} from "../../domain/ReceivingInspectionErrors";

function createInspection(): ReceivingInspection {
  return ReceivingInspection.create({
    id: "inspection-1",
    purchaseOrderId: "purchase-order-1",
    arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
    arrivedBy: "warehouse-user-1",
    notes: null,
    items: [
      ReceivingInspectionItem.create({
        purchaseItemId: "purchase-item-1",
        variantId: "variant-1",
        expectedQuantity: 10,
      }),
      ReceivingInspectionItem.create({
        purchaseItemId: "purchase-item-2",
        variantId: "variant-2",
        expectedQuantity: 5,
      }),
    ],
  });
}

describe("ReceivingInspection", () => {
  it("creates inspection with ARRIVED status", () => {
    const inspection = createInspection();

    expect(inspection.id).toBe("inspection-1");
    expect(inspection.purchaseOrderId).toBe("purchase-order-1");
    expect(inspection.status).toBe("ARRIVED");
    expect(inspection.items).toHaveLength(2);
  });

  it("starts inspection from ARRIVED status", () => {
    const inspection = createInspection();

    inspection.start(new Date("2026-01-01T01:00:00.000Z"), "warehouse-user-1");

    expect(inspection.status).toBe("UNDER_INSPECTION");
    expect(inspection.startedBy).toBe("warehouse-user-1");
  });

  it("rejects completing inspection before start", () => {
    const inspection = createInspection();

    expect(() =>
      inspection.complete({
        completedAt: new Date("2026-01-01T02:00:00.000Z"),
        completedBy: "warehouse-user-1",
        items: [],
      }),
    ).toThrow(ReceivingInspectionStatusInvalidError);
  });

  it("completes inspection when all items are resolved", () => {
    const inspection = createInspection();

    inspection.start(new Date("2026-01-01T01:00:00.000Z"), "warehouse-user-1");

    inspection.complete({
      completedAt: new Date("2026-01-01T02:00:00.000Z"),
      completedBy: "warehouse-user-1",
      items: [
        {
          purchaseItemId: "purchase-item-1",
          acceptedQuantity: 8,
          quarantinedQuantity: 1,
          rejectedQuantity: 1,
          notes: null,
        },
        {
          purchaseItemId: "purchase-item-2",
          acceptedQuantity: 5,
          quarantinedQuantity: 0,
          rejectedQuantity: 0,
          notes: null,
        },
      ],
    });

    expect(inspection.status).toBe("COMPLETED");
    expect(inspection.completedBy).toBe("warehouse-user-1");
    expect(inspection.hasQuarantine()).toBe(true);
    expect(inspection.hasRejectedQuantity()).toBe(true);
  });

  it("rejects completion when not all items are provided", () => {
    const inspection = createInspection();

    inspection.start(new Date("2026-01-01T01:00:00.000Z"), "warehouse-user-1");

    expect(() =>
      inspection.complete({
        completedAt: new Date("2026-01-01T02:00:00.000Z"),
        completedBy: "warehouse-user-1",
        items: [
          {
            purchaseItemId: "purchase-item-1",
            acceptedQuantity: 10,
            quarantinedQuantity: 0,
            rejectedQuantity: 0,
            notes: null,
          },
        ],
      }),
    ).toThrow(ReceivingInspectionQuantityUnresolvedError);
  });

  it("rejects duplicate item input", () => {
    const inspection = createInspection();

    inspection.start(new Date("2026-01-01T01:00:00.000Z"), "warehouse-user-1");

    expect(() =>
      inspection.complete({
        completedAt: new Date("2026-01-01T02:00:00.000Z"),
        completedBy: "warehouse-user-1",
        items: [
          {
            purchaseItemId: "purchase-item-1",
            acceptedQuantity: 10,
            quarantinedQuantity: 0,
            rejectedQuantity: 0,
            notes: null,
          },
          {
            purchaseItemId: "purchase-item-1",
            acceptedQuantity: 10,
            quarantinedQuantity: 0,
            rejectedQuantity: 0,
            notes: null,
          },
        ],
      }),
    ).toThrow(ReceivingInspectionQuantityUnresolvedError);
  });

  it("rejects mutation after completed", () => {
    const inspection = createInspection();

    inspection.start(new Date("2026-01-01T01:00:00.000Z"), "warehouse-user-1");

    inspection.complete({
      completedAt: new Date("2026-01-01T02:00:00.000Z"),
      completedBy: "warehouse-user-1",
      items: [
        {
          purchaseItemId: "purchase-item-1",
          acceptedQuantity: 10,
          quarantinedQuantity: 0,
          rejectedQuantity: 0,
          notes: null,
        },
        {
          purchaseItemId: "purchase-item-2",
          acceptedQuantity: 5,
          quarantinedQuantity: 0,
          rejectedQuantity: 0,
          notes: null,
        },
      ],
    });

    expect(() =>
      inspection.start(new Date("2026-01-01T03:00:00.000Z"), "warehouse-user-1"),
    ).toThrow(ReceivingInspectionStatusInvalidError);
  });
});