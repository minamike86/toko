import { beforeEach, describe, expect, it } from "vitest";

import { CreatePurchaseOrder } from "@/modules/procurement/application/use-cases/CreatePurchaseOrder";
import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import { CatalogSnapshotPort } from "@/modules/procurement/application/ports/CatalogSnapshotPort";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { InventoryProcurementAdapter } from "@/modules/procurement/infrastructure/InventoryProcurementAdapter";
import { ReceivePurchaseStock } from "@/modules/inventory/application/ReceivePurchaseStock";
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

describe("ReceivePurchaseOrder integration", () => {
  const supplierRepository = new PrismaSupplierRepository();
  const purchaseOrderRepository = new PrismaPurchaseOrderRepository();
  const inventoryRepository = new PrismaInventoryRepository(prisma);

  beforeEach(async () => {
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

    const receivePurchaseStock = new ReceivePurchaseStock({
      inventoryRepo: inventoryRepository,
    });

    const inventoryProcurementAdapter = new InventoryProcurementAdapter(
      receivePurchaseStock,
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    const receivePurchaseOrder = new ReceivePurchaseOrder(
      purchaseOrderRepository,
      inventoryProcurementAdapter,
    );

    const receivedOrder = await receivePurchaseOrder.execute(
      {
        purchaseOrderId: createdOrder.id,
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

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
    expect(movements[0].variantId).toBe("var-1");
    expect(movements[0].type).toBe("IN");
    expect(movements[0].origin).toBe("PURCHASE");
    expect(movements[0].referenceId).toBe(createdOrder.id);

    const persistedOrder = await prisma.purchaseOrder.findUnique({
      where: { id: createdOrder.id },
    });

    expect(persistedOrder).not.toBeNull();
    expect(persistedOrder?.status).toBe("RECEIVED");
    expect(persistedOrder?.receivedBy).toBe("user-1");
  });
});