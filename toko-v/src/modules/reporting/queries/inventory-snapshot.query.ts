import { prisma } from "@/shared/prisma";

export type InventorySnapshotRow = {
  variantId: string;
  productId: string;
  quantity: number;
};

export async function findInventorySnapshot(): Promise<
  InventorySnapshotRow[]
> {
  const rows = await prisma.inventoryItem.findMany({
    orderBy: [{ variantId: "asc" }],
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
        `Inventory snapshot query found inventory item without related variant: ${row.variantId}`,
      );
    }

    return {
      variantId: row.variantId,
      productId: row.variant.productId,
      quantity: row.quantity,
    };
  });
}