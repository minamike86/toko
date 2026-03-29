import { PrismaClient } from "@prisma/client";

export type SeedInventoryItemInput = {
  variantId: string;
  quantity: number;
  productId?: string;
};

export async function seedInventory(
  prisma: PrismaClient,
  input: SeedInventoryItemInput,
): Promise<void> {
  const productId = input.productId ?? `P-${input.variantId}`;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    await prisma.product.create({
      data: {
        id: productId,
        name: productId,
        brand: null,
        isActive: true,
      },
    });
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
  });

  if (!variant) {
    await prisma.productVariant.create({
      data: {
        id: input.variantId,
        productId,
        sku: input.variantId,
        variantName: input.variantId,
        unit: "PCS",
        sizeLabel: null,
        colorLabel: null,
        basePrice: 0,
        isActive: true,
      },
    });
  }

  const existing = await prisma.inventoryItem.findUnique({
    where: { variantId: input.variantId },
  });

  if (existing) {
    await prisma.inventoryItem.update({
      where: { variantId: input.variantId },
      data: {
        quantity: input.quantity,
      },
    });
    return;
  }

  await prisma.inventoryItem.create({
    data: {
      variantId: input.variantId,
      quantity: input.quantity,
    },
  });
}