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
