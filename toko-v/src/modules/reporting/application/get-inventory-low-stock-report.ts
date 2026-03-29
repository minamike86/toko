import { findInventoryLowStock } from "@/modules/reporting/queries/inventory-low-stock.query";
import { InventoryLowStockDTO } from "../dto/inventory-low-stock.dto";

export async function getInventoryLowStockReport(
  threshold: number,
): Promise<InventoryLowStockDTO[]> {
  const rows = await findInventoryLowStock(threshold);

  return rows.map((row) => ({
    productId: row.productId,
    variantId: row.variantId,
    currentStockQuantity: row.quantity,
  }));
}