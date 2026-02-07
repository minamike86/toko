import {
  CatalogReadRepository,
  CatalogProductSnapshot,
} from "../domain/CatalogReadRepository";

export class InMemoryCatalogReadRepository
  implements CatalogReadRepository
{
  constructor(
    private readonly products: CatalogProductSnapshot[]
  ) {}

  async getProductsByIds(
    productIds: string[]
  ): Promise<CatalogProductSnapshot[]> {
    return this.products.filter(
      p => productIds.includes(p.productId) && p.isActive
    );
  }
}
