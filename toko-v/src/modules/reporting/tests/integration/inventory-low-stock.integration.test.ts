import { beforeEach, describe, expect, it } from "vitest";
import { reportingPrisma as prisma } from "./_bootstrap";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventoryLowStockReport } from "@/modules/reporting/application/get-inventory-low-stock-report";

describe("Inventory Low Stock Report (integration)", () => {
  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
  });

  it("returns items with quantity <= threshold", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P-LS-101", variantId: "V-LS-101", quantity: 10 },
        { productId: "P-LS-102", variantId: "V-LS-102", quantity: 5 },
        { productId: "P-LS-103", variantId: "V-LS-103", quantity: 2 },
      ],
    });

    const result = await getInventoryLowStockReport(5);

    expect(result).toEqual([
      {
        productId: "P-LS-103",
        variantId: "V-LS-103",
        sku: "V-LS-103",
        productName: "P-LS-103",
        variantName: "Default",
        unit: "PCS",
        currentStockQuantity: 2,
      },
      {
        productId: "P-LS-102",
        variantId: "V-LS-102",
        sku: "V-LS-102",
        productName: "P-LS-102",
        variantName: "Default",
        unit: "PCS",
        currentStockQuantity: 5,
      },
    ]);
  });

  it("does not include items above threshold", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P-LS-201", variantId: "V-LS-201", quantity: 10 },
        { productId: "P-LS-202", variantId: "V-LS-202", quantity: 7 },
      ],
    });

    const result = await getInventoryLowStockReport(5);

    expect(result).toEqual([]);
  });

  it("orders by quantity asc then variantId asc then productId asc", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P-LS-302", variantId: "V-LS-302", quantity: 3 },
        { productId: "P-LS-301", variantId: "V-LS-301", quantity: 3 },
        { productId: "P-LS-303", variantId: "V-LS-303", quantity: 1 },
      ],
    });

    const result = await getInventoryLowStockReport(5);

    expect(result).toEqual([
      {
        productId: "P-LS-303",
        variantId: "V-LS-303",
        sku: "V-LS-303",
        productName: "P-LS-303",
        variantName: "Default",
        unit: "PCS",
        currentStockQuantity: 1,
      },
      {
        productId: "P-LS-301",
        variantId: "V-LS-301",
        sku: "V-LS-301",
        productName: "P-LS-301",
        variantName: "Default",
        unit: "PCS",
        currentStockQuantity: 3,
      },
      {
        productId: "P-LS-302",
        variantId: "V-LS-302",
        sku: "V-LS-302",
        productName: "P-LS-302",
        variantName: "Default",
        unit: "PCS",
        currentStockQuantity: 3,
      },
    ]);
  });

  it("returns empty array when no match", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P-LS-401", variantId: "V-LS-401", quantity: 10 },
        { productId: "P-LS-402", variantId: "V-LS-402", quantity: 8 },
      ],
    });

    const result = await getInventoryLowStockReport(5);

    expect(result).toEqual([]);
  });

  it("returns empty array when threshold is negative", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P-LS-501", variantId: "V-LS-501", quantity: 0 },
      ],
    });

    const result = await getInventoryLowStockReport(-1);

    expect(result).toEqual([]);
  });
});