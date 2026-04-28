import { Supplier } from "@/modules/procurement/domain/Supplier";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { PrismaSupplierMapper } from "./mappers/PrismaSupplierMapper";
import { prisma } from "@/shared/prisma";
import { randomUUID } from "crypto";

export class PrismaSupplierRepository implements SupplierRepository {
  nextId(): string {
    return randomUUID();
  }

  async save(supplier: Supplier): Promise<void> {
    const data = PrismaSupplierMapper.toPersistence(supplier);

    await prisma.supplier.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        storeName: data.storeName,
        salesName: data.salesName,
        phone: data.phone,
        notes: data.notes,
        isActive: data.isActive,
        createdAt: data.createdAt,
      },
      update: {
        storeName: data.storeName,
        salesName: data.salesName,
        phone: data.phone,
        notes: data.notes,
        isActive: data.isActive,
      },
    });
  }

  async findById(id: string): Promise<Supplier | null> {
    const record = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return PrismaSupplierMapper.toDomain(record);
  }

  async findByStoreName(storeName: string): Promise<Supplier | null> {
    const normalizedStoreName = storeName.trim();

    if (!normalizedStoreName) {
      return null;
    }

    const records = await prisma.supplier.findMany({
      where: {
        storeName: normalizedStoreName,
      },
      take: 1,
    });

    const record = records[0] ?? null;

    if (!record) {
      return null;
    }

    return PrismaSupplierMapper.toDomain(record);
  }
}