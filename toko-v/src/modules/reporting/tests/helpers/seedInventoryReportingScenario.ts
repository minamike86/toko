import { PrismaClient } from "@prisma/client";

export type InventorySeedItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type StockMovementSeedItem = {
  id: string;
  productId: string;
  variantId: string | null;
  type: string;
  origin: string;
  quantity: number;
  reason: string;
  referenceId?: string | null;
  occurredAt: Date;
};

export type SeedInventoryReportingScenarioInput =
  | InventorySeedItem[]
  | {
    inventoryItems?: InventorySeedItem[];
    stockMovements?: StockMovementSeedItem[];
  };

export async function seedInventoryReportingScenario(
  prisma: PrismaClient,
  input: SeedInventoryReportingScenarioInput,
): Promise<void> {
  const inventoryItems = Array.isArray(input) ? input : (input.inventoryItems ?? []);
  const stockMovements = Array.isArray(input) ? [] : (input.stockMovements ?? []);

  const ensureProductAndVariant = async (
    productId: string,
    variantId: string,
  ): Promise<void> => {
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
      where: { id: variantId },
    });

    if (!variant) {
      await prisma.productVariant.create({
        data: {
          id: variantId,
          productId,
          sku: variantId,
          variantName: variantId,
          unit: "PCS",
          sizeLabel: null,
          colorLabel: null,
          basePrice: 0,
          isActive: true,
        },
      });
    }
  };

  for (const item of inventoryItems) {
    await ensureProductAndVariant(item.productId, item.variantId);

    const existing = await prisma.inventoryItem.findUnique({
      where: { variantId: item.variantId },
    });

    if (existing) {
      await prisma.inventoryItem.update({
        where: { variantId: item.variantId },
        data: {
          quantity: item.quantity,
        },
      });
      continue;
    }

    await prisma.inventoryItem.create({
      data: {
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }

  for (const movement of stockMovements) {
    if (movement.variantId) {
      await ensureProductAndVariant(movement.productId, movement.variantId);
    } else {
      const product = await prisma.product.findUnique({
        where: { id: movement.productId },
      });

      if (!product) {
        await prisma.product.create({
          data: {
            id: movement.productId,
            name: movement.productId,
            brand: null,
            isActive: true,
          },
        });
      }
    }

    await prisma.stockMovement.create({
      data: {
        id: movement.id,
        productId: movement.productId,
        variantId: movement.variantId,
        type: movement.type,
        origin: movement.origin,
        quantity: movement.quantity,
        reason: movement.reason,
        referenceId: movement.referenceId ?? null,
        occurredAt: movement.occurredAt,
      },
    });
  }
}