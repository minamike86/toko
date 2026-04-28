import type { PurchaseOrderPayableReader } from "../../domain/payable/PurchaseOrderPayableReader";
import type { PurchaseReturnRepository } from "../../domain/payable/PurchaseReturnRepository";
import type { SupplierPaymentRepository } from "../../domain/payable/SupplierPaymentRepository";
import type { SupplierPayableReader } from "../../domain/payable/SupplierPayableReader";
import type { Step7AuthorizationGuard } from "./Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "./Step7UnitOfWork";
import type {
  RecordSupplierPaymentInput,
  RecordSupplierPaymentResult,
  Step7UseCaseContext,
} from "./Step7DTO";
import {
  assertOutstandingNotNegative,
  calculateOutstanding,
} from "../../domain/payable/SupplierPayable";
import { assertSupplierPaymentAmountPositive } from "../../domain/payable/SupplierPayment";
import type { SupplierPaymentRecord } from "../../domain/payable/SupplierPayment";
import { Step7BusinessError } from "../../domain/payable/Step7Errors";

export type RecordSupplierPaymentDependencies = {
  authorization: Step7AuthorizationGuard;
  unitOfWork: Step7UnitOfWork;
  purchaseOrders: PurchaseOrderPayableReader;
  suppliers: SupplierPayableReader;
  payments: SupplierPaymentRepository;
  returns: PurchaseReturnRepository;
  context: Step7UseCaseContext;
};

export class RecordSupplierPayment {
  constructor(private readonly dependencies: RecordSupplierPaymentDependencies) { }

  async execute(
    input: RecordSupplierPaymentInput,
  ): Promise<RecordSupplierPaymentResult> {
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
          "Supplier payment can only be recorded for received purchase order.",
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

      assertSupplierPaymentAmountPositive(input.amount);

      const totalPaidBefore =
        await this.dependencies.payments.sumPaidByPurchaseOrderId(
          purchaseOrder.id,
        );
      const totalReturned =
        await this.dependencies.returns.sumReturnedByPurchaseOrderId(
          purchaseOrder.id,
        );

      const outstandingBefore = calculateOutstanding({
        payableInitial: purchaseOrder.totalCost,
        totalPaid: totalPaidBefore,
        totalReturned,
      });

      assertOutstandingNotNegative(outstandingBefore);

      if (input.amount > outstandingBefore) {
        throw new Step7BusinessError(
          "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING",
          "Supplier payment exceeds current outstanding.",
        );
      }

      const paymentId = await this.dependencies.payments.nextId();
      const payment: SupplierPaymentRecord = {
        id: paymentId,
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        amount: input.amount,
        paidAt: input.paidAt,
        notes: input.notes,
        createdAt: this.dependencies.context.now(),
        createdBy: input.actor.actorId,
      };

      await this.dependencies.payments.save(payment);

      const totalPaidAfter = totalPaidBefore + input.amount;
      const outstandingAfter = calculateOutstanding({
        payableInitial: purchaseOrder.totalCost,
        totalPaid: totalPaidAfter,
        totalReturned,
      });

      assertOutstandingNotNegative(outstandingAfter);

      return {
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        paidAmount: input.amount,
        payableInitial: purchaseOrder.totalCost,
        totalPaid: totalPaidAfter,
        totalReturned,
        outstanding: outstandingAfter,
        paymentId,
        paidAt: input.paidAt,
      };
    });
  }
}