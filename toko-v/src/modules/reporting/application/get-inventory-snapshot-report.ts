import type { InventorySnapshotReportRow } from "@/modules/reporting/dto/inventory-snapshot-report.dto";
import { findInventorySnapshot } from "@/modules/reporting/queries/inventory-snapshot.query";

export async function getInventorySnapshotReport(): Promise<
  InventorySnapshotReportRow[]
> {
  const rows = await findInventorySnapshot();

  return rows.map((row) => ({
    variantId: row.variantId,
    productId: row.productId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    currentStockQuantity: row.quantity,
  }));
}
