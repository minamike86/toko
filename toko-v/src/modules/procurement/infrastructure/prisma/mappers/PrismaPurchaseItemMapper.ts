import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";

type PurchaseItemRecord = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
};

export class PrismaPurchaseItemMapper {
  static toDomain(record: PurchaseItemRecord): PurchaseItem {
    return PurchaseItem.rehydrate({
      id: record.id,
      purchaseOrderId: record.purchaseOrderId,
      productId: record.productId,
      variantId: record.variantId,
      productNameSnapshot: record.productNameSnapshot,
      variantNameSnapshot: record.variantNameSnapshot,
      unitSnapshot: record.unitSnapshot,
      quantity: record.quantity,
      unitCost: record.unitCost,
      subtotalCost: record.subtotalCost,
    });
  }

  static toPersistence(item: PurchaseItem): PurchaseItemRecord {
    return {
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      productId: item.productId,
      variantId: item.variantId,
      productNameSnapshot: item.productNameSnapshot,
      variantNameSnapshot: item.variantNameSnapshot,
      unitSnapshot: item.unitSnapshot,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotalCost: item.subtotalCost,
    };
  }
}