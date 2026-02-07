import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

export class OrderItem {
  private constructor(
    readonly id: EntityId,
    readonly productId: EntityId,
    readonly productNameSnapshot: string,
    readonly unitSnapshot: string,
    readonly unitPriceSnapshot: Money,
    readonly quantity: PositiveInt,
    readonly subtotal: Money
  ) {}

  static create(params: {
    id: EntityId;
    productId: EntityId;
    productNameSnapshot: string;
    unitSnapshot: string;
    unitPriceSnapshot: Money;
    quantity: PositiveInt;
  }): OrderItem {
    const subtotal = Money.of(params.unitPriceSnapshot.get() * params.quantity.get());
    return new OrderItem(
      params.id,
      params.productId,
      params.productNameSnapshot,
      params.unitSnapshot,
      params.unitPriceSnapshot,
      params.quantity,
      subtotal
    );
  }
}
