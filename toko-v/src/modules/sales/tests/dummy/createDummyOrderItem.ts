import { OrderItem } from "@/modules/sales/domain/OrderItem";
import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

export function createDummyOrderItem(orderId: string): OrderItem {
  return OrderItem.create({
    id: EntityId.of(`${orderId}-item-1`),
    productId: EntityId.of("P001"),
    productNameSnapshot: "Produk Dummy",
    unitSnapshot: "pcs",
    unitPriceSnapshot: Money.of(10000),
    quantity: PositiveInt.of(1),
  });
}
