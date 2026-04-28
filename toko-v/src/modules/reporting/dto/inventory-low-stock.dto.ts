export type InventoryLowStockDTO = {
  productId: string;
  variantId: string | null;
  currentStockQuantity: number;
};