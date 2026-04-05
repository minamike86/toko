import { beforeEach, describe, expect, it } from "vitest";
import { UpdateSupplierStatus } from "@/modules/procurement/application/use-cases/UpdateSupplierStatus";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { UserRole } from "@/modules/user/domain/UserRole";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { prisma } from "@/shared/prisma";

describe("UpdateSupplierStatus integration", () => {
  const supplierRepository = new PrismaSupplierRepository();
  const useCase = new UpdateSupplierStatus(supplierRepository);

  beforeEach(async () => {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();
  });

  it("deactivates supplier and persists status change", async () => {
    const supplier = Supplier.create({
      id: supplierRepository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await supplierRepository.save(supplier);

    const result = await useCase.execute(
      {
        supplierId: supplier.id,
        isActive: false,
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(result.isActive).toBe(false);

    const persisted = await prisma.supplier.findUnique({
      where: { id: supplier.id },
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.isActive).toBe(false);
  });

  it("throws when supplier is not found", async () => {
    await expect(
      useCase.execute(
        {
          supplierId: "missing-supplier",
          isActive: false,
        },
        {
          actorId: "user-1",
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrowError(NotFoundError);
  });
});