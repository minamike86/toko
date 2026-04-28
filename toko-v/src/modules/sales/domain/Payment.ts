import { InvalidPaymentAmountError } from './SalesErrors';

/**
 * Payment entity represents a single payment fact recorded against an order.
 *
 * A payment is immutable after construction. Corrections to a payment must be
 * performed by creating a new Payment instance rather than mutating an
 * existing one.
 */

export class Payment {
  /**
   * Unique identifier for the payment.
   */
  public readonly id: string;

  /**
   * Identifier of the order this payment belongs to.
   */
  public readonly orderId: string;

  /**
   * Amount paid. Must be greater than zero.
   */
  public readonly amount: number;

  /**
   * Timestamp representing when the payment occurred on the ground (e.g. when cash was
   * received). This is distinct from `createdAt` which records when the payment
   * was persisted to the database.
   */
  public readonly paidAt: Date;

  /**
   * Arbitrary payment method string (e.g. "CASH", "TRANSFER"). This field is
   * intentionally not constrained by an enum to allow future evolution without
   * requiring a schema change.
   */
  public readonly method: string;

  /**
   * Timestamp representing when the payment record was persisted to the database.
   */
  public readonly createdAt: Date;
  constructor(
    id: string,
    orderId: string,
    amount: number,
    paidAt: Date,
    method: string,
    createdAt: Date,
  ) {
    if (amount <= 0) {
      // business rule: payments must always be positive
      throw new InvalidPaymentAmountError();
    }

    this.id = id;
    this.orderId = orderId;
    this.amount = amount;
    this.paidAt = paidAt;
    this.method = method;
    this.createdAt = createdAt;
  }
}
