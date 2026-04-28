import {
  ActorId,
  MoneyAmount,
  PurchaseOrderId,
  SupplierId,
  SupplierPaymentId,
} from "./SupplierPayable";
import { Step7BusinessError } from "./Step7Errors";

export type SupplierPaymentRecord = {
  id: SupplierPaymentId;
  purchaseOrderId: PurchaseOrderId;
  supplierId: SupplierId;
  amount: MoneyAmount;
  paidAt: Date;
  notes: string | null;
  createdAt: Date;
  createdBy: ActorId;
};

export function assertSupplierPaymentAmountPositive(
  amount: MoneyAmount,
): void {
  if (amount <= 0) {
    throw new Step7BusinessError(
      "INVALID_SUPPLIER_PAYMENT_AMOUNT",
      "Supplier payment amount must be greater than zero.",
    );
  }
}