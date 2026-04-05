import { beforeEach, describe, expect, it } from "vitest";
import { CreatePurchaseOrder } from "@/modules/procurement/application/use-cases/CreatePurchaseOrder";
import { ReceivePurchaseOrder } from "@/modules/procurement/application/use-cases/ReceivePurchaseOrder";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { InventoryProcurementAdapter } from "@/modules/procurement/infrastructure/InventoryProcurementAdapter";
import { ReceivePurchaseStock } from "@/modules/inventory/application/ReceivePurchaseStock";
import { PrismaInventoryRepository } from "@/modules/inventory/infrastructure/PrismaInventoryRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { UserRole } from "@/modules/user/domain/UserRole";
import { prisma } from "@/shared/prisma";

class FakeCatalogSnapshotPort {
  async getVariantsByIds(ids: string[]) {
    return ids.map((id) => ({
      productId: "prod-1",
      variantId: id,
      productName: "A",
      variantName: "A1",
      unit: "pcs",
      isActive: true,
    }));
  }
}

describe("ReceivePurchaseOrder integration", () => {
  const supplierRepo = new PrismaSupplierRepository();
  const poRepo = new PrismaPurchaseOrderRepository();
  const inventoryRepo = new PrismaInventoryRepository(prisma);

  beforeEach(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    await prisma.product.create({ data: { id: "prod-1", name: "A", isActive: true } });
    await prisma.productVariant.create({ data: { id: "var-1", productId: "prod-1", sku: "sku", variantName: "A1", unit: "pcs", basePrice: 0, isActive: true } });
    await prisma.inventoryItem.create({ data: { variantId: "var-1", quantity: 0 } });
  });

  it("adds stock and sets PO to RECEIVED", async () => {
    const supplier = Supplier.create({ id: supplierRepo.nextId(), storeName: "Toko", createdAt: new Date() });
    await supplierRepo.save(supplier);

    const create = new CreatePurchaseOrder(supplierRepo, poRepo, new FakeCatalogSnapshotPort() as any);

    const created = await create.execute({ supplierId: supplier.id, items: [{ variantId: "var-1", quantity: 2, unitCost: 10 }] }, { actorId: "u1", role: UserRole.ADMIN });

    const inventoryUseCase = new ReceivePurchaseStock({ inventoryRepo });
    const adapter = new InventoryProcurementAdapter(inventoryUseCase, { actorId: "u1", role: UserRole.ADMIN });

    const receive = new ReceivePurchaseOrder(poRepo, adapter);

    const result = await receive.execute({ purchaseOrderId: created.id }, { actorId: "u1", role: UserRole.ADMIN });

    expect(result.status).toBe("RECEIVED");

    const stock = await prisma.inventoryItem.findUnique({ where: { variantId: "var-1" } });
    expect(stock?.quantity).toBe(2);

    const movements = await prisma.stockMovement.findMany();
    expect(movements.length).toBe(1);
    expect(movements[0].origin).toBe("PURCHASE");
  });
});
