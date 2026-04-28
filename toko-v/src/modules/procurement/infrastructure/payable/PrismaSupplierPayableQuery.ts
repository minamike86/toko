import type {
  SupplierOutstandingPurchaseOrderLine,
  SupplierOutstandingSummary,
  SupplierPayableQuery,
} from "../../domain/payable/SupplierPayableQuery";
import type {
  MoneyAmount,
  PurchaseOrderId,
  SupplierId,
} from "../../domain/payable/SupplierPayable";
import { calculateOutstanding } from "../../domain/payable/SupplierPayable";
import { Step7RepositoryError } from "../../domain/payable/Step7Errors";
import type { Step7PrismaClient } from "./Step7PrismaClient";

export class PrismaSupplierPayableQuery implements SupplierPayableQuery {
  constructor(private readonly prisma: Step7PrismaClient) { }

  async getOutstandingBySupplierId(
    supplierId: SupplierId,
  ): Promise<SupplierOutstandingSummary | null> {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (supplier === null) {
        return null;
      }

      const purchaseOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          supplierId,
          status: "RECEIVED",
        },
        include: {
          items: true,
        },
        orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
      });

      const lines: SupplierOutstandingPurchaseOrderLine[] = [];

      for (const purchaseOrder of purchaseOrders) {
        const line = await this.buildOutstandingLine(
          purchaseOrder.id,
          purchaseOrder.receivedAt,
          purchaseOrder.items.reduce(
            (total, item) => total + item.subtotalCost,
            0,
          ),
        );

        if (line.outstanding > 0) {
          lines.push(line);
        }
      }

      return {
        supplierId: supplier.id,
        supplierStoreName: supplier.storeName,
        totalOutstanding: lines.reduce(
          (total, line) => total + line.outstanding,
          0,
        ),
        purchaseOrders: lines,
      };
    } catch (error) {
      if (error instanceof Step7RepositoryError) {
        throw error;
      }

      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Failed to load supplier outstanding summary.",
      );
    }
  }

  async getOutstandingByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierOutstandingPurchaseOrderLine | null> {
    try {
      const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { items: true },
      });

      if (purchaseOrder === null || purchaseOrder.status !== "RECEIVED") {
        return null;
      }

      return this.buildOutstandingLine(
        purchaseOrder.id,
        purchaseOrder.receivedAt,
        purchaseOrder.items.reduce(
          (total, item) => total + item.subtotalCost,
          0,
        ),
      );
    } catch (error) {
      if (error instanceof Step7RepositoryError) {
        throw error;
      }

      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Failed to load purchase order outstanding line.",
      );
    }
  }

  private async buildOutstandingLine(
    purchaseOrderId: PurchaseOrderId,
    receivedAt: Date | null,
    payableInitial: MoneyAmount,
  ): Promise<SupplierOutstandingPurchaseOrderLine> {
    if (receivedAt === null) {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Received purchase order must have receivedAt.",
      );
    }

    const [paymentTotal, returnTotal] = await Promise.all([
      this.prisma.supplierPayment.aggregate({
        where: { purchaseOrderId },
        _sum: { amount: true },
      }),
      this.prisma.purchaseReturnReductionItem.aggregate({
        where: {
          purchaseReturn: {
            purchaseOrderId,
          },
        },
        _sum: {
          reducedAmount: true,
        },
      }),
    ]);

    const totalPaid = paymentTotal._sum.amount ?? 0;
    const totalReturned = returnTotal._sum.reducedAmount ?? 0;
    const outstanding = calculateOutstanding({
      payableInitial,
      totalPaid,
      totalReturned,
    });

    if (outstanding < 0) {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYABLE_QUERY_FAILED",
        "Supplier outstanding query produced a negative value.",
      );
    }

    return {
      purchaseOrderId,
      receivedAt,
      payableInitial,
      totalPaid,
      totalReturned,
      outstanding,
    };
  }
}