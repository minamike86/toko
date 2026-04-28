import type {
  PurchaseOrderPayableItemSnapshot,
  PurchaseOrderPayableReader,
  PurchaseOrderPayableSnapshot,
  PurchaseOrderPayableStatus,
} from "../../domain/payable/PurchaseOrderPayableReader";
import type { PurchaseOrderId } from "../../domain/payable/SupplierPayable";
import { Step7RepositoryError } from "../../domain/payable/Step7Errors";
import type { Step7PrismaClient } from "./Step7PrismaClient";

export class PrismaPurchaseOrderPayableReader
  implements PurchaseOrderPayableReader {
  constructor(private readonly prisma: Step7PrismaClient) { }

  async findPayableSnapshotById(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseOrderPayableSnapshot | null> {
    try {
      const row = await this.prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: {
            orderBy: { id: "asc" },
          },
        },
      });

      if (row === null) {
        return null;
      }

      return {
        id: row.id,
        supplierId: row.supplierId,
        status: this.toPurchaseOrderPayableStatus(row.status),
        receivedAt: row.receivedAt,
        totalCost: row.items.reduce(
          (total, item) => total + item.subtotalCost,
          0,
        ),
        items: row.items.map(
          (item): PurchaseOrderPayableItemSnapshot => ({
            purchaseItemId: item.id,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotalCost: item.subtotalCost,
          }),
        ),
      };
    } catch {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Failed to load purchase order payable snapshot.",
      );
    }
  }

  private toPurchaseOrderPayableStatus(
    status: string,
  ): PurchaseOrderPayableStatus {
    if (
      status === "CREATED" ||
      status === "RECEIVED" ||
      status === "CANCELED"
    ) {
      return status;
    }

    throw new Step7RepositoryError(
      "SUPPLIER_PAYABLE_QUERY_FAILED",
      "Purchase order status is not recognized.",
    );
  }
}