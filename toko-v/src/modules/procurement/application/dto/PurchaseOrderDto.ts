export type PurchaseOrderItemDto = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
};

export type PurchaseOrderDto = {
  id: string;
  supplierId: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  receivedAt: Date | null;
  receivedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
  totalQuantity: number;
  totalTransactionQuantity: number;
  totalCost: number;
  items: PurchaseOrderItemDto[];
};