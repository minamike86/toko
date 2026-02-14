import { describe, it, expect, beforeEach } from "vitest";
import { reportingPrisma as prisma } from "./_bootstrap";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventoryLowStock } from "../../queries/inventory-low-stock.query";

describe("Inventory Low Stock Report (integration)", () => {
  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
  });

  it("returns items with quantity <= threshold", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 10 },
        { productId: "P002", quantity: 5 },
        { productId: "P003", quantity: 2 },
      ],
    });

    const result = await getInventoryLowStock(prisma, { threshold: 5 });

    expect(result).toEqual([
      { productId: "P003", currentStockQuantity: 2 },
      { productId: "P002", currentStockQuantity: 5 },
    ]);
  });

  it("does not include items above threshold", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 10 },
        { productId: "P002", quantity: 7 },
      ],
    });

    const result = await getInventoryLowStock(prisma, { threshold: 5 });

    expect(result).toEqual([]);
  });

  it("orders by quantity asc then productId asc", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P002", quantity: 3 },
        { productId: "P001", quantity: 3 },
        { productId: "P003", quantity: 1 },
      ],
    });

    const result = await getInventoryLowStock(prisma, { threshold: 5 });

    expect(result).toEqual([
      { productId: "P003", currentStockQuantity: 1 },
      { productId: "P001", currentStockQuantity: 3 },
      { productId: "P002", currentStockQuantity: 3 },
    ]);
  });

  it("returns empty array when no match", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 10 },
        { productId: "P002", quantity: 8 },
      ],
    });

    const result = await getInventoryLowStock(prisma, { threshold: 5 });

    expect(result).toEqual([]);
  });

  it("returns empty array when threshold is negative", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 0 },
      ],
    });

    const result = await getInventoryLowStock(prisma, { threshold: -1 });

    expect(result).toEqual([]);
  });
});
