import { prisma } from "@/shared/prisma";
import type { InventorySnapshotReportRow } from "@/modules/reporting/dto/inventory-snapshot-report.dto";

export async function findInventorySnapshot(): Promise<
  InventorySnapshotReportRow[]
> {
  const rows = await prisma.inventoryItem.findMany({
    select: {
      productId: true,
      quantity: true,
    },
    orderBy: {
      productId: "asc",
    },
  });

  return rows.map((row) => ({
    productId: row.productId,
    currentStockQuantity: row.quantity,
  }));
}