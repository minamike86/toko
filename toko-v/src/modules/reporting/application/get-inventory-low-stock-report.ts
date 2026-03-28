import type { InventoryLowStockDTO } from "@/modules/reporting/dto/inventory-low-stock.dto";
import { findInventoryLowStock } from "@/modules/reporting/queries/inventory-low-stock.query";

export async function getInventoryLowStockReport(input: {
  threshold: number;
}): Promise<InventoryLowStockDTO[]> {
  return findInventoryLowStock(input);
}