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

  const origin = type === "ADJUST" ? "MANUAL_ADJUSTMENT" : "LEGACY";

  await prisma.stockMovement.upsert({
    where: { id },
    create: {
      id,
      productId,
      type,
      origin,
      quantity,
      occurredAt,
      reason,
      referenceId,
    },
    update: {
      // movement immutable -> no-op
    },
  });
}