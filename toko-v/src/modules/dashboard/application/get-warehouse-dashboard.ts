import { getInventoryLowStockReport } from "@/modules/reporting/application/get-inventory-low-stock-report";
import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";
import type { WarehouseDashboardDTO } from "../dto/warehouse-dashboard.dto";

const LOW_STOCK_THRESHOLD = 10;

export async function getWarehouseDashboard(): Promise<WarehouseDashboardDTO> {
  const snapshot = await getInventorySnapshotReport();
  const lowStock = await getInventoryLowStockReport(LOW_STOCK_THRESHOLD);

  const lowStockSet = new Set(lowStock.map((item) => item.variantId));

  const items = snapshot.map((row) => ({
    variantId: row.variantId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    unit: row.unit,
    currentStockQuantity: row.currentStockQuantity,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    isLowStock: lowStockSet.has(row.variantId),
  }));

  return {
    asOf: new Date(),
    totalVariants: items.length,
    lowStockCount: lowStock.length,
    items,
  };
}