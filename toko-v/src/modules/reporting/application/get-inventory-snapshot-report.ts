import {
  findInventorySnapshot,
  type InventorySnapshotRow,
} from "@/modules/reporting/queries/inventory-snapshot.query";
import type { InventorySnapshotReportRow } from "@/modules/reporting/dto/inventory-snapshot-report.dto";

export async function getInventorySnapshotReport(): Promise<
  InventorySnapshotReportRow[]
> {
  const rows: InventorySnapshotRow[] = await findInventorySnapshot();

  return rows.map((row) => ({
    variantId: row.variantId,
    productId: row.productId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    unit: row.unit,
    currentStockQuantity: row.quantity,
  }));
}