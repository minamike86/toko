export type CatalogProductSnapshot = {
  productId: string;
  name: string;
  unit: string;
  price: number;
  isActive: boolean;
};

export type CatalogVariantReadModel = {
  variantId: string;
  productId: string;
  productName: string;
  unit: string;
  price: number;
  isActive: boolean;
};

export interface CatalogReadRepository {
  getProductsByIds(ids: string[]): Promise<CatalogProductSnapshot[]>;
  getVariantsByIds(ids: string[]): Promise<CatalogVariantReadModel[]>;
}