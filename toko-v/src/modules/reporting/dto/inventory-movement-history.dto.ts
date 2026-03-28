export type InventoryMovementHistoryDTO = {
  id: string;
  productId: string;
  movementDate: Date;
  movementType: string;
  quantity: number;
  origin: string;
  reason: string;
  referenceId: string | null;
};