import { prisma } from "@/shared/prisma";

export type InventoryLowStockRow = {
  productId: string;
  variantId: string;
  quantity: number;
};

type FindInventoryLowStockInput =
  | number
  | {
    threshold: number;
  };

export async function findInventoryLowStock(
  input: FindInventoryLowStockInput,
): Promise<InventoryLowStockRow[]> {
  const threshold = typeof input === "number" ? input : input.threshold;

  const rows = await prisma.inventoryItem.findMany({
    where: {
      quantity: {
        lte: threshold,
      },
    },
    orderBy: [{ quantity: "asc" }, { variantId: "asc" }],
    select: {
      variantId: true,
      quantity: true,
      variant: {
        select: {
          productId: true,
        },
      },
    },
  });

  return rows.map((row) => {
    if (!row.variant) {
      throw new Error(
        `Inventory low stock query found inventory item without related variant: ${row.variantId}`,
      );
    }

    return {
      productId: row.variant.productId,
      variantId: row.variantId,
      quantity: row.quantity,
    };
  });
}