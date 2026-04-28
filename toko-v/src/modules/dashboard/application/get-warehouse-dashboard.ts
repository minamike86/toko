import { getInventoryLowStockReport } from "@/modules/reporting/application/get-inventory-low-stock-report";
import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";
import type {
  WarehouseDashboardDTO,
  WarehouseDashboardItemDTO,
} from "../dto/warehouse-dashboard.dto";

const LOW_STOCK_THRESHOLD = 10;

export async function getWarehouseDashboard(): Promise<WarehouseDashboardDTO> {
  const [snapshotRows, lowStockRows] = await Promise.all([
    getInventorySnapshotReport(),
    getInventoryLowStockReport(LOW_STOCK_THRESHOLD),
  ]);

  const lowStockVariantIds = new Set<string>(
    lowStockRows
      .map((row) => row.variantId)
      .filter((variantId): variantId is string => variantId !== null),
  );

  const items: WarehouseDashboardItemDTO[] = snapshotRows.map((row) => ({
    variantId: row.variantId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    unit: row.unit,
    currentStockQuantity: row.currentStockQuantity,
    isLowStock: lowStockVariantIds.has(row.variantId),
  }));

  return {
    asOf: new Date(),
    totalVariants: items.length,
    lowStockCount: lowStockRows.length,
    items,
  };
}