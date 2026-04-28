import type { InventoryMovementHistoryDTO } from "@/modules/reporting/dto/inventory-movement-history.dto";
import { findInventoryMovementHistory } from "@/modules/reporting/queries/inventory-movement-history.query";

export async function getInventoryMovementHistoryReport(filter?: {
  productId?: string;
  variantId?: string;
  from?: Date;
  to?: Date;
}): Promise<InventoryMovementHistoryDTO[]> {
  const rows = await findInventoryMovementHistory(filter);

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    variantId: row.variantId,
    movementDate: row.occurredAt,
    movementType: row.type,
    origin: row.origin,
    quantity: row.quantity,
    reason: row.reason,
    referenceId: row.referenceId,
  }));
}