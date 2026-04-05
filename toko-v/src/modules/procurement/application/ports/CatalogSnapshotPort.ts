export type ProcurementVariantSnapshot = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unit: string;
  isActive: boolean;
};

export interface CatalogSnapshotPort {
  getVariantsByIds(variantIds: string[]): Promise<ProcurementVariantSnapshot[]>;
}