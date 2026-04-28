import { describe, expect, it } from "vitest";
import { CreatePurchaseOrder } from "@/modules/procurement/application/use-cases/CreatePurchaseOrder";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { CatalogSnapshotPort } from "@/modules/procurement/application/ports/CatalogSnapshotPort";
import { UserRole } from "@/modules/user/domain/UserRole";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/ApplicationError";

class InMemorySupplierRepository implements SupplierRepository {
  private readonly items = new Map<string, Supplier>();

  nextId(): string {
    return "sup-next";
  }

  async save(supplier: Supplier): Promise<void> {
    this.items.set(supplier.id, supplier);
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.items.get(id) ?? null;
  }

  async findByStoreName(storeName: string): Promise<Supplier | null> {
    for (const supplier of this.items.values()) {
      if (supplier.storeName === storeName.trim()) {
        return supplier;
      }
    }

    return null;
  }

  seed(supplier: Supplier): void {
    this.items.set(supplier.id, supplier);
  }
}

class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly items = new Map<string, PurchaseOrder>();
  private itemSequence = 0;

  nextId(): string {
    return "po-1";
  }

  nextItemId(): string {
    this.itemSequence += 1;
    return `poi-${this.itemSequence}`;
  }

  async save(order: PurchaseOrder): Promise<void> {
    this.items.set(order.id, order);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.items.get(id) ?? null;
  }
}

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

describe("CreatePurchaseOrder", () => {
  it("creates purchase order from active supplier and active catalog variants", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([
      {
        productId: "prod-1",
        variantId: "var-1",
        productName: "Benang Katun",
        variantName: "Merah",
        unit: "pcs",
        isActive: true,
      },
    ]);

    supplierRepository.seed(
      Supplier.create({
        id: "sup-1",
        storeName: "Toko Benang Makmur",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      }),
    );

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    const result = await useCase.execute(
      {
        supplierId: "sup-1",
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

    expect(result.id).toBe("po-1");
    expect(result.status).toBe("CREATED");
    expect(result.totalQuantity).toBe(2);
    expect(result.totalCost).toBe(20000);
    expect(result.createdBy).toBe("user-1");
    expect(result.items).toHaveLength(1);
  });

  it("rejects empty purchase order items", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([]);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
          items: [],
        },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(ValidationError);
  });

  it("throws when supplier is not found", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([]);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
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
    ).rejects.toThrowError(NotFoundError);
  });

  it("throws when supplier is inactive", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([
      {
        productId: "prod-1",
        variantId: "var-1",
        productName: "Benang Katun",
        variantName: "Merah",
        unit: "pcs",
        isActive: true,
      },
    ]);

    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });
    supplier.deactivate();

    supplierRepository.seed(supplier);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
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
    ).rejects.toThrow();
  });

  it("throws when variant snapshot is not found", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([]);

    supplierRepository.seed(
      Supplier.create({
        id: "sup-1",
        storeName: "Toko Benang Makmur",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      }),
    );

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
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
    ).rejects.toThrowError(NotFoundError);
  });

  it("throws when variant is inactive", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([
      {
        productId: "prod-1",
        variantId: "var-1",
        productName: "Benang Katun",
        variantName: "Merah",
        unit: "pcs",
        isActive: false,
      },
    ]);

    supplierRepository.seed(
      Supplier.create({
        id: "sup-1",
        storeName: "Toko Benang Makmur",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      }),
    );

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
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

  it("rejects non admin and non warehouse actor", async () => {
    const supplierRepository = new InMemorySupplierRepository();
    const purchaseOrderRepository = new InMemoryPurchaseOrderRepository();
    const catalogSnapshotPort = new FakeCatalogSnapshotPort([]);

    const useCase = new CreatePurchaseOrder(
      supplierRepository,
      purchaseOrderRepository,
      catalogSnapshotPort,
    );

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
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
          role: UserRole.SALES,
        },
      ),
    ).rejects.toThrowError(ForbiddenError);
  });
});