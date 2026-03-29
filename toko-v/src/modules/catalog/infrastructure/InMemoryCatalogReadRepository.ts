import {
  CatalogReadRepository,
  CatalogProductSnapshot,
  CatalogVariantReadModel,
} from "../domain/CatalogReadRepository";

export class InMemoryCatalogReadRepository implements CatalogReadRepository {
  constructor(
    private readonly products: CatalogProductSnapshot[],
    private readonly variants: CatalogVariantReadModel[],
  ) { }

  async getProductsByIds(
    productIds: string[],
  ): Promise<CatalogProductSnapshot[]> {
    return this.products.filter(
      (p) => productIds.includes(p.productId) && p.isActive,
    );
  }

  async getVariantsByIds(
    variantIds: string[],
  ): Promise<CatalogVariantReadModel[]> {
    return this.variants.filter(
      (v) => variantIds.includes(v.variantId) && v.isActive,
    );
  }
}