export type CreatePurchaseOrderItemInput = {
  variantId: string;
  quantity: number;
  unitCost: number;
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  items: CreatePurchaseOrderItemInput[];
};