import {
  MoneyAmount,
  PurchaseItemId,
  PurchaseOrderId,
  SupplierId,
} from "./SupplierPayable";

export type PurchaseOrderPayableStatus =
  | "CREATED"
  | "RECEIVED"
  | "CANCELED";

export type PurchaseOrderPayableItemSnapshot = {
  purchaseItemId: PurchaseItemId;
  quantity: number;
  unitCost: MoneyAmount;
  subtotalCost: MoneyAmount;
};

export type PurchaseOrderPayableSnapshot = {
  id: PurchaseOrderId;
  supplierId: SupplierId;
  status: PurchaseOrderPayableStatus;
  receivedAt: Date | null;
  totalCost: MoneyAmount;
  items: PurchaseOrderPayableItemSnapshot[];
};

export interface PurchaseOrderPayableReader {
  findPayableSnapshotById(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseOrderPayableSnapshot | null>;
}