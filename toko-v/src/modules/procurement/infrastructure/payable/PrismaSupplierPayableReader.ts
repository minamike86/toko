import type {
  SupplierPayableReader,
  SupplierPayableSnapshot,
} from "../../domain/payable/SupplierPayableReader";
import type { SupplierId } from "../../domain/payable/SupplierPayable";
import { Step7RepositoryError } from "../../domain/payable/Step7Errors";
import type { Step7PrismaClient } from "./Step7PrismaClient";

export class PrismaSupplierPayableReader implements SupplierPayableReader {
  constructor(private readonly prisma: Step7PrismaClient) { }

  async findPayableSnapshotById(
    supplierId: SupplierId,
  ): Promise<SupplierPayableSnapshot | null> {
    try {
      const row = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (row === null) {
        return null;
      }

      return {
        id: row.id,
        storeName: row.storeName,
        isActive: row.isActive,
      };
    } catch {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Failed to load supplier payable snapshot.",
      );
    }
  }
}