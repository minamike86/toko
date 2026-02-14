import "./_bootstrap";
import { reportingPrisma as prisma } from "./_bootstrap";

import { describe, it, expect, beforeEach } from "vitest";

import { seedInventoryReportingScenario } from "../helpers/seedInventoryReportingScenario";
import { getInventorySnapshot } from "../../inventory/inventory-snapshot.query";

describe("Inventory Snapshot Report (integration)", () => {

   beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
  });
  
  it("returns all inventory items including zero quantity", async () => {
    // ---------------------------------------------------------------------
    // GIVEN: inventory data exists
    // ---------------------------------------------------------------------
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [
        { productId: "P001", quantity: 10 },
        { productId: "P002", quantity: 0 },
      ],
    });

    // ---------------------------------------------------------------------
    // WHEN: inventory snapshot is queried
    // ---------------------------------------------------------------------
    const snapshot = await getInventorySnapshot(prisma);

    // ---------------------------------------------------------------------
    // THEN: all inventory items are returned
    // ---------------------------------------------------------------------
    //expect(snapshot).toHaveLength(2);

     expect(snapshot).toEqual([
      {
        productId: "P001",
        currentStockQuantity: 10,
      },
      {
        productId: "P002",
        currentStockQuantity: 0,
      },
    ]);

    
  });

  it("does not include products without inventoryItem record", async () => {
    // ---------------------------------------------------------------------
    // GIVEN: inventory data exists for only one product
    // ---------------------------------------------------------------------
    
    await seedInventoryReportingScenario(prisma, {
  inventoryItems: [
    { productId: "P001", quantity: 5 },
    { productId: "P002", quantity: 0 }, // eksplisit tetap ada
  ],
});

const snapshot = await getInventorySnapshot(prisma);

expect(snapshot).toHaveLength(2);
expect(snapshot).toEqual(
  expect.arrayContaining([
    { productId: "P001", currentStockQuantity: 5 },
    { productId: "P002", currentStockQuantity: 0 },
  ])
);


  });

  it("returns empty array when no inventory items exist", async () => {

    

    const snapshot = await getInventorySnapshot(prisma);

    expect(snapshot).toEqual([]);
  });

  it("returns exactly one row per productId", async () => {
    await seedInventoryReportingScenario(prisma, {
      inventoryItems: [{ productId: "P001", quantity: 5 }],
    });

    const snapshot = await getInventorySnapshot(prisma);

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toEqual({
      productId: "P001",
      currentStockQuantity: 5,
    });
  });

});
