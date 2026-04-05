import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PrismaPurchaseItemMapper } from "./PrismaPurchaseItemMapper";
import { toPurchaseOrderStatus } from "./toPurchaseOrderStatus";

type PurchaseOrderRecord = {
  id: string;
  supplierId: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  receivedAt: Date | null;
  receivedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
  items: Array<{
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
  }>;
};

type PurchaseOrderPersistence = {
  id: string;
  supplierId: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  receivedAt: Date | null;
  receivedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
  items: Array<{
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
  }>;
};

export class PrismaPurchaseOrderMapper {
  static toDomain(record: PurchaseOrderRecord): PurchaseOrder {
    const items: PurchaseItem[] = record.items.map((item) =>
      PrismaPurchaseItemMapper.toDomain(item),
    );

    return PurchaseOrder.rehydrate({
      id: record.id,
      supplierId: record.supplierId,
      status: toPurchaseOrderStatus(record.status),
      items,
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      receivedAt: record.receivedAt,
      receivedBy: record.receivedBy,
      canceledAt: record.canceledAt,
      canceledBy: record.canceledBy,
    });
  }

  static toPersistence(order: PurchaseOrder): PurchaseOrderPersistence {
    return {
      id: order.id,
      supplierId: order.supplierId,
      status: order.status,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      receivedAt: order.receivedAt,
      receivedBy: order.receivedBy,
      canceledAt: order.canceledAt,
      canceledBy: order.canceledBy,
      items: order.items.map((item) => PrismaPurchaseItemMapper.toPersistence(item)),
    };
  }
}