import { describe, expect, it } from "vitest";
import { CreateSupplier } from "@/modules/procurement/application/use-cases/CreateSupplier";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { UserRole } from "@/modules/user/domain/UserRole";
import { ConflictError, ForbiddenError } from "@/shared/errors/ApplicationError";

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
}

describe("CreateSupplier", () => {
  it("creates supplier when actor is admin", async () => {
    const repository = new InMemorySupplierRepository();
    const useCase = new CreateSupplier(repository);

    const result = await useCase.execute(
      {
        storeName: "Toko Benang Makmur",
        salesName: "Budi",
        phone: "08123",
        notes: "utama",
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(result.id).toBe("sup-1");
    expect(result.storeName).toBe("Toko Benang Makmur");
    expect(result.isActive).toBe(true);
  });

  it("rejects duplicate supplier store name", async () => {
    const repository = new InMemorySupplierRepository();
    const useCase = new CreateSupplier(repository);

    await useCase.execute(
      {
        storeName: "Toko Benang Makmur",
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    await expect(
      useCase.execute(
        {
          storeName: "Toko Benang Makmur",
        },
        {
          actorId: "user-2",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(ConflictError);
  });

  it("rejects non admin actor", async () => {
    const repository = new InMemorySupplierRepository();
    const useCase = new CreateSupplier(repository);

    await expect(
      useCase.execute(
        {
          storeName: "Toko Benang Makmur",
        },
        {
          actorId: "user-1",
          role: UserRole.WAREHOUSE,
        },
      ),
    ).rejects.toThrowError(ForbiddenError);
  });
});