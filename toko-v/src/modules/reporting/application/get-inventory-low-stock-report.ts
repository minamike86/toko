import { findInventoryLowStock } from "@/modules/reporting/queries/inventory-low-stock.query";
import type { InventoryLowStockDTO } from "../dto/inventory-low-stock.dto";

export async function getInventoryLowStockReport(
  threshold: number,
): Promise<InventoryLowStockDTO[]> {
  return findInventoryLowStock(threshold);
}