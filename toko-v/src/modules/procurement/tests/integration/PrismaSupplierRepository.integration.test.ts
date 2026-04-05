import { beforeEach, describe, expect, it } from "vitest";
import { PrismaSupplierRepository } from "@/modules/procurement/infrastructure/prisma/PrismaSupplierRepository";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import { prisma } from "@/shared/prisma";

describe("PrismaSupplierRepository integration", () => {
  const repository = new PrismaSupplierRepository();

  beforeEach(async () => {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();
  });

  it("saves and finds supplier by id", async () => {
    const supplier = Supplier.create({
      id: repository.nextId(),
      storeName: "Toko Benang Makmur",
      salesName: "Budi",
      phone: "08123456789",
      notes: "supplier utama",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await repository.save(supplier);

    const found = await repository.findById(supplier.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(supplier.id);
    expect(found?.storeName).toBe("Toko Benang Makmur");
    expect(found?.salesName).toBe("Budi");
    expect(found?.phone).toBe("08123456789");
    expect(found?.notes).toBe("supplier utama");
    expect(found?.isActive).toBe(true);
  });

  it("updates existing supplier through save", async () => {
    const supplier = Supplier.create({
      id: repository.nextId(),
      storeName: "Toko A",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await repository.save(supplier);

    supplier.updateContactInfo({
      storeName: "Toko B",
      salesName: "Sari",
      phone: "08111",
      notes: "prioritas",
    });
    supplier.deactivate();

    await repository.save(supplier);

    const found = await repository.findById(supplier.id);

    expect(found).not.toBeNull();
    expect(found?.storeName).toBe("Toko B");
    expect(found?.salesName).toBe("Sari");
    expect(found?.phone).toBe("08111");
    expect(found?.notes).toBe("prioritas");
    expect(found?.isActive).toBe(false);
  });

  it("finds supplier by store name", async () => {
    const supplier = Supplier.create({
      id: repository.nextId(),
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    await repository.save(supplier);

    const found = await repository.findByStoreName("Toko Benang Makmur");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(supplier.id);
  });
});