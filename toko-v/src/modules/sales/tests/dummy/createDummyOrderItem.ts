import { OrderItem } from "@/modules/sales/domain/OrderItem";
import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

type Params = {
  orderId: string;
  productId?: string;
  variantId?: string;
  productNameSnapshot?: string;
  unitSnapshot?: string;
  unitPrice?: number;
  quantity?: number;
};

export function createDummyOrderItem(params: Params): OrderItem {
  const productId = params.productId ?? "P001";
  const variantId = params.variantId ?? "V001";

  return OrderItem.create({
    id: EntityId.of(`${params.orderId}-item-1`),
    productId: EntityId.of(productId),
    variantId: EntityId.of(variantId),
    productNameSnapshot: params.productNameSnapshot ?? "Produk Dummy",
    unitSnapshot: params.unitSnapshot ?? "pcs",
    unitPriceSnapshot: Money.of(params.unitPrice ?? 10000),
    quantity: PositiveInt.of(params.quantity ?? 1),
  });
}