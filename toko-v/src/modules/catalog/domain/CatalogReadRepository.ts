export type CatalogProductSnapshot = {
  productId: string;
  name: string;
  unit: string;
  price: number;
  isActive: boolean;
};

export interface CatalogReadRepository {
  getProductsByIds(ids: string[]): Promise<CatalogProductSnapshot[]>;
}
