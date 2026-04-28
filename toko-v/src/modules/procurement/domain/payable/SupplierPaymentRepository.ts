import { SupplierPaymentRecord } from "./SupplierPayment";
import {
  MoneyAmount,
  PurchaseOrderId,
  SupplierPaymentId,
} from "./SupplierPayable";

export interface SupplierPaymentRepository {
  nextId(): Promise<SupplierPaymentId>;

  save(payment: SupplierPaymentRecord): Promise<void>;

  listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierPaymentRecord[]>;

  sumPaidByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount>;
}