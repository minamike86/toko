import { PrismaClient } from "@prisma/client";

export async function seedInventory(
  prisma: PrismaClient,
  params: {
    productId: string;
    quantity: number;
  }
) {
  const { productId, quantity } = params;

  if (quantity < 0) {
    throw new Error("seedInventory: quantity must be >= 0");
  }

  await prisma.inventoryItem.upsert({
    where: { productId },
    create: {
      productId,
      quantity,
    },
    update: {
      quantity,
    },
  });
}
