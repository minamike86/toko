import { PrismaClient } from "@prisma/client";

export async function seedStockMovement(
  prisma: PrismaClient,
  params: {
    id: string;
    productId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    occurredAt: Date;
    reason?: string;
    referenceId?: string;
  }
) {
  const {
    id,
    productId,
    type,
    quantity,
    occurredAt,
    reason = "seed",
    referenceId,
  } = params;

  if (quantity <= 0) {
    throw new Error("seedStockMovement: quantity must be > 0");
  }

  await prisma.stockMovement.upsert({
    where: { id },
    create: {
      id,
      productId,
      type,
      quantity,
      occurredAt,
      reason,
      referenceId,
    },
    update: {
      // movement immutable → no-op
    },
  });
}
