// inventory-movement-history-query.ts

import { prisma } from "@/shared/prisma";
import type { InventoryMovementHistoryDTO } from "@/modules/reporting/dto/inventory-movement-history.dto"


type MovementWhere = {
  productId?: string;
  occurredAt?: {
    gte?: Date;
    lte?: Date;
  };
};

export async function findInventoryMovementHistory(filter?: {
  productId?: string;
  from?: Date;
  to?: Date;
}): Promise<InventoryMovementHistoryDTO[]> {
  const where: MovementWhere = {};

  if (filter?.productId) {
    where.productId = filter.productId;
  }

  if (filter?.from || filter?.to) {
    where.occurredAt = {
      ...(filter.from ? { gte: filter.from } : {}),
      ...(filter.to ? { lte: filter.to } : {}),
    };
  }

  const rows = await prisma.stockMovement.findMany({
    where,
    orderBy: [
      { occurredAt: "asc" },
      { id: "asc" },
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    movementDate: row.occurredAt,
    movementType: row.type,
    quantity: row.quantity,
    reason: row.reason,
    referenceId: row.referenceId,
  }));
}