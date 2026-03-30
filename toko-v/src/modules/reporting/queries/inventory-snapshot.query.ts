import { prisma } from "@/shared/prisma";

export type InventorySnapshotRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
};

export async function findInventorySnapshot(): Promise<InventorySnapshotRow[]> {
  const rows = await prisma.inventoryItem.findMany({
    orderBy: [{ variantId: "asc" }],
    select: {
      variantId: true,
      quantity: true,
      variant: {
        select: {
          productId: true,
          sku: true,
          variantName: true,
          product: {
            select: {
              name: true,
            },
          },
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

    if (!row.variant.productId) {
      throw new Error(
        `Inventory snapshot query found variant without productId: ${row.variantId}`,
      );
    }

    if (!row.variant.sku) {
      throw new Error(
        `Inventory snapshot query found variant without sku: ${row.variantId}`,
      );
    }

    if (!row.variant.variantName) {
      throw new Error(
        `Inventory snapshot query found variant without variantName: ${row.variantId}`,
      );
    }

    if (!row.variant.product.name) {
      throw new Error(
        `Inventory snapshot query found variant product without product name: ${row.variantId}`,
      );
    }

    return {
      variantId: row.variantId,
      productId: row.variant.productId,
      sku: row.variant.sku,
      productName: row.variant.product.name,
      variantName: row.variant.variantName,
      quantity: row.quantity,
    };
  });
}