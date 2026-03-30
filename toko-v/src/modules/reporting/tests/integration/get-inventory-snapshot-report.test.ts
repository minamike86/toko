import { beforeEach, describe, expect, it, vi } from "vitest";

const { findInventorySnapshotMock } = vi.hoisted(() => ({
  findInventorySnapshotMock: vi.fn(),
}));

vi.mock("@/modules/reporting/queries/inventory-snapshot.query", () => ({
  findInventorySnapshot: findInventorySnapshotMock,
}));

import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";

describe("getInventorySnapshotReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps quantity to currentStockQuantity without changing ordering", async () => {
    findInventorySnapshotMock.mockResolvedValue([
      {
        variantId: "V001",
        productId: "P001",
        sku: "SKU-001",
        productName: "Produk A",
        variantName: "Merah",
        quantity: 7,
      },
    ]);

    await expect(getInventorySnapshotReport()).resolves.toEqual([
      {
        variantId: "V001",
        productId: "P001",
        sku: "SKU-001",
        productName: "Produk A",
        variantName: "Merah",
        currentStockQuantity: 7,
      },
    ]);
  });
});