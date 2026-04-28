import { Supplier } from "@/modules/procurement/domain/Supplier";

type SupplierRecord = {
  id: string;
  storeName: string;
  salesName: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};

export class PrismaSupplierMapper {
  static toDomain(record: SupplierRecord): Supplier {
    return Supplier.rehydrate({
      id: record.id,
      storeName: record.storeName,
      salesName: record.salesName,
      phone: record.phone,
      notes: record.notes,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }

  static toPersistence(supplier: Supplier): SupplierRecord {
    return {
      id: supplier.id,
      storeName: supplier.storeName,
      salesName: supplier.salesName,
      phone: supplier.phone,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
    };
  }
}