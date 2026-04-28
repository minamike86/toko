export type InventoryMovementHistoryDTO = {
  id: string;
  productId: string;
  variantId: string | null;
  movementDate: Date;
  movementType: string;
  quantity: number;
  origin: string;
  reason: string;
  referenceId: string | null;
};