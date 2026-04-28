import { beforeEach, describe, expect, it } from "vitest";
import { CreateSupplier } from "@/modules/procurement/application/use-cases/CreateSupplier";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { UserRole } from "@/modules/user/domain/UserRole";
import { ConflictError } from "@/shared/errors/ApplicationError";
import { prisma } from "@/shared/prisma";

describe("CreateSupplier integration", () => {
  const supplierRepository = new PrismaSupplierRepository();
  const useCase = new CreateSupplier(supplierRepository);

  beforeEach(async () => {

    await prisma.purchaseReturnReductionItem.deleteMany();
    await prisma.purchaseReturnReduction.deleteMany();
    await prisma.supplierPayment.deleteMany();

    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();

  });

  it("creates supplier and persists it", async () => {
    const result = await useCase.execute(
      {
        storeName: "Toko Benang Makmur",
        salesName: "Budi",
        phone: "08123456789",
        notes: "supplier utama",
      },
      {
        actorId: "user-1",
        role: UserRole.ADMIN,
      },
    );

    expect(result.storeName).toBe("Toko Benang Makmur");
    expect(result.isActive).toBe(true);

    const persisted = await prisma.supplier.findUnique({
      where: { id: result.id },
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.storeName).toBe("Toko Benang Makmur");
    expect(persisted?.salesName).toBe("Budi");
    expect(persisted?.phone).toBe("08123456789");
    expect(persisted?.notes).toBe("supplier utama");
    expect(persisted?.isActive).toBe(true);
  });

  it("rejects duplicate supplier store name", async () => {
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
});