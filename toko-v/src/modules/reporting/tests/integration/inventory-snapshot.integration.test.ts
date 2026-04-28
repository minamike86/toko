import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/shared/prisma";
import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";
import { seedInventoryReportingScenario } from "@/modules/reporting/tests/helpers/seedInventoryReportingScenario";

describe("Inventory Snapshot Report (integration)", () => {
  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();

    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();

    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
  });

  it("returns all inventory items including zero quantity", async () => {
    await seedInventoryReportingScenario(prisma, [
      { productId: "P001", variantId: "V001", quantity: 20 },
      { productId: "P002", variantId: "V002", quantity: 0 },
    ]);

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toEqual([
      {
        productId: "P001",
        variantId: "V001",
        sku: "V001",
        productName: "P001",
        variantName: "V001",
        unit: "PCS",
        currentStockQuantity: 20,
      },
      {
        productId: "P002",
        variantId: "V002",
        sku: "V002",
        productName: "P002",
        variantName: "V002",
        unit: "PCS",
        currentStockQuantity: 0,
      },
    ]);
  });

  it("does not include products without inventoryItem record", async () => {
    await seedInventoryReportingScenario(prisma, [
      { productId: "P001", variantId: "V001", quantity: 10 },
      { productId: "P002", variantId: "V002", quantity: 0 },
    ]);

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toHaveLength(2);
    expect(snapshot).toEqual(
      expect.arrayContaining([
        {
          productId: "P001",
          variantId: "V001",
          sku: "V001",
          productName: "P001",
          variantName: "V001",
          unit: "PCS",
          currentStockQuantity: 10,
        },
        {
          productId: "P002",
          variantId: "V002",
          sku: "V002",
          productName: "P002",
          variantName: "V002",
          unit: "PCS",
          currentStockQuantity: 0,
        },
      ]),
    );
  });

  it("returns empty array when no inventory items exist", async () => {
    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toEqual([]);
  });

  it("returns exactly one row per variantId", async () => {
    await seedInventoryReportingScenario(prisma, [
      { productId: "P001", variantId: "V001", quantity: 20 },
    ]);

    const snapshot = await getInventorySnapshotReport();

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toEqual({
      productId: "P001",
      variantId: "V001",
      sku: "V001",
      productName: "P001",
      variantName: "V001",
      unit: "PCS",
      currentStockQuantity: 20,
    });
  });
});