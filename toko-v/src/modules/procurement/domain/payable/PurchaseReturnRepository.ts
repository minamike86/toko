import { PurchaseReturnReductionRecord } from "./PurchaseReturnReduction";
import {
  MoneyAmount,
  PurchaseItemId,
  PurchaseOrderId,
  PurchaseReturnId,
} from "./SupplierPayable";

export interface PurchaseReturnRepository {
  nextId(): Promise<PurchaseReturnId>;

  save(returnReduction: PurchaseReturnReductionRecord): Promise<void>;

  listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseReturnReductionRecord[]>;

  sumReturnedByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount>;

  sumReturnedQuantityByPurchaseItemId(
    purchaseItemId: PurchaseItemId,
  ): Promise<number>;
}