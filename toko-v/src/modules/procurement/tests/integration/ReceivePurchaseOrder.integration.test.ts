import { beforeEach, describe, expect, it } from "vitest";

import { CreatePurchaseOrder } from "@/modules/procurement/application/use-cases/CreatePurchaseOrder";
import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import { CatalogSnapshotPort } from "@/modules/procurement/application/ports/CatalogSnapshotPort";
import type { ProcurementUnitNormalizationPort } from "@/shared/application/unit-normalization/procurement-unit-normalization.port";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { InventoryProcurementAdapter } from "@/modules/procurement/infrastructure/InventoryProcurementAdapter";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";
import { PrismaInventoryRepository } from "@/modules/inventory/infrastructure/PrismaInventoryRepository";
import { UserRole } from "@/modules/user/domain/UserRole";
import { prisma } from "@/shared/prisma";

class FakeCatalogSnapshotPort implements CatalogSnapshotPort {
  async getVariantsByIds(variantIds: string[]) {
    return variantIds.map((variantId) => ({
      productId: "prod-1",
      variantId,
      productName: "Benang Katun",
      variantName: "Merah",
      unit: "pcs",
      isActive: true,
    }));
  }
}

class IdentityNormalizationPort implements ProcurementUnitNormalizationPort {
  async normalizeProcurementItem(input: {
    variantId: string;
    transactionUnit: string;
    transactionQuantity: number;
    referenceId: string;
  }): Promise<{
    variantId: string;
    transactionUnit: string;
    transactionQuantity: number;
    canonicalUnit: string;
    canonicalQuantity: number;
    referenceId: string;
  }> {
    return {
      variantId: input.variantId,
      transactionUnit: input.transactionUnit,
      transactionQuantity: input.transactionQuantity,
      canonicalUnit: input.transactionUnit,
      canonicalQuantity: input.transactionQuantity,
      referenceId: input.referenceId,
    };
  }
}

describe("ReceivePurchaseOrder integration", () => {
  const supplierRepository = new PrismaSupplierRepository();
  const purchaseOrderRepository = new PrismaPurchaseOrderRepository();
  const inventoryRepository = new PrismaInventoryRepository(prisma);

  beforeEach(async () => {

    await prisma.purchaseReturnReductionItem.deleteMany();
    await prisma.purchaseReturnReduction.deleteMany();
    await prisma.supplierPayment.deleteMany();

    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();

    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();

    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    await prisma.product.create({
      data: {
        id: "prod-1",
        name: "Benang Katun",
        brand: null,
        isActive: true,
      },
    });

    await prisma.productVariant.create({
      data: {
        id: "var-1",
        productId: "prod-1",
        sku: "SKU-VAR-1",
        variantName: "Merah",
        unit: "pcs",
        sizeLabel: null,
        colorLabel: null,
        basePrice: 0,
        isActive: true,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        variantId: "var-1",
        quantity: 0,
      },
    });
  });

  it("adds stock, writes purchase movement, and marks PO as RECEIVED", async () => {
    const supplier = Supplier.create({
      id: supplierRepository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-05T00:00:00.000Z"),
    });

    await supplierRepository.save(supplier);

    const createPurchaseOrder = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      new FakeCatalogSnapshotPort(),
    );

    const createdOrder = await createPurchaseOrder.execute(
      {
        supplierId: supplier.id,
        items: [
          {
            variantId: "var-1",
            quantity: 2,
            unitCost: 10000,
          },
        ],
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    const receiveStock = new ReceiveStock({
      inventoryRepo: inventoryRepository,
    });

    const inventoryProcurementAdapter = new InventoryProcurementAdapter(
      receiveStock,
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    const receivePurchaseOrder = new ReceivePurchaseOrder(
      purchaseOrderRepository,
      new IdentityNormalizationPort(),
      inventoryProcurementAdapter,
    );

    const receivedOrder = await receivePurchaseOrder.execute({
      purchaseOrderId: createdOrder.id,
      actor: {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    });

    expect(receivedOrder.status).toBe("RECEIVED");
    expect(receivedOrder.receivedBy).toBe("user-1");

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { variantId: "var-1" },
    });

    expect(inventoryItem).not.toBeNull();
    expect(inventoryItem?.quantity).toBe(2);

    const movements = await prisma.stockMovement.findMany({
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    });

    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      variantId: "var-1",
      type: "IN",
      quantity: 2,
      reason: "PROCUREMENT_RECEIVE",
      origin: "PURCHASE",
      referenceId: createdOrder.id,
    });

    const persistedOrder = await prisma.purchaseOrder.findUnique({
      where: { id: createdOrder.id },
    });

    expect(persistedOrder?.status).toBe("RECEIVED");
    expect(persistedOrder?.receivedBy).toBe("user-1");
  });
});