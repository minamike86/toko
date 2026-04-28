import {
  MoneyAmount,
  PurchaseOrderId,
  SupplierId,
} from "./SupplierPayable";

export type SupplierOutstandingPurchaseOrderLine = {
  purchaseOrderId: PurchaseOrderId;
  receivedAt: Date;
  payableInitial: MoneyAmount;
  totalPaid: MoneyAmount;
  totalReturned: MoneyAmount;
  outstanding: MoneyAmount;
};

export type SupplierOutstandingSummary = {
  supplierId: SupplierId;
  supplierStoreName: string;
  totalOutstanding: MoneyAmount;
  purchaseOrders: SupplierOutstandingPurchaseOrderLine[];
};

export interface SupplierPayableQuery {
  getOutstandingBySupplierId(
    supplierId: SupplierId,
  ): Promise<SupplierOutstandingSummary | null>;

  getOutstandingByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierOutstandingPurchaseOrderLine | null>;
}