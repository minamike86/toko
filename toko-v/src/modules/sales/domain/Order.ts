import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";

import { OrderItem } from "./OrderItem";
import { OrderStatus } from "./OrderStatus";
import { OrderType } from "./OrderType";
import {
  EmptyOrderItemsError,
  InvalidOrderStatusTransitionError,
  OrderAlreadyCanceledError,
} from "./SalesErrors";

export class Order {
  private status: OrderStatus;
  private totalAmount: Money;
  private outstandingAmount: Money;

  private constructor(
    readonly id: EntityId,
    readonly type: OrderType,
    readonly items: OrderItem[],
    status: OrderStatus,
    totalAmount: Money,
    outstandingAmount: Money,
    readonly createdAt: Date,
    readonly createdBy: EntityId
  ) {
    if (items.length === 0) throw new EmptyOrderItemsError();

    this.status = status;
    this.totalAmount = totalAmount;
    this.outstandingAmount = outstandingAmount;

    this.assertInvariants();
  }

  /* =====================
     Factory
     ===================== */

  static create(params: {
    id: EntityId;
    type: OrderType;
    items: OrderItem[];
    createdAt: Date;
    createdBy: EntityId;
  }): Order {
    const total = params.items.reduce(
      (acc, item) => acc.add(item.subtotal),
      Money.zero()
    );

    return new Order(
      params.id,
      params.type,
      params.items,
      OrderStatus.CREATED,
      total,
      total,
      params.createdAt,
      params.createdBy
    );
  }

  /* =====================
     Getters
     ===================== */

  getStatus(): OrderStatus {
    return this.status;
  }

  getTotalAmount(): Money {
    return this.totalAmount;
  }

  getOutstandingAmount(): Money {
    return this.outstandingAmount;
  }

  /* =====================
     Domain Behaviors
     ===================== */

  markAsPaid(): void {
    if (this.status === OrderStatus.CANCELED) {
      throw new OrderAlreadyCanceledError();
    }

    if (
      ![OrderStatus.CREATED, OrderStatus.ON_CREDIT].includes(this.status)
    ) {
      throw new InvalidOrderStatusTransitionError(
        this.status,
        OrderStatus.PAID
      );
    }

    this.status = OrderStatus.PAID;
    this.outstandingAmount = Money.zero();
    this.assertInvariants();
  }

  markAsCredit(): void {
    if (this.status !== OrderStatus.CREATED) {
      throw new InvalidOrderStatusTransitionError(
        this.status,
        OrderStatus.ON_CREDIT
      );
    }

    this.status = OrderStatus.ON_CREDIT;
    this.outstandingAmount = this.totalAmount;
    this.assertInvariants();
  }

  markAsFailed(): void {
    if (
      ![OrderStatus.CREATED, OrderStatus.ON_CREDIT].includes(this.status)
    ) {
      throw new InvalidOrderStatusTransitionError(
        this.status,
        OrderStatus.FAILED
      );
    }

    this.status = OrderStatus.FAILED;

    // outstanding tidak diubah
    this.assertInvariants();
  }

  cancel(): void {
    if (this.status === OrderStatus.CANCELED) {
      throw new OrderAlreadyCanceledError();
    }

    if (
      ![
        OrderStatus.CREATED,
        OrderStatus.ON_CREDIT,
        OrderStatus.PAID,
      ].includes(this.status)
    ) {
      throw new InvalidOrderStatusTransitionError(
        this.status,
        OrderStatus.CANCELED
      );
    }

    this.status = OrderStatus.CANCELED;
    this.assertInvariants();
  }

  /* =====================
     Invariants
     ===================== */

  private assertInvariants(): void {
    const recomputed = this.items.reduce(
      (acc, item) => acc.add(item.subtotal),
      Money.zero()
    );

    if (recomputed.get() !== this.totalAmount.get()) {
      throw new Error(
        "Invariant broken: totalAmount tidak sama dengan subtotal items."
      );
    }

    const outstandingZero = this.outstandingAmount.isZero();

    if (
      outstandingZero &&
      ![OrderStatus.PAID, OrderStatus.CANCELED].includes(this.status)
    ) {
      throw new Error(
        "Invariant broken: outstanding 0 hanya saat PAID atau CANCELED."
      );
    }
  }

  static reconstitute(params: {
  id: EntityId;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: Money;
  outstandingAmount: Money;
  createdAt: Date;
  createdBy: EntityId;
}): Order {
  return new Order(
    params.id,
    params.type,
    params.items,
    params.status,
    params.totalAmount,
    params.outstandingAmount,
    params.createdAt,
    params.createdBy
  );
}

}
