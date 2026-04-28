import type {
  PurchaseOrderPayableItemSnapshot,
  PurchaseOrderPayableReader,
} from "../../domain/payable/PurchaseOrderPayableReader";
import type { PurchaseReturnRepository } from "../../domain/payable/PurchaseReturnRepository";
import type {
  PurchaseReturnReductionItemRecord,
  PurchaseReturnReductionRecord,
} from "../../domain/payable/PurchaseReturnReduction";
import {
  assertPurchaseReturnItemsNotEmpty,
  assertPurchaseReturnQuantityPositiveInteger,
  calculatePurchaseReturnReducedAmount,
} from "../../domain/payable/PurchaseReturnReduction";
import type { SupplierPaymentRepository } from "../../domain/payable/SupplierPaymentRepository";
import type { SupplierPayableReader } from "../../domain/payable/SupplierPayableReader";
import {
  assertOutstandingNotNegative,
  calculateOutstanding,
} from "../../domain/payable/SupplierPayable";
import { Step7BusinessError } from "../../domain/payable/Step7Errors";
import type { Step7AuthorizationGuard } from "./Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "./Step7UnitOfWork";
import type {
  HandlePurchaseReturnInput,
  HandlePurchaseReturnResult,
  Step7UseCaseContext,
} from "./Step7DTO";

export type HandlePurchaseReturnDependencies = {
  authorization: Step7AuthorizationGuard;
  unitOfWork: Step7UnitOfWork;
  purchaseOrders: PurchaseOrderPayableReader;
  suppliers: SupplierPayableReader;
  payments: SupplierPaymentRepository;
  returns: PurchaseReturnRepository;
  context: Step7UseCaseContext;
};

export class HandlePurchaseReturn {
  constructor(private readonly dependencies: HandlePurchaseReturnDependencies) { }

  async execute(
    input: HandlePurchaseReturnInput,
  ): Promise<HandlePurchaseReturnResult> {
    this.dependencies.authorization.requireAdmin(input.actor);

    return this.dependencies.unitOfWork.runInTransaction(async () => {
      const purchaseOrder =
        await this.dependencies.purchaseOrders.findPayableSnapshotById(
          input.purchaseOrderId,
        );

      if (purchaseOrder === null) {
        throw new Step7BusinessError(
          "PURCHASE_ORDER_NOT_FOUND",
          "Purchase order was not found.",
        );
      }

      if (purchaseOrder.status !== "RECEIVED") {
        throw new Step7BusinessError(
          "PURCHASE_ORDER_NOT_RECEIVED",
          "Purchase return can only be recorded for received purchase order.",
        );
      }

      const supplier =
        await this.dependencies.suppliers.findPayableSnapshotById(
          purchaseOrder.supplierId,
        );

      if (supplier === null) {
        throw new Step7BusinessError(
          "SUPPLIER_NOT_FOUND",
          "Supplier was not found.",
        );
      }

      assertPurchaseReturnItemsNotEmpty(
        input.returnItems.map((item) => ({
          purchaseReturnId: "",
          purchaseItemId: item.purchaseItemId,
          quantity: item.quantity,
          reducedAmount: 0,
          reason: item.reason,
        })),
      );

      const returnId = await this.dependencies.returns.nextId();

      const returnItems: PurchaseReturnReductionItemRecord[] = [];
      let totalReducedAmount = 0;

      for (const item of input.returnItems) {
        assertPurchaseReturnQuantityPositiveInteger(item.quantity);

        const purchaseItem = this.findPurchaseItem(
          purchaseOrder.items,
          item.purchaseItemId,
        );

        const alreadyReturnedQuantity =
          await this.dependencies.returns.sumReturnedQuantityByPurchaseItemId(
            item.purchaseItemId,
          );

        const remainingReturnableQuantity =
          purchaseItem.quantity - alreadyReturnedQuantity;

        if (item.quantity > remainingReturnableQuantity) {
          throw new Step7BusinessError(
            "PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION",
            "Purchase return quantity exceeds remaining returnable quantity.",
          );
        }

        const reducedAmount = calculatePurchaseReturnReducedAmount(
          item.quantity,
          purchaseItem.unitCost,
        );

        totalReducedAmount += reducedAmount;

        returnItems.push({
          purchaseReturnId: returnId,
          purchaseItemId: item.purchaseItemId,
          quantity: item.quantity,
          reducedAmount,
          reason: item.reason,
        });
      }

      const totalPaid =
        await this.dependencies.payments.sumPaidByPurchaseOrderId(
          purchaseOrder.id,
        );
      const totalReturnedBefore =
        await this.dependencies.returns.sumReturnedByPurchaseOrderId(
          purchaseOrder.id,
        );

      const outstandingBefore = calculateOutstanding({
        payableInitial: purchaseOrder.totalCost,
        totalPaid,
        totalReturned: totalReturnedBefore,
      });

      assertOutstandingNotNegative(outstandingBefore);

      if (totalReducedAmount > outstandingBefore) {
        throw new Step7BusinessError(
          "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING",
          "Purchase return reduction exceeds current outstanding.",
        );
      }

      const returnReduction: PurchaseReturnReductionRecord = {
        id: returnId,
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        returnedAt: input.returnedAt,
        notes: input.notes,
        createdAt: this.dependencies.context.now(),
        createdBy: input.actor.actorId,
        items: returnItems,
      };

      await this.dependencies.returns.save(returnReduction);

      const totalReturnedAfter = totalReturnedBefore + totalReducedAmount;
      const outstandingAfter = calculateOutstanding({
        payableInitial: purchaseOrder.totalCost,
        totalPaid,
        totalReturned: totalReturnedAfter,
      });

      assertOutstandingNotNegative(outstandingAfter);

      return {
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        returnId,
        reducedAmount: totalReducedAmount,
        payableInitial: purchaseOrder.totalCost,
        totalPaid,
        totalReturned: totalReturnedAfter,
        outstanding: outstandingAfter,
        returnedAt: input.returnedAt,
      };
    });
  }

  private findPurchaseItem(
    purchaseItems: PurchaseOrderPayableItemSnapshot[],
    purchaseItemId: string,
  ): PurchaseOrderPayableItemSnapshot {
    const purchaseItem = purchaseItems.find(
      (item) => item.purchaseItemId === purchaseItemId,
    );

    if (purchaseItem === undefined) {
      throw new Step7BusinessError(
        "PURCHASE_RETURN_ITEM_INVALID",
        "Purchase return item does not exist in purchase order.",
      );
    }

    return purchaseItem;
  }
}