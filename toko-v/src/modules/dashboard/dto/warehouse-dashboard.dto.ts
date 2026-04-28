export type WarehouseDashboardItemDTO = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  unit: string;
  currentStockQuantity: number;
  isLowStock: boolean;
};

export type WarehouseDashboardDTO = {
  asOf: Date;
  totalVariants: number;
  lowStockCount: number;
  items: WarehouseDashboardItemDTO[];
};