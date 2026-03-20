export type InventoryMovementHistoryDTO = {
  id: string;
  productId: string;
  movementDate: Date;
  movementType: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
};