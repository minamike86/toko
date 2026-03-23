/**
 * Enumeration of the possible statuses of an Order. The state machine
 * for orders is defined in Order.ts and use cases are responsible for
 * enforcing valid transitions.
 */

export enum OrderStatus {
  CREATED = "CREATED",
  ON_CREDIT = "ON_CREDIT",
  PAID = "PAID",
  CANCELED = "CANCELED",
  FAILED = "FAILED",
}
