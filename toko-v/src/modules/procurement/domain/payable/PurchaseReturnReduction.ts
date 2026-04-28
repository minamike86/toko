import {
  ActorId,
  MoneyAmount,
  PurchaseItemId,
  PurchaseOrderId,
  PurchaseReturnId,
  SupplierId,
} from "./SupplierPayable";
import { Step7BusinessError } from "./Step7Errors";

export type PurchaseReturnReductionRecord = {
  id: PurchaseReturnId;
  purchaseOrderId: PurchaseOrderId;
  supplierId: SupplierId;
  returnedAt: Date;
  notes: string | null;
  createdAt: Date;
  createdBy: ActorId;
  items: PurchaseReturnReductionItemRecord[];
};

export type PurchaseReturnReductionItemRecord = {
  purchaseReturnId: PurchaseReturnId;
  purchaseItemId: PurchaseItemId;
  quantity: number;
  reducedAmount: MoneyAmount;
  reason: string | null;
};

export function assertPurchaseReturnItemsNotEmpty(
  items: readonly PurchaseReturnReductionItemRecord[],
): void {
  if (items.length === 0) {
    throw new Step7BusinessError(
      "PURCHASE_RETURN_ITEM_INVALID",
      "Purchase return must contain at least one item.",
    );
  }
}

export function assertPurchaseReturnQuantityPositiveInteger(
  quantity: number,
): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Step7BusinessError(
      "PURCHASE_RETURN_ITEM_INVALID",
      "Purchase return quantity must be a positive integer.",
    );
  }
}

export function calculatePurchaseReturnReducedAmount(
  quantity: number,
  unitCost: MoneyAmount,
): MoneyAmount {
  assertPurchaseReturnQuantityPositiveInteger(quantity);
  return quantity * unitCost;
}