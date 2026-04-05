import { beforeEach, describe, expect, it } from "vitest";
import { CreatePurchaseOrder } from "@/modules/procurement/application/use-cases/CreatePurchaseOrder";
import { CatalogSnapshotPort } from "@/modules/procurement/application/ports/CatalogSnapshotPort";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { UserRole } from "@/modules/user/domain/UserRole";
import {
  ConflictError,
  NotFoundError,
} from "@/shared/errors/ApplicationError";
import { prisma } from "@/shared/prisma";

class FakeCatalogSnapshotPort implements CatalogSnapshotPort {
  constructor(
    private readonly snapshots: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantName: string;
      unit: string;
      isActive: boolean;
    }>,
  ) { }

  async getVariantsByIds(variantIds: string[]) {
    return this.snapshots.filter((snapshot) =>
      variantIds.includes(snapshot.variantId),
    );
  }
}

describe("CreatePurchaseOrder integration", () => {
  const supplierRepository = new PrismaSupplierRepository();
  const purchaseOrderRepository = new PrismaPurchaseOrderRepository();

  beforeEach(async () => {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();
  });

  it("creates purchase order and persists aggregate", async () => {
    const supplier = Supplier.create({
      id: supplierRepository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await supplierRepository.save(supplier);

    const catalogSnapshotPort = new FakeCatalogSnapshotPort([
      {
        productId: "prod-1",
        variantId: "var-1",
        productName: "Benang Katun",
        variantName: "Merah",
        unit: "pcs",
        isActive: true,
      },
      {
        productId: "prod-2",
        variantId: "var-2",
        productName: "Benang Sutra",
        variantName: "Biru",
        unit: "pcs",
        isActive: true,
      },
    ]);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    const result = await useCase.execute(
      {
        supplierId: supplier.id,
        items: [
          {
            variantId: "var-1",
            quantity: 2,
            unitCost: 10000,
          },
          {
            variantId: "var-2",
            quantity: 3,
            unitCost: 20000,
          },
        ],
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(result.status).toBe("CREATED");
    expect(result.totalQuantity).toBe(5);
    expect(result.totalCost).toBe(80000);
    expect(result.items).toHaveLength(2);

    const persisted = await prisma.purchaseOrder.findUnique({
      where: { id: result.id },
      include: { items: true },
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.supplierId).toBe(supplier.id);
    expect(persisted?.status).toBe("CREATED");
    expect(persisted?.items).toHaveLength(2);
  });

  it("throws when catalog snapshot is missing", async () => {
    const supplier = Supplier.create({
      id: supplierRepository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await supplierRepository.save(supplier);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      new FakeCatalogSnapshotPort([]),
    );

    await expect(
      useCase.execute(
        {
          supplierId: supplier.id,
          items: [
            {
              variantId: "var-404",
              quantity: 1,
              unitCost: 10000,
            },
          ],
        },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(NotFoundError);
  });

  it("throws when catalog variant is inactive", async () => {
    const supplier = Supplier.create({
      id: supplierRepository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await supplierRepository.save(supplier);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      new FakeCatalogSnapshotPort([
        {
          productId: "prod-1",
          variantId: "var-1",
          productName: "Benang Katun",
          variantName: "Merah",
          unit: "pcs",
          isActive: false,
        },
      ]),
    );

    await expect(
      useCase.execute(
        {
          supplierId: supplier.id,
          items: [
            {
              variantId: "var-1",
              quantity: 1,
              unitCost: 10000,
            },
          ],
        },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(ConflictError);
  });
});