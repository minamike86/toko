import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { DomainError } from '@/shared/errors/DomainError';

import { OrderItem } from "./OrderItem";
import { OrderStatus } from "./OrderStatus";
import { OrderType } from "./OrderType";
import {
  EmptyOrderItemsError, InvalidOrderStatusTransitionError, OrderAlreadyCanceledError,
} from "./SalesErrors";

export class Order {
  private status: OrderStatus;
  private totalAmount: Money;
  private outstandingAmount: Money;
  private version: number;

  private constructor(
    readonly id: EntityId,
    readonly type: OrderType,
    readonly items: OrderItem[],
    status: OrderStatus,
    totalAmount: Money,
    outstandingAmount: Money,
    readonly createdAt: Date,
    readonly createdBy: EntityId,
    version: number

  ) {
    if (items.length === 0) throw new EmptyOrderItemsError();

    this.status = status;
    this.totalAmount = totalAmount;
    this.outstandingAmount = outstandingAmount;
    this.version = version;

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
      params.createdBy,
      0
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

  /**
   * Returns the optimistic locking version of the order. Persisting an order
   * must increment this value.
   */
  getVersion(): number {
    return this.version;
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

  /* =====================
     Persistence
     ===================== */
  /**
   * Returns a plain object suitable for persistence. The version field is
   * included so that repositories can use it as a precondition for
   * optimistic locking. The repository is responsible for incrementing
   * the version when persisting.
   */
  toPrimitives(): {
    id: string;
    type: OrderType;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    outstandingAmount: number;
    createdAt: Date;
    createdBy: string;
    version: number;
  } {
    return {
      id: this.id.toString(),
      type: this.type,
      items: this.items,
      status: this.status,
      totalAmount: this.totalAmount.get(),
      outstandingAmount: this.outstandingAmount.get(),
      createdAt: this.createdAt,
      createdBy: this.createdBy.toString(),
      version: this.version,
    };
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
    version: number;
  }): Order {
    return new Order(
      params.id,
      params.type,
      params.items,
      params.status,
      params.totalAmount,
      params.outstandingAmount,
      params.createdAt,
      params.createdBy,
      params.version,
    );
  }

  public recomputeOutstanding(totalPaid: Money): void {
    const totalAmountNumber = this.totalAmount.get();
    const totalPaidNumber = totalPaid.get();

    if (totalPaidNumber > totalAmountNumber) {
      throw new DomainError('Total paid melebihi total order');
    }

    const newOutstanding = totalAmountNumber - totalPaidNumber;

    // newOutstanding boleh 0, tapi Money.of(0) akan throw (karena aturan Money.of > 0)
    if (newOutstanding === 0) {
      this.outstandingAmount = Money.zero();
      this.status = OrderStatus.PAID;
      return;
    }

    this.outstandingAmount = Money.of(newOutstanding);
  }

  /**
  * Internal method used by repositories to increment the version. This
  * method should not be called by application code outside the persistence
  * layer. The increment happens after the entity has been successfully
  * persisted.
  */
  _incrementVersion(): void {
    this.version += 1;
  }

}
