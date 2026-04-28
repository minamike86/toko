import { DomainError } from "@/shared/errors/DomainError";

export class EmptyOrderItemsError extends DomainError {
  constructor() {
    super("Order harus memiliki minimal satu item.");
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Transisi status order tidak valid: ${from} -> ${to}`);
  }
}

export class OrderAlreadyCanceledError extends DomainError {
  constructor() {
    super("Order sudah dibatalkan dan tidak bisa diproses ulang.");
  }
}

export class InactiveProductError extends DomainError {
  constructor(productId: string) {
    super(`Product ${productId} tidak aktif dan tidak boleh dijual.`);
  }
}

//=====================================================

/**
 * Error thrown when a payment amount is less than or equal to zero.
 */
export class InvalidPaymentAmountError extends DomainError {
  constructor() {
    super('Payment amount must be greater than zero');
  }
}

/**
 * Error thrown when a payment would cause the total paid to exceed the
 * order total amount.
 */
export class PaymentOverpayError extends DomainError {
  constructor() {
    super('Payment amount exceeds outstanding amount');
  }
}

/**
 * Error thrown when attempting to settle a payment on an order that is
 * not currently on credit.
 */
export class OrderNotOnCreditError extends DomainError {
  constructor() {
    super('Order is not on credit');
  }
}

/**
 * Error thrown when optimistic locking detects a version conflict while
 * updating an Order. Clients should retry the operation when this is
 * encountered (up to a limited number of attempts).
 */
export class OptimisticLockConflictError extends DomainError {
  constructor() {
    super('Optimistic lock conflict');
  }
}