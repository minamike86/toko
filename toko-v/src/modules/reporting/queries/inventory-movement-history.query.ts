import { prisma } from "@/shared/prisma";

type MovementWhere = {
  productId?: string;
  variantId?: string;
  occurredAt?: {
    gte?: Date;
    lte?: Date;
  };
};

export type InventoryMovementHistoryRow = {
  id: string;
  productId: string;
  variantId: string | null;
  occurredAt: Date;
  type: string;
  origin: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
};

export async function findInventoryMovementHistory(filter?: {
  productId?: string;
  variantId?: string;
  from?: Date;
  to?: Date;
}): Promise<InventoryMovementHistoryRow[]> {
  const where: MovementWhere = {};

  if (filter?.productId) {
    where.productId = filter.productId;
  }

  if (filter?.variantId) {
    where.variantId = filter.variantId;
  }

  if (filter?.from || filter?.to) {
    where.occurredAt = {
      ...(filter.from ? { gte: filter.from } : {}),
      ...(filter.to ? { lte: filter.to } : {}),
    };
  }

  const rows = await prisma.stockMovement.findMany({
    where,
    orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      productId: true,
      variantId: true,
      occurredAt: true,
      type: true,
      origin: true,
      quantity: true,
      reason: true,
      referenceId: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    variantId: row.variantId,
    occurredAt: row.occurredAt,
    type: row.type,
    origin: row.origin,
    quantity: row.quantity,
    reason: row.reason,
    referenceId: row.referenceId,
  }));
}