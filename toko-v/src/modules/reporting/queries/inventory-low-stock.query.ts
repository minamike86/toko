import { prisma } from "@/shared/prisma";
import type { InventoryLowStockDTO } from "../dto/inventory-low-stock.dto";

function buildVariantName(input: {
  sizeLabel: string | null;
  colorLabel: string | null;
}): string {
  const parts = [input.sizeLabel, input.colorLabel].filter(
    (value): value is string => value !== null && value.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(" / ") : "Default";
}

export async function findInventoryLowStock(
  threshold: number,
): Promise<InventoryLowStockDTO[]> {
  const rows = await prisma.inventoryItem.findMany({
    where: {
      quantity: {
        lte: threshold,
      },
    },
    select: {
      variantId: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          productId: true,
          sku: true,
          unit: true,
          sizeLabel: true,
          colorLabel: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ quantity: "asc" }, { variantId: "asc" }],
  });

  return rows.map((row) => ({
    productId: row.variant.productId,
    variantId: row.variantId,
    sku: row.variant.sku,
    productName: row.variant.product.name,
    variantName: buildVariantName({
      sizeLabel: row.variant.sizeLabel,
      colorLabel: row.variant.colorLabel,
    }),
    unit: row.variant.unit,
    currentStockQuantity: row.quantity,
  }));
}