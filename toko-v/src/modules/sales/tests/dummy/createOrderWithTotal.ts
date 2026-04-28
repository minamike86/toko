import { Order } from "@/modules/sales/domain/Order";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { EntityId } from "@/shared/value-objects/EntityId";
import { createDummyOrderItem } from "./createDummyOrderItem";

type Params = {
  orderId: string;
  total: number;
  createdBy?: string;
  type?: OrderType;
};

export function createOrderWithTotal(params: Params): Order {
  const quantity = 1;

  return Order.create({
    id: EntityId.of(params.orderId),
    type: params.type ?? OrderType.OFFLINE,
    items: [
      createDummyOrderItem({
        orderId: params.orderId,
        productId: "P001",
        variantId: "V001",
        productNameSnapshot: "Produk Dummy",
        unitSnapshot: "pcs",
        unitPrice: params.total,
        quantity,
      }),
    ],
    createdAt: new Date(),
    createdBy: EntityId.of(params.createdBy ?? "USER-1"),
  });
}