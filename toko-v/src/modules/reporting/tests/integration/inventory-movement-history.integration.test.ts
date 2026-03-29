import { describe, it, expect, beforeEach } from "vitest";
import { reportingPrisma as prisma } from "./_bootstrap";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventoryMovementHistoryReport } from "../../application/get-inventory-movement-history-report";

describe("Inventory Movement History Report (integration)", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
  });

  it("returns all movements ordered by occurredAt asc then id asc", async () => {
    const date = new Date("2024-01-01T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", variantId: "V001", quantity: 10 }],
      stockMovements: [
        {
          id: "B",
          productId: "P001",
          variantId: "V001",
          occurredAt: date,
          type: "IN",
          origin: "LEGACY",
          quantity: 5,
          reason: "seed",
        },
        {
          id: "A",
          productId: "P001",
          variantId: "V001",
          occurredAt: date,
          type: "OUT",
          origin: "LEGACY",
          quantity: 2,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistoryReport();

    expect(result.map((r) => r.id)).toEqual(["A", "B"]);
    expect(result).toEqual([
      expect.objectContaining({
        id: "A",
        productId: "P001",
        variantId: "V001",
        movementType: "OUT",
        origin: "LEGACY",
      }),
      expect.objectContaining({
        id: "B",
        productId: "P001",
        variantId: "V001",
        movementType: "IN",
        origin: "LEGACY",
      }),
    ]);
  });

  it("filters by productId", async () => {
    const date = new Date();

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", variantId: "V001", quantity: 10 },
        { productId: "P002", variantId: "V002", quantity: 5 },
      ],
      stockMovements: [
        {
          id: "M1",
          productId: "P001",
          variantId: "V001",
          occurredAt: date,
          type: "IN",
          origin: "LEGACY",
          quantity: 5,
          reason: "seed",
        },
        {
          id: "M2",
          productId: "P002",
          variantId: "V002",
          occurredAt: date,
          type: "IN",
          origin: "LEGACY",
          quantity: 3,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistoryReport({
      productId: "P001",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productId: "P001",
      variantId: "V001",
      origin: "LEGACY",
    });
  });

  it("filters by variantId", async () => {
    const date = new Date();

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", variantId: "V001", quantity: 10 },
        { productId: "P001", variantId: "V002", quantity: 8 },
      ],
      stockMovements: [
        {
          id: "M1",
          productId: "P001",
          variantId: "V001",
          occurredAt: date,
          type: "IN",
          origin: "LEGACY",
          quantity: 5,
          reason: "seed",
        },
        {
          id: "M2",
          productId: "P001",
          variantId: "V002",
          occurredAt: date,
          type: "OUT",
          origin: "LEGACY",
          quantity: 2,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistoryReport({
      variantId: "V002",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productId: "P001",
      variantId: "V002",
      movementType: "OUT",
    });
  });

  it("filters by date range (inclusive)", async () => {
    const d1 = new Date("2024-01-01T00:00:00Z");
    const d2 = new Date("2024-01-02T00:00:00Z");
    const d3 = new Date("2024-01-03T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", variantId: "V001", quantity: 10 }],
      stockMovements: [
        {
          id: "M1",
          productId: "P001",
          variantId: "V001",
          occurredAt: d1,
          type: "IN",
          origin: "LEGACY",
          quantity: 1,
          reason: "seed",
        },
        {
          id: "M2",
          productId: "P001",
          variantId: "V001",
          occurredAt: d2,
          type: "IN",
          origin: "LEGACY",
          quantity: 1,
          reason: "seed",
        },
        {
          id: "M3",
          productId: "P001",
          variantId: "V001",
          occurredAt: d3,
          type: "IN",
          origin: "LEGACY",
          quantity: 1,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistoryReport({
      from: d1,
      to: d2,
    });

    expect(result.map((r) => r.id)).toEqual(["M1", "M2"]);
    expect(result.every((r) => r.origin === "LEGACY")).toBe(true);
  });

  it("does not implicitly limit results", async () => {
    const base = new Date("2024-01-01T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", variantId: "V001", quantity: 10 }],
      stockMovements: Array.from({ length: 5 }).map((_, i) => ({
        id: `M${i}`,
        productId: "P001",
        variantId: "V001",
        occurredAt: new Date(base.getTime() + i),
        type: "IN" as const,
        origin: "LEGACY" as const,
        quantity: 1,
        reason: "seed",
      })),
    });

    const result = await getInventoryMovementHistoryReport();

    expect(result).toHaveLength(5);
    expect(result.every((r) => r.variantId === "V001")).toBe(true);
  });
});