import {
  CatalogReadRepository,
  CatalogVariantReadModel,
} from "@/modules/catalog/domain/CatalogReadRepository";

type Deps = {
  catalogReadRepo: CatalogReadRepository;
};

export class ListPosVariants {
  constructor(private readonly deps: Deps) { }

  async execute(): Promise<CatalogVariantReadModel[]> {
    return this.deps.catalogReadRepo.listPosVariants();
  }
}