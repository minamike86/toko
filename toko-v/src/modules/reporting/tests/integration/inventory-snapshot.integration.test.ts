import "./_bootstrap";
import { reportingPrisma as prisma } from "./_bootstrap";

import { describe, it, expect, beforeEach } from "vitest";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";

describe("Inventory Snapshot Report (integration)", () => {
  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
  });

  it("returns all inventory items including zero quantity", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", variantId: "V001", quantity: 10 },
        { productId: "P002", variantId: "V002", quantity: 0 },
      ],
    });

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toEqual([
      {
        productId: "P001",
        variantId: "V001",
        currentStockQuantity: 10,
      },
      {
        productId: "P002",
        variantId: "V002",
        currentStockQuantity: 0,
      },
    ]);
  });

  it("does not include products without inventoryItem record", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", variantId: "V001", quantity: 5 },
        { productId: "P002", variantId: "V002", quantity: 0 },
      ],
    });

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toHaveLength(2);
    expect(snapshot).toEqual(
      expect.arrayContaining([
        { productId: "P001", variantId: "V001", currentStockQuantity: 5 },
        { productId: "P002", variantId: "V002", currentStockQuantity: 0 },
      ])
    );
  });

  it("returns empty array when no inventory items exist", async () => {
    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toEqual([]);
  });

  it("returns exactly one row per variantId", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", variantId: "V001", quantity: 5 }],
    });

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toEqual({
      productId: "P001",
      variantId: "V001",
      currentStockQuantity: 5,
    });
  });
});