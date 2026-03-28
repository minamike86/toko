import type { InventoryMovementHistoryDTO } from "@/modules/reporting/dto/inventory-movement-history.dto";
import { findInventoryMovementHistory } from "@/modules/reporting/queries/inventory-movement-history.query";

export async function getInventoryMovementHistoryReport(filter?: {
  productId?: string;
  from?: Date;
  to?: Date;
}): Promise<InventoryMovementHistoryDTO[]> {
  return findInventoryMovementHistory(filter);
}