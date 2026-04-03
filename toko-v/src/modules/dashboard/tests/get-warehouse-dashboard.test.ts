import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getInventorySnapshotReportMock,
  getInventoryLowStockReportMock,
} = vi.hoisted(() => ({
  getInventorySnapshotReportMock: vi.fn(),
  getInventoryLowStockReportMock: vi.fn(),
}));

vi.mock("@/modules/reporting/application/get-inventory-snapshot-report", () => ({
  getInventorySnapshotReport: getInventorySnapshotReportMock,
}));

vi.mock("@/modules/reporting/application/get-inventory-low-stock-report", () => ({
  getInventoryLowStockReport: getInventoryLowStockReportMock,
}));

import { getWarehouseDashboard } from "@/modules/dashboard/application/get-warehouse-dashboard";

describe("getWarehouseDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes dashboard from reporting only", async () => {
    getInventorySnapshotReportMock.mockResolvedValue([
      {
        variantId: "V001",
        productId: "P001",
        sku: "SKU-001",
        productName: "Produk A",
        variantName: "Merah",
        unit: "PCS",
        currentStockQuantity: 4,
      },
      {
        variantId: "V002",
        productId: "P001",
        sku: "SKU-002",
        productName: "Produk A",
        variantName: "Biru",
        unit: "PCS",
        currentStockQuantity: 20,
      },
    ]);

    getInventoryLowStockReportMock.mockResolvedValue([
      {
        productId: "P001",
        variantId: "V001",
        unit: "PCS",
        currentStockQuantity: 4,
      },
    ]);

    const result = await getWarehouseDashboard();

    expect(result.totalVariants).toBe(2);
    expect(result.lowStockCount).toBe(1);
    expect(result.items).toEqual([
      {
        variantId: "V001",
        sku: "SKU-001",
        productName: "Produk A",
        variantName: "Merah",
        unit: "PCS",
        currentStockQuantity: 4,
        lowStockThreshold: 10,
        isLowStock: true,
      },
      {
        variantId: "V002",
        sku: "SKU-002",
        productName: "Produk A",
        variantName: "Biru",
        unit: "PCS",
        currentStockQuantity: 20,
        lowStockThreshold: 10,
        isLowStock: false,
      },
    ]);
  });
});