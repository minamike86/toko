// inventory-low-stock.query.ts

export type InventoryLowStockDTO = {
  productId: string;
  currentStockQuantity: number;
};

type ReportingDb = {
  inventoryItem: {
    findMany: (args: {
      where: {
        quantity: {
          lte: number;
        };
      };
      orderBy: [{ quantity: "asc" }, { productId: "asc" }];
      select: {
        productId: true;
        quantity: true;
      };
    }) => Promise<
      {
        productId: string;
        quantity: number;
      }[]
    >;
  };
};

export async function getInventoryLowStock(
  db: ReportingDb,
  input: { threshold: number }
): Promise<InventoryLowStockDTO[]> {
  if (input.threshold < 0) {
    return [];
  }

  const rows = await db.inventoryItem.findMany({
    where: {
      quantity: {
        lte: input.threshold,
      },
    },
    orderBy: [
      { quantity: "asc" },
      { productId: "asc" },
    ],
    select: {
      productId: true,
      quantity: true,
    },
  });

  return rows.map((row) => ({
    productId: row.productId,
    currentStockQuantity: row.quantity,
  }));
}
