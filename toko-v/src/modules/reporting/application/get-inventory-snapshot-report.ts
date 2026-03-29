import { findInventorySnapshot } from "@/modules/reporting/queries/inventory-snapshot.query";
import { InventorySnapshotReportRow } from "../dto/inventory-snapshot-report.dto";

export async function getInventorySnapshotReport(): Promise<
  InventorySnapshotReportRow[]
> {
  const rows = await findInventorySnapshot();

  return rows.map((row) => ({
    productId: row.productId,
    variantId: row.variantId,
    currentStockQuantity: row.quantity,
  }));
}