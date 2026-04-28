import { describe, expect, it } from "vitest";
import { UpdateSupplierStatus } from "@/modules/procurement/application/use-cases/UpdateSupplierStatus";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { UserRole } from "@/modules/user/domain/UserRole";
import { ForbiddenError, NotFoundError } from "@/shared/errors/ApplicationError";

class InMemorySupplierRepository implements SupplierRepository {
  private readonly items = new Map<string, Supplier>();

  nextId(): string {
    return "sup-1";
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

describe("UpdateSupplierStatus", () => {
  it("deactivates supplier when actor is admin", async () => {
    const repository = new InMemorySupplierRepository();
    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    repository.seed(supplier);

    const useCase = new UpdateSupplierStatus(repository);

    const result = await useCase.execute(
      {
        supplierId: "sup-1",
        isActive: false,
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(result.isActive).toBe(false);
  });

  it("throws when supplier is not found", async () => {
    const repository = new InMemorySupplierRepository();
    const useCase = new UpdateSupplierStatus(repository);

    await expect(
      useCase.execute(
        {
          supplierId: "missing",
          isActive: false,
        },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(NotFoundError);
  });

  it("rejects non admin actor", async () => {
    const repository = new InMemorySupplierRepository();
    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    repository.seed(supplier);

    const useCase = new UpdateSupplierStatus(repository);

    await expect(
      useCase.execute(
        {
          supplierId: "sup-1",
          isActive: false,
        },
        {
          actorId: "user-1",
          role: UserRole.WAREHOUSE,
        },
      ),
    ).rejects.toThrowError(ForbiddenError);
  });
});