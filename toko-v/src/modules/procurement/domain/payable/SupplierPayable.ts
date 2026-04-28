import { Step7BusinessError } from "./Step7Errors";

export type EntityId = string;
export type MoneyAmount = number;

export type SupplierPaymentId = EntityId;
export type PurchaseReturnId = EntityId;
export type PurchaseOrderId = EntityId;
export type SupplierId = EntityId;
export type PurchaseItemId = EntityId;
export type ActorId = EntityId;

export type SupplierPayableTotals = {
  payableInitial: MoneyAmount;
  totalPaid: MoneyAmount;
  totalReturned: MoneyAmount;
};

export function calculateOutstanding(
  totals: SupplierPayableTotals,
): MoneyAmount {
  return totals.payableInitial - totals.totalPaid - totals.totalReturned;
}

export function assertOutstandingNotNegative(
  outstanding: MoneyAmount,
): void {
  if (outstanding < 0) {
    throw new Step7BusinessError(
      "SUPPLIER_OUTSTANDING_NEGATIVE",
      "Supplier outstanding must not be negative.",
    );
  }
}