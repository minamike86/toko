import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import type { PurchaseReturnRepository } from "../../domain/payable/PurchaseReturnRepository";
import type {
  PurchaseReturnReductionItemRecord,
  PurchaseReturnReductionRecord,
} from "../../domain/payable/PurchaseReturnReduction";
import type {
  MoneyAmount,
  PurchaseItemId,
  PurchaseOrderId,
  PurchaseReturnId,
} from "../../domain/payable/SupplierPayable";
import { Step7RepositoryError } from "../../domain/payable/Step7Errors";
import type { Step7PrismaClient } from "./Step7PrismaClient";

export class PrismaPurchaseReturnRepository
  implements PurchaseReturnRepository {
  constructor(private readonly prisma: Step7PrismaClient) { }

  async nextId(): Promise<PurchaseReturnId> {
    return randomUUID();
  }

  async save(returnReduction: PurchaseReturnReductionRecord): Promise<void> {
    try {
      await this.prisma.purchaseReturnReduction.create({
        data: {
          id: returnReduction.id,
          purchaseOrderId: returnReduction.purchaseOrderId,
          supplierId: returnReduction.supplierId,
          returnedAt: returnReduction.returnedAt,
          notes: returnReduction.notes,
          createdAt: returnReduction.createdAt,
          createdBy: returnReduction.createdBy,
          items: {
            create: returnReduction.items.map((item) => ({
              id: randomUUID(),
              purchaseItemId: item.purchaseItemId,
              quantity: item.quantity,
              reducedAmount: item.reducedAmount,
              reason: item.reason,
            })),
          },
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new Step7RepositoryError(
          "PURCHASE_RETURN_ALREADY_EXISTS",
          "Purchase return reduction already exists.",
        );
      }

      throw new Step7RepositoryError(
        "PURCHASE_RETURN_PERSISTENCE_FAILED",
        "Failed to persist purchase return reduction.",
      );
    }
  }

  async listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseReturnReductionRecord[]> {
    try {
      const rows = await this.prisma.purchaseReturnReduction.findMany({
        where: { purchaseOrderId },
        include: { items: true },
        orderBy: [{ returnedAt: "asc" }, { createdAt: "asc" }],
      });

      return rows.map((row) => ({
        id: row.id,
        purchaseOrderId: row.purchaseOrderId,
        supplierId: row.supplierId,
        returnedAt: row.returnedAt,
        notes: row.notes,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        items: row.items.map(
          (item): PurchaseReturnReductionItemRecord => ({
            purchaseReturnId: item.purchaseReturnId,
            purchaseItemId: item.purchaseItemId,
            quantity: item.quantity,
            reducedAmount: item.reducedAmount,
            reason: item.reason,
          }),
        ),
      }));
    } catch {
      throw new Step7RepositoryError(
        "PURCHASE_RETURN_PERSISTENCE_FAILED",
        "Failed to load purchase return reduction history.",
      );
    }
  }

  async sumReturnedByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount> {
    try {
      const result = await this.prisma.purchaseReturnReductionItem.aggregate({
        where: {
          purchaseReturn: {
            purchaseOrderId,
          },
        },
        _sum: {
          reducedAmount: true,
        },
      });

      return result._sum.reducedAmount ?? 0;
    } catch {
      throw new Step7RepositoryError(
        "PURCHASE_RETURN_PERSISTENCE_FAILED",
        "Failed to sum purchase return reductions.",
      );
    }
  }

  async sumReturnedQuantityByPurchaseItemId(
    purchaseItemId: PurchaseItemId,
  ): Promise<number> {
    try {
      const result = await this.prisma.purchaseReturnReductionItem.aggregate({
        where: { purchaseItemId },
        _sum: { quantity: true },
      });

      return result._sum.quantity ?? 0;
    } catch {
      throw new Step7RepositoryError(
        "PURCHASE_RETURN_PERSISTENCE_FAILED",
        "Failed to sum returned purchase item quantity.",
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