// inventory-low-stock-query.ts

import { prisma } from "@/shared/prisma";
import type { InventoryLowStockDTO } from "@/modules/reporting/dto/inventory-low-stock.dto"


export async function findInventoryLowStock(input: {
  threshold: number;
}): Promise<InventoryLowStockDTO[]> {
  if (input.threshold < 0) return [];

  const rows = await prisma.inventoryItem.findMany({
    where: {
      quantity: { lte: input.threshold },
    },
    orderBy: [
      { quantity: "asc" },
      { productId: "asc" },
    ],
    select: {
      productId: true,
      quantity: true,
    },
  });

  return rows.map((row) => ({
    productId: row.productId,
    currentStockQuantity: row.quantity,
  }));
}