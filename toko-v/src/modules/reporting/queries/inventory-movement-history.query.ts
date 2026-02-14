export type InventoryMovementHistoryDTO = {
  id: string;
  productId: string;
  movementDate: Date;
  movementType: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
};

type MovementWhere = {
  productId?: string;
  occurredAt?: {
    gte?: Date;
    lte?: Date;
  };
};

type MovementRow = {
  id: string;
  productId: string;
  occurredAt: Date;
  type: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
};


type ReportingDb = {
  stockMovement: {
    findMany: (args: {
      where?: MovementWhere;
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }];
    }) => Promise<MovementRow[]>;
  };
};

export async function getInventoryMovementHistory(
  db: ReportingDb,
  filter?: {
    productId?: string;
    from?: Date;
    to?: Date;
  }
): Promise<InventoryMovementHistoryDTO[]> {
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

  const rows = await db.stockMovement.findMany({
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
