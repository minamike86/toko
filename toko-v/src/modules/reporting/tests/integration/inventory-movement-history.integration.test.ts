import { describe, it, expect, beforeEach } from "vitest";
import { reportingPrisma as prisma } from "./_bootstrap";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventoryMovementHistory } from "../../queries/inventory-movement-history.query";

describe("Inventory Movement History Report (integration)", () => {
  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
  });

  it("returns all movements ordered by occurredAt asc then id asc", async () => {
    const date = new Date("2024-01-01T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", quantity: 10 }],
      stockMovements: [
        {
          id: "B",
          productId: "P001",
          occurredAt: date,
          type: "IN",
          quantity: 5,
          reason: "seed",
        },
        {
          id: "A",
          productId: "P001",
          occurredAt: date,
          type: "OUT",
          quantity: 2,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistory(prisma);

    expect(result.map((r) => r.id)).toEqual(["A", "B"]);
  });

  it("filters by productId", async () => {
    const date = new Date();

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 10 },
        { productId: "P002", quantity: 5 },
      ],
      stockMovements: [
        {
          id: "M1",
          productId: "P001",
          occurredAt: date,
          type: "IN",
          quantity: 5,
          reason: "seed",
        },
        {
          id: "M2",
          productId: "P002",
          occurredAt: date,
          type: "IN",
          quantity: 3,
          reason: "seed",
        },
      ],
    });

    const result = await getInventoryMovementHistory(prisma, {
      productId: "P001",
    });

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe("P001");
  });

  it("filters by date range (inclusive)", async () => {
    const d1 = new Date("2024-01-01T00:00:00Z");
    const d2 = new Date("2024-01-02T00:00:00Z");
    const d3 = new Date("2024-01-03T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", quantity: 10 }],
      stockMovements: [
        { id: "M1", productId: "P001", occurredAt: d1, type: "IN", quantity: 1, reason: "seed" },
        { id: "M2", productId: "P001", occurredAt: d2, type: "IN", quantity: 1, reason: "seed" },
        { id: "M3", productId: "P001", occurredAt: d3, type: "IN", quantity: 1, reason: "seed" },
      ],
    });

    const result = await getInventoryMovementHistory(prisma, {
      from: d1,
      to: d2,
    });

    expect(result.map((r) => r.id)).toEqual(["M1", "M2"]);
  });

  it("does not implicitly limit results", async () => {
    const base = new Date("2024-01-01T00:00:00Z");

    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", quantity: 10 }],
      stockMovements: Array.from({ length: 5 }).map((_, i) => ({
        id: `M${i}`,
        productId: "P001",
        occurredAt: new Date(base.getTime() + i),
        type: "IN" as const,
        quantity: 1,
        reason: "seed",
      })),
    });

    const result = await getInventoryMovementHistory(prisma);

    expect(result).toHaveLength(5);
  });
});
