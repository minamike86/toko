import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import type { SupplierPaymentRepository } from "../../domain/payable/SupplierPaymentRepository";
import type { SupplierPaymentRecord } from "../../domain/payable/SupplierPayment";
import type {
  MoneyAmount,
  PurchaseOrderId,
  SupplierPaymentId,
} from "../../domain/payable/SupplierPayable";
import { Step7RepositoryError } from "../../domain/payable/Step7Errors";
import type { Step7PrismaClient } from "./Step7PrismaClient";

export class PrismaSupplierPaymentRepository
  implements SupplierPaymentRepository {
  constructor(private readonly prisma: Step7PrismaClient) { }

  async nextId(): Promise<SupplierPaymentId> {
    return randomUUID();
  }

  async save(payment: SupplierPaymentRecord): Promise<void> {
    try {
      await this.prisma.supplierPayment.create({
        data: {
          id: payment.id,
          purchaseOrderId: payment.purchaseOrderId,
          supplierId: payment.supplierId,
          amount: payment.amount,
          paidAt: payment.paidAt,
          notes: payment.notes,
          createdAt: payment.createdAt,
          createdBy: payment.createdBy,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new Step7RepositoryError(
          "SUPPLIER_PAYMENT_ALREADY_EXISTS",
          "Supplier payment already exists.",
        );
      }

      throw new Step7RepositoryError(
        "SUPPLIER_PAYMENT_PERSISTENCE_FAILED",
        "Failed to persist supplier payment.",
      );
    }
  }

  async listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierPaymentRecord[]> {
    try {
      const rows = await this.prisma.supplierPayment.findMany({
        where: { purchaseOrderId },
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
      });

      return rows.map((row) => ({
        id: row.id,
        purchaseOrderId: row.purchaseOrderId,
        supplierId: row.supplierId,
        amount: row.amount,
        paidAt: row.paidAt,
        notes: row.notes,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
      }));
    } catch {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYMENT_PERSISTENCE_FAILED",
        "Failed to load supplier payment history.",
      );
    }
  }

  async sumPaidByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount> {
    try {
      const result = await this.prisma.supplierPayment.aggregate({
        where: { purchaseOrderId },
        _sum: { amount: true },
      });

      return result._sum.amount ?? 0;
    } catch {
      throw new Step7RepositoryError(
        "SUPPLIER_PAYMENT_PERSISTENCE_FAILED",
        "Failed to sum supplier payments.",
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}