import { prisma } from "@/shared/prisma";
import {
  CatalogProductSnapshot,
  CatalogReadRepository,
  CatalogVariantReadModel,
} from "@/modules/catalog/domain/CatalogReadRepository";

export class PrismaCatalogReadRepository implements CatalogReadRepository {
  async getProductsByIds(ids: string[]): Promise<CatalogProductSnapshot[]> {
    if (ids.length === 0) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: {
          in: ids,
        },
      },
      select: {
        productId: true,
        unit: true,
        basePrice: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const variantByProductId = new Map<string, { unit: string; basePrice: number }>();

    for (const variant of variants) {
      if (!variantByProductId.has(variant.productId)) {
        variantByProductId.set(variant.productId, {
          unit: variant.unit,
          basePrice: variant.basePrice,
        });
      }
    }

    return products.map((product) => {
      const variantSnapshot = variantByProductId.get(product.id);

      return {
        productId: product.id,
        name: product.name,
        unit: variantSnapshot?.unit ?? "",
        price: variantSnapshot?.basePrice ?? 0,
        isActive: product.isActive,
      };
    });
  }

  async getVariantsByIds(ids: string[]): Promise<CatalogVariantReadModel[]> {
    if (ids.length === 0) {
      return [];
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        productId: true,
        sku: true,
        variantName: true,
        unit: true,
        basePrice: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const productIds = [...new Set(variants.map((variant) => variant.productId))];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productNameById = new Map(
      products.map((product) => [product.id, product.name]),
    );

    return variants.map((variant) => ({
      variantId: variant.id,
      productId: variant.productId,
      productName: productNameById.get(variant.productId) ?? "Unknown Product",
      variantName: variant.variantName,
      unit: variant.unit,
      price: variant.basePrice,
      isActive: variant.isActive,
    }));
  }

  async listPosVariants(): Promise<CatalogVariantReadModel[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        productId: true,
        sku: true,
        variantName: true,
        unit: true,
        basePrice: true,
        isActive: true,
      },
      orderBy: [
        {
          productId: "asc",
        },
        {
          variantName: "asc",
        },
      ],
    });

    const productIds = [...new Set(variants.map((variant) => variant.productId))];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productNameById = new Map(
      products.map((product) => [product.id, product.name]),
    );

    return variants.map((variant) => ({
      variantId: variant.id,
      productId: variant.productId,
      productName: productNameById.get(variant.productId) ?? "Unknown Product",
      variantName: variant.variantName,
      unit: variant.unit,
      price: variant.basePrice,
      isActive: variant.isActive,
    }));
  }
}