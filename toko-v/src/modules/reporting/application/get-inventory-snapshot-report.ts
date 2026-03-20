import type { InventorySnapshotReportRow } from "@/modules/reporting/dto/inventory-snapshot-report.dto";
import { findInventorySnapshot } from "@/modules/reporting/inventory/inventory-snapshot.query";

export async function getInventorySnapshotReport(): Promise<
  InventorySnapshotReportRow[]
> {
  return findInventorySnapshot();
}