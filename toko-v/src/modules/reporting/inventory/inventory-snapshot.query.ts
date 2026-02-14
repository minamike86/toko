export type InventorySnapshotDTO = {
  productId: string;
  currentStockQuantity: number;
};

type ReportingDb = {
  inventoryItem: {
    findMany: (args: {
      select: { productId: true; quantity: true };
      orderBy: { productId: "asc" };
    }) => Promise<{ productId: string; quantity: number }[]>;
  };
};

export async function getInventorySnapshot(
  db: ReportingDb
): Promise<InventorySnapshotDTO[]> {
  const rows = await db.inventoryItem.findMany({
    select: {
      productId: true,
      quantity: true,
    },
    orderBy: { productId: "asc" },
  });

  return rows.map((row) => ({
    productId: row.productId,
    currentStockQuantity: row.quantity,
  }));
}
